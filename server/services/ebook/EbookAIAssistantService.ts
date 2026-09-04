import { generateContentWithRetry } from "../../config/gemini";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VocabItem {
  word: string;
  translation: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  cefrLevel: string;
}

export async function chatWithAssistant(
  chapterTitle: string,
  chapterContent: string,
  ebookLanguage: string,
  cefrLevel: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const historyText = history
    .slice(-6) // keep last 3 exchanges for context
    .map((m) => `${m.role === "user" ? "Estudante" : "Assistente"}: ${m.content}`)
    .join("\n");

  const prompt = `Você é o Kamba IA, um assistente de leitura especializado em aprendizagem de idiomas.
Você está ajudando um estudante a entender o capítulo de um e-book de aprendizagem de idiomas.

CONTEXTO DO CAPÍTULO:
Título: "${chapterTitle}"
Idioma do e-book: ${ebookLanguage}
Nível CEFR do estudante: ${cefrLevel}

CONTEÚDO DO CAPÍTULO (primeiros 3000 caracteres):
${chapterContent.substring(0, 3000)}

${historyText ? `HISTÓRICO DA CONVERSA:\n${historyText}\n` : ""}

PERGUNTA DO ESTUDANTE: ${userMessage}

REGRAS:
- Responda de forma clara e acessível para o nível ${cefrLevel}
- Se a pergunta for sobre vocabulário, gramática ou conteúdo do capítulo, use exemplos do próprio texto
- Se a pergunta for em português, responda em português
- Se a pergunta for no idioma do e-book (${ebookLanguage}), responda nesse idioma
- Seja encorajador e pedagógico
- Mantenha as respostas concisas (máx. 200 palavras)
- Não invente informações que não estão no capítulo`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text?.trim() ?? "Desculpe, não consegui processar a sua pergunta. Tente novamente.";
}

export async function extractVocabulary(
  chapterContent: string,
  ebookLanguage: string,
  cefrLevel: string,
  count: number = 10
): Promise<VocabItem[]> {
  const prompt = `Analise o seguinte conteúdo de capítulo de e-book e extraia as ${count} palavras ou expressões mais importantes para um estudante de nível CEFR ${cefrLevel}.

IDIOMA DO CONTEÚDO: ${ebookLanguage}
NÍVEL CEFR: ${cefrLevel}

CONTEÚDO:
${chapterContent.substring(0, 4000)}

Retorne APENAS um JSON array com esta estrutura exata:
[
  {
    "word": "palavra ou expressão no idioma original",
    "translation": "tradução para português",
    "definition": "definição simples em português (1-2 frases)",
    "example": "exemplo de uso no idioma original (frase curta)",
    "partOfSpeech": "substantivo | verbo | adjetivo | advérbio | expressão | outro",
    "cefrLevel": "A1 | A2 | B1 | B2 | C1 | C2"
  }
]

Priorize palavras que:
1. Aparecem no texto
2. São relevantes para o nível ${cefrLevel}
3. Têm alto valor pedagógico`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "[]";
  return JSON.parse(text) as VocabItem[];
}

export async function generateGrammarExplanation(
  sentence: string,
  ebookLanguage: string,
  cefrLevel: string
): Promise<{ explanation: string; structure: string; tips: string[] }> {
  const prompt = `Você é um professor de idiomas especializado.
Explique a estrutura gramatical da seguinte frase para um estudante de nível CEFR ${cefrLevel}.

IDIOMA: ${ebookLanguage}
FRASE: "${sentence}"

Retorne APENAS um JSON com esta estrutura:
{
  "explanation": "explicação clara da gramática em português (2-3 frases)",
  "structure": "diagrama simplificado da estrutura (ex: Sujeito + Verbo + Objeto)",
  "tips": ["dica prática 1", "dica prática 2", "dica prática 3"]
}`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "{}";
  return JSON.parse(text);
}
