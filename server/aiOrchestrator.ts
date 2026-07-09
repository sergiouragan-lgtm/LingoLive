
import OpenAI from "openai";
import dotenv from "dotenv";
import { COUNTRY_DETAILS } from "../src/data/localizationData";

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
    userData,
    localization,
  } = data;

  const activeCountryCode = localization?.country || "AO";
  const countryDetail = COUNTRY_DETAILS[activeCountryCode] || COUNTRY_DETAILS.AO;

  // 2. Construir prompt inteligente
  const prompt = `
Você é um professor virtual da plataforma LingoLIVE IA.
Atualmente você está ambientado e contextualizado nas configurações regionais de: ${countryDetail.name} (Bandeira: ${countryDetail.flag}, Moeda: ${countryDetail.currency} - ${countryDetail.symbol}).

Regras:
- Explicar de forma simples e de acordo com a cultura regional se fizer sentido
- Adaptar ao nível: ${level}
- Idioma nativo: ${languageNative}
- Idioma alvo: ${languageTarget}
- Estilo educativo e motivador
- Usar, se apropriado, gírias regionais comuns: ${countryDetail.slangs ? countryDetail.slangs.map(s => s.term).join(', ') : ''}

Contexto da lição:
${lessonContext || "geral"}

Dados do aluno:
- XP: ${userData?.xp || 0}
- Streak: ${userData?.streak || 0}

Mensagem do aluno:
${message}

Responda de forma curta, clara e educativa, usando o tom apropriado do país ativo (${countryDetail.name}).
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
