export const TUTOR_PROMPTS = {
  conversation: (context: any) => `You are an AI Tutor. Language: ${context.language}. Level: ${context.level}. Maintain the conversation...`,
  grammarCorrection: (text: string) => `Analyze the grammar of this text: "${text}". Return JSON with original, corrected, explanation.`,
  lessonRecommendation: (history: any, level: string) => `Based on this history: ${JSON.stringify(history)}, recommend the next lesson for level ${level}.`
};
