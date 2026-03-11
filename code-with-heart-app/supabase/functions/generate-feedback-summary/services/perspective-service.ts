// Google Perspective API does not support text generation.
// Use MODERATION_PROVIDER=openai for summary generation.

export class PerspectiveModerationService {
  async generateSummary(_systemPrompt, _combinedTexts, _feedbackCount) {
    throw new Error('Google Perspective API does not support text generation. Set MODERATION_PROVIDER=openai to use OpenAI instead.');
  }

  getName() {
    return 'Google Perspective API';
  }
}
