export interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  responseMimeType?: string;
}

export type ApprovalStatus = "Draft" | "Pending" | "Approved" | "Archived";

export interface PromptVersion {
  version: string; // e.g., "1.0.0"
  content: string; // Prompt text containing template variables like {{language}}
  systemInstruction?: string;
  config: ModelConfig;
  status: ApprovalStatus;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  changeLog?: string;
}

export interface PromptTemplate {
  id: string; // e.g., "tutor-conversation", "pronunciation-assessment"
  name: string;
  description: string;
  tags: string[];
  activeVersion: string; // The currently active/approved version
  versions: PromptVersion[];
  lastModifiedAt: string;
}

// Default system templates to populate the registry upon first load
const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tutor-conversation",
    name: "Tutor de Conversação Multilingue",
    description: "Prompt principal do motor de conversação Kamba AI da LingoLIVE para interações realistas com variantes regionais de sotaque.",
    tags: ["conversacao", "kamba-ai", "tutor"],
    activeVersion: "1.2.0",
    lastModifiedAt: "2026-07-15T00:00:00Z",
    versions: [
      {
        version: "1.0.0",
        content: "Você é o Kamba AI, um tutor de conversação muito amigável para praticar {{language}} no nível {{proficiency}}. Ajude o utilizador com o tema: {{scenario}}.",
        systemInstruction: "Aja como um tutor amigável e focado.",
        config: {
          model: "gemini-1.5-flash",
          temperature: 0.7,
          maxOutputTokens: 500
        },
        status: "Archived",
        createdAt: "2026-01-10T12:00:00Z",
        createdBy: "Equipa IA LingoLIVE",
        approvedAt: "2026-01-10T14:00:00Z",
        approvedBy: "Líder de IA",
        changeLog: "Versão inicial de testes."
      },
      {
        version: "1.2.0",
        content: `Você é o Kamba AI, o tutor de conversação de elite da LingoLIVE IA.
O estudante está a aprender o idioma "{{language}}" no nível de proficiência "{{proficiency}}", com foco na variante regional "{{region}}".
Atualmente, estão no cenário de aprendizagem: "{{scenario}}".

Regras de Governação LingoLIVE:
1. Adapte as suas respostas rigorosamente à variante regional: use vocabulário local, termos típicos e referências culturais de "{{region}}".
2. Mantenha o nível gramatical adequado para o nível de proficiência "{{proficiency}}".
3. Forneça respostas encorajadoras, curtas e de fácil digestão (máximo 3 frases) para facilitar a prática de shadowing e a conversação fluida.
4. Integre gírias locais com moderação se a variante exigir.

Mensagem do estudante: "{{userMessage}}"`,
        systemInstruction: "Você é o Kamba AI, um assistente e tutor linguístico especializado em variantes regionais. Seja empático, fale de forma natural e adeque-se sempre à variante selecionada.",
        config: {
          model: "gemini-2.5-flash",
          temperature: 0.8,
          maxOutputTokens: 800
        },
        status: "Approved",
        createdAt: "2026-07-01T10:00:00Z",
        createdBy: "Equipa de Linguística LingoLIVE",
        approvedAt: "2026-07-02T09:00:00Z",
        approvedBy: "Conselho de IA LingoLIVE",
        changeLog: "Atualizado para suportar o modelo gemini-2.5-flash e alinhar regras estritas de variantes geopolíticas."
      }
    ]
  },
  {
    id: "pronunciation-assessment",
    name: "Avaliador Científico de Pronúncia",
    description: "Prompt encarregue de comparar a transcrição do Whisper com o texto alvo e emitir um relatório fonético em formato estruturado.",
    tags: ["pronuncia", "whisper", "avaliacao", "json"],
    activeVersion: "2.0.0",
    lastModifiedAt: "2026-07-15T00:00:00Z",
    versions: [
      {
        version: "2.0.0",
        content: `Analise a pronúncia do estudante comparando o texto que foi transcrevido pelo Whisper contra o texto esperado.
Texto Esperado: "{{targetText}}"
Transcrição do Whisper: "{{whisperTranscription}}"
Idioma Alvo: "{{language}}"

Gere um relatório fonético científico estruturado rigorosamente em formato JSON com a seguinte estrutura:
{
  "accuracyScore": 0-100 (pontuação geral de correspondência fonética),
  "completenessScore": 0-100 (se todas as palavras do texto esperado estão na transcrição),
  "fluencyScore": 0-100 (classificação de ritmo e cadência presumida),
  "transcription": "transcrição exata analisada",
  "mistakes": [
    {
      "word": "palavra falada incorretamente",
      "phonemeError": "indicação fonética do desvio",
      "correctionTip": "dica anatómica de correção em Português"
    }
  ],
  "pedagogicalFeedback": "Explicação calorosa e científica em Português de Portugal recomendando melhorias de dicção."
}`,
        systemInstruction: "Você é o Avaliador de Pronúncia Empresarial Senior e Especialista Fonético da LingoLIVE IA. Analise áudios transcrevidos por Whisper e gere relatórios científicos fonéticos e precisos em formato JSON.",
        config: {
          model: "gemini-2.5-flash",
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        },
        status: "Approved",
        createdAt: "2026-06-15T16:30:00Z",
        createdBy: "Dr. Fonética LingoLIVE",
        approvedAt: "2026-06-16T11:00:00Z",
        approvedBy: "Conselho de IA LingoLIVE",
        changeLog: "Refatoração para garantir formato JSON estrito com tipagem fonética."
      }
    ]
  },
  {
    id: "explanation-prompt",
    name: "Explicação Contextualizada de Léxico",
    description: "Gera explicações gramaticais e semânticas em JSON para qualquer palavra ou expressão idiomática com restrições etárias rigorosas.",
    tags: ["lexico", "gramatica", "seguranca", "json"],
    activeVersion: "1.1.0",
    lastModifiedAt: "2026-07-15T00:00:00Z",
    versions: [
      {
        version: "1.1.0",
        content: `Explique a seguinte expressão ou palavra do idioma "{{language}}":
Expressão: "{{phrase}}"

Forneça uma resposta concisa em formato JSON contendo:
1. meaning: Tradução precisa em português europeu ou significado direto.
2. pronunciation: Guia fonético acessível (ex: "hola" -> "OH-lah").
3. grammarNote: Breve nota gramatical ou contexto de uso (máximo 1 frase).
4. exampleOriginal: Exemplo simples e natural utilizando esta frase em "{{language}}".
5. exampleTranslation: Tradução para português do exemplo fornecido.
6. maturityLevel: Nível de maturidade adequado para este termo. Escolha EXCLUSIVAMENTE entre "Infantil", "Adolescente", "Adulto". Atente-se ao limite máximo do estudante que é "{{maxMaturity}}".
7. category: Classificação. Escolha EXCLUSIVAMENTE entre "Gíria", "Formal", "Acadêmica", "Geral".

Restrições de segurança corporativa do estudante:
{{promptConstraint}}`,
        systemInstruction: "Você é o Especialista em Lexicografia e Termonologia da LingoLIVE IA. Desenvolva dicionários acessíveis e perfeitamente adequados à faixa etária do utilizador.",
        config: {
          model: "gemini-2.5-flash",
          temperature: 0.3,
          maxOutputTokens: 1200,
          responseMimeType: "application/json"
        },
        status: "Approved",
        createdAt: "2026-07-05T09:00:00Z",
        createdBy: "Equipa de Proteção Infantil LingoLIVE",
        approvedAt: "2026-07-06T10:00:00Z",
        approvedBy: "Comité de Ética de IA",
        changeLog: "Reforçado com filtros de segurança e conformidade para idades escolares."
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = "lingolive_prompt_registry";

export class PromptRegistryService {
  private templates: PromptTemplate[] = [];

  constructor() {
    this.loadRegistry();
  }

  /**
   * Loads the prompt registry from local storage, or populates it with defaults if empty.
   */
  private loadRegistry(): void {
    if (typeof window === "undefined") {
      this.templates = DEFAULT_TEMPLATES;
      return;
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.templates = JSON.parse(stored);
      } else {
        this.templates = DEFAULT_TEMPLATES;
        this.saveRegistry();
      }
    } catch (err) {
      console.error("Erro ao carregar PromptRegistry do LocalStorage:", err);
      this.templates = DEFAULT_TEMPLATES;
    }
  }

  /**
   * Persists the current state of prompt templates in the local storage.
   */
  private saveRegistry(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.templates));
      // Notify components about registry updates
      window.dispatchEvent(new Event("prompt_registry_updated"));
    } catch (err) {
      console.error("Erro ao salvar PromptRegistry no LocalStorage:", err);
    }
  }

  /**
   * Returns all registered prompt templates with their respective versions.
   */
  public getAllTemplates(): PromptTemplate[] {
    return this.templates;
  }

  /**
   * Searches and retrieves a prompt template by its unique identifier.
   */
  public getTemplateById(id: string): PromptTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  /**
   * Retrieves the currently active/approved version of a prompt template.
   */
  public getActiveVersion(id: string): PromptVersion | undefined {
    const template = this.getTemplateById(id);
    if (!template) return undefined;
    return template.versions.find((v) => v.version === template.activeVersion);
  }

  /**
   * Compiles the active prompt by replacing template placeholder variables {{variable}} with actual values.
   * @param id The ID of the template.
   * @param variables Key-value object of substitution values.
   * @returns Compiled prompt string and its model configuration.
   */
  public compilePrompt(
    id: string,
    variables: Record<string, string>
  ): { content: string; systemInstruction?: string; config: ModelConfig } {
    const activeVer = this.getActiveVersion(id);
    if (!activeVer) {
      throw new Error(`Template de prompt "${id}" não foi encontrado ou não possui uma versão ativa definida.`);
    }

    let compiledContent = activeVer.content;
    let compiledSystemInstruction = activeVer.systemInstruction;

    // Substitute all placeholders of form {{key}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      compiledContent = compiledContent.replace(regex, value);
      if (compiledSystemInstruction) {
        compiledSystemInstruction = compiledSystemInstruction.replace(regex, value);
      }
    });

    return {
      content: compiledContent,
      systemInstruction: compiledSystemInstruction,
      config: activeVer.config
    };
  }

  /**
   * Registers a completely new prompt template in the registry.
   */
  public createTemplate(
    id: string,
    name: string,
    description: string,
    tags: string[],
    initialContent: string,
    config: ModelConfig,
    createdBy: string,
    systemInstruction?: string
  ): PromptTemplate {
    if (this.getTemplateById(id)) {
      throw new Error(`Já existe um template de prompt com o ID "${id}".`);
    }

    const newVersion: PromptVersion = {
      version: "1.0.0",
      content: initialContent,
      systemInstruction,
      config,
      status: "Draft",
      createdAt: new Date().toISOString(),
      createdBy,
      changeLog: "Criação do template e versão inicial."
    };

    const newTemplate: PromptTemplate = {
      id,
      name,
      description,
      tags,
      activeVersion: "1.0.0",
      versions: [newVersion],
      lastModifiedAt: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    this.saveRegistry();
    return newTemplate;
  }

  /**
   * Adds a new version of an existing prompt template for governance and staging.
   */
  public addVersion(
    id: string,
    version: string,
    content: string,
    config: ModelConfig,
    createdBy: string,
    changeLog?: string,
    systemInstruction?: string,
    status: ApprovalStatus = "Draft"
  ): PromptVersion {
    const template = this.getTemplateById(id);
    if (!template) {
      throw new Error(`Não é possível adicionar versão. Template "${id}" não encontrado.`);
    }

    const versionExists = template.versions.some((v) => v.version === version);
    if (versionExists) {
      throw new Error(`A versão "${version}" já existe no template "${id}".`);
    }

    const newVer: PromptVersion = {
      version,
      content,
      systemInstruction,
      config,
      status,
      createdAt: new Date().toISOString(),
      createdBy,
      changeLog
    };

    template.versions.push(newVer);
    template.lastModifiedAt = new Date().toISOString();

    // If initial status was submitted as Approved, update active pointer
    if (status === "Approved") {
      template.activeVersion = version;
      newVer.approvedAt = new Date().toISOString();
      newVer.approvedBy = createdBy;
    }

    this.saveRegistry();
    return newVer;
  }

  /**
   * Updates the governance status of a prompt version (e.g. promoting from Draft to Approved).
   */
  public updateApprovalStatus(
    id: string,
    version: string,
    status: ApprovalStatus,
    approvedBy?: string
  ): void {
    const template = this.getTemplateById(id);
    if (!template) {
      throw new Error(`Template "${id}" não encontrado.`);
    }

    const verObj = template.versions.find((v) => v.version === version);
    if (!verObj) {
      throw new Error(`Versão "${version}" não encontrada no template "${id}".`);
    }

    const oldStatus = verObj.status;
    verObj.status = status;

    if (status === "Approved") {
      // Archive current active version if applicable
      const currentActive = template.versions.find((v) => v.version === template.activeVersion);
      if (currentActive && currentActive.version !== version && currentActive.status === "Approved") {
        currentActive.status = "Archived";
      }

      template.activeVersion = version;
      verObj.approvedAt = new Date().toISOString();
      verObj.approvedBy = approvedBy || "Administrador do Sistema";
    } else if (oldStatus === "Approved") {
      // If we are unapproving the currently active version, set active pointer to the most recent approved version
      const remainingApproved = template.versions
        .filter((v) => v.version !== version && v.status === "Approved")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (remainingApproved.length > 0) {
        template.activeVersion = remainingApproved[0].version;
      } else {
        template.activeVersion = ""; // No active approved prompt remaining
      }
    }

    template.lastModifiedAt = new Date().toISOString();
    this.saveRegistry();
  }

  /**
   * Rolls back the active pointer of a template to a previously approved version.
   */
  public rollbackToVersion(id: string, version: string, operator: string): void {
    const template = this.getTemplateById(id);
    if (!template) {
      throw new Error(`Template "${id}" não encontrado.`);
    }

    const targetVer = template.versions.find((v) => v.version === version);
    if (!targetVer) {
      throw new Error(`Versão "${version}" não existe no template "${id}".`);
    }

    if (targetVer.status !== "Approved" && targetVer.status !== "Archived") {
      throw new Error(`Não é possível reverter para a versão "${version}" porque o seu estado atual é "${targetVer.status}". Deve aprovar a versão primeiro.`);
    }

    // Un-approve current active if it's different
    const currentActive = template.versions.find((v) => v.version === template.activeVersion);
    if (currentActive && currentActive.version !== version) {
      currentActive.status = "Archived";
    }

    targetVer.status = "Approved";
    targetVer.approvedAt = new Date().toISOString();
    targetVer.approvedBy = operator;
    template.activeVersion = version;
    template.lastModifiedAt = new Date().toISOString();

    this.saveRegistry();
  }

  /**
   * Resets the entire prompt registry back to factory default values.
   */
  public resetToDefaults(): void {
    this.templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
    this.saveRegistry();
  }

  /**
   * Exports the entire registry as a portable JSON structure.
   */
  public exportRegistry(): string {
    return JSON.stringify(this.templates, null, 2);
  }

  /**
   * Imports an external registry dump, merging or overwriting current templates.
   */
  public importRegistry(jsonString: string): void {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error("O formato do registo de importação deve ser uma lista de templates.");
      }
      
      // Perform structural check of first item if exists
      if (parsed.length > 0) {
        const item = parsed[0];
        if (!item.id || !item.name || !Array.isArray(item.versions)) {
          throw new Error("Formato inválido de template de prompt detetado no ficheiro de importação.");
        }
      }

      this.templates = parsed;
      this.saveRegistry();
    } catch (err: any) {
      throw new Error(`Falha ao importar o registo de prompts: ${err.message}`);
    }
  }
}

export const promptRegistry = new PromptRegistryService();
