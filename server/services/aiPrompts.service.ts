
export const getExplanationPrompt = (phrase: string, language: string, maxMaturity: string, promptConstraint: string) => `Explain the following word or phrase from the language "${language}":
Phrase: "${phrase}"

Provide a concise response in JSON format containing:
1. meaning: Precise English translation or meaning.
2. pronunciation: An English phonetic guide (e.g. "hola" -> "OH-lah").
3. grammarNote: A brief grammar explanation or usage note (1 sentence).
4. exampleOriginal: A simple, natural example sentence using this phrase in ${language}.
5. exampleTranslation: The English translation of the example sentence.
6. maturityLevel: O nível de maturidade adequado para este termo/frase. Escolha EXCLUSIVAMENTE entre: "Infantil", "Adolescente", "Adulto". Atente-se ao limite de maturidade do usuário que é "${maxMaturity}".
7. category: A classificação da palavra ou frase. Escolha EXCLUSIVAMENTE entre: "Gíria", "Formal", "Acadêmica", "Geral".

Restrições adicionais de conteúdo para conformidade de idade:
${promptConstraint}`;

export const getFeedbackPrompt = (language: string, proficiency: string, scenario: string, planId: string, transcript: string) => `Analyze this conversation between a language learner (User) and their AI partner (Model).
Language being learned: ${language}
Learner's reported level: ${proficiency}
Scenario: ${scenario}
User Current Plan: ${planId}

Conversation Transcript:
${transcript}

Please perform a thorough linguistic review of the learner's replies and provide a structured review in JSON format.
Include:
1. overallScore (1-100 scale)
2. fluencyLevel (Estimated actual CEFR level based on performance, e.g., A1, A2, B1, B2, C1, C2)
3. strengths (Array of strings, e.g., "Good use of past tense", "Clear sentence structures")
4. grammarMistakes (Array of objects, each containing:
   - original: The original sentence with the mistake.
   - corrected: The corrected, natural-sounding version.
   - explanation: A clear explanation in English of why the mistake occurred and how to avoid it.)
5. vocabularyTips (Array of objects, each containing:
   - word: A useful word or idiom related to their scenario.
   - definition: English definition.
   - suggestion: How they can use it in their practice.)
6. pronunciationTips (Array of strings, offering advice on phonetic spelling, accent, or stress patterns for difficult words)
7. encouragingSummary (A warm, positive paragraph in English summarizing their progress and suggesting next steps)
8. pronunciationAnalysis (Array of objects, each comparing the user's typical accented pronunciation of a difficult word/phrase from the transcript against the native target model:
   - word: The word or short phrase from the transcript being analyzed
   - userPhonetic: How a typical learner at this level might mispronounce or heavily accent it
   - nativePhonetic: Correct native phonetic guide
   - tip: Specific pronunciation tip comparing the user against the native model, telling how to position tongue, mouth or blow air to improve)

Be supportive, constructive, and accurate in your grammar corrections. If there are no grammar mistakes, leave that array empty.`;
