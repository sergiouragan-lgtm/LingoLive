import { describe, it, expect } from "vitest";
import {
  buildTutorProfileAdaptationPolicy,
  TutorProfileAdaptationInput,
} from "./tutorProfileAdaptationPolicyBuilder";
import { buildTutorSessionContext } from "./tutorSessionContextBuilder";
import { buildTutorCulturalInstructions } from "./tutorCulturalInstructionsBuilder";

describe("tutorProfileAdaptationPolicyBuilder — Suíte de Testes da Política de Adaptação por Perfil", () => {
  it("TESTE 1 — CRIANÇA: Validação Inicial do Perfil e Diretrizes Básicas", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "child",
      ageGroup: "5-8 anos",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("child");
    expect(policy.sessionMode).toBe("tutoring");
    expect(policy.communicationGuidance.some((g) => g.includes("simples"))).toBe(true);
    expect(policy.communicationGuidance.some((g) => g.includes("instruções curtas"))).toBe(true);
    expect(policy.teachingGuidance.some((g) => g.includes("delicadeza"))).toBe(true);
    expect(policy.safetyGuidance.some((g) => g.includes("proteções reforçadas para menores"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("dados pessoais"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("segredos"))).toBe(true);
  });

  it("TESTE 1.1 — CRIANÇA: Remoção Total de Promessas Absolutas (100% Seguro / Risco Zero)", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    const allGuidanceText = [
      ...policy.communicationGuidance,
      ...policy.teachingGuidance,
      ...policy.assistanceGuidance,
      ...policy.autonomyGuidance,
      ...policy.safetyGuidance,
      ...policy.prohibitedBehaviours,
    ].join(" ").toLowerCase();

    expect(allGuidanceText).not.toContain("100%");
    expect(allGuidanceText).not.toContain("100 %");
    expect(allGuidanceText).not.toContain("segurança total");
    expect(allGuidanceText).not.toContain("completamente seguro");
    expect(allGuidanceText).not.toContain("risco zero");
    expect(allGuidanceText).not.toContain("totalmente infalível");

    // Confirma que a proibição de promessas absolutas está explícita
    expect(policy.prohibitedBehaviours.some((p) => p.includes("promessas absolutas de segurança"))).toBe(true);
  });

  it("TESTE 1.2 — CRIANÇA: Proteção de Dados Pessoais Explícita", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("dados pessoais") &&
      p.includes("nome completo") &&
      p.includes("morada") &&
      p.includes("telefone") &&
      (p.includes("correio eletrónico") || p.includes("email"))
    )).toBe(true);
  });

  it("TESTE 1.3 — CRIANÇA: Proibição de Segredos e Conversas 'Só Entre Nós'", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("guardar segredos") || p.includes("isto fica só entre nós")
    )).toBe(true);
  });

  it("TESTE 1.4 — CRIANÇA: Proibição de Contacto Externo e Redes Sociais", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("contacto externo") && p.includes("redes sociais")
    )).toBe(true);
  });

  it("TESTE 1.5 — CRIANÇA: Prevenção de Dependência Emocional e Falsa Amizade Humana Exclusiva", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("dependência emocional") && p.includes("amizade humana exclusiva")
    )).toBe(true);
  });

  it("TESTE 1.6 — CRIANÇA: Identidade Clara de IA sem Biografia Humana Falsa", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.communicationGuidance.some((g) =>
      g.includes("tutor de inteligência artificial") && g.includes("sem biografia humana falsa")
    )).toBe(true);
  });

  it("TESTE 1.7 — CRIANÇA: Não Substituição de Encarregados, Professores ou Profissionais", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("substituir encarregados de educação") && p.includes("médicos, psicólogos ou serviços de emergência")
    )).toBe(true);
  });

  it("TESTE 1.8 — CRIANÇA: Encaminhamento para Adulto Responsável em Situações Sensíveis", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.assistanceGuidance.some((g) =>
      g.includes("medo, perigo ou desconforto") && g.includes("adulto responsável de confiança")
    )).toBe(true);
  });

  it("TESTE 1.9 — CRIANÇA: Conteúdo Adequado e Proteção Contra Conteúdos Inadequados", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    expect(policy.prohibitedBehaviours.some((p) =>
      p.includes("conteúdos sexuais adultos, violência, drogas, álcool, desafios perigosos")
    )).toBe(true);
  });

  it("TESTE 1.10 — CRIANÇA: Ausência de Regras Visuais Obrigatórias para Tutor por Voz", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    const allGuidanceText = [...policy.communicationGuidance, ...policy.teachingGuidance].join(" ");
    expect(allGuidanceText).not.toContain("explicação visual/lúdica");
    expect(allGuidanceText).not.toContain("visuais obrigatórios");
  });

  it("TESTE 1.11 — CRIANÇA: Ausência de Limites Rígidos Arbitrários (ex: exatas 1-2 frases)", () => {
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    const allGuidanceText = [...policy.communicationGuidance, ...policy.teachingGuidance].join(" ");
    expect(allGuidanceText).not.toContain("1–2 frases");
    expect(allGuidanceText).not.toContain("duas frases");
    expect(allGuidanceText).not.toContain("zero termos gramaticais");
  });

  it("TESTE 1.12 — CRIANÇA: Integração com TutorCulturalInstructionsBuilder sem '100%'", () => {
    const sessionCtx = buildTutorSessionContext({
      learningProfile: "child",
      ageGroup: "5-8 anos",
    });

    const culturalInst = buildTutorCulturalInstructions(sessionCtx);
    expect(culturalInst.serializedInstructions).toContain("[PROFILE ADAPTATION]");
    expect(culturalInst.serializedInstructions).not.toContain("100%");
    expect(culturalInst.serializedInstructions).toContain("child");
  });

  it("TESTE 2 — ADOLESCENTE", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "teenager",
      ageGroup: "13-16 anos",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("teenager");
    expect(policy.communicationGuidance.some((g) => g.includes("não infantilizado"))).toBe(true);
    expect(policy.autonomyGuidance.some((g) => g.includes("autónoma"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("colega humano"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("redes sociais"))).toBe(true);
  });

  it("TESTE 3 — ADULTO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
      ageGroup: "Adulto (26+)",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("adult");
    expect(policy.communicationGuidance.some((g) => g.includes("madura"))).toBe(true);
    expect(policy.teachingGuidance.some((g) => g.includes("metas do mundo real"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("paternalista"))).toBe(true);
  });

  it("TESTE 4 — PROFESSOR", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "TEACHER",
      sessionMode: "teacher_support",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("educator");
    expect(policy.sessionMode).toBe("teacher_support");
    expect(policy.teachingGuidance.some((g) => g.includes("planeamento pedagógico"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("substituto do professor"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("notas oficiais"))).toBe(true);
  });

  it("TESTE 5 — ENCARREGADO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "guardian_support",
      rbacRole: "PARENT",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("guardian_support");
    expect(policy.sessionMode).toBe("guardian_guidance");
    expect(policy.teachingGuidance.some((g) => g.includes("apoiar a aprendizagem em casa"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("diagnósticos clínicos"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("culpar a criança"))).toBe(true);
  });

  it("TESTE 6 — ESCOLA", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "SCHOOL_ADMIN",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("institutional");
    expect(policy.sessionMode).toBe("school_support");
    expect(policy.communicationGuidance.some((g) => g.includes("institucional"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("aluno individual"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("dados pessoais"))).toBe(true);
  });

  it("TESTE 7 — EMBAIXADOR LINGUÍSTICO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "language_ambassador",
      rbacRole: "AMBASSADOR",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("language_ambassador");
    expect(policy.sessionMode).toBe("ambassador_support");
    expect(policy.teachingGuidance.some((g) => g.includes("variantes regionais"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("professor certificado"))).toBe(true);
    expect(policy.prohibitedBehaviours.some((p) => p.includes("estereótipos regionais"))).toBe(true);
  });

  it("TESTE 8 — PERFIL GENÉRICO", () => {
    const policy = buildTutorProfileAdaptationPolicy(null);

    expect(policy.resolvedLearningProfile).toBe("generic");
    expect(policy.sessionMode).toBe("tutoring");
    expect(policy.fallbackApplied).toBe(true);
    expect(policy.sourceConfidence).toBe("fallback");
    expect(policy.communicationGuidance.some((g) => g.includes("neutra"))).toBe(true);
  });

  it("TESTE 9 — PAPEL RBAC NÃO MUDA", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "STUDENT",
      learningProfile: "child",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    // Confirma que a política não exporta comandos ou alterações de RBAC
    const policyKeys = Object.keys(policy);
    expect(policyKeys).not.toContain("grantedPermissions");
    expect(policyKeys).not.toContain("assignedRole");
    expect(policy.prohibitedBehaviours.some((p) => p.includes("does not change account permissions"))).toBe(true);
  });

  it("TESTE 10 — STUDENT NÃO DEFINE IDADE", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "STUDENT",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("generic");
    expect(policy.resolvedLearningProfile).not.toBe("child");
    expect(policy.resolvedLearningProfile).not.toBe("teenager");
  });

  it("TESTE 11 — PROFESSOR NÃO É ALUNO AUTOMÁTICO", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "TEACHER",
      sessionMode: "teacher_support",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("educator");
    expect(policy.sessionMode).toBe("teacher_support");
  });

  it("TESTE 12 — ENCARREGADO NÃO É CRIANÇA", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "PARENT",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("guardian_support");
    expect(policy.resolvedLearningProfile).not.toBe("child");
  });

  it("TESTE 13 — ESCOLA NÃO É UTILIZADOR INDIVIDUAL", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "ORG_ADMIN",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("institutional");
    expect(policy.prohibitedBehaviours.some((p) => p.includes("aluno individual"))).toBe(true);
  });

  it("TESTE 14 — EMBAIXADOR NÃO É PROFESSOR CERTIFICADO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "language_ambassador",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.prohibitedBehaviours.some((p) => p.includes("professor certificado"))).toBe(true);
  });

  it("TESTE 15 — TUTORIZAÇÃO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
      sessionMode: "tutoring",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.sessionMode).toBe("tutoring");
  });

  it("TESTE 16 — AJUDA", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
      sessionMode: "help",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.sessionMode).toBe("help");
    expect(policy.assistanceGuidance.some((g) => g.includes("Responder diretamente ao problema imediato"))).toBe(true);
  });

  it("TESTE 17 — AUTO-AJUDA", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
      sessionMode: "self_help",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.sessionMode).toBe("self_help");
    expect(policy.assistanceGuidance.some((g) => g.includes("autónoma"))).toBe(true);
    expect(policy.assistanceGuidance.some((g) => g.includes("sem emitir diagnósticos nem conselhos clínicos"))).toBe(true);
  });

  it("TESTE 18 — CONFLITO DE PERFIL", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "TEACHER",
      learningProfile: "child",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("child");
    expect(policy.sourceConfidence).toBe("partial");
  });

  it("TESTE 19 — VALOR DESCONHECIDO", () => {
    const input: TutorProfileAdaptationInput = {
      rbacRole: "UNKNOWN_ROLE_123",
      learningProfile: "CORRUPTED_VALUE",
      ageGroup: "INVALID_AGE",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(policy.resolvedLearningProfile).toBe("generic");
    expect(policy.fallbackApplied).toBe(true);
    expect(policy.sourceConfidence).toBe("fallback");
  });

  it("TESTE 20 — IMUTABILIDADE", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.communicationGuidance)).toBe(true);
    expect(Object.isFrozen(policy.teachingGuidance)).toBe(true);
    expect(Object.isFrozen(policy.prohibitedBehaviours)).toBe(true);

    expect(() => {
      // @ts-expect-error Testing runtime frozen immutability
      policy.communicationGuidance.push("NEW_GUIDANCE");
    }).toThrow();
  });

  it("TESTE 21 — DETERMINISMO", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "child",
      sessionMode: "tutoring",
    };
    const p1 = buildTutorProfileAdaptationPolicy(input);
    const p2 = buildTutorProfileAdaptationPolicy(input);

    expect(p1).toEqual(p2);
  });

  it("TESTE 22 — AUSÊNCIA DE REDE E GEMINI", () => {
    const t0 = performance.now();
    const policy = buildTutorProfileAdaptationPolicy({ learningProfile: "child" });
    const t1 = performance.now();

    expect(policy).toBeDefined();
    expect(t1 - t0).toBeLessThan(50);
  });

  it("TESTE 23 — SEM DADOS SENSÍVEIS", () => {
    const policy = buildTutorProfileAdaptationPolicy({
      learningProfile: "child",
    });

    const stringified = JSON.stringify(policy).toLowerCase();
    expect(stringified).not.toContain("email");
    expect(stringified).not.toContain("password");
    expect(stringified).not.toContain("address");
    expect(stringified).not.toContain("phone");
    expect(stringified).not.toContain("diagnosis");
  });

  it("TESTE 24 — CEFR NÃO DEFINE PAPEL", () => {
    const policyA1 = buildTutorProfileAdaptationPolicy({ cefrLevel: "A1" });
    const policyC1 = buildTutorProfileAdaptationPolicy({ cefrLevel: "C1" });

    expect(policyA1.resolvedLearningProfile).toBe("generic");
    expect(policyC1.resolvedLearningProfile).toBe("generic");
  });

  it("TESTE 25 — IDIOMA NÃO DEFINE PERFIL", () => {
    const input1 = { learningGoals: ["pt-AO"] };
    const input2 = { learningGoals: ["en-US"] };

    const p1 = buildTutorProfileAdaptationPolicy(input1);
    const p2 = buildTutorProfileAdaptationPolicy(input2);

    expect(p1.resolvedLearningProfile).toBe("generic");
    expect(p2.resolvedLearningProfile).toBe("generic");
  });

  it("TESTE 26 — PERFIL NÃO É ALTERADO PELO TUTOR", () => {
    const input: TutorProfileAdaptationInput = {
      learningProfile: "adult",
    };
    const policy = buildTutorProfileAdaptationPolicy(input);

    // Garante que a política é puramente consultiva/pedagógica e não retorna comandos de mutação
    const policyRecord = policy as unknown as Record<string, unknown>;
    expect(policyRecord.mutationCommand).toBeUndefined();
    expect(policyRecord.updateProfilePayload).toBeUndefined();
  });

  it("TESTE 27 — CORRECÇÃO PEDAGÓGICA", () => {
    const policyGentle = buildTutorProfileAdaptationPolicy({
      learningProfile: "adult",
      preferredCorrectionStyle: "gentle",
    });

    expect(policyGentle.teachingGuidance.some((g) => g.includes("suave"))).toBe(true);
  });

  it("TESTE 28 — PROIBIÇÃO RBAC UNIVERSAL", () => {
    const profiles = ["child", "teenager", "adult", "educator", "guardian_support", "institutional", "language_ambassador", "generic"] as const;

    for (const p of profiles) {
      const policy = buildTutorProfileAdaptationPolicy({ learningProfile: p });
      expect(policy.safetyGuidance.some((s) => s.includes("não altera as permissões da conta nem a autoridade RBAC"))).toBe(true);
      expect(policy.prohibitedBehaviours.some((pb) => pb.includes("does not change account permissions or RBAC authority"))).toBe(true);
    }
  });
});
