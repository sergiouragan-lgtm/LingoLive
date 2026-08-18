import { 
  Auth, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider, 
  signInAnonymously, 
  signOut, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  MultiFactorResolver, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator, 
  RecaptchaVerifier, 
  getMultiFactorResolver 
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase.config';
import { EnterpriseRole } from './rbac';

export interface EnterpriseAuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  role: EnterpriseRole;
  tenantId: string | null;
}

export class AuthService {
  private auth: Auth;

  constructor() {
    this.auth = getFirebaseAuth();
  }

  /**
   * Universal logging helper for authentication telemetry
   */
  private logEvent(action: string, metadata: Record<string, any> = {}) {
    console.log(`[Enterprise Auth Audit] Action: ${action} | Time: ${new Date().toISOString()} | Meta:`, JSON.stringify(metadata));
  }

  /**
   * Google Single Sign-On
   */
  public async signInWithGoogle(): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "google" });
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "google", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Apple ID Authentication
   */
  public async signInWithApple(): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "apple" });
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "apple", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Microsoft SSO (Active Directory / O365)
   */
  public async signInWithMicrosoft(): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "microsoft" });
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('user.read');
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "microsoft", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Facebook Identity Provider
   */
  public async signInWithFacebook(): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "facebook" });
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "facebook", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * GitHub SSO Integration
   */
  public async signInWithGitHub(): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "github" });
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "github", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * SAML / OIDC Enterprise Single Sign-On (SSO) Support
   */
  public async signInWithEnterpriseSSO(providerId: string): Promise<User> {
    try {
      this.logEvent("SIGN_IN_ATTEMPT", { provider: "enterprise_sso", providerId });
      const provider = new OAuthProvider(providerId);
      const result = await signInWithPopup(this.auth, provider);
      this.logEvent("SIGN_IN_SUCCESS", { uid: result.user.uid, email: result.user.email, tenantId: result.user.tenantId });
      return result.user;
    } catch (error) {
      this.logEvent("SIGN_IN_FAILURE", { provider: "enterprise_sso", providerId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Passwordless Magic Link Setup
   */
  public async sendMagicLink(email: string, redirectUrl: string): Promise<void> {
    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
    };
    try {
      this.logEvent("MAGIC_LINK_REQUESTED", { email });
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      this.logEvent("MAGIC_LINK_SENT", { email });
    } catch (error) {
      this.logEvent("MAGIC_LINK_FAILED", { email, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Passwordless Magic Link Verification
   */
  public async completeMagicLinkSignIn(currentUrl: string): Promise<User> {
    if (isSignInWithEmailLink(this.auth, currentUrl)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please enter your email for verification:');
      }
      if (!email) throw new Error('Email verification is required to complete magic-link registration.');
      
      try {
        const result = await signInWithEmailLink(this.auth, email, currentUrl);
        window.localStorage.removeItem('emailForSignIn');
        this.logEvent("MAGIC_LINK_SUCCESS", { uid: result.user.uid, email: result.user.email });
        return result.user;
      } catch (error) {
        this.logEvent("MAGIC_LINK_VERIFICATION_FAILED", { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }
    throw new Error('Current URL is not a valid email sign-in link.');
  }

  /**
   * Anonymous Trial Access Session
   */
  public async signInAnonymously(): Promise<User> {
    try {
      this.logEvent("ANONYMOUS_SIGN_IN_ATTEMPT");
      const result = await signInAnonymously(this.auth);
      this.logEvent("ANONYMOUS_SIGN_IN_SUCCESS", { uid: result.user.uid });
      return result.user;
    } catch (error) {
      this.logEvent("ANONYMOUS_SIGN_IN_FAILURE", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Enroll Multi-Factor Authentication (MFA) with Phone Number
   */
  public async enrollMfaPhone(phoneNumber: string, recaptchaContainerId: string): Promise<any> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Authentication state is required to enroll MFA.');

    try {
      this.logEvent("MFA_ENROLLMENT_STARTED", { uid: user.uid, phone: phoneNumber });
      const recaptchaVerifier = new RecaptchaVerifier(this.auth, recaptchaContainerId, {
        size: 'invisible'
      });
      const multiFactorSession = await (user as any).multiFactor.getSession();
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession
      };
      const phoneAuthProvider = new PhoneAuthProvider(this.auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
      this.logEvent("MFA_ENROLLMENT_VERIFICATION_SENT", { uid: user.uid });
      return verificationId;
    } catch (error) {
      this.logEvent("MFA_ENROLLMENT_FAILED", { uid: user.uid, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Biometrics / WebAuthn Client Key Provisioning Stubs
   */
  public async registerBiometricKey(): Promise<PublicKeyCredential | null> {
    if (typeof window === 'undefined' || !window.navigator.credentials) {
      console.warn("[Enterprise Auth] Biometric APIs are unavailable in this container context.");
      return null;
    }
    this.logEvent("BIOMETRICS_PROVISIONING_INITIATED");
    // WebAuthn standard credential setup (Stub for actual Native and browser integrations)
    return null;
  }

  /**
   * Safe Global Log Out
   */
  public async logout(): Promise<void> {
    const user = this.auth.currentUser;
    this.logEvent("LOGOUT_INITIATED", { uid: user?.uid });
    await signOut(this.auth);
    this.logEvent("LOGOUT_COMPLETED");
  }

  /**
   * Current Authenticated User getter
   */
  public getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
