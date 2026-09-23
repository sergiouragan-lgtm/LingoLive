import { describe, it, expect, beforeEach } from 'vitest';
import { VoiceProviderFactory } from '../VoiceProviderFactory';
import { CurrentVoiceProvider } from '../CurrentVoiceProvider';
import { GPTLiveAdapter } from '../GPTLiveAdapter';

describe('VoiceProviderFactory', () => {
  beforeEach(() => {
    delete process.env.VOICE_PROVIDER;
  });

  it('should return CurrentVoiceProvider by default', () => {
    const provider = VoiceProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(CurrentVoiceProvider);
    expect(provider.name).toBe('current-whisper');
  });

  it('should return GPTLiveAdapter when VOICE_PROVIDER=gpt-live', () => {
    process.env.VOICE_PROVIDER = 'gpt-live';
    const provider = VoiceProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GPTLiveAdapter);
    expect(provider.name).toBe('gpt-live-1-spike');
  });

  it('should report GPT Live enabled correctly', () => {
    process.env.VOICE_PROVIDER = 'gpt-live';
    expect(VoiceProviderFactory.isGPTLiveEnabled()).toBe(true);

    delete process.env.VOICE_PROVIDER;
    expect(VoiceProviderFactory.isGPTLiveEnabled()).toBe(false);
  });

  it('should allow explicit provider selection', () => {
    const current = VoiceProviderFactory.getProvider('current');
    const gptLive = VoiceProviderFactory.getProvider('gpt-live');

    expect(current).toBeInstanceOf(CurrentVoiceProvider);
    expect(gptLive).toBeInstanceOf(GPTLiveAdapter);
  });
});
