
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  // 3. Chamar OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert language teacher." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
};
