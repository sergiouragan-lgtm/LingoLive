import { IPromptManager } from "../interfaces/IEngineComponents";
import { AIOrchestrationLogger } from "../utils/Logger";

export class PromptManager implements IPromptManager {
  private templates: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  getPrompt(templateName: string, variables: Record<string, any>, version = "latest"): string {
    const versions = this.templates.get(templateName);
    if (!versions) {
      throw new Error(`Template '${templateName}' not found.`);
    }

    let template = versions.get(version);
    if (!template && version === "latest") {
      // Find the alphabetically highest version or default
      const sortedVersions = Array.from(versions.keys()).sort();
      const highestVersion = sortedVersions[sortedVersions.length - 1];
      template = versions.get(highestVersion);
    }

    if (!template) {
      throw new Error(`Template '${templateName}' version '${version}' not found.`);
    }

    // Interpolate variables: {{variableName}}
    let compiled = template;
    for (const [key, value] of Object.entries(variables)) {
      compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value ?? ""));
    }

    return compiled;
  }

  registerPrompt(templateName: string, promptText: string, version: string): void {
    if (!this.templates.has(templateName)) {
      this.templates.set(templateName, new Map());
    }
    this.templates.get(templateName)!.set(version, promptText);
    AIOrchestrationLogger.info(`Registered prompt template: ${templateName} [v${version}]`);
  }

  private initializeDefaultTemplates() {
    // 1. Tutor Chat Prompt Template
    this.registerPrompt(
      "tutor_chat",
      `Você é o tutor inteligente LingoLIVE.
Contexto do Aluno:
- Idioma Nativo: {{nativeLanguage}}
- Idioma Alvo: {{targetLanguage}}
- Nível de Proficiência: {{level}}
- Faixa Etária: {{ageGroup}}
- Tom Recomendado: {{tone}}

Contexto da Escola:
{{schoolContext}}

Instruções Adicionais:
{{additionalInstructions}}

Mensagem do Aluno:
{{message}}

Responda no idioma alvo de forma clara, motivadora e apropriada para a faixa etária. Se o aluno cometer um erro, inclua uma correção sutil.`,
      "1.0.0"
    );

    // 2. Phrase Explanation Template
    this.registerPrompt(
      "explain_phrase",
      `Explique a expressão ou frase "{{phrase}}" para um aluno que fala {{nativeLanguage}} e está aprendendo {{targetLanguage}}.
O nível do aluno é {{level}} e a idade é {{age}}.
Restrição de maturidade: {{maturityConstraint}}.

Forneça a explicação detalhada com o significado, pronúncia fonética legível, uma nota gramatical simplificada e uma frase de exemplo com sua tradução.`,
      "1.0.0"
    );
  }
}
