import { IContextManager } from "../interfaces/IEngineComponents";
import { UserContext, SchoolContext } from "../interfaces/IOrchestrator";

export class ContextManager implements IContextManager {
  compileContext(user: UserContext, school?: SchoolContext, lessonContext?: string): string {
    const ageGroup = this.determineAgeGroup(user.age);
    const pedagogicalInstructions = this.getPedagogicalInstructions(user.age, user.learningGoal);
    
    let contextStr = `=== PERFIL DO ESTUDANTE LINGOLIVE ===
- Nível CEFR: ${user.level}
- Idade: ${user.age} anos (${ageGroup})
- Idioma de Origem: ${user.languageNative}
- Idioma em Aprendizado: ${user.languageTarget}
- Objetivo de Aprendizado: ${user.learningGoal || "Conversação Geral"}
- XP Acumulado: ${user.xp || 0} | Dias de Streak: ${user.streak || 0}
- Permissão de Gírias: ${user.allowSlang ? "Habilitado" : "Desabilitado"}
- Expressões Regionais: ${user.allowRegionalExpressions ? "Habilitado" : "Desabilitado"}

=== DIRETRIZES PEDAGÓGICAS ===
${pedagogicalInstructions}
`;

    if (school) {
      contextStr += `\n=== CONTEXTO DA INSTITUIÇÃO ===
- Escola: ${school.schoolName || "LingoLIVE Enterprise"}
- Foco de Ensino: ${school.pedagogicalFocus || "Comunicação Fluida e Imersão Cultural"}
`;
    }

    if (lessonContext) {
      contextStr += `\n=== CONTEXTO DA LIÇÃO ATUAL ===
- Atividade / Tema: ${lessonContext}
`;
    }

    return contextStr;
  }

  private determineAgeGroup(age: number): string {
    if (age <= 8) return "Infantil (5-8 anos)";
    if (age <= 12) return "Pré-Adolescente (9-12 anos)";
    if (age <= 16) return "Adolescente (13-16 anos)";
    if (age <= 25) return "Jovem Adulto (17-25 anos)";
    return "Adulto (26+)";
  }

  private getPedagogicalInstructions(age: number, learningGoal?: string): string {
    if (age <= 8) {
      return "- Use linguagem extremamente simples, muito visual, amigável e cheia de emojis.\n- Evite regras gramaticais formais e foque em associação de palavras simples.\n- NUNCA introduza gírias ou conteúdo adulto.";
    }
    if (age <= 12) {
      return "- Use explicações simples, divertidas e encorajadoras.\n- Introduza gírias cotidianas leves de forma explicada e contextualizada.";
    }
    if (age <= 16) {
      return "- Use linguagem ágil e moderna.\n- Explique claramente o uso social de cada expressão nova apresentada.";
    }
    
    // Adult focuses
    let goalFocus = "Conversação Geral";
    if (learningGoal?.toLowerCase().includes("trabalho") || learningGoal?.toLowerCase().includes("negócio")) {
      goalFocus = "Comunicação Corporativa e Vocabulário de Negócios";
    } else if (learningGoal?.toLowerCase().includes("viagem")) {
      goalFocus = "Vocabulário Prático de Sobrevivência em Viagens";
    } else if (learningGoal?.toLowerCase().includes("academia") || learningGoal?.toLowerCase().includes("escola")) {
      goalFocus = "Escrita e Estrutura Gramatical Formal/Acadêmica";
    }

    return `- Foco Pedagógico do Adulto: ${goalFocus}.\n- Mantenha tom respeitoso, maduro e altamente encorajador, adequado ao desenvolvimento profissional.`;
  }
}
