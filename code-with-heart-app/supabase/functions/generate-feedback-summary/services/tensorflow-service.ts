// TensorFlow.js does not support text generation.
// Use MODERATION_PROVIDER=openai for summary generation.
export class TensorFlowModerationService {
  async generateSummary(_systemPrompt, _combinedTexts, _feedbackCount) {
    throw new Error('TensorFlow.js does not support text generation. Set MODERATION_PROVIDER=openai to use OpenAI instead.');
  }
  getName() {
    return 'TensorFlow.js Toxicity Model';
  }
}
