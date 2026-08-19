/**
 * LingoLIVE IA - Child Safety Service
 *
 * REFORÇO DE SEGURANÇA (auditoria): antes desta alteração, a faixa etária
 * usada para adaptar o comportamento do tutor de IA vinha diretamente de um
 * parâmetro enviado pelo PRÓPRIO CLIENTE (`ageGroup` na URL do WebSocket) —
 * ou seja, era trivialmente falsificável por qualquer utilizador, e o motor
 * de chat de texto não tinha sequer essa proteção.
 *
 * Este serviço torna a idade a fonte ÚNICA e AUTORITATIVA do lado do servidor:
 * lê sempre a idade guardada no perfil do utilizador autenticado (nunca a
 * aceita do cliente), e nunca falha "aberto": qualquer erro ou ausência de
 * dados resulta sempre na faixa etária mais protegida (Kids), nunca em Adult.
 */
import { dbAdmin } from "../config/firebaseAdmin";
import { HarmCategory, HarmBlockThreshold, SafetySetting } from "@google/genai";

export type AgeGroup = "Infancy" | "Kids" | "PreTeens" | "Teens" | "Adult";

const MOST_PROTECTIVE_DEFAULT: AgeGroup = "Kids";

/**
 * Converte uma idade numérica na faixa etária correspondente.
 * Em caso de dúvida/idade desconhecida, devolve sempre a opção mais protegida.
 */
export function computeAgeGroupFromAge(age: number | null | undefined): AgeGroup {
  if (typeof age !== "number" || Number.isNaN(age) || age < 0) {
    return MOST_PROTECTIVE_DEFAULT;
  }
  if (age <= 5) return "Infancy";
  if (age <= 9) return "Kids";
  if (age <= 12) return "PreTeens";
  if (age <= 17) return "Teens";
  return "Adult";
}

/**
 * Resolve a faixa etária REAL de um utilizador autenticado, lendo diretamente
 * do Firestore (nunca confiando em valores enviados pelo cliente).
 * Utilizadores convidados/sandbox e qualquer falha de leitura resultam sempre
 * na faixa mais protegida por defeito.
 */
export async function resolveServerSideAgeGroup(userUid: string | null | undefined): Promise<{
  ageGroup: AgeGroup;
  realAge: number | null;
  isMinor: boolean;
}> {
  // Em ambiente de testes automatizados (Vitest define process.env.VITEST),
  // nunca tentamos uma chamada real ao Firestore — mesmo padrão aplicado em
  // firestoreSafe.service.ts, paymentEngine.service.ts e stripe.service.ts,
  // que evita que cada teste demore perto do limite do Vitest à espera de
  // uma ligação de rede que nunca vai funcionar em CI/local sem credenciais.
  if (process.env.VITEST) {
    return { ageGroup: MOST_PROTECTIVE_DEFAULT, realAge: null, isMinor: true };
  }

  if (!userUid || userUid === "guest-user" || userUid === "sandbox-demo-user" || !dbAdmin) {
    return { ageGroup: MOST_PROTECTIVE_DEFAULT, realAge: null, isMinor: true };
  }

  try {
    const snap = await dbAdmin.collection("intelligentProfiles").doc(userUid).get();
    if (!snap.exists) {
      return { ageGroup: MOST_PROTECTIVE_DEFAULT, realAge: null, isMinor: true };
    }
    const data = snap.data() as any;
    // Fonte da idade: campo legado 'personalData.age', preenchido pelo Onboarding
    // para todos os utilizadores (mantido por compatibilidade e é hoje a única
    // fonte fiável de idade numérica no sistema).
    const rawAge = data?.personalData?.age;
    const age = typeof rawAge === "number" ? rawAge : null;
    const ageGroup = computeAgeGroupFromAge(age);
    return { ageGroup, realAge: age, isMinor: ageGroup !== "Adult" };
  } catch (err: any) {
    console.warn(`[ChildSafety] Falha ao verificar idade real de ${userUid}, a aplicar modo protegido por defeito:`, err?.message || err);
    return { ageGroup: MOST_PROTECTIVE_DEFAULT, realAge: null, isMinor: true };
  }
}

/**
 * Devolve as configurações de segurança de conteúdo do Gemini apropriadas
 * para a faixa etária. Todas as faixas de menores usam o limiar mais estrito
 * disponível (BLOCK_LOW_AND_ABOVE); adultos usam um limiar ainda assim seguro
 * por defeito (BLOCK_MEDIUM_AND_ABOVE) — nunca ficamos sem filtragem.
 */
export function getSafetySettingsForAgeGroup(ageGroup: AgeGroup): SafetySetting[] {
  const threshold: HarmBlockThreshold =
    ageGroup === "Adult" ? HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE : HarmBlockThreshold.BLOCK_LOW_AND_ABOVE;

  return [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold },
  ];
}

/**
 * Diretiva textual, em inglês (idioma dos prompts de sistema do tutor), a
 * injetar no system instruction consoante a faixa etária real do utilizador.
 * Usada tanto pelo tutor de voz (Live) como pelo tutor de texto.
 */
export function buildAgeSafetyDirective(ageGroup: AgeGroup): string {
  switch (ageGroup) {
    case "Infancy":
      return `AGE SAFETY DIRECTIVE - Toddlers & Preschoolers (Ages 3-5):
Use extremely simple words, short playful sentences, and a warm, gentle, encouraging tone.
Absolutely no scary, violent, romantic, or mature themes of any kind.
Never ask for or reference the child's real location, school, or any identifying personal details.
If the user writes something unsafe, concerning, or inappropriate, respond calmly and redirect to a safe, simple learning topic without repeating or amplifying the content.`;
    case "Kids":
      return `AGE SAFETY DIRECTIVE - Early Elementary (Ages 6-9):
Use simple, friendly, age-appropriate vocabulary. Keep the tone playful and encouraging.
No violence, horror, romance, or mature/adult themes. No political, religious, or ideological content.
Never ask for or reference the child's real location, school, or any identifying personal details.
If the user writes something unsafe, concerning, or inappropriate, respond calmly and redirect to a safe, simple learning topic without repeating or amplifying the content.`;
    case "PreTeens":
      return `AGE SAFETY DIRECTIVE - Pre-Teens (Ages 10-12):
Use age-appropriate vocabulary suited to a curious pre-teen. Keep an encouraging, respectful tone.
Avoid violence, horror, romantic/sexual content, and any mature or adult themes.
Do not discuss self-harm, substance use, or explicit political/ideological topics.
Never ask for or reference the student's real location, school, or identifying personal details.
If the user raises a concerning or unsafe topic, respond with care, do not elaborate on it, and gently redirect to the learning activity; suggest they talk to a trusted adult if it seems serious.`;
    case "Teens":
      return `AGE SAFETY DIRECTIVE - Teens (Ages 13-17):
Maintain a respectful, age-appropriate tone for a teenager. Standard educational topics are fine.
Avoid explicit sexual content, graphic violence, glorification of self-harm, or illegal-activity instructions.
Do not provide medical, legal, or mental-health advice; if such topics arise, gently suggest speaking with a trusted adult or professional.
Never request or store sensitive personal identifying information beyond what the platform already has on file.
If the user raises a concerning or unsafe topic (self-harm, abuse, violence), respond with care and calmly encourage them to reach out to a trusted adult or local support service, without providing harmful details.`;
    case "Adult":
    default:
      return `AGE CONTEXT: You are chatting with an adult. Maintain a natural, engaging, mature, and standard conversation, while still following the platform's general safety guidelines.`;
  }
}
