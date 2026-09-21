import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface PenetrationTest {
  testId: string;
  name: string;
  scope: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'in-progress' | 'completed' | 'paused';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tester: string;
  findings: string[];
}

export interface SecurityTestSuite {
  suiteId: string;
  name: string;
  testType: 'unit' | 'integration' | 'security' | 'penetration';
  tests: SecurityTest[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface SecurityTest {
  testId: string;
  name: string;
  description: string;
  testCategory: 'authentication' | 'authorization' | 'injection' | 'xss' | 'csrf' | 'encryption' | 'api' | 'infrastructure';
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  lastRun?: Date;
}

export interface TestResult {
  resultId: string;
  testId: string;
  suiteId: string;
  executedAt: Date;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  details?: string;
  vulnerabilitiesFound: string[];
}

export interface VulnerabilityScanning {
  scanId: string;
  scanType: 'static' | 'dynamic' | 'dependency' | 'config';
  target: string;
  startTime: Date;
  endTime?: Date;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  vulnerabilitiesDiscovered: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface SecurityReport {
  reportId: string;
  reportType: 'penetration-test' | 'security-audit' | 'compliance-check' | 'risk-assessment';
  generatedAt: Date;
  generatedBy: string;
  summary: string;
  findings: ReportFinding[];
  recommendations: string[];
  overallRiskScore: number;
  status: 'draft' | 'finalized' | 'submitted';
}

export interface ReportFinding {
  findingId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedComponent: string;
  remediationSteps: string[];
  estimatedCVSS: number;
}

export interface SecurityTestingMetrics {
  metricsId: string;
  timestamp: Date;
  totalTestsRun: number;
  testsPassed: number;
  testsFailed: number;
  vulnerabilitiesFound: number;
  averageTestDuration: number;
  passRate: number;
  criticalVulnerabilities: number;
}

class SecurityTestingPenetrationService {
  private db = getFirestore();

  async createPenetrationTest(
    name: string,
    scope: string,
    tester: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<PenetrationTest> {
    try {
      const testId = `pentest_${Date.now()}`;

      const pentest: PenetrationTest = {
        testId,
        name,
        scope,
        startDate: new Date(),
        status: 'planned',
        severity,
        tester,
        findings: [],
      };

      await this.db.collection('penetration_tests').doc(testId).set(pentest);

      logSecurityEvent('PENETRATION_TEST_CREATED' as any, 'info' as any, 'Penetration test created', {
        testId,
        name,
        scope,
        tester,
      });

      return pentest;
    } catch (error) {
      logSecurityEvent('PENETRATION_TEST_CREATION_FAILED' as any, 'error' as any, 'Failed to create penetration test', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createSecurityTestSuite(
    name: string,
    testType: 'unit' | 'integration' | 'security' | 'penetration',
    tests: SecurityTest[]
  ): Promise<SecurityTestSuite> {
    try {
      const suiteId = `suite_${Date.now()}`;

      const suite: SecurityTestSuite = {
        suiteId,
        name,
        testType,
        tests,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('security_test_suites').doc(suiteId).set(suite);

      logSecurityEvent('SECURITY_TEST_SUITE_CREATED' as any, 'info' as any, 'Security test suite created', {
        suiteId,
        name,
        testType,
        testCount: tests.length,
      });

      return suite;
    } catch (error) {
      logSecurityEvent('SECURITY_TEST_SUITE_CREATION_FAILED' as any, 'error' as any, 'Failed to create security test suite', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordTestResult(
    testId: string,
    suiteId: string,
    status: 'passed' | 'failed' | 'error',
    duration: number,
    vulnerabilitiesFound: string[] = [],
    details?: string
  ): Promise<TestResult> {
    try {
      const resultId = `result_${Date.now()}`;

      const result: TestResult = {
        resultId,
        testId,
        suiteId,
        executedAt: new Date(),
        status,
        duration,
        details,
        vulnerabilitiesFound,
      };

      await this.db.collection('test_results').doc(resultId).set(result);

      logSecurityEvent('TEST_RESULT_RECORDED' as any, status === 'passed' ? 'info' as any : 'warn' as any, 'Test result recorded', {
        resultId,
        testId,
        status,
        vulnerabilityCount: vulnerabilitiesFound.length,
      });

      return result;
    } catch (error) {
      logSecurityEvent('TEST_RESULT_RECORDING_FAILED' as any, 'error' as any, 'Failed to record test result', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async executeVulnerabilityScanning(
    scanType: 'static' | 'dynamic' | 'dependency' | 'config',
    target: string
  ): Promise<VulnerabilityScanning> {
    try {
      const scanId = `scan_${Date.now()}`;

      const scan: VulnerabilityScanning = {
        scanId,
        scanType,
        target,
        startTime: new Date(),
        status: 'in-progress',
        vulnerabilitiesDiscovered: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };

      await this.db.collection('vulnerability_scans').doc(scanId).set(scan);

      logSecurityEvent('VULNERABILITY_SCAN_STARTED' as any, 'info' as any, 'Vulnerability scanning started', {
        scanId,
        scanType,
        target,
      });

      return scan;
    } catch (error) {
      logSecurityEvent('VULNERABILITY_SCAN_INITIATION_FAILED' as any, 'error' as any, 'Failed to initiate vulnerability scan', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completeScan(
    scanId: string,
    vulnerabilitiesDiscovered: number,
    criticalCount: number,
    highCount: number,
    mediumCount: number,
    lowCount: number
  ): Promise<VulnerabilityScanning> {
    try {
      const scanDoc = await this.db.collection('vulnerability_scans').doc(scanId).get();
      const scan = scanDoc.data() as VulnerabilityScanning;

      if (!scan) throw new Error('Scan not found');

      const completedScan: VulnerabilityScanning = {
        ...scan,
        status: 'completed',
        endTime: new Date(),
        vulnerabilitiesDiscovered,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
      };

      await scanDoc.ref.update(completedScan);

      logSecurityEvent('VULNERABILITY_SCAN_COMPLETED' as any, 'warn' as any, 'Vulnerability scan completed', {
        scanId,
        vulnerabilitiesDiscovered,
        criticalCount,
        highCount,
      });

      return completedScan;
    } catch (error) {
      logSecurityEvent('VULNERABILITY_SCAN_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete vulnerability scan', {
        scanId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateSecurityReport(
    reportType: 'penetration-test' | 'security-audit' | 'compliance-check' | 'risk-assessment',
    generatedBy: string,
    summary: string,
    findings: ReportFinding[],
    recommendations: string[],
    overallRiskScore: number
  ): Promise<SecurityReport> {
    try {
      const reportId = `report_${Date.now()}`;

      const report: SecurityReport = {
        reportId,
        reportType,
        generatedAt: new Date(),
        generatedBy,
        summary,
        findings,
        recommendations,
        overallRiskScore,
        status: 'draft',
      };

      await this.db.collection('security_reports').doc(reportId).set(report);

      logSecurityEvent('SECURITY_REPORT_GENERATED' as any, 'info' as any, 'Security report generated', {
        reportId,
        reportType,
        generatedBy,
        findingCount: findings.length,
      });

      return report;
    } catch (error) {
      logSecurityEvent('SECURITY_REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate security report', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async finalizeSecurityReport(
    reportId: string
  ): Promise<SecurityReport> {
    try {
      const reportDoc = await this.db.collection('security_reports').doc(reportId).get();
      const report = reportDoc.data() as SecurityReport;

      if (!report) throw new Error('Report not found');

      const finalizedReport: SecurityReport = {
        ...report,
        status: 'finalized',
      };

      await reportDoc.ref.update(finalizedReport);

      logSecurityEvent('SECURITY_REPORT_FINALIZED' as any, 'info' as any, 'Security report finalized', {
        reportId,
        riskScore: report.overallRiskScore,
      });

      return finalizedReport;
    } catch (error) {
      logSecurityEvent('SECURITY_REPORT_FINALIZATION_FAILED' as any, 'error' as any, 'Failed to finalize security report', {
        reportId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getSecurityTestingMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<SecurityTestingMetrics> {
    try {
      const metricsId = `metrics_${Date.now()}`;

      const resultsSnapshot = await this.db.collection('test_results')
        .where('executedAt', '>=', timeRange.start)
        .where('executedAt', '<=', timeRange.end)
        .get();

      const results = resultsSnapshot.docs.map((doc) => doc.data() as TestResult);

      const testsPassed = results.filter((r) => r.status === 'passed').length;
      const testsFailed = results.filter((r) => r.status === 'failed').length;
      const totalVulnerabilities = results.reduce((sum, r) => sum + r.vulnerabilitiesFound.length, 0);
      const avgDuration = results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

      const metrics: SecurityTestingMetrics = {
        metricsId,
        timestamp: new Date(),
        totalTestsRun: results.length,
        testsPassed,
        testsFailed,
        vulnerabilitiesFound: totalVulnerabilities,
        averageTestDuration: avgDuration,
        passRate: results.length > 0 ? (testsPassed / results.length) * 100 : 0,
        criticalVulnerabilities: 0,
      };

      await this.db.collection('security_testing_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('SECURITY_TESTING_METRICS_CALCULATED' as any, 'info' as any, 'Security testing metrics calculated', {
        metricsId,
        totalTestsRun: results.length,
        vulnerabilitiesFound: totalVulnerabilities,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('SECURITY_TESTING_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate security testing metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const securityTestingPenetrationService = new SecurityTestingPenetrationService();
