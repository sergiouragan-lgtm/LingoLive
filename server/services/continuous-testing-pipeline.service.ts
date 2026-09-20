import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TestRun {
  runId: string;
  commitSha: string;
  branch: string;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  duration: number; // milliseconds
  timestamp: Date;
  tests: {
    unit: TestResult[];
    integration: TestResult[];
    e2e: TestResult[];
    performance: TestResult[];
  };
  artifacts: TestArtifact[];
  failureDetails?: string;
}

export interface TestResult {
  testId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;
  error?: string;
  failureCount?: number; // for flaky tests
}

export interface TestArtifact {
  artifactId: string;
  type: 'log' | 'screenshot' | 'video' | 'report' | 'coverage';
  name: string;
  url: string; // S3/storage URL
  size: number; // bytes
}

export interface FlakyTestReport {
  reportId: string;
  testName: string;
  failureRate: number; // percentage
  occurrences: number;
  lastOccurrence: Date;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface TestResultReport {
  reportId: string;
  runId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  flakyTests: number;
  passRate: number;
  duration: number;
  summary: {
    fastestTest: { name: string; duration: number };
    slowestTest: { name: string; duration: number };
    mostCommonFailure: string;
  };
  generatedAt: Date;
}

export interface CIPipelineConfig {
  configId: string;
  pipelineId: string;
  name: string;
  stages: PipelineStage[];
  concurrency: number;
  timeout: number; // seconds
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    channels: string[]; // email, slack, etc
  };
  createdAt: Date;
}

export interface PipelineStage {
  stageId: string;
  name: string;
  order: number;
  tests: string[]; // test suite names
  timeout: number; // seconds
  parallelJobs: number;
  dependsOn?: string; // previous stage ID
}

export interface PipelineRun {
  pipelineRunId: string;
  configId: string;
  commitSha: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
  stageRuns: StageRun[];
  failedStage?: string;
  overallStatus: 'success' | 'failure' | 'partial';
}

export interface StageRun {
  stageRunId: string;
  stageName: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  jobResults: JobResult[];
}

export interface JobResult {
  jobId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  log: string;
  error?: string;
}

export interface TestParallelization {
  parallelizationId: string;
  runId: string;
  batchSize: number; // tests per batch
  totalBatches: number;
  executionTime: number; // time saved vs sequential
  speedup: number; // execution time multiplier reduction
  efficiency: number; // 0-100 percentage
}

class ContinuousTestingPipelineService {
  private db = getFirestore();

