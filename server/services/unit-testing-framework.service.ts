import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TestSuite {
  suiteId: string;
  name: string;
  description: string;
  testCount: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  duration: number; // milliseconds
  coverage: CodeCoverage;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  createdAt: Date;
}

export interface CodeCoverage {
  statements: number; // percentage
  branches: number; // percentage
  functions: number; // percentage
  lines: number; // percentage
  coveredStatements: number;
  totalStatements: number;
  hotspots: HotSpot[];
}

export interface HotSpot {
  file: string;
  line: number;
  coverage: number;
  priority: 'high' | 'medium' | 'low';
}

export interface UnitTest {
  testId: string;
  suiteId: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number; // milliseconds
  error?: string;
  errorStack?: string;
  assertions: Assertion[];
  tags: string[];
  createdAt: Date;
}

export interface Assertion {
  assertionId: string;
  type: 'equal' | 'deepEqual' | 'throws' | 'truthy' | 'falsy' | 'match';
  expected: any;
  actual: any;
  passed: boolean;
  message: string;
}

export interface MockDefinition {
  mockId: string;
  service: string;
  method: string;
  returnValue: any;
  callCount: number;
  callHistory: CallRecord[];
}

export interface CallRecord {
  timestamp: Date;
  args: any[];
  returnValue: any;
}

export interface TestMetrics {
  metricsId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number; // percentage
  avgDuration: number; // milliseconds
  totalDuration: number;
  coverageTarget: number; // percentage
  coverageActual: number;
  flakySuspects: string[];
  recordedAt: Date;
}

class UnitTestingFrameworkService {
  private db = getFirestore();

