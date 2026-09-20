import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TestingGuideline {
  guidelineId: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'general';
  title: string;
  description: string;
  bestPractices: string[];
  antiPatterns: string[];
  examples: CodeExample[];
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

export interface CodeExample {
  exampleId: string;
  language: 'typescript' | 'javascript';
  title: string;
  code: string;
  explanation: string;
  isGood: boolean;
}

export interface TestDataManagement {
  managementId: string;
  name: string;
  description: string;
  dataType: 'fixture' | 'factory' | 'builder' | 'generator' | 'faker';
  scope: 'unit' | 'integration' | 'e2e' | 'all';
  schema: Record<string, any>;
  sampleData: Record<string, any>[];
  creationStrategy: string;
  cleanupStrategy: string;
  createdAt: Date;
}

export interface MockStubStrategy {
  strategyId: string;
  name: string;
  description: string;
  targetModule: string;
  mockType: 'full-mock' | 'partial-mock' | 'spy' | 'stub' | 'spy-on';
  implementation: string;
  useCases: string[];
  caveats: string[];
  testScenarios: TestScenario[];
  createdAt: Date;
}

export interface TestScenario {
  scenarioId: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  expectedOutcome: string;
  metrics: Record<string, any>;
}

export interface ScenarioStep {
  stepId: string;
  order: number;
  action: string;
  expectedResult: string;
  notes?: string;
}

export interface TestingPlaybook {
  playbookId: string;
  name: string;
  category: 'setup' | 'workflow' | 'troubleshooting' | 'optimization' | 'ci-cd';
  description: string;
  targetAudience: string[];
  chapters: PlaybookChapter[];
  prerequisites: string[];
  estimatedTime: number; // minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookChapter {
  chapterId: string;
  order: number;
  title: string;
  content: string;
  sections: PlaybookSection[];
  keyTakeaways: string[];
}

export interface PlaybookSection {
  sectionId: string;
  title: string;
  content: string;
  codeBlocks: CodeExample[];
  warnings?: string[];
  tips?: string[];
}

export interface TestingStandard {
  standardId: string;
  name: string;
  description: string;
  category: 'naming' | 'structure' | 'coverage' | 'performance' | 'documentation';
  rules: TestingRule[];
  enforcementLevel: 'required' | 'recommended' | 'optional';
  applicableScopes: string[];
  createdAt: Date;
}

export interface TestingRule {
  ruleId: string;
  title: string;
  description: string;
  pattern: string;
  rationale: string;
  example: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DocumentationTemplate {
  templateId: string;
  name: string;
  type: 'test-case' | 'test-suite' | 'bug-report' | 'performance-report' | 'coverage-report';
  sections: TemplateSection[];
  format: 'markdown' | 'html' | 'json';
  createdAt: Date;
}

export interface TemplateSection {
  sectionId: string;
  title: string;
  description: string;
  isRequired: boolean;
  fieldType: 'text' | 'textarea' | 'code' | 'list' | 'table' | 'checkbox';
  placeholders?: string[];
}

class TestDocumentationBestPracticesService {
  private db = getFirestore();

  async createTestingGuideline(
    category: 'unit' | 'integration' | 'e2e' | 'performance' | 'general',
    title: string,
    description: string,
    bestPractices: string[],
    antiPatterns: string[]
  ): Promise<TestingGuideline> {
    try {
      const guidelineId = `guideline_${Date.now()}`;

      const guideline: TestingGuideline = {
        guidelineId,
        category,
        title,
        description,
        bestPractices,
        antiPatterns,
        examples: [],
        priority: 'medium',
        lastUpdated: new Date(),
      };

      await this.db.collection('testing_guidelines').doc(guidelineId).set(guideline);

      logSecurityEvent('TESTING_GUIDELINE_CREATED' as any, 'info' as any, 'Testing guideline created', {
        guidelineId,
        category,
        title,
      });

      return guideline;
    } catch (error) {
      logSecurityEvent('TESTING_GUIDELINE_CREATION_FAILED' as any, 'error' as any, 'Failed to create testing guideline', {
        category,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addCodeExample(
    guidelineId: string,
    language: 'typescript' | 'javascript',
    title: string,
    code: string,
    explanation: string,
    isGood: boolean
  ): Promise<CodeExample> {
    try {
      const exampleId = `example_${Date.now()}`;

      const example: CodeExample = {
        exampleId,
        language,
        title,
        code,
        explanation,
        isGood,
      };

      const guidelineRef = this.db.collection('testing_guidelines').doc(guidelineId);
      await guidelineRef.update({
        examples: (await guidelineRef.get()).data()?.examples || [],
      });

      logSecurityEvent('CODE_EXAMPLE_ADDED' as any, 'info' as any, 'Code example added to guideline', {
        exampleId,
        guidelineId,
        language,
      });

      return example;
    } catch (error) {
      logSecurityEvent('CODE_EXAMPLE_ADDITION_FAILED' as any, 'error' as any, 'Failed to add code example', {
        guidelineId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineTestDataManagement(
    name: string,
    description: string,
    dataType: 'fixture' | 'factory' | 'builder' | 'generator' | 'faker',
    scope: 'unit' | 'integration' | 'e2e' | 'all',
    schema: Record<string, any>
  ): Promise<TestDataManagement> {
    try {
      const managementId = `data_management_${Date.now()}`;

      const management: TestDataManagement = {
        managementId,
        name,
        description,
        dataType,
        scope,
        schema,
        sampleData: [],
        creationStrategy: '',
        cleanupStrategy: '',
        createdAt: new Date(),
      };

      await this.db.collection('test_data_management').doc(managementId).set(management);

      logSecurityEvent('TEST_DATA_MANAGEMENT_DEFINED' as any, 'info' as any, 'Test data management defined', {
        managementId,
        name,
        dataType,
        scope,
      });

      return management;
    } catch (error) {
      logSecurityEvent('TEST_DATA_MANAGEMENT_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define test data management', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineMockStubStrategy(
    name: string,
    description: string,
    targetModule: string,
    mockType: 'full-mock' | 'partial-mock' | 'spy' | 'stub' | 'spy-on',
    useCases: string[]
  ): Promise<MockStubStrategy> {
    try {
      const strategyId = `mock_strategy_${Date.now()}`;

      const strategy: MockStubStrategy = {
        strategyId,
        name,
        description,
        targetModule,
        mockType,
        implementation: '',
        useCases,
        caveats: [],
        testScenarios: [],
        createdAt: new Date(),
      };

      await this.db.collection('mock_stub_strategies').doc(strategyId).set(strategy);

      logSecurityEvent('MOCK_STUB_STRATEGY_DEFINED' as any, 'info' as any, 'Mock/stub strategy defined', {
        strategyId,
        name,
        mockType,
        targetModule,
      });

      return strategy;
    } catch (error) {
      logSecurityEvent('MOCK_STUB_STRATEGY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define mock/stub strategy', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createTestingPlaybook(
    name: string,
    category: 'setup' | 'workflow' | 'troubleshooting' | 'optimization' | 'ci-cd',
    description: string,
    targetAudience: string[],
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<TestingPlaybook> {
    try {
      const playbookId = `playbook_${Date.now()}`;

      const playbook: TestingPlaybook = {
        playbookId,
        name,
        category,
        description,
        targetAudience,
        chapters: [],
        prerequisites: [],
        estimatedTime: 30,
        difficultyLevel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('testing_playbooks').doc(playbookId).set(playbook);

      logSecurityEvent('TESTING_PLAYBOOK_CREATED' as any, 'info' as any, 'Testing playbook created', {
        playbookId,
        name,
        category,
        difficultyLevel,
      });

      return playbook;
    } catch (error) {
      logSecurityEvent('TESTING_PLAYBOOK_CREATION_FAILED' as any, 'error' as any, 'Failed to create testing playbook', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addPlaybookChapter(
    playbookId: string,
    order: number,
    title: string,
    content: string,
    keyTakeaways: string[]
  ): Promise<PlaybookChapter> {
    try {
      const chapterId = `chapter_${Date.now()}`;

      const chapter: PlaybookChapter = {
        chapterId,
        order,
        title,
        content,
        sections: [],
        keyTakeaways,
      };

      const playbookRef = this.db.collection('testing_playbooks').doc(playbookId);
      const playbookDoc = await playbookRef.get();
      const chapters = playbookDoc.data()?.chapters || [];
      chapters.push(chapter);

      await playbookRef.update({ chapters, updatedAt: new Date() });

      logSecurityEvent('PLAYBOOK_CHAPTER_ADDED' as any, 'info' as any, 'Playbook chapter added', {
        chapterId,
        playbookId,
        title,
      });

      return chapter;
    } catch (error) {
      logSecurityEvent('PLAYBOOK_CHAPTER_ADDITION_FAILED' as any, 'error' as any, 'Failed to add playbook chapter', {
        playbookId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineTestingStandard(
    name: string,
    description: string,
    category: 'naming' | 'structure' | 'coverage' | 'performance' | 'documentation',
    rules: TestingRule[],
    enforcementLevel: 'required' | 'recommended' | 'optional'
  ): Promise<TestingStandard> {
    try {
      const standardId = `standard_${Date.now()}`;

      const standard: TestingStandard = {
        standardId,
        name,
        description,
        category,
        rules,
        enforcementLevel,
        applicableScopes: [],
        createdAt: new Date(),
      };

      await this.db.collection('testing_standards').doc(standardId).set(standard);

      logSecurityEvent('TESTING_STANDARD_DEFINED' as any, 'info' as any, 'Testing standard defined', {
        standardId,
        name,
        category,
        enforcementLevel,
      });

      return standard;
    } catch (error) {
      logSecurityEvent('TESTING_STANDARD_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define testing standard', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDocumentationTemplate(
    name: string,
    type: 'test-case' | 'test-suite' | 'bug-report' | 'performance-report' | 'coverage-report',
    sections: TemplateSection[],
    format: 'markdown' | 'html' | 'json'
  ): Promise<DocumentationTemplate> {
    try {
      const templateId = `template_${Date.now()}`;

      const template: DocumentationTemplate = {
        templateId,
        name,
        type,
        sections,
        format,
        createdAt: new Date(),
      };

      await this.db.collection('documentation_templates').doc(templateId).set(template);

      logSecurityEvent('DOCUMENTATION_TEMPLATE_CREATED' as any, 'info' as any, 'Documentation template created', {
        templateId,
        name,
        type,
        format,
      });

      return template;
    } catch (error) {
      logSecurityEvent('DOCUMENTATION_TEMPLATE_CREATION_FAILED' as any, 'error' as any, 'Failed to create documentation template', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getTestingGuidelines(category?: string): Promise<TestingGuideline[]> {
    try {
      let collectionRef = this.db.collection('testing_guidelines');
      const snapshot = category
        ? await collectionRef.where('category', '==', category).get()
        : await collectionRef.get();

      const guidelines = snapshot.docs.map((doc) => doc.data() as TestingGuideline);

      logSecurityEvent('TESTING_GUIDELINES_RETRIEVED' as any, 'info' as any, 'Testing guidelines retrieved', {
        count: guidelines.length,
        category: category || 'all',
      });

      return guidelines;
    } catch (error) {
      logSecurityEvent('TESTING_GUIDELINES_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve testing guidelines', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getTestingPlaybooks(category?: string): Promise<TestingPlaybook[]> {
    try {
      let collectionRef = this.db.collection('testing_playbooks');
      const snapshot = category
        ? await collectionRef.where('category', '==', category).get()
        : await collectionRef.get();

      const playbooks = snapshot.docs.map((doc) => doc.data() as TestingPlaybook);

      logSecurityEvent('TESTING_PLAYBOOKS_RETRIEVED' as any, 'info' as any, 'Testing playbooks retrieved', {
        count: playbooks.length,
        category: category || 'all',
      });

      return playbooks;
    } catch (error) {
      logSecurityEvent('TESTING_PLAYBOOKS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve testing playbooks', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const testDocumentationBestPracticesService = new TestDocumentationBestPracticesService();
