import { describe, it, expect } from 'vitest';
import { buildExecutionPlan, TutorExecutionMetadata } from './TutorExecutionPlanBuilder';
import { TutorProviderSelection } from './TutorProviderSelectionPolicy';

describe('TutorExecutionPlanBuilder', () => {
  const mockSelection: TutorProviderSelection = Object.freeze({
    primaryProvider: "openai",
    secondaryProvider: "gemini",
    reason: "voice-pedagogical-dialogue",
    allowGenerativeDialogue: true,
    useMemoryResponseDirectly: false,
  });

  it('should create realtime plan for voice', () => {
    const metadata: TutorExecutionMetadata = Object.freeze({
      taskKind: "realtime-voice-dialogue",
      responseChannel: "voice",
      hasSufficientMemoryResult: false,
      requiresRealtimeResponse: true,
      requiresParallelSupport: false
    });
    
    const plan = buildExecutionPlan(mockSelection, metadata);
    expect(plan.priority).toBe("realtime");
    expect(plan.responseChannel).toBe("voice");
    expect(plan.executeGenerativeDialogue).toBe(true);
    expect(plan.primaryProvider).toBe("openai");
  });

  it('should create simple memory plan without dialogue', () => {
    const memorySelection: TutorProviderSelection = Object.freeze({
        primaryProvider: "gemini",
        secondaryProvider: null,
        reason: "simple-memory-response",
        allowGenerativeDialogue: false,
        useMemoryResponseDirectly: true,
    });
    
    const metadata: TutorExecutionMetadata = Object.freeze({
      taskKind: "memory-retrieval",
      responseChannel: "text",
      hasSufficientMemoryResult: true,
      requiresRealtimeResponse: false,
      requiresParallelSupport: false
    });
    
    const plan = buildExecutionPlan(memorySelection, metadata);
    expect(plan.useMemoryDirectly).toBe(true);
    expect(plan.executeGenerativeDialogue).toBe(false);
    expect(plan.priority).toBe("interactive");
  });

  it('should be immutable and deterministic', () => {
    const metadata: TutorExecutionMetadata = Object.freeze({
      taskKind: "live-text-dialogue",
      responseChannel: "text",
      hasSufficientMemoryResult: false,
      requiresRealtimeResponse: false,
      requiresParallelSupport: false
    });
    
    const plan1 = buildExecutionPlan(mockSelection, metadata);
    const plan2 = buildExecutionPlan(mockSelection, metadata);
    
    expect(plan1).toEqual(plan2);
    expect(Object.isFrozen(plan1)).toBe(true);
  });
});
