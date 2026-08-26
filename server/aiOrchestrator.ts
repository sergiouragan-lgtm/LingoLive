
import OpenAI from "openai";
import dotenv from "dotenv";
import { COUNTRY_DETAILS } from "../src/data/localizationData";
import { ai, generateContentWithRetry } from "./config/gemini";

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
    userData,
    localization,
    age,
    learningGoal,
    targetRegion,
    languageMode,
    allowRegionalExpressions,
    allowSlang,
    preferredAIModel,
    tutorSessionContext,
    systemInstruction
  } = data;

  const activeCountryCode = tutorSessionContext?.geoLinguisticProfile?.countryCode || localization?.country || "AO";
  const countryDetail = COUNTRY_DETAILS[activeCountryCode] || COUNTRY_DETAILS.AO;

  // Determine age group, constraints, and adjust tone
  let ageGroup = "Adulto (26+)";
  let ageTone = "Adulto e profissional (sério, acolhedor, focado)";
  let pedagogicalConstraints = "";

  const parsedAge = age !== undefined ? Number(age) : 25;

  if (parsedAge >= 5 && parsedAge <= 8) {
    ageGroup = "5-8 anos";
    ageTone = "Infantil (extremamente divertido, empolgante, simples, encorajador, usa muitos emojis e analogias simples)";
    pedagogicalConstraints = `
- LIMITAÇÃO PEDAGÓGICA CRÍTICA: O aluno tem entre 5 e 8 anos de idade.
- Ensine apenas vocabulário básico padrão de categorias infantis: cumprimentos, família, escola, cores, números, animais.
- NUNCA introduza gírias ou termos coloquiais avançados.
- Exemplos padrão autorizados: "Hello", "Good morning", "Thank you".
- NÃO comente sobre regionalismos complexos ou gírias modernas.
`;
  } else if (parsedAge >= 9 && parsedAge <= 12) {
    ageGroup = "9-12 anos";
    ageTone = "Infantil/Pré-Adolescente (empolgante, dinâmico, motivador, simples, usa gírias infantis leves)";
    pedagogicalConstraints = `
- LIMITAÇÃO PEDAGÓGICA CRÍTICA: O aluno tem entre 9 e 12 anos de idade.
- Comece a introduzir expressões comuns e leves com explicações simples (ex: "Awesome", "Cool", "No problem", "See you", "Everything is okay").
- Explique brevemente de forma didática e positiva (ex: "'Cool' significa 'legal'. É muito utilizado por crianças e adolescentes nos Estados Unidos").
- NÃO use gírias maduras ou coloquialismos pesados.
`;
  } else if (parsedAge >= 13 && parsedAge <= 16) {
    ageGroup = "13-16 anos";
    ageTone = "Adolescente (descontraído, moderno, dinâmico, usa gírias saudáveis e incentivos ágeis)";
    pedagogicalConstraints = `
- LIMITAÇÃO PEDAGÓGICA CRÍTICA: O aluno tem entre 13 e 16 anos de idade (Adolescente).
- Pode introduzir gírias leves e muito difundidas (ex: "That's awesome", "No worries", "What's up?", "Hang out", "My bad").
- Cada gíria ou expressão ensinada deve trazer claramente: Significado, Contexto de uso, Quando usar e Quando evitar de forma amigável.
`;
  } else if (parsedAge >= 17 && parsedAge <= 25) {
    ageGroup = "17-25 anos (Jovem Adulto)";
    ageTone = "Jovem Adulto (moderno, dinâmico, coloquial moderno, focado em networking e interações sociais)";
    pedagogicalConstraints = `
- LIMITAÇÃO PEDAGÓGICA CRÍTICA: O aluno é um Jovem Adulto (17-25 anos).
- Introduza linguagem coloquial moderna (ex: "I'm broke", "I'm starving", "Let's grab a coffee", "Hit me up", "No big deal").
- Apresente também diferenças interessantes entre países (ex: Buddy/Bro nos EUA vs Mate/Cheers no Reino Unido).
`;
  } else {
    // 26+ (Adults)
    ageGroup = "Adulto (26+)";
    let goalFocus = "Geral";
    if (learningGoal === "Trabalho" || learningGoal === "Negócios" || learningGoal === "💼" || learningGoal === "📊") {
      goalFocus = "Profissional e Negócios (Expressões corporativas, termos de networking profissional, e-mails comerciais)";
    } else if (learningGoal === "Viagens" || learningGoal === "✈️") {
      goalFocus = "Turismo e Viagem (Expressões locais úteis para hotel, aeroporto, restaurante, pedir direções)";
    } else if (learningGoal === "Conversação" || learningGoal === "💬") {
      goalFocus = "Conversação do dia a dia (Expressões naturais e coloquiais do dia a dia para conexões autênticas)";
    } else if (learningGoal === "Universidade" || learningGoal === "Escola" || learningGoal === "🎓" || learningGoal === "🎒") {
      goalFocus = "Acadêmico e Universitário (Expressões formais, termos de redação acadêmica, apresentações de seminários)";
    }
    ageTone = "Adulto (maduro, respeitoso, encorajador, focado no objetivo de carreira ou viagem)";
    pedagogicalConstraints = `
- FOCO PEDAGÓGICO DO ADULTO: Focar inteiramente no objetivo do aluno: ${goalFocus}.
- Forneça exemplos que façam sentido profissional, de turismo ou acadêmico conforme o objetivo escolhido.
`;
  }

  // Adjust vocabulary and theme based on goal
  let goalContext = "";
  if (learningGoal) {
    goalContext = `- Objetivo de Aprendizado do Aluno: ${learningGoal}. Adapte o vocabulário, exemplos práticos e simulações para este foco.`;
  }

  // Region and mode specific prompt inserts
  const chosenRegion = targetRegion || "US";
  const expressionsAllow = allowRegionalExpressions !== false ? "Habilitadas" : "Desabilitadas";
  const slangAllow = (allowSlang !== false && parsedAge >= 9) ? "Habilitadas" : "Desabilitadas/Proibidas";
  const chosenMode = languageMode || "Standard";

  const regionalVariantPrompt = `
- VARIANTE REGIONAL ALVO DO ALUNO: ${chosenRegion} (Ex: se Inglês, US=Estados Unidos, GB=Reino Unido, CA=Canadá, AU=Austrália, INT=Internacional. Se Português, PT=Portugal, BR=Brasil, AO=Angola, MZ=Moçambique).
- Adapte seu vocabulário preferido para esta variante regional! 
- Se o aluno perguntar ou se for oportuno, faça comparações didáticas de regionalismo (ex: "Apartment" nos EUA vs "Flat" no Reino Unido, ou "Buddy" nos EUA vs "Mate" no Reino Unido/Austrália).
- Estado de Expressões Regionais: ${expressionsAllow}.
- Estado de Gírias: ${slangAllow}.
- Modo de Linguagem do Aluno: ${chosenMode} (Standard foca no acadêmico/padrão da língua, Colloquial foca no uso prático coloquial das ruas).
`;

  // 2. Construir prompt inteligente
  const prompt = `
Você é um professor virtual da plataforma LingoLIVE IA.
Atualmente você está ambientado e contextualizado nas configurações regionais de: ${countryDetail.name} (Bandeira: ${countryDetail.flag}, Moeda: ${countryDetail.currency} - ${countryDetail.symbol}).

REGRAS DE CONDUTA PEDAGÓGICA E CONTEÚDO:
1. Siga estritamente as limitações da faixa etária (${ageGroup}) e o tom apropriado: ${ageTone}.
2. Siga as diretrizes de regionalismo e preferência do aluno:
${regionalVariantPrompt}
3. REGRAS PEDAGÓGICAS CRÍTICAS:
   - O conteúdo principal deve ser sempre a forma padrão da língua; regionalismos e gírias aparecem apenas como complemento informativo.
   - Cada expressão ou gíria nova apresentada deve indicar claramente onde é usada, quem costuma usá-la (faixa etária, contexto social) e em que situações é apropriada ou deve ser evitada.
   - SEGURANÇA MÁXIMA: NUNCA ensine gírias ofensivas, discriminatórias, de conotação sexual ou ligadas a comportamentos de risco, especialmente para menores de idade.
4. CLASSIFICAÇÃO MANDATÓRIA DE EXPRESSÕES:
   Sempre que introduzir ou explicar uma expressão, gíria ou termo regional, classifique-o explicitamente no final usando marcadores de fácil leitura:
   - Categoria: [Formal | Neutra | Informal | Regional | Gíria | Profissional | Académica]
   - Maturidade: [Infantil | Adolescente | Jovem adulto | Adulto]

${pedagogicalConstraints}

- Idioma nativo do aluno: ${languageNative}
- Idioma que o aluno está aprendendo (Idioma alvo): ${languageTarget}
- Estilo educativo, motivador, paciente e interativo.
- Usar, se apropriado e respeitando a idade, gírias regionais comuns de ${countryDetail.name}: ${countryDetail.slangs ? countryDetail.slangs.map(s => s.term).join(', ') : ''}

Contexto da lição:
${lessonContext || "geral"}

Dados de progresso do aluno:
- XP acumulado: ${userData?.xp || 0}
- Streak de dias: ${userData?.streak || 0}

Mensagem do aluno:
${message}

Responda de forma curta, clara e altamente educativa, mantendo total sintonia com o perfil do aluno (idade, nível, variante, objetivo) e o tom do país ativo (${countryDetail.name}). NUNCA gere conteúdo inadequado para a idade do utilizador.
`;

  const activeModel = preferredAIModel || "gpt-4o";

  if (activeModel === "gemini") {
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an expert language teacher.",
          temperature: 0.7,
        }
      });
      return response.text || "Desculpe, não consegui obter uma resposta de Gemini.";
    } catch (geminiError: any) {
      console.error("Erro na chamada direta ao Gemini:", geminiError.message);
      return `[Erro Gemini] Ocorreu uma falha ao comunicar com o modelo Gemini.`;
    }
  } else {
    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // ChatGPT 4 (flagship)
        messages: [
          { role: "system", content: systemInstruction || "You are an expert language teacher." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (openaiError: any) {
      console.error("Erro na chamada direta ao OpenAI (GPT-4o):", openaiError.message);
      console.log("Tentando fallback de alta disponibilidade para o Gemini...");
      try {
        const response = await generateContentWithRetry({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || "You are an expert language teacher.",
            temperature: 0.7,
          }
        });
        return `[Nota: Executado via Fallback (Gemini) devido a limite/ausência de chave OpenAI] ${response.text || ""}`;
      } catch (fallbackError: any) {
        console.error("Gemini fallback failed as well:", fallbackError.message);
        return `[Erro de Conexão] O ChatGPT 4 (GPT-4o) falhou e o modelo de contingência (Gemini) também está offline. Verifique a chave de API OPENAI_API_KEY no painel de configurações.`;
      }
    }
  }
};
