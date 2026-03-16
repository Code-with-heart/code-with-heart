// Google Gemini 2.5 Flash implementation for feedback summary generation.

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export class GeminiSummaryService {
  apiKey;

  constructor() {
    this.apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  async generateSummary(systemPrompt, combinedTexts, feedbackCount) {
    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Please summarise the following ${feedbackCount} feedback message(s):\n\n${combinedTexts}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!summary) {
      throw new Error('Gemini returned an empty summary');
    }

    return summary;
  }

  getName() {
    return 'Google Gemini 2.5 Flash';
  }
}
