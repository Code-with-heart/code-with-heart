export class OpenAIModerationService {
  apiKey;

  constructor() {
    this.apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async moderateContent(text) {
    // Retry logic for rate limits
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            input: text
          })
        });

        // Handle rate limiting with retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || '5';
          const waitTime = parseInt(retryAfter) * 1000;
          console.log(`Rate limited. Attempt ${attempt}/${maxRetries}. Waiting ${waitTime}ms...`);

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          // On final attempt, throw to trigger fallback
          throw new Error(`OpenAI rate limit exceeded after ${maxRetries} attempts`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const result = data.results[0];

        // Determine if feedback should be rejected
        // Focus on harmful categories: hate, harassment, violence
        const shouldReject = result.flagged && (
          result.categories.hate ||
          result.categories['hate/threatening'] ||
          result.categories.harassment ||
          result.categories['harassment/threatening'] ||
          result.categories.violence ||
          result.categories['violence/graphic']
        );

        // Build human-readable rejection reason
        const flaggedCategories = [];
        if (result.categories.hate || result.categories['hate/threatening']) {
          flaggedCategories.push('hate speech or discriminatory language');
        }
        if (result.categories.harassment || result.categories['harassment/threatening']) {
          flaggedCategories.push('harassment or threatening content');
        }
        if (result.categories.violence || result.categories['violence/graphic']) {
          flaggedCategories.push('violent or graphic content');
        }

        const rejectionReason = shouldReject
          ? `Your feedback was flagged for containing ${flaggedCategories.join(', ')}. Please revise your feedback to be constructive and respectful, avoiding any inappropriate language or harmful content.`
          : undefined;

        return {
          shouldReject,
          rejectionReason,
          categories: flaggedCategories,
          raw: result
        };

      } catch (error) {
        lastError = error;
        console.error(`Moderation attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
    }

    // If all retries failed, throw the last error
    throw lastError;
  }

  getName() {
    return 'OpenAI Moderation API';
  }
}
