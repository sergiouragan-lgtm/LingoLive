import { generateContentWithRetry } from "../../config/gemini";

export interface EbookStructure {
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  cefrLevel: string;
  language: string;
  estimatedPages: number;
  chapters: ChapterOutline[];
}

export interface ChapterOutline {
  id: string;
  number: number;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedWords: number;
}

export interface ToneConfig {
  formality: "informal" | "neutral" | "formal" | "academic";
  style: "conversational" | "narrative" | "instructional" | "analytical";
  audience: "children" | "teens" | "adults" | "professionals";
  richness: "simple" | "standard" | "rich" | "elaborate";
}

export async function generateEbookStructure(
  topic: string,
  language: string,
  cefrLevel: string,
  tone: ToneConfig,
  numChapters: number
): Promise<EbookStructure> {
  const toneDescription = `
    Formalidade: ${tone.formality} | Estilo: ${tone.style} |
    Público-alvo: ${tone.audience} | Riqueza linguística: ${tone.richness}
  `;

  const prompt = `
Você é um especialista em criação de material didático e e-books de aprendizagem de idiomas.
Crie a estrutura completa de um e-book profissional sobre o seguinte tópico:

TÓPICO: "${topic}"
IDIOMA DO CONTEÚDO: ${language}
NÍVEL CEFR: ${cefrLevel}
TOM EDITORIAL: ${toneDescription}
NÚMERO DE CAPÍTULOS: ${numChapters}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "title": "Título principal do e-book",
  "subtitle": "Subtítulo descritivo",
  "description": "Descrição de 2-3 frases sobre o e-book",
  "targetAudience": "Descrição do público-alvo ideal",
  "cefrLevel": "${cefrLevel}",
  "language": "${language}",
  "estimatedPages": <número estimado de páginas>,
  "chapters": [
    {
      "id": "ch-1",
      "number": 1,
      "title": "Título do Capítulo",
      "summary": "Resumo de 2-3 frases do capítulo",
      "keyPoints": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3"],
      "estimatedWords": <estimativa de palavras>
    }
  ]
}
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "{}";
  return JSON.parse(text) as EbookStructure;
}

export async function generateChapterContent(
  ebookTitle: string,
  chapter: ChapterOutline,
  language: string,
  tone: ToneConfig,
  previousContext: string = ""
): Promise<string> {
  const toneInstructions = buildToneInstructions(tone);

  const prompt = `
Você é um redator especialista em material educativo para aprendizagem de idiomas.
Escreva o conteúdo completo e rico do seguinte capítulo de e-book:

E-BOOK: "${ebookTitle}"
CAPÍTULO ${chapter.number}: "${chapter.title}"
RESUMO DO CAPÍTULO: ${chapter.summary}
PONTOS-CHAVE A COBRIR: ${chapter.keyPoints.join(", ")}
IDIOMA: ${language}
TAMANHO ALVO: aproximadamente ${chapter.estimatedWords} palavras

DIRETRIZES DE TOM E ESTILO:
${toneInstructions}

${previousContext ? `CONTEXTO DOS CAPÍTULOS ANTERIORES:\n${previousContext}\n` : ""}

Escreva o conteúdo completo do capítulo em formato Markdown.
Inclua:
- Introdução envolvente ao capítulo
- Seções bem estruturadas com subtítulos (## para seções, ### para subseções)
- Exemplos práticos e ilustrativos
- Exercícios ou atividades de prática no final (se aplicável)
- Conclusão ou resumo dos pontos principais
- Transição suave para o próximo capítulo

Use apenas Markdown limpo. Não inclua JSON ou metadados.
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text?.trim() ?? "";
}

export async function improveContent(
  content: string,
  instruction: string,
  tone: ToneConfig,
  language: string
): Promise<string> {
  const toneInstructions = buildToneInstructions(tone);

  const prompt = `
Você é um editor literário e especialista em conteúdo educativo.
Melhore o seguinte conteúdo conforme a instrução fornecida.

INSTRUÇÃO DE MELHORIA: "${instruction}"

IDIOMA: ${language}

DIRETRIZES DE TOM:
${toneInstructions}

CONTEÚDO ORIGINAL:
${content}

Retorne APENAS o conteúdo melhorado em formato Markdown.
Mantenha a estrutura existente onde não houver necessidade de mudança.
Preserve os títulos e organização. Não adicione explicações ou comentários sobre as mudanças.
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text?.trim() ?? content;
}

export async function generateTitleSuggestions(
  topic: string,
  language: string,
  audience: string
): Promise<string[]> {
  const prompt = `
Crie 6 sugestões criativas e profissionais de títulos para um e-book educativo.

TÓPICO: "${topic}"
IDIOMA: ${language}
PÚBLICO: ${audience}

Retorne APENAS um JSON array com 6 strings de títulos:
["Título 1", "Título 2", "Título 3", "Título 4", "Título 5", "Título 6"]
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "[]";
  return JSON.parse(text) as string[];
}

export async function generateExercises(
  chapterContent: string,
  cefrLevel: string,
  language: string,
  count: number = 5
): Promise<object[]> {
  const prompt = `
Baseado no conteúdo do capítulo abaixo, crie ${count} exercícios práticos variados.

NÍVEL CEFR: ${cefrLevel}
IDIOMA: ${language}

CONTEÚDO DO CAPÍTULO:
${chapterContent.substring(0, 2000)}

Retorne APENAS um JSON array de exercícios:
[
  {
    "type": "multiple-choice | fill-blank | true-false | translation | open-question",
    "question": "texto da pergunta",
    "options": ["opção A", "opção B", "opção C", "opção D"],
    "answer": "resposta correta",
    "explanation": "explicação da resposta correta",
    "difficulty": "easy | medium | hard"
  }
]
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "[]";
  return JSON.parse(text) as object[];
}

export async function analyzeToneConsistency(
  content: string,
  targetTone: ToneConfig
): Promise<{ score: number; feedback: string; suggestions: string[] }> {
  const toneDesc = buildToneInstructions(targetTone);

  const prompt = `
Analise a consistência de tom do seguinte texto com relação às diretrizes editoriais.

DIRETRIZES DE TOM ALVO:
${toneDesc}

TEXTO A ANALISAR:
${content.substring(0, 3000)}

Retorne APENAS um JSON com esta estrutura:
{
  "score": <número de 0 a 100 representando consistência de tom>,
  "feedback": "feedback geral sobre o tom do texto",
  "suggestions": ["sugestão de melhoria 1", "sugestão de melhoria 2", "sugestão de melhoria 3"]
}
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text?.trim() ?? "{}";
  return JSON.parse(text);
}

function buildToneInstructions(tone: ToneConfig): string {
  const formalityMap = {
    informal: "Linguagem descontraída, próxima ao leitor, use contrações e expressões coloquiais",
    neutral: "Linguagem equilibrada, nem muito formal nem muito informal",
    formal: "Linguagem formal e elegante, evite contrações, mantenha distância profissional",
    academic: "Linguagem acadêmica rigorosa, use terminologia técnica precisa, cite conceitos formalmente",
  };

  const styleMap = {
    conversational: "Escreva como se estivesse conversando diretamente com o leitor, use 'você'",
    narrative: "Use narrativas e histórias para ilustrar conceitos, crie conexão emocional",
    instructional: "Seja direto e prático, use listas, passos numerados e exemplos claros",
    analytical: "Aprofunde na análise crítica, explore nuances, use dados e argumentos sólidos",
  };

  const audienceMap = {
    children: "Vocabulário simples, frases curtas, exemplos do cotidiano infantil, muito encorajamento",
    teens: "Linguagem jovem mas respeitosa, exemplos relevantes para adolescentes, dinâmico",
    adults: "Exemplos práticos da vida adulta, respeite a experiência prévia do leitor",
    professionals: "Contexto profissional e empresarial, ROI claro do aprendizado, eficiência",
  };

  const richnessMap = {
    simple: "Frases curtas, vocabulário básico, estrutura simples e direta",
    standard: "Variação moderada de estruturas, vocabulário acessível com alguns termos específicos",
    rich: "Frases bem elaboradas, vocabulário variado, figuras de linguagem ocasionais",
    elaborate: "Prosa rica e elaborada, vocabulário sofisticado, estruturas complexas quando adequado",
  };

  return `
- Formalidade: ${formalityMap[tone.formality]}
- Estilo narrativo: ${styleMap[tone.style]}
- Adaptação ao público: ${audienceMap[tone.audience]}
- Riqueza linguística: ${richnessMap[tone.richness]}
`;
}
