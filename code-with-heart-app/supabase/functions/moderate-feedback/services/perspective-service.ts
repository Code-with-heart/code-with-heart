// Google Perspective API implementation
// Free API with generous limits (1 QPS default, can request more)
// Get API key from https://developers.perspectiveapi.com/

export class PerspectiveModerationService {
  apiKey;

  constructor() {
    this.apiKey = Deno.env.get('PERSPECTIVE_API_KEY');
    if (!this.apiKey) {
      throw new Error('PERSPECTIVE_API_KEY environment variable is required');
    }
  }

  async moderateContent(text) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              comment: { text },
              // Context helps Perspective understand the use case
              context: {
                entries: [
                  {
                    text: 'This is peer feedback in an educational/workplace setting. The feedback should be constructive and professional. Criticism is allowed but should not be personal attacks, discriminatory, threatening, or harassing.',
                  },
                ],
              },
              languages: ['en', 'de'],
              requestedAttributes: {
                // Core toxicity detection
                TOXICITY: {},
                SEVERE_TOXICITY: {},
                // Identity-based attacks (discrimination)
                IDENTITY_ATTACK: {},
                // Personal attacks and insults
                INSULT: {},
                // Threats of violence or harm
                THREAT: {},
                // Profanity detection
                PROFANITY: {},
              },
            }),
          }
        );

        // Handle rate limiting
        if (response.status === 429) {
          console.log(`Rate limited. Attempt ${attempt}/${maxRetries}. Waiting 2s...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error('Perspective API rate limit exceeded after retries');
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Perspective API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const scores = data.attributeScores;

        // Get scores (0-1 range, higher = more likely problematic)
        const toxicity = scores.TOXICITY?.summaryScore?.value || 0;
        const severeToxicity = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
        const identityAttack = scores.IDENTITY_ATTACK?.summaryScore?.value || 0;
        const insult = scores.INSULT?.summaryScore?.value || 0;
        const threat = scores.THREAT?.summaryScore?.value || 0;
        const profanity = scores.PROFANITY?.summaryScore?.value || 0;

        console.log('Perspective scores:', { toxicity, severeToxicity, identityAttack, insult, threat, profanity });

        // ZERO TOLERANCE thresholds - strict moderation policy
        // Any indication of harmful content will be rejected
        const THRESHOLD = {
          SEVERE_TOXICITY: 0.3, 
          THREAT: 0.3,          
          IDENTITY_ATTACK: 0.3, 
          TOXICITY: 0.3,        
          INSULT: 0.3,          
          PROFANITY: 0.3,       
        };

        const shouldReject =
          severeToxicity >= THRESHOLD.SEVERE_TOXICITY ||
          threat >= THRESHOLD.THREAT ||
          identityAttack >= THRESHOLD.IDENTITY_ATTACK ||
          toxicity >= THRESHOLD.TOXICITY ||
          insult >= THRESHOLD.INSULT ||
          profanity >= THRESHOLD.PROFANITY;

        // Build rejection reason with specific feedback
        const flaggedCategories = [];
        if (severeToxicity >= THRESHOLD.SEVERE_TOXICITY) flaggedCategories.push('toxic content');
        if (threat >= THRESHOLD.THREAT) flaggedCategories.push('threatening language');
        if (identityAttack >= THRESHOLD.IDENTITY_ATTACK) flaggedCategories.push('discriminatory language');
        if (insult >= THRESHOLD.INSULT) flaggedCategories.push('insulting language');
        if (profanity >= THRESHOLD.PROFANITY) flaggedCategories.push('profanity');
        if (toxicity >= THRESHOLD.TOXICITY && flaggedCategories.length === 0) flaggedCategories.push('inappropriate language');

        const rejectionReason = shouldReject
          ? `Your feedback was flagged for containing ${flaggedCategories.join(', ')}. In a professional feedback setting, please focus on specific behaviors or outcomes rather than personal attributes. Constructive criticism is welcome, but it should remain respectful.`
          : undefined;

        return {
          shouldReject,
          rejectionReason,
          categories: flaggedCategories,
          raw: {
            toxicity,
            severeToxicity,
            identityAttack,
            insult,
            threat,
            profanity,
          },
        };

      } catch (error) {
        lastError = error;
        console.error(`Moderation attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw lastError;
  }

  getName() {
    return 'Google Perspective API';
  }
}
