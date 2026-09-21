import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TwoFASetup {
  userId: string;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  createdAt: Date;
  verifiedAt?: Date;
  enabled: boolean;
}

export interface TwoFASession {
  userId: string;
  tempToken: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

class TwoFAService {
  private db: Firestore;
  private sessions: Map<string, TwoFASession> = new Map();

  constructor() {
    this.db = getFirestore();
  }

  public async generateSecret(userId: string, email: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    try {
      const secret = speakeasy.generateSecret({
        name: `LingoLive (${email})`,
        length: 32,
      });

      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');
      const backupCodes = Array.from({ length: 10 }, () => this.generateBackupCode());

      logSecurityEvent(
        '2FA_SECRET_GENERATED' as any,
        'info' as any,
        `2FA secret generated for user ${userId}`,
        { userId },
        { backupCodesCount: backupCodes.length }
      );

      return { secret: secret.base32, qrCode, backupCodes };
    } catch (error: any) {
      logSecurityEvent(
        '2FA_GENERATION_FAILED' as any,
        'warning' as any,
        `Failed to generate 2FA secret: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async enableTwoFA(userId: string, secret: string, verificationCode: string, backupCodes: string[]): Promise<boolean> {
    try {
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: verificationCode,
        window: 2,
      });

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      const setup: TwoFASetup = {
        userId,
        secret,
        qrCode: '', // Store separately if needed
        backupCodes: backupCodes.map((code) => this.hashCode(code)),
        createdAt: new Date(),
        verifiedAt: new Date(),
        enabled: true,
      };

      await this.db.collection('user_2fa').doc(userId).set(setup);

      logSecurityEvent(
        '2FA_ENABLED' as any,
        'warning' as any,
        `2FA enabled for user ${userId}`,
        { userId },
        { backupCodesCount: backupCodes.length }
      );

      return true;
    } catch (error: any) {
      logSecurityEvent(
        '2FA_ENABLE_FAILED' as any,
        'warning' as any,
        `Failed to enable 2FA: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('user_2fa').doc(userId).get();

      if (!doc.exists) {
        return false;
      }

      const setup = doc.data() as TwoFASetup;
      if (!setup.enabled) {
        return false;
      }

      const isValid = speakeasy.totp.verify({
        secret: setup.secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (isValid) {
        logSecurityEvent(
          '2FA_VERIFIED' as any,
          'info' as any,
          `2FA token verified for user ${userId}`,
          { userId },
          {}
        );
      }

      return isValid;
    } catch (error: any) {
      logSecurityEvent(
        '2FA_VERIFY_FAILED' as any,
        'warning' as any,
        `2FA verification failed: ${error.message}`,
        { userId },
        { error: error.message }
      );
      return false;
    }
  }

  public async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('user_2fa').doc(userId).get();

      if (!doc.exists) {
        return false;
      }

      const setup = doc.data() as TwoFASetup;
      const hashedCode = this.hashCode(backupCode);

      const isValid = setup.backupCodes.includes(hashedCode);

      if (isValid) {
        setup.backupCodes = setup.backupCodes.filter((c) => c !== hashedCode);
        await this.db.collection('user_2fa').doc(userId).update({
          backupCodes: setup.backupCodes,
        });

        logSecurityEvent(
          '2FA_BACKUP_CODE_USED' as any,
          'warning' as any,
          `Backup code used for user ${userId}`,
          { userId },
          { codesRemaining: setup.backupCodes.length }
        );
      }

      return isValid;
    } catch (error: any) {
      logSecurityEvent(
        '2FA_BACKUP_VERIFY_FAILED' as any,
        'warning' as any,
        `Backup code verification failed: ${error.message}`,
        { userId },
        { error: error.message }
      );
      return false;
    }
  }

  public async disableTwoFA(userId: string): Promise<void> {
    try {
      await this.db.collection('user_2fa').doc(userId).update({
        enabled: false,
      });

      logSecurityEvent(
        '2FA_DISABLED' as any,
        'warning' as any,
        `2FA disabled for user ${userId}`,
        { userId },
        {}
      );
    } catch (error: any) {
      logSecurityEvent(
        '2FA_DISABLE_FAILED' as any,
        'warning' as any,
        `Failed to disable 2FA: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async isTwoFAEnabled(userId: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('user_2fa').doc(userId).get();
      if (!doc.exists) return false;

      const setup = doc.data() as TwoFASetup;
      return setup.enabled;
    } catch {
      return false;
    }
  }

  private generateBackupCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private hashCode(code: string): string {
    return Buffer.from(code).toString('base64');
  }
}

export const twoFAService = new TwoFAService();
