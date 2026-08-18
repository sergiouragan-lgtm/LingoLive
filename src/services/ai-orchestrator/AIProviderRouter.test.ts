import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIProviderRouter } from './AIProviderRouter';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';

vi.mock('./GeminiProvider');
vi.mock('./OpenAIProvider');

describe('AIProviderRouter', () => {
  let router: AIProviderRouter;
  let mockGemini: any;
  let mockOpenAI: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGemini = new GeminiProvider();
    mockOpenAI = new OpenAIProvider();
    
    // Hack to inject mocks into the private providers record if possible,
    // or create a new instance of AIProviderRouter that uses the mocks.
    // Given the singleton export, it might be better to just mock the methods.
    
    router = new AIProviderRouter();
    // Re-assign the private providers
    (router as any).providers = {
        gemini: mockGemini,
        openai: mockOpenAI
    };
  });

  it('should use Gemini successfully', async () => {
    mockGemini.generateText.mockResolvedValue('Gemini success');
    const response = await router.generateText('hello', {});
    expect(response).toBe('Gemini success');
    expect(mockGemini.generateText).toHaveBeenCalledTimes(1);
    expect(mockOpenAI.generateText).not.toHaveBeenCalled();
  });

  it('should failover to OpenAI on recoverable error', async () => {
    mockGemini.generateText.mockRejectedValue(new Error('network error'));
    mockOpenAI.generateText.mockResolvedValue('OpenAI success');
    
    const response = await router.generateText('hello', {});
    expect(response).toBe('OpenAI success');
    expect(mockGemini.generateText).toHaveBeenCalledTimes(1);
    expect(mockOpenAI.generateText).toHaveBeenCalledTimes(1);
  });

  it('should not failover to OpenAI on non-recoverable error', async () => {
    mockGemini.generateText.mockRejectedValue(new Error('AbortError'));
    
    await expect(router.generateText('hello', {})).rejects.toThrow('AbortError');
    expect(mockGemini.generateText).toHaveBeenCalledTimes(1);
    expect(mockOpenAI.generateText).not.toHaveBeenCalled();
  });
});
