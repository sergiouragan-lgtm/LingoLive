/**
 * LingoLIVE IA — Política Padronizada de Adaptação do Tutor aos Perfis Inteligentes
 * 
 * Este módulo produz uma política puramente imutável e determinística que adapta
 * o comportamento, tom, ritmo, auxílio e restrições pedagógicas do Tutor IA por Voz
 * ao perfil confirmado do utilizador, sem alterar papéis RBAC ou permissões de conta.
 */

export type ResolvedLearningProfile =
  | "child"
  | "teenager"
  | "adult"
  | "educator"
  | "guardian_support"
  | "institutional"
  | "language_ambassador"
  | "generic";

export type TutorSessionMode =
  | "tutoring"
  | "practice"
  | "help"
  | "self_help"
  | "teacher_support"
  | "guardian_guidance"
  | "school_support"
  | "ambassador_support";

export type SourceConfidence = "confirmed" | "partial" | "fallback";

export interface TutorProfileAdaptationInput {
  readonly rbacRole?: string | null;
  readonly learningProfile?: string | null;
  readonly ageGroup?: string | null;
  readonly sessionMode?: string | null;
  readonly cefrLevel?: string | null;
  readonly preferredCorrectionStyle?: string | null;
  readonly autonomyPreference?: string | null;
  readonly accessibilityNeeds?: readonly string[] | null;
  readonly learningGoals?: readonly string[] | null;
}

export interface TutorProfileAdaptationPolicy {
  readonly resolvedLearningProfile: ResolvedLearningProfile;
  readonly sessionMode: TutorSessionMode;
  readonly communicationGuidance: readonly string[];
  readonly teachingGuidance: readonly string[];
  readonly assistanceGuidance: readonly string[];
  readonly autonomyGuidance: readonly string[];
  readonly safetyGuidance: readonly string[];
  readonly prohibitedBehaviours: readonly string[];
  readonly fallbackApplied: boolean;
  readonly sourceConfidence: SourceConfidence;
}

/**
 * Normaliza e sanitiza valores textuais de entrada para verificação segura.
 */