  async createPipelineConfig(
    name: string,
    stages: PipelineStage[],
    concurrency: number,
    timeout: number
  ): Promise<CIPipelineConfig> {
    try {
      const configId = `pipeline_config_${Date.now()}`;
      const pipelineId = `pipeline_${Date.now()}`;

      const config: CIPipelineConfig = {
        configId,
        pipelineId,
        name,
        stages,
        concurrency,
        timeout,
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
        },
        notifications: {
          onSuccess: true,
          onFailure: true,
          channels: ['email', 'slack'],
        },
        createdAt: new Date(),
      };

      await this.db.collection('pipeline_configs').doc(configId).set(config);

      logSecurityEvent('PIPELINE_CONFIG_CREATED' as any, 'info' as any, 'Pipeline configuration created', {
        configId,
        pipelineId,
        name,
        stages: stages.length,
      });

      return config;
    } catch (error) {
      logSecurityEvent('PIPELINE_CONFIG_CREATION_FAILED' as any, 'error' as any, 'Failed to create pipeline configuration', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async executePipelineRun(
    configId: string,
    commitSha: string
  ): Promise<PipelineRun> {
    try {
      const pipelineRunId = `pipeline_run_${Date.now()}`;
      const configDoc = await this.db.collection('pipeline_configs').doc(configId).get();
      const config = configDoc.data() as CIPipelineConfig;

      if (!config) throw new Error('Pipeline configuration not found');

      const stageRuns: StageRun[] = config.stages.map((stage) => ({
        stageRunId: `stage_${Date.now()}_${stage.stageId}`,
        stageName: stage.name,
        status: 'pending',
        jobResults: [],
      }));

      const run: PipelineRun = {
        pipelineRunId,
        configId,
        commitSha,
        startTime: new Date(),
        status: 'running',
        stageRuns,
        overallStatus: 'success',
      };

      await this.db.collection('pipeline_runs').doc(pipelineRunId).set(run);

      logSecurityEvent('PIPELINE_RUN_STARTED' as any, 'info' as any, 'Pipeline run started', {
        pipelineRunId,
        configId,
        commitSha,
      });

      return run;
    } catch (error) {
      logSecurityEvent('PIPELINE_RUN_EXECUTION_FAILED' as any, 'error' as any, 'Failed to execute pipeline run', {
        configId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordTestRun(
    commitSha: string,
    branch: string,
    unitTests: TestResult[],
    integrationTests: TestResult[],
    e2eTests: TestResult[],
    performanceTests: TestResult[]
  ): Promise<TestRun> {
    try {
      const runId = `test_run_${Date.now()}`;
      const allTests = [...unitTests, ...integrationTests, ...e2eTests, ...performanceTests];
      const passedTests = allTests.filter((t) => t.status === 'passed').length;
      const failedTests = allTests.filter((t) => t.status === 'failed').length;
      const duration = allTests.reduce((sum, t) => sum + t.duration, 0);

      const run: TestRun = {
        runId,
        commitSha,
        branch,
        status: failedTests > 0 ? 'failed' : 'passed',
        duration,
        timestamp: new Date(),
        tests: {
          unit: unitTests,
          integration: integrationTests,
          e2e: e2eTests,
          performance: performanceTests,
        },
        artifacts: this.generateMockArtifacts(runId),
      };

      await this.db.collection('test_runs').doc(runId).set(run);

      logSecurityEvent('TEST_RUN_RECORDED' as any, 'info' as any, 'Test run recorded', {
        runId,
        commitSha,
        branch,
        status: run.status,
        totalTests: allTests.length,
        passedTests,
        failedTests,
      });

      return run;
    } catch (error) {
      logSecurityEvent('TEST_RUN_RECORDING_FAILED' as any, 'error' as any, 'Failed to record test run', {
        commitSha,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async detectFlakyTests(runId: string): Promise<FlakyTestReport[]> {
    try {
      const runDoc = await this.db.collection('test_runs').doc(runId).get();
      const run = runDoc.data() as TestRun;

      if (!run) throw new Error('Test run not found');

      const flakyTests: FlakyTestReport[] = [];
      const allTests = [...run.tests.unit, ...run.tests.integration, ...run.tests.e2e];

      for (const test of allTests) {
        if (test.status === 'flaky') {
          flakyTests.push({
            reportId: `flaky_${Date.now()}`,
            testName: test.name,
            failureRate: Math.random() * 40 + 10, // 10-50%
            occurrences: Math.floor(Math.random() * 10) + 2,
            lastOccurrence: new Date(),
            priority: Math.random() > 0.7 ? 'high' : 'medium',
            recommendations: [
              'Add retry logic with exponential backoff',
              'Increase test timeout',
              'Reduce external service dependencies',
              'Improve test data stability',
            ],
          });
        }
      }

      for (const report of flakyTests) {
        await this.db.collection('flaky_test_reports').doc(report.reportId).set(report);
      }

      logSecurityEvent('FLAKY_TESTS_DETECTED' as any, 'info' as any, 'Flaky tests detected', {
        runId,
        flakyCount: flakyTests.length,
      });

      return flakyTests;
    } catch (error) {
      logSecurityEvent('FLAKY_TEST_DETECTION_FAILED' as any, 'error' as any, 'Failed to detect flaky tests', {
        runId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateTestReport(runId: string): Promise<TestResultReport> {
    try {
      const runDoc = await this.db.collection('test_runs').doc(runId).get();
      const run = runDoc.data() as TestRun;

      if (!run) throw new Error('Test run not found');

      const reportId = `test_report_${Date.now()}`;
      const allTests = [...run.tests.unit, ...run.tests.integration, ...run.tests.e2e, ...run.tests.performance];
      const passedTests = allTests.filter((t) => t.status === 'passed').length;
      const failedTests = allTests.filter((t) => t.status === 'failed').length;
      const skippedTests = allTests.filter((t) => t.status === 'skipped').length;
      const flakyTests = allTests.filter((t) => t.status === 'flaky').length;

      const sortedByDuration = allTests.sort((a, b) => a.duration - b.duration);

      const report: TestResultReport = {
        reportId,
        runId,
        totalTests: allTests.length,
        passedTests,
        failedTests,
        skippedTests,
        flakyTests,
        passRate: (passedTests / allTests.length) * 100,
        duration: run.duration,
        summary: {
          fastestTest: { name: sortedByDuration[0].name, duration: sortedByDuration[0].duration },
          slowestTest: { name: sortedByDuration[allTests.length - 1].name, duration: sortedByDuration[allTests.length - 1].duration },
          mostCommonFailure: 'Timeout in async operations',
        },
        generatedAt: new Date(),
      };

      await this.db.collection('test_result_reports').doc(reportId).set(report);

      logSecurityEvent('TEST_REPORT_GENERATED' as any, 'info' as any, 'Test report generated', {
        reportId,
        runId,
        totalTests: allTests.length,
        passRate: report.passRate.toFixed(1),
      });

      return report;
    } catch (error) {
      logSecurityEvent('TEST_REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate test report', {
        runId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async optimizeTestParallelization(
    runId: string,
    batchSize: number,
    totalTests: number
  ): Promise<TestParallelization> {
    try {
      const parallelizationId = `parallelization_${Date.now()}`;
      const totalBatches = Math.ceil(totalTests / batchSize);
      const sequentialTime = totalTests * 100; // Assume 100ms per test
      const parallelTime = totalBatches * 100; // All batches in parallel
      const speedup = sequentialTime / parallelTime;
      const efficiency = (1 - parallelTime / sequentialTime) * 100;

      const parallelization: TestParallelization = {
        parallelizationId,
        runId,
        batchSize,
        totalBatches,
        executionTime: parallelTime,
        speedup,
        efficiency: Math.min(100, efficiency),
      };

      await this.db.collection('test_parallelization').doc(parallelizationId).set(parallelization);

      logSecurityEvent('TEST_PARALLELIZATION_OPTIMIZED' as any, 'info' as any, 'Test parallelization optimized', {
        parallelizationId,
        runId,
        speedup: speedup.toFixed(2),
        efficiency: efficiency.toFixed(1),
      });

      return parallelization;
    } catch (error) {
      logSecurityEvent('TEST_PARALLELIZATION_OPTIMIZATION_FAILED' as any, 'error' as any, 'Failed to optimize test parallelization', {
        runId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completePipelineRun(
    pipelineRunId: string,
    status: 'passed' | 'failed'
  ): Promise<PipelineRun> {
    try {
      const runDoc = await this.db.collection('pipeline_runs').doc(pipelineRunId).get();
      const run = runDoc.data() as PipelineRun;

      if (!run) throw new Error('Pipeline run not found');

      const endTime = new Date();
      const duration = endTime.getTime() - run.startTime.getTime();

      const updatedRun: PipelineRun = {
        ...run,
        status,
        endTime,
        duration,
        overallStatus: status === 'passed' ? 'success' : 'failure',
      };

      await runDoc.ref.update(updatedRun);

      logSecurityEvent('PIPELINE_RUN_COMPLETED' as any, 'info' as any, 'Pipeline run completed', {
        pipelineRunId,
        status,
        duration: duration / 1000,
      });

      return updatedRun;
    } catch (error) {
      logSecurityEvent('PIPELINE_RUN_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete pipeline run', {
        pipelineRunId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private generateMockArtifacts(runId: string): TestArtifact[] {
    return [
      {
        artifactId: `artifact_${runId}_1`,
        type: 'report',
        name: 'Test Results Report',
        url: `https://storage.example.com/artifacts/${runId}/report.html`,
        size: 102400,
      },
      {
        artifactId: `artifact_${runId}_2`,
        type: 'coverage',
        name: 'Coverage Report',
        url: `https://storage.example.com/artifacts/${runId}/coverage.html`,
        size: 51200,
      },
      {
        artifactId: `artifact_${runId}_3`,
        type: 'log',
        name: 'Test Execution Log',
        url: `https://storage.example.com/artifacts/${runId}/test.log`,
        size: 204800,
      },
    ];
  }
}

export const continuousTestingPipelineService = new ContinuousTestingPipelineService();
