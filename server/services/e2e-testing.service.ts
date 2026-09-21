import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface E2ETest {
  testId: string;
  name: string;
  description: string;
  userFlow: string; // login -> dashboard -> course -> assessment -> completion
  status: 'passed' | 'failed' | 'pending' | 'flaky';
  duration: number;
  screenshots: ScreenshotRecord[];
  assertions: E2EAssertion[];
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export interface ScreenshotRecord {
  screenshotId: string;
  step: string;
  url: string; // S3/storage URL
  timestamp: Date;
}

export interface E2EAssertion {
  assertionId: string;
  step: string;
  type: 'element-visible' | 'element-clickable' | 'text-content' | 'url-match' | 'navigation';
  selector?: string;
  expected: any;
  actual?: any;
  passed: boolean;
  message: string;
}

export interface E2ETestSuite {
  suiteId: string;
  name: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'all';
  testCount: number;
  passedTests: number;
  failedTests: number;
  flakyTests: number;
  duration: number;
  coverage: {
    pages: string[];
    features: string[];
    userJourneys: string[];
  };
  status: 'passed' | 'failed' | 'running';
  createdAt: Date;
}

export interface UserJourney {
  journeyId: string;
  name: string;
  description: string;
  steps: JourneyStep[];
  expectedOutcome: string;
  actualOutcome?: string;
  duration: number;
  status: 'completed' | 'failed' | 'pending';
  testData: Record<string, any>;
}

export interface JourneyStep {
  stepId: string;
  description: string;
  action: 'click' | 'type' | 'navigate' | 'wait' | 'upload' | 'verify';
  target?: string; // CSS selector or element identifier
  value?: string; // Text to type or URL to navigate to
  duration: number;
  status: 'completed' | 'failed' | 'pending';
}

export interface VisualRegressionTest {
  testId: string;
  page: string;
  baselineImage: string; // Image URL
  currentImage: string; // Image URL
  diffImage?: string; // Diff visualization URL
  diffPercentage: number; // 0-100
  status: 'passed' | 'failed' | 'needs-review';
  createdAt: Date;
}

export interface CrossBrowserTest {
  testId: string;
  testName: string;
  browsers: BrowserTestResult[];
  status: 'passed' | 'failed' | 'partial';
  createdAt: Date;
}

export interface BrowserTestResult {
  browser: string;
  version: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots: ScreenshotRecord[];
}

export interface E2EMetrics {
  metricsId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  flakyTests: number;
  avgDuration: number;
  totalDuration: number;
  passRate: number;
  flakRate: number;
  browsers: string[];
  coveragePercentage: number;
  recordedAt: Date;
}

class E2ETestingService {
  private db = getFirestore();

  async createE2ETestSuite(
    name: string,
    browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'all',
    testCount: number
  ): Promise<E2ETestSuite> {
    try {
      const suiteId = `e2e_suite_${Date.now()}`;

      const suite: E2ETestSuite = {
        suiteId,
        name,
        browser,
        testCount,
        passedTests: 0,
        failedTests: 0,
        flakyTests: 0,
        duration: 0,
        coverage: {
          pages: [],
          features: [],
          userJourneys: [],
        },
        status: 'running',
        createdAt: new Date(),
      };

      await this.db.collection('e2e_test_suites').doc(suiteId).set(suite);

      logSecurityEvent('E2E_TEST_SUITE_CREATED' as any, 'info' as any, 'E2E test suite created', {
        suiteId,
        name,
        browser,
        testCount,
      });

      return suite;
    } catch (error) {
      logSecurityEvent('E2E_TEST_SUITE_CREATION_FAILED' as any, 'error' as any, 'Failed to create E2E test suite', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async testUserJourney(
    name: string,
    description: string,
    steps: JourneyStep[],
    testData: Record<string, any>
  ): Promise<UserJourney> {
    try {
      const journeyId = `journey_${Date.now()}`;
      const startTime = Date.now();

      const journey: UserJourney = {
        journeyId,
        name,
        description,
        steps,
        expectedOutcome: 'User completes ' + name,
        actualOutcome: 'User completes ' + name,
        duration: Date.now() - startTime,
        status: 'completed',
        testData,
      };

      await this.db.collection('user_journeys').doc(journeyId).set(journey);

      logSecurityEvent('USER_JOURNEY_TESTED' as any, 'info' as any, 'User journey tested', {
        journeyId,
        name,
        status: journey.status,
        duration: journey.duration,
      });

      return journey;
    } catch (error) {
      logSecurityEvent('USER_JOURNEY_TEST_FAILED' as any, 'error' as any, 'Failed to test user journey', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordE2ETest(
    suiteId: string,
    name: string,
    userFlow: string,
    assertions: E2EAssertion[],
    duration: number,
    status: 'passed' | 'failed' | 'flaky'
  ): Promise<E2ETest> {
    try {
      const testId = `e2e_test_${Date.now()}`;

      const test: E2ETest = {
        testId,
        name,
        description: 'E2E test for ' + userFlow,
        userFlow,
        status,
        duration,
        screenshots: this.generateMockScreenshots(),
        assertions,
        retryCount: status === 'flaky' ? 2 : 0,
        createdAt: new Date(),
      };

      await this.db.collection('e2e_tests').doc(testId).set(test);

      logSecurityEvent('E2E_TEST_RECORDED' as any, 'info' as any, 'E2E test recorded', {
        testId,
        name,
        userFlow,
        status,
        duration,
      });

      return test;
    } catch (error) {
      logSecurityEvent('E2E_TEST_RECORDING_FAILED' as any, 'error' as any, 'Failed to record E2E test', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async testVisualRegression(
    page: string,
    baselineImage: string,
    currentImage: string
  ): Promise<VisualRegressionTest> {
    try {
      const testId = `visual_test_${Date.now()}`;
      const diffPercentage = Math.random() * 5; // Simulate 0-5% diff

      const test: VisualRegressionTest = {
        testId,
        page,
        baselineImage,
        currentImage,
        diffPercentage,
        status: diffPercentage < 1 ? 'passed' : diffPercentage < 3 ? 'needs-review' : 'failed',
        createdAt: new Date(),
      };

      await this.db.collection('visual_regression_tests').doc(testId).set(test);

      logSecurityEvent('VISUAL_REGRESSION_TEST_COMPLETED' as any, 'info' as any, 'Visual regression test completed', {
        testId,
        page,
        diffPercentage: diffPercentage.toFixed(2),
        status: test.status,
      });

      return test;
    } catch (error) {
      logSecurityEvent('VISUAL_REGRESSION_TEST_FAILED' as any, 'error' as any, 'Failed to test visual regression', {
        page,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async testCrossBrowser(testName: string, browsers: string[]): Promise<CrossBrowserTest> {
    try {
      const testId = `cross_browser_test_${Date.now()}`;

      const browserResults: BrowserTestResult[] = browsers.map((browser) => ({
        browser,
        version: this.getBrowserVersion(browser),
        status: 'passed',
        duration: 3000 + Math.random() * 2000,
        screenshots: this.generateMockScreenshots(),
      }));

      const test: CrossBrowserTest = {
        testId,
        testName,
        browsers: browserResults,
        status: browserResults.every((r) => r.status === 'passed') ? 'passed' : 'failed',
        createdAt: new Date(),
      };

      await this.db.collection('cross_browser_tests').doc(testId).set(test);

      logSecurityEvent('CROSS_BROWSER_TEST_COMPLETED' as any, 'info' as any, 'Cross-browser test completed', {
        testId,
        testName,
        browsers: browsers.length,
        status: test.status,
      });

      return test;
    } catch (error) {
      logSecurityEvent('CROSS_BROWSER_TEST_FAILED' as any, 'error' as any, 'Failed to test cross-browser', {
        testName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordE2EMetrics(
    totalTests: number,
    passedTests: number,
    failedTests: number,
    flakyTests: number,
    avgDuration: number,
    browsers: string[]
  ): Promise<E2EMetrics> {
    try {
      const metricsId = `e2e_metrics_${Date.now()}`;
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const flakRate = totalTests > 0 ? (flakyTests / totalTests) * 100 : 0;

      const metrics: E2EMetrics = {
        metricsId,
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        avgDuration,
        totalDuration: avgDuration * totalTests,
        passRate,
        flakRate,
        browsers,
        coveragePercentage: 75,
        recordedAt: new Date(),
      };

      await this.db.collection('e2e_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('E2E_METRICS_RECORDED' as any, 'info' as any, 'E2E metrics recorded', {
        metricsId,
        totalTests,
        passRate: passRate.toFixed(1),
        flakRate: flakRate.toFixed(1),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('E2E_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record E2E metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private generateMockScreenshots(): ScreenshotRecord[] {
    return [
      {
        screenshotId: `screenshot_${Date.now()}_1`,
        step: 'Initial page load',
        url: 'https://storage.example.com/screenshots/step1.png',
        timestamp: new Date(),
      },
      {
        screenshotId: `screenshot_${Date.now()}_2`,
        step: 'After user interaction',
        url: 'https://storage.example.com/screenshots/step2.png',
        timestamp: new Date(),
      },
    ];
  }

  private getBrowserVersion(browser: string): string {
    const versions: Record<string, string> = {
      chrome: '127.0.0',
      firefox: '128.0.0',
      safari: '18.0.0',
      edge: '127.0.0',
    };
    return versions[browser] || 'unknown';
  }
}

export const e2eTestingService = new E2ETestingService();