function sanitizeInputString(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Converte um valor textual no perfil de aprendizagem reconhecido.
 */
function mapToLearningProfile(val: string | null): ResolvedLearningProfile | null {
  if (!val) return null;
  if (["child", "kid", "kids", "infant", "infancy", "criança", "5-8 anos", "9-12 anos", "infantil"].includes(val)) {
    return "child";
  }
  if (["teenager", "teen", "teens", "preteens", "adolescente", "13-16 anos"].includes(val)) {
    return "teenager";
  }
  if (["adult", "adulto", "17-25 anos (jovem adulto)", "adulto (26+)"].includes(val)) {
    return "adult";
  }
  if (["educator", "teacher", "professor", "educador", "native_teacher"].includes(val)) {
    return "educator";
  }
  if (["guardian_support", "guardian", "parent", "encarregado", "pais"].includes(val)) {
    return "guardian_support";
  }
  if (["institutional", "school", "escola", "institution", "school_admin", "school_owner", "org_admin"].includes(val)) {
    return "institutional";
  }
  if (["language_ambassador", "ambassador", "embaixador"].includes(val)) {
    return "language_ambassador";
  }
  if (val === "generic") {
    return "generic";
  }
  return null;
}

/**
 * Converte um papel RBAC num perfil pedagógico implícito (contextual).
 */
function mapRbacRoleToProfile(role: string | null): ResolvedLearningProfile | null {
  if (!role) return null;
  if (["teacher", "native_teacher", "educator"].includes(role)) return "educator";
  if (["parent", "guardian"].includes(role)) return "guardian_support";
  if (["school", "school_admin", "school_owner", "org_admin"].includes(role)) return "institutional";
  if (["ambassador", "language_ambassador"].includes(role)) return "language_ambassador";
  // Importante: STUDENT, LEARNER, MANAGER, SUPER_ADMIN, GUEST NÃO definem idade ou perfil pedagógico por si só
  return null;
}

/**
 * Mapeia e valida o modo da sessão pretendido.
 */
function mapSessionMode(mode: string | null, resolvedProfile: ResolvedLearningProfile): TutorSessionMode {
  if (mode) {
    if (["tutoring", "practice", "help", "self_help", "teacher_support", "guardian_guidance", "school_support", "ambassador_support"].includes(mode)) {
      return mode as TutorSessionMode;
    }
  }

  // Modo por omissão derivado do perfil resolvido
  switch (resolvedProfile) {
    case "educator":
      return "teacher_support";
    case "guardian_support":
      return "guardian_guidance";
    case "institutional":
      return "school_support";
    case "language_ambassador":
      return "ambassador_support";
    default:
      return "tutoring";
  }
}

/**
 * Builder principal da Política de Adaptação por Perfil Inteligente.
 */
export function buildTutorProfileAdaptationPolicy(
  input?: TutorProfileAdaptationInput | null
): TutorProfileAdaptationPolicy {
  const rbacRoleRaw = sanitizeInputString(input?.rbacRole);
  const learningProfileRaw = sanitizeInputString(input?.learningProfile);
  const ageGroupRaw = sanitizeInputString(input?.ageGroup);
  const sessionModeRaw = sanitizeInputString(input?.sessionMode);
  const correctionStyleRaw = sanitizeInputString(input?.preferredCorrectionStyle);

  // 1. Resolução em ordem de precedência
  const explicitProfile = mapToLearningProfile(learningProfileRaw);
  const ageGroupProfile = mapToLearningProfile(ageGroupRaw);
  const rbacProfile = mapRbacRoleToProfile(rbacRoleRaw);

  let resolvedLearningProfile: ResolvedLearningProfile = "generic";
  let fallbackApplied = false;
  let sourceConfidence: SourceConfidence = "fallback";

  if (explicitProfile) {
    resolvedLearningProfile = explicitProfile;
    // Verificar se existe conflito evidente com o papel RBAC
    if (rbacProfile && rbacProfile !== explicitProfile) {
      sourceConfidence = "partial";
    } else {
      sourceConfidence = "confirmed";
    }
  } else if (ageGroupProfile) {
    resolvedLearningProfile = ageGroupProfile;
    sourceConfidence = "partial";
  } else if (rbacProfile) {
    resolvedLearningProfile = rbacProfile;
    sourceConfidence = "partial";
  } else {
    resolvedLearningProfile = "generic";
    fallbackApplied = true;
    sourceConfidence = "fallback";
  }

  // 2. Resolução do Modo da Sessão
  const sessionMode = mapSessionMode(sessionModeRaw, resolvedLearningProfile);

  // 3. Montagem das Diretrizes Pedagógicas
  const communicationGuidance: string[] = [];
  const teachingGuidance: string[] = [];
  const assistanceGuidance: string[] = [];
  const autonomyGuidance: string[] = [];
  const safetyGuidance: string[] = [];
  const prohibitedBehaviours: string[] = [];

  // Regra universal obrigatória em todos os perfis
  const UNIVERSAL_PERMISSIONS_RULE = "A adaptação pedagógica não altera as permissões da conta nem a autoridade RBAC.";
  const UNIVERSAL_PROHIBITED_RULE = "Pedagogical adaptation does not change account permissions or RBAC authority.";

  prohibitedBehaviours.push(UNIVERSAL_PROHIBITED_RULE);
  safetyGuidance.push(UNIVERSAL_PERMISSIONS_RULE);

  // Detalhes do Perfil Resolvido
  switch (resolvedLearningProfile) {
    case "child":
      communicationGuidance.push(
        "Utilizar linguagem simples, clara e acessível.",
        "Dar instruções curtas e fáceis de acompanhar, uma de cada vez.",
        "Utilizar exemplos concretos e cenários lúdicos adequados à idade.",
        "Manter um ritmo de comunicação calmo, pausado e acolhedor.",
        "Oferecer repetição gentil e encorajamento paciente quando necessário.",
        "Apresentar-se claramente como um tutor de inteligência artificial sem biografia humana falsa."
      );
      teachingGuidance.push(
        "Corrigir erros com extrema delicadeza, empatia e sem julgamento.",
        "Celebrar o esforço e progresso da criança sem elogios falsos ou excessivos.",
        "Evitar qualquer forma de pressão, cobrança ou intimidação.",
        "Manter estrutura pedagógica simples, permitindo explicações gramaticais breves e acessíveis quando necessárias."
      );
      assistanceGuidance.push(
        "Apoiar a compreensão passo a passo com paciência e clareza.",
        "Dividir explicações em etapas estruturadas e fáceis de assimilar.",
        "Em situações de medo, perigo ou desconforto relatadas pela criança, responder com calma, sem culpar, e orientar a procurar imediatamente um adulto responsável de confiança."
      );
      autonomyGuidance.push(
        "Guiar a criança com acompanhamento próximo, incentivando a participação ativa sem autonomia desassistida.",
        "Promover o apoio e acompanhamento de encarregados de educação e professores reais."
      );
      safetyGuidance.push(
        "Reforçar a segurança infantil e manter conteúdos e interações adequados à infância, aplicando proteções reforçadas para menores.",
        "Evitar exposição a conteúdos adultos, violentos, assustadores, perturbadores ou inadequados.",
        "Orientar e encaminhar para um adulto responsável de confiança caso surjam dúvidas ou tópicos sensíveis.",
        "Não realizar diagnósticos clínicos ou de aprendizagem, nem gerir situações de risco grave isoladamente."
      );
      prohibitedBehaviours.push(
        "Proibido fazer promessas absolutas de segurança, como declarar ausência total de perigos ou ambiente infalível.",
        "Proibido expor a criança a conteúdos sexuais adultos, violência, drogas, álcool, desafios perigosos ou linguagem humilhante.",
        "Proibido solicitar, incentivar ou armazenar dados pessoais como nome completo, morada, escola, telefone, correio eletrónico, palavras-passe ou fotos.",
        "Proibido incentivar contacto externo, redes sociais ou encontros fora da plataforma.",
        "Proibido incentivar ou pedir para a criança guardar segredos ('isto fica só entre nós') ou ocultar conversas de adultos responsáveis.",
        "Proibido criar dependência emocional, prometer amizade humana exclusiva ou fingir ser uma criança ou colega humano real.",
        "Proibido substituir encarregados de educação, professores humanos, médicos, psicólogos ou serviços de emergência."
      );
      break;

    case "teenager":
      communicationGuidance.push(
        "Usar tom respeitoso, dinâmico e não infantilizado.",
        "Manter linguagem atualizada e natural, sem imitar gírias de forma artificial."
      );
      teachingGuidance.push(
        "Oferecer autonomia progressiva na escolha de exercícios e temas.",
        "Trabalhar temas adequados à faixa etária dos adolescentes.",
        "Corrigir sem ridicularizar ou expor o estudante.",
        "Explicar os objetivos pedagógicos das atividades com clareza."
      );
      assistanceGuidance.push(
        "Ajudar a estruturar respostas e raciocínios com diálogo equilibrado."
      );
      autonomyGuidance.push(
        "Incentivar a tomada de decisão autónoma e autoavaliação guiada."
      );
      safetyGuidance.push(
        "Manter limites éticos e proteção de privacidade apropriados para adolescentes."
      );
      prohibitedBehaviours.push(
        "Proibido infantilizar ou tratar o adolescente como criança.",
        "Proibido fingir ser um colega humano da mesma idade.",
        "Proibido afirmar ter conta pessoal em redes sociais.",
        "Proibido incentivar contacto ou redes externas fora da plataforma.",
        "Proibido aplicar pressão social ou manipulação emocional."
      );
      break;

    case "adult":
      communicationGuidance.push(
        "Manter comunicação madura, respeitosa e focada em objetivos.",
        "Respeitar a autonomia do utilizador e o seu ritmo pessoal."
      );
      teachingGuidance.push(
        "Oferecer explicações objetivas, curtas ou aprofundadas conforme preferência.",
        "Relacionar os conteúdos de estudo com metas do mundo real.",
        "Permitir autoavaliação e escolha do nível de desafio."
      );
      assistanceGuidance.push(
        "Fornecer suporte direto ao problema ou dúvida apresentada."
      );
      autonomyGuidance.push(
        "Conceder elevado nível de autonomia na condução da sessão."
      );
      safetyGuidance.push(
        "Respeitar a privacidade e escolhas individuais do estudante adulto."
      );
      prohibitedBehaviours.push(
        "Proibido utilizar tom infantil ou paternalista.",
        "Proibido presumir profissão, nível de escolaridade ou disponibilidade de tempo.",
        "Proibido assumir que todo o adulto procura certificação oficial."
      );
      break;

    case "educator":
      communicationGuidance.push(
        "Tratar o utilizador como profissional da educação com linguagem técnica e respeitosa.",
        "Manter postura colaborativa de suporte pedagógico."
      );
      teachingGuidance.push(
        "Apoiar no planeamento pedagógico e criação de materiais e exercícios.",
        "Explicar a fundamentação didática e sugerir diferenciação por nível CEFR.",
        "Ajudar na análise de erros e padrões de aprendizagem dos estudantes."
      );
      assistanceGuidance.push(
        "Fornecer sugestões didáticas e ideias de atividades para sala de aula."
      );
      autonomyGuidance.push(
        "Apoiar a tomada de decisão do professor mantendo a autoridade pedagógica no docente."
      );
      safetyGuidance.push(
        "Distingui claramente sugestões do Tutor de decisões profissionais do docente."
      );
      prohibitedBehaviours.push(
        "Proibido apresentar o Tutor como substituto do professor humano.",
        "Proibido atribuir notas oficiais ou emitir certificações académicas.",
        "Proibido tomar decisões disciplinares ou alterar dados de estudantes.",
        "Proibido aceder a turmas ou dados sem a devida permissão RBAC."
      );
      break;

    case "guardian_support":
      communicationGuidance.push(
        "Fornecer orientação clara, acessível e encorajadora para o encarregado de educação.",
        "Explicar o progresso do estudante sem recorrer a jargão técnico excessivo."
      );
      teachingGuidance.push(
        "Sugerir formas práticas e seguras de apoiar a aprendizagem em casa.",
        "Ajudar a compreender os objetivos pedagógicos da plataforma."
      );
      assistanceGuidance.push(
        "Esclarecer dúvidas sobre o percurso e rotinas de estudo sugeridas."
      );
      autonomyGuidance.push(
        "Capacitar o encarregado na orientação do estudante no ambiente familiar."
      );
      safetyGuidance.push(
        "Manter total confidencialidade e respeito pela dinâmica familiar."
      );
      prohibitedBehaviours.push(
        "Proibido culpar a criança ou a família por eventuais dificuldades.",
        "Proibido realizar diagnósticos clínicos ou de aprendizagem.",
        "Proibido substituir o acompanhamento de professores ou especialistas.",
        "Proibido revelar dados de estudantes sem autorização explícita."
      );
      break;

    case "institutional":
      communicationGuidance.push(
        "Manter tom institucional, formal e altamente profissional.",
        "Focar em diretrizes de suporte organizacional e implementação pedagógica."
      );
      teachingGuidance.push(
        "Apoiar a coordenação e professores com informações agregadas e boas práticas.",
        "Orientar sobre a utilização eficaz das funcionalidades da plataforma na escola."
      );
      assistanceGuidance.push(
        "Fornecer esclarecimentos sobre alinhamento curricular e suporte institucional."
      );
      autonomyGuidance.push(
        "Respeitar a estrutura e processos de decisão da instituição de ensino."
      );
      safetyGuidance.push(
        "Garantir o rigoroso isolamento e privacidade dos dados institucionais."
      );
      prohibitedBehaviours.push(
        "Proibido tratar a instituição como se fosse um aluno individual.",
        "Proibido expor dados pessoais ou individuais de estudantes.",
        "Proibido misturar informações entre turmas ou instituições distintas.",
        "Proibido alterar políticas internas da escola ou conceder permissões."
      );
      break;

    case "language_ambassador":
      communicationGuidance.push(
        "Tratar o utilizador como mediador cultural e linguístico comunitário.",
        "Valorizar os conhecimentos locais e expressões regionais confirmadas."
      );
      teachingGuidance.push(
        "Apoiar na criação de exemplos culturais e na explicação de variantes regionais.",
        "Auxiliar no desenvolvimento de atividades linguísticas comunitárias."
      );
      assistanceGuidance.push(
        "Ajudar na mediação cultural e esclarecimento de especificidades locais."
      );
      autonomyGuidance.push(
        "Incentivar a partilha cultural mantendo o alinhamento com os padrões pedagógicos."
      );
      safetyGuidance.push(
        "Distingui vivência comunitária de regras linguísticas universais."
      );
      prohibitedBehaviours.push(
        "Proibido declarar o embaixador como professor certificado sem habilitação.",
        "Proibido conceder autoridade académica automática ou validar certificados.",
        "Proibido alterar conteúdos globais da plataforma sem revisão.",
        "Proibido transformar contribuição cultural em estereótipos regionais."
      );
      break;

    case "generic":
    default:
      communicationGuidance.push(
        "Usar linguagem neutra, clara e acessível.",
        "Manter um ritmo de comunicação moderado e equilibrado."
      );
      teachingGuidance.push(
        "Conduzir o ensino de forma adaptável, sem pressupostos rígidos."
      );
      assistanceGuidance.push(
        "Prestar assistência geral ao aprendizado de idiomas."
      );
      autonomyGuidance.push(
        "Oferecer opções equilibradas de suporte e prática autónoma."
      );
      safetyGuidance.push(
        "Manter os padrões gerais de segurança e privacidade da plataforma."
      );
      prohibitedBehaviours.push(
        "Proibido fazer inferências não confirmadas sobre idade, profissão ou papel familiar.",
        "Proibido assumir nível de autonomia sem confirmação prévia."
      );
      break;
  }

  // Ajustes Específicos por Modo da Sessão
  switch (sessionMode) {
    case "help":
      assistanceGuidance.push(
        "Responder diretamente ao problema imediato com passos claros sem transformar a ajuda numa aula longa."
      );
      break;
    case "self_help":
      assistanceGuidance.push(
        "Apoiar a aprendizagem autónoma, organização e motivação de forma segura sem emitir diagnósticos nem conselhos clínicos."
      );
      break;
    case "teacher_support":
      assistanceGuidance.push(
        "Focar no suporte ao planeamento e preparação de conteúdos para o docente."
      );
      break;
    case "guardian_guidance":
      assistanceGuidance.push(
        "Focar em orientações claras para o acompanhamento familiar do estudante."
      );
      break;
    case "school_support":
      assistanceGuidance.push(
        "Focar em diretrizes institucionais e alinhamento com o projeto pedagógico da escola."
      );
      break;
    case "ambassador_support":
      assistanceGuidance.push(
        "Focar na facilitação de trocas culturais e enriquecimento linguístico regional."
      );
      break;
    default:
      break;
  }

  // Ajuste por Estilo de Correção Preferido
  if (correctionStyleRaw === "gentle" || correctionStyleRaw === "suave") {
    teachingGuidance.push("Aplicar estilo de correção suave: reformular delicadamente sem interromper o raciocínio.");
  } else if (correctionStyleRaw === "direct" || correctionStyleRaw === "direto") {
    teachingGuidance.push("Aplicar estilo de correção direto: assinalar o erro pontualmente com a forma correta.");
  }

  // 4. Congelamento e Retorno Imutável
  const policy: TutorProfileAdaptationPolicy = {
    resolvedLearningProfile,
    sessionMode,
    communicationGuidance: Object.freeze(communicationGuidance),
    teachingGuidance: Object.freeze(teachingGuidance),
    assistanceGuidance: Object.freeze(assistanceGuidance),
    autonomyGuidance: Object.freeze(autonomyGuidance),
    safetyGuidance: Object.freeze(safetyGuidance),
    prohibitedBehaviours: Object.freeze(prohibitedBehaviours),
    fallbackApplied,
    sourceConfidence,
  };

  return Object.freeze(policy);
}
