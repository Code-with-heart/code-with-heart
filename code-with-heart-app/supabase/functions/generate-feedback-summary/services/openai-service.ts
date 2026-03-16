export class OpenAIModerationService {
  apiKey;

  constructor() {
    this.apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateSummary(systemPrompt, combinedTexts, feedbackCount) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Please summarise the following ${feedbackCount} feedback message(s):\n\n${combinedTexts}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() ?? '';

    if (!summary) {
      throw new Error('OpenAI returned an empty summary');
    }

    return summary;
  }

  getName() {
    return 'OpenAI';
  }
}
