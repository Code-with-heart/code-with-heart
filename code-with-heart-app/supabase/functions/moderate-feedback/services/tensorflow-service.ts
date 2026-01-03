// Placeholder for TensorFlow.js Toxicity Model implementation
// To implement: Use @tensorflow-models/toxicity package
export class TensorFlowModerationService {
  async moderateContent(text) {
    // Implementation for TensorFlow.js toxicity model
    // Self-hosted, runs in-process (no API calls)
    // Detects: identity_attack, insult, obscene, severe_toxicity, sexual_explicit, threat, toxicity
    throw new Error('TensorFlow.js toxicity model integration not yet implemented. Set MODERATION_PROVIDER=openai to use OpenAI instead.');
  }
  getName() {
    return 'TensorFlow.js Toxicity Model';
  }
}
