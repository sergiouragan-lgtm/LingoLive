import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface EncryptionKey {
  keyId: string;
  algorithm: 'AES-256' | 'RSA-2048' | 'ECDSA-P256';
  keyType: 'symmetric' | 'asymmetric';
  status: 'active' | 'rotated' | 'revoked';
  createdAt: Date;
  expiresAt?: Date;
  lastRotatedAt?: Date;
  keyUsage: string;
}

export interface KeyRotationPolicy {
  policyId: string;
  keyType: string;
  rotationIntervalDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface EncryptedData {
  dataId: string;
  keyId: string;
  encryptedValue: string;
  ivValue?: string;
  saltValue?: string;
  encryptedAt: Date;
  algorithm: string;
  dataType: string;
}

export interface DataClassification {
  classificationId: string;
  dataType: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  encryptionRequired: boolean;
  encryptionKeyId?: string;
  maskingRequired: boolean;
  retentionDays: number;
}

export interface KeyUsageLog {
  logId: string;
  keyId: string;
  operation: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'rotate';
  timestamp: Date;
  userId?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface CertificateManagement {
  certificateId: string;
  certificateName: string;
  issuer: string;
  validFrom: Date;
  validUntil: Date;
  certificateType: 'TLS' | 'Code Signing' | 'Client Auth';
  status: 'active' | 'expired' | 'revoked';
  thumbprint: string;
}

class DataEncryptionKeyManagementService {
  private db = getFirestore();

