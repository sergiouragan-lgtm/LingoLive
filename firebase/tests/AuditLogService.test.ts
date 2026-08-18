import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogService } from '../audit/AuditLogService';
import { AuditLogRepository } from '../firestore/repositories';

const mockLogSensitiveAction = vi.fn();
const mockRepoInstance = {
  logSensitiveAction: mockLogSensitiveAction
};

// Mock the AuditLogRepository class
vi.mock('../firestore/repositories', () => {
  return {
    AuditLogRepository: class {
      logSensitiveAction = mockLogSensitiveAction;
    }
  };
});

describe('AuditLogService Unit Tests', () => {
  let auditLogService: AuditLogService;

  beforeEach(() => {
    vi.clearAllMocks();
    auditLogService = new AuditLogService();
  });

  describe('logFailedLogin', () => {
    it('should package and dispatch a failed login log entry to the repository', async () => {
      await auditLogService.logFailedLogin({
        email: 'attacker@test.com',
        reason: 'Invalid credentials key',
        tenantId: 'tenant-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledTimes(1);
      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledWith({
        actorUid: 'UNAUTHENTICATED',
        actorEmail: 'attacker@test.com',
        action: 'IDENTITY_FAILED_LOGIN',
        resourcePath: '/auth/login',
        tenantId: 'tenant-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        oldValue: null,
        newValue: {
          attemptedEmail: 'attacker@test.com',
          failureReason: 'Invalid credentials key',
          severity: 'WARNING'
        }
      });
    });

    it('should fall back to defaults if optional parameters are omitted', async () => {
      await auditLogService.logFailedLogin({
        email: 'attacker@test.com',
        reason: 'MFA_TIMEOUT',
        tenantId: ''
      });

      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'SYSTEM_GLOBAL',
          ipAddress: 'UNKNOWN_IP',
          userAgent: 'UNKNOWN_USER_AGENT'
        })
      );
    });
  });

  describe('logRoleChange', () => {
    it('should log user role escalations', async () => {
      await auditLogService.logRoleChange({
        actorUid: 'admin_456',
        actorEmail: 'admin@school.com',
        targetUid: 'student_789',
        targetEmail: 'student@school.com',
        oldRole: 'STUDENT',
        newRole: 'TEACHER',
        tenantId: 'school-a',
        ipAddress: '10.0.0.1',
        userAgent: 'Safari'
      });

      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledTimes(1);
      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledWith({
        actorUid: 'admin_456',
        actorEmail: 'admin@school.com',
        action: 'SECURITY_ROLE_CHANGE',
        resourcePath: '/users/student_789/role',
        tenantId: 'school-a',
        ipAddress: '10.0.0.1',
        userAgent: 'Safari',
        oldValue: {
          role: 'STUDENT',
          targetEmail: 'student@school.com'
        },
        newValue: {
          role: 'TEACHER',
          targetEmail: 'student@school.com',
          authorizedBy: 'admin@school.com'
        }
      });
    });
  });

  describe('logSensitiveDataAccess', () => {
    it('should record user requests on sensitive operations', async () => {
      await auditLogService.logSensitiveDataAccess({
        actorUid: 'user_111',
        actorEmail: 'teacher@school.com',
        action: 'PII_VIEW',
        resourcePath: '/profiles/student_789',
        tenantId: 'school-b',
        reason: 'Verifying parent emergency contact details',
        ipAddress: '172.16.0.4',
        userAgent: 'Chrome'
      });

      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledWith({
        actorUid: 'user_111',
        actorEmail: 'teacher@school.com',
        action: 'PII_VIEW',
        resourcePath: '/profiles/student_789',
        tenantId: 'school-b',
        ipAddress: '172.16.0.4',
        userAgent: 'Chrome',
        oldValue: null,
        newValue: {
          accessJustification: 'Verifying parent emergency contact details',
          severity: 'INFO'
        }
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log generic policy overrides or configuration changes', async () => {
      await auditLogService.logSecurityEvent({
        actorUid: 'sys_admin',
        actorEmail: 'master@enterprise.com',
        action: 'MAINTENANCE_TOGGLE',
        resourcePath: '/featureFlags/maintenance',
        tenantId: 'global',
        oldValue: { active: false },
        newValue: { active: true },
        ipAddress: '127.0.0.1'
      });

      expect(mockRepoInstance.logSensitiveAction).toHaveBeenCalledWith({
        actorUid: 'sys_admin',
        actorEmail: 'master@enterprise.com',
        action: 'MAINTENANCE_TOGGLE',
        resourcePath: '/featureFlags/maintenance',
        tenantId: 'global',
        ipAddress: '127.0.0.1',
        userAgent: 'UNKNOWN_USER_AGENT',
        oldValue: { active: false },
        newValue: { active: true }
      });
    });
  });
});
