// Abstract interface for moderation services
// This allows easy switching between different AI providers (OpenAI, Perspective, etc.)
// Factory pattern for service selection
// Switch providers by changing MODERATION_PROVIDER environment variable
export async function getModerationService(provider) {
  switch(provider){
    case 'openai':
      // Dynamic import to avoid loading unused services
      const { OpenAIModerationService } = await import('./services/openai-service.ts');
      return new OpenAIModerationService();
    case 'perspective':
      const { PerspectiveModerationService } = await import('./services/perspective-service.ts');
      return new PerspectiveModerationService();
    case 'tensorflow':
      const { TensorFlowModerationService } = await import('./services/tensorflow-service.ts');
      return new TensorFlowModerationService();
    default:
      throw new Error(`Unknown moderation provider: ${provider}. Available: openai, perspective, tensorflow`);
  }
}