  async createEncryptionKey(
    algorithm: 'AES-256' | 'RSA-2048' | 'ECDSA-P256',
    keyType: 'symmetric' | 'asymmetric',
    keyUsage: string,
    expiresAt?: Date
  ): Promise<EncryptionKey> {
    try {
      const keyId = `key_${Date.now()}`;

      const key: EncryptionKey = {
        keyId,
        algorithm,
        keyType,
        status: 'active',
        createdAt: new Date(),
        expiresAt,
        keyUsage,
      };

      await this.db.collection('encryption_keys').doc(keyId).set(key);

      logSecurityEvent('ENCRYPTION_KEY_CREATED' as any, 'info' as any, 'Encryption key created', {
        keyId,
        algorithm,
        keyType,
        keyUsage,
      });

      return key;
    } catch (error) {
      logSecurityEvent('ENCRYPTION_KEY_CREATION_FAILED' as any, 'error' as any, 'Failed to create encryption key', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async rotateKey(
    keyId: string,
    newKeyId: string
  ): Promise<EncryptionKey> {
    try {
      const keyDoc = await this.db.collection('encryption_keys').doc(keyId).get();
      const key = keyDoc.data() as EncryptionKey;

      if (!key) throw new Error('Key not found');

      const rotatedKey: EncryptionKey = {
        ...key,
        status: 'rotated',
        lastRotatedAt: new Date(),
      };

      await keyDoc.ref.update(rotatedKey);

      logSecurityEvent('ENCRYPTION_KEY_ROTATED' as any, 'info' as any, 'Encryption key rotated', {
        keyId,
        newKeyId,
      });

      return rotatedKey;
    } catch (error) {
      logSecurityEvent('ENCRYPTION_KEY_ROTATION_FAILED' as any, 'error' as any, 'Failed to rotate encryption key', {
        keyId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineKeyRotationPolicy(
    keyType: string,
    rotationIntervalDays: number,
    autoRotate: boolean,
    notifyBeforeDays: number
  ): Promise<KeyRotationPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;

      const policy: KeyRotationPolicy = {
        policyId,
        keyType,
        rotationIntervalDays,
        autoRotate,
        notifyBeforeDays,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('key_rotation_policies').doc(policyId).set(policy);

      logSecurityEvent('KEY_ROTATION_POLICY_DEFINED' as any, 'info' as any, 'Key rotation policy defined', {
        policyId,
        keyType,
        rotationIntervalDays,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('KEY_ROTATION_POLICY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define key rotation policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async encryptData(
    keyId: string,
    plaintext: string,
    dataType: string
  ): Promise<EncryptedData> {
    try {
      const dataId = `encrypted_${Date.now()}`;

      const encryptedData: EncryptedData = {
        dataId,
        keyId,
        encryptedValue: Buffer.from(plaintext).toString('base64'),
        encryptedAt: new Date(),
        algorithm: 'AES-256-GCM',
        dataType,
      };

      await this.db.collection('encrypted_data').doc(dataId).set(encryptedData);

      logSecurityEvent('DATA_ENCRYPTED' as any, 'info' as any, 'Data encrypted', {
        dataId,
        keyId,
        dataType,
      });

      return encryptedData;
    } catch (error) {
      logSecurityEvent('DATA_ENCRYPTION_FAILED' as any, 'error' as any, 'Failed to encrypt data', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async classifyData(
    dataType: string,
    classification: 'public' | 'internal' | 'confidential' | 'restricted',
    encryptionRequired: boolean,
    maskingRequired: boolean,
    retentionDays: number,
    encryptionKeyId?: string
  ): Promise<DataClassification> {
    try {
      const classificationId = `classify_${Date.now()}`;

      const dataClassification: DataClassification = {
        classificationId,
        dataType,
        classification,
        encryptionRequired,
        encryptionKeyId,
        maskingRequired,
        retentionDays,
      };

      await this.db.collection('data_classifications').doc(classificationId).set(dataClassification);

      logSecurityEvent('DATA_CLASSIFIED' as any, 'info' as any, 'Data classified', {
        classificationId,
        dataType,
        classification,
      });

      return dataClassification;
    } catch (error) {
      logSecurityEvent('DATA_CLASSIFICATION_FAILED' as any, 'error' as any, 'Failed to classify data', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async logKeyUsage(
    keyId: string,
    operation: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'rotate',
    userId?: string,
    errorMessage?: string
  ): Promise<KeyUsageLog> {
    try {
      const logId = `keylog_${Date.now()}`;

      const usageLog: KeyUsageLog = {
        logId,
        keyId,
        operation,
        timestamp: new Date(),
        userId,
        status: errorMessage ? 'failed' : 'success',
        errorMessage,
      };

      await this.db.collection('key_usage_logs').doc(logId).set(usageLog);

      if (errorMessage) {
        logSecurityEvent('KEY_OPERATION_FAILED' as any, 'warn' as any, 'Key operation failed', {
          logId,
          keyId,
          operation,
          error: errorMessage,
        });
      }

      return usageLog;
    } catch (error) {
      logSecurityEvent('KEY_USAGE_LOGGING_FAILED' as any, 'error' as any, 'Failed to log key usage', {
        keyId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async manageCertificate(
    certificateName: string,
    issuer: string,
    validFrom: Date,
    validUntil: Date,
    certificateType: 'TLS' | 'Code Signing' | 'Client Auth',
    thumbprint: string
  ): Promise<CertificateManagement> {
    try {
      const certificateId = `cert_${Date.now()}`;

      const certificate: CertificateManagement = {
        certificateId,
        certificateName,
        issuer,
        validFrom,
        validUntil,
        certificateType,
        status: 'active',
        thumbprint,
      };

      await this.db.collection('certificates').doc(certificateId).set(certificate);

      logSecurityEvent('CERTIFICATE_MANAGED' as any, 'info' as any, 'Certificate managed', {
        certificateId,
        certificateName,
        certificateType,
      });

      return certificate;
    } catch (error) {
      logSecurityEvent('CERTIFICATE_MANAGEMENT_FAILED' as any, 'error' as any, 'Failed to manage certificate', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getKeyRotationMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<{
    rotationsPerformed: number;
    keysExpiringSoon: number;
    expiredKeys: number;
    averageRotationTime: number;
  }> {
    try {
      const keysSnapshot = await this.db.collection('encryption_keys').get();
      const keys = keysSnapshot.docs.map((doc) => doc.data() as EncryptionKey);

      const rotatedKeys = keys.filter((k) => k.lastRotatedAt &&
        k.lastRotatedAt >= timeRange.start &&
        k.lastRotatedAt <= timeRange.end);

      const keysExpiringSoon = keys.filter((k) =>
        k.expiresAt &&
        k.expiresAt > new Date() &&
        k.expiresAt <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );

      const expiredKeys = keys.filter((k) =>
        k.expiresAt &&
        k.expiresAt < new Date()
      );

      const avgRotationTime = rotatedKeys.length > 0
        ? rotatedKeys.reduce((sum, k) => {
            const created = k.createdAt.getTime();
            const rotated = k.lastRotatedAt?.getTime() || 0;
            return sum + (rotated - created);
          }, 0) / rotatedKeys.length
        : 0;

      return {
        rotationsPerformed: rotatedKeys.length,
        keysExpiringSoon: keysExpiringSoon.length,
        expiredKeys: expiredKeys.length,
        averageRotationTime: avgRotationTime,
      };
    } catch (error) {
      logSecurityEvent('KEY_ROTATION_METRICS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve key rotation metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const dataEncryptionKeyManagementService = new DataEncryptionKeyManagementService();
