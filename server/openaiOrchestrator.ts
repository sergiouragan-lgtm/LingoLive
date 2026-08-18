
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

let openaiInstance: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave OPENAI_API_KEY não foi configurada.");
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
};

export const orchestrateAI = async (
    data: any
) => {
  const {
    message,
    userId,
    level,
    languageNative,
    languageTarget,
    lessonContext,
    // Add user data passed in from caller
    userData,
  } = data;

  // 2. Construir prompt inteligente
  const prompt = `
Você é um professor virtual da plataforma LingoLIVE IA.

Regras:
- Explicar de forma simples
- Adaptar ao nível: ${level}
- Idioma nativo: ${languageNative}
- Idioma alvo: ${languageTarget}
- Estilo educativo e motivador

Contexto da lição:
${lessonContext || "geral"}

Dados do aluno:
- XP: ${userData?.xp || 0}
- Streak: ${userData?.streak || 0}

Mensagem do aluno:
${message}

Responda de forma curta, clara e educativa.
`;

  try {
    const openai = getOpenAI();
    // 3. Chamar OpenAI com ChatGPT 4 (gpt-4o)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert language teacher." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error("OpenAI Orquestrador Simplificado falhou:", error.message);
    return `[Modo de Demonstração - ChatGPT 4] Olá! No momento estamos operando em modo de demonstração. Se você configurar a sua OPENAI_API_KEY no painel de administração, poderei responder usando o modelo GPT-4o original da OpenAI. Sua mensagem foi: "${message}"`;
  }
};