  async createTestSuite(
    name: string,
    description: string,
    testCount: number
  ): Promise<TestSuite> {
    try {
      const suiteId = `test_suite_${Date.now()}`;

      const suite: TestSuite = {
        suiteId,
        name,
        description,
        testCount,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        duration: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
          coveredStatements: 0,
          totalStatements: 0,
          hotspots: [],
        },
        status: 'running',
        createdAt: new Date(),
      };

      await this.db.collection('test_suites').doc(suiteId).set(suite);

      logSecurityEvent('TEST_SUITE_CREATED' as any, 'info' as any, 'Test suite created', {
        suiteId,
        name,
        testCount,
      });

      return suite;
    } catch (error) {
      logSecurityEvent('TEST_SUITE_CREATION_FAILED' as any, 'error' as any, 'Failed to create test suite', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordUnitTest(
    suiteId: string,
    name: string,
    description: string,
    status: 'passed' | 'failed' | 'skipped' | 'pending',
    duration: number,
    assertions: Assertion[],
    error?: string
  ): Promise<UnitTest> {
    try {
      const testId = `unit_test_${Date.now()}`;

      const test: UnitTest = {
        testId,
        suiteId,
        name,
        description,
        status,
        duration,
        error,
        assertions,
        tags: this.inferTags(name),
        createdAt: new Date(),
      };

      await this.db.collection('unit_tests').doc(testId).set(test);

      logSecurityEvent('UNIT_TEST_RECORDED' as any, 'info' as any, 'Unit test recorded', {
        testId,
        suiteId,
        name,
        status,
        duration,
      });

      return test;
    } catch (error) {
      logSecurityEvent('UNIT_TEST_RECORDING_FAILED' as any, 'error' as any, 'Failed to record unit test', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateTestSuiteCoverage(
    suiteId: string,
    coverage: CodeCoverage,
    passCount: number,
    failCount: number,
    skipCount: number,
    duration: number
  ): Promise<TestSuite> {
    try {
      const suiteDoc = await this.db.collection('test_suites').doc(suiteId).get();
      const suite = suiteDoc.data() as TestSuite;

      if (!suite) throw new Error('Test suite not found');

      const totalTests = passCount + failCount + skipCount;
      const passRate = totalTests > 0 ? (passCount / totalTests) * 100 : 0;

      const updatedSuite: TestSuite = {
        ...suite,
        passCount,
        failCount,
        skipCount,
        duration,
        coverage,
        status: failCount === 0 ? 'passed' : 'failed',
      };

      await suiteDoc.ref.update(updatedSuite);

      logSecurityEvent('TEST_SUITE_COVERAGE_UPDATED' as any, 'info' as any, 'Test suite coverage updated', {
        suiteId,
        coverage: coverage.statements.toFixed(1),
        passRate: passRate.toFixed(1),
      });

      return updatedSuite;
    } catch (error) {
      logSecurityEvent('TEST_SUITE_COVERAGE_UPDATE_FAILED' as any, 'error' as any, 'Failed to update test suite coverage', {
        suiteId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async registerMock(
    service: string,
    method: string,
    returnValue: any
  ): Promise<MockDefinition> {
    try {
      const mockId = `mock_${service}_${method}_${Date.now()}`;

      const mock: MockDefinition = {
        mockId,
        service,
        method,
        returnValue,
        callCount: 0,
        callHistory: [],
      };

      await this.db.collection('mock_definitions').doc(mockId).set(mock);

      logSecurityEvent('MOCK_REGISTERED' as any, 'info' as any, 'Mock registered', {
        mockId,
        service,
        method,
      });

      return mock;
    } catch (error) {
      logSecurityEvent('MOCK_REGISTRATION_FAILED' as any, 'error' as any, 'Failed to register mock', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordMockCall(mockId: string, args: any[], returnValue: any): Promise<MockDefinition> {
    try {
      const mockDoc = await this.db.collection('mock_definitions').doc(mockId).get();
      const mock = mockDoc.data() as MockDefinition;

      if (!mock) throw new Error('Mock not found');

      const callRecord: CallRecord = {
        timestamp: new Date(),
        args,
        returnValue,
      };

      const updatedMock: MockDefinition = {
        ...mock,
        callCount: mock.callCount + 1,
        callHistory: [...mock.callHistory, callRecord],
      };

      await mockDoc.ref.update(updatedMock);

      return updatedMock;
    } catch (error) {
      logSecurityEvent('MOCK_CALL_RECORDING_FAILED' as any, 'error' as any, 'Failed to record mock call', {
        mockId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordTestMetrics(
    totalTests: number,
    passedTests: number,
    failedTests: number,
    skippedTests: number,
    avgDuration: number,
    coverageActual: number
  ): Promise<TestMetrics> {
    try {
      const metricsId = `test_metrics_${Date.now()}`;
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

      const metrics: TestMetrics = {
        metricsId,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        passRate,
        avgDuration,
        totalDuration: avgDuration * totalTests,
        coverageTarget: 80,
        coverageActual,
        flakySuspects: this.identifyFlakySuspects(),
        recordedAt: new Date(),
      };

      await this.db.collection('test_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('TEST_METRICS_RECORDED' as any, 'info' as any, 'Test metrics recorded', {
        metricsId,
        totalTests,
        passRate: passRate.toFixed(1),
        coverage: coverageActual.toFixed(1),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('TEST_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record test metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getTestSuiteCoverage(suiteId: string): Promise<CodeCoverage> {
    try {
      const suiteDoc = await this.db.collection('test_suites').doc(suiteId).get();
      const suite = suiteDoc.data() as TestSuite;

      if (!suite) throw new Error('Test suite not found');

      return suite.coverage;
    } catch (error) {
      logSecurityEvent('GET_TEST_COVERAGE_FAILED' as any, 'error' as any, 'Failed to get test coverage', {
        suiteId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private inferTags(testName: string): string[] {
    const tags: string[] = [];
    if (testName.toLowerCase().includes('auth')) tags.push('auth');
    if (testName.toLowerCase().includes('database') || testName.toLowerCase().includes('db')) tags.push('database');
    if (testName.toLowerCase().includes('api')) tags.push('api');
    if (testName.toLowerCase().includes('performance')) tags.push('performance');
    if (testName.toLowerCase().includes('error') || testName.toLowerCase().includes('exception')) tags.push('error-handling');
    return tags.length > 0 ? tags : ['general'];
  }

  private identifyFlakySuspects(): string[] {
    return [
      'asyncTimeout.test.ts',
      'concurrentRequests.test.ts',
      'externalServiceMock.test.ts',
    ];
  }
}

export const unitTestingFrameworkService = new UnitTestingFrameworkService();
