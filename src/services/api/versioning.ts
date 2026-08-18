import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Interface representing semantic version parts.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/**
 * Interface for API deprecation warnings or compatibility issues.
 */
export interface ApiWarningInfo {
  url: string;
  warningMessage: string;
  sunsetDate?: Date;
  timestamp: string;
}

// Callback type for active warning listeners
type WarningListener = (info: ApiWarningInfo) => void;

class ApiVersioningManager {
  private currentClientVersion: string = '1.0.0';
  private defaultApiMajorVersion: string = 'v1';
  private warningListeners: Set<WarningListener> = new Set();

  /**
   * Parse a SemVer string into its structured components.
   * Handles formats like "1.2.3" or "2.0.0-beta.1".
   */
  public parseSemVer(version: string): SemVer {
    const clean = version.trim().replace(/^v/i, '');
    const [main, prerelease] = clean.split('-');
    const [majorStr, minorStr, patchStr] = main.split('.');

    const major = parseInt(majorStr, 10) || 0;
    const minor = parseInt(minorStr, 10) || 0;
    const patch = parseInt(patchStr, 10) || 0;

    return { major, minor, patch, prerelease };
  }

  /**
   * Compares two semantic versions.
   * Returns:
   *   1 if v1 > v2
   *  -1 if v1 < v2
   *   0 if v1 === v2
   */
  public compareSemVer(v1: string, v2: string): number {
    const sv1 = this.parseSemVer(v1);
    const sv2 = this.parseSemVer(v2);

    if (sv1.major !== sv2.major) {
      return sv1.major > sv2.major ? 1 : -1;
    }
    if (sv1.minor !== sv2.minor) {
      return sv1.minor > sv2.minor ? 1 : -1;
    }
    if (sv1.patch !== sv2.patch) {
      return sv1.patch > sv2.patch ? 1 : -1;
    }

    // Handle prerelease comparison simply (non-prerelease is greater)
    if (sv1.prerelease && !sv2.prerelease) return -1;
    if (!sv1.prerelease && sv2.prerelease) return 1;
    if (sv1.prerelease && sv2.prerelease) {
      return sv1.prerelease.localeCompare(sv2.prerelease);
    }

    return 0;
  }

  /**
   * Check if a client version is compatible with a server/API version.
   * In SemVer, breaking changes occur when the Major version increments.
   */
  public isCompatible(clientVersion: string, serverVersion: string): boolean {
    const cv = this.parseSemVer(clientVersion);
    const sv = this.parseSemVer(serverVersion);
    return cv.major === sv.major;
  }

  /**
   * Set the active client version.
   */
  public setClientVersion(version: string): void {
    this.currentClientVersion = version;
    const parsed = this.parseSemVer(version);
    this.defaultApiMajorVersion = `v${parsed.major}`;
  }

  /**
   * Get the current client version.
   */
  public getClientVersion(): string {
    return this.currentClientVersion;
  }

  /**
   * Get the default API major version string (e.g. "v1", "v2").
   */
  public getDefaultApiMajorVersion(): string {
    return this.defaultApiMajorVersion;
  }

  /**
   * Formats a path into a fully qualified API URL containing the version prefix,
   * complying with "Versionamento via URL" in API_REFERENCE.md.
   * 
   * Example: "/pronunciation/evaluate" -> "/api/v1/pronunciation/evaluate"
   */
  public buildVersionedUrl(path: string, options?: { version?: string }): string {
    let cleanPath = path.trim();
    
    // Normalize leading slash
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    const majorVersion = options?.version || this.defaultApiMajorVersion;

    // Check if URL already has the API prefix and version prefix
    const apiPrefixRegex = /^\/api\/v\d+/i;
    if (apiPrefixRegex.test(cleanPath)) {
      return cleanPath;
    }

    // If it starts with /api but doesn't have version, e.g. /api/pronunciation
    if (cleanPath.startsWith('/api/')) {
      const rest = cleanPath.substring(5); // skip "/api/"
      return `/api/${majorVersion}/${rest}`;
    }

    // Otherwise, combine them
    return `/api/${majorVersion}${cleanPath}`;
  }

  /**
   * Generates HTTP headers containing version info to assist with server tracking.
   */
  public getAPIHeaders(version?: string): Record<string, string> {
    const majorVersion = version || this.defaultApiMajorVersion;
    return {
      'X-API-Version': this.currentClientVersion,
      'X-API-Major-Version': majorVersion,
      'Accept': `application/json; version=${majorVersion}`,
    };
  }

  /**
   * Registers a callback for whenever a deprecated endpoint response is parsed.
   */
  public addWarningListener(listener: WarningListener): () => void {
    this.warningListeners.add(listener);
    return () => {
      this.warningListeners.delete(listener);
    };
  }

  /**
   * Parse HTTP response headers for Sunset and Warning markers.
   * When found, triggers registered warning listeners and logs to Firestore.
   */
  public handleResponseHeaders(
    headers: Headers | Record<string, string> | any,
    url: string
  ): { isDeprecated: boolean; sunsetDate?: Date; warningMessage?: string } {
    let sunsetStr: string | null = null;
    let warningStr: string | null = null;

    if (headers instanceof Headers) {
      sunsetStr = headers.get('sunset') || headers.get('Sunset');
      warningStr = headers.get('warning') || headers.get('Warning');
    } else if (headers && typeof headers === 'object') {
      // Find case-insensitive keys
      const keys = Object.keys(headers);
      const sunsetKey = keys.find(k => k.toLowerCase() === 'sunset');
      const warningKey = keys.find(k => k.toLowerCase() === 'warning');
      if (sunsetKey) sunsetStr = headers[sunsetKey];
      if (warningKey) warningStr = headers[warningKey];
    }

    const isDeprecated = !!(sunsetStr || warningStr);
    let sunsetDate: Date | undefined;
    let warningMessage = warningStr || undefined;

    if (sunsetStr) {
      const parsedDate = Date.parse(sunsetStr);
      if (!isNaN(parsedDate)) {
        sunsetDate = new Date(parsedDate);
      }
    }

    if (isDeprecated) {
      const info: ApiWarningInfo = {
        url,
        warningMessage: warningMessage || `Endpoint descontinuado detectado em ${url}`,
        sunsetDate,
        timestamp: new Date().toISOString()
      };

      // Notify in-app warning listeners
      this.warningListeners.forEach(listener => {
        try {
          listener(info);
        } catch (e) {
          console.error('[ApiVersioning] Error in warning listener:', e);
        }
      });

      // Async log to admin audit trail in Firestore
      this.logWarningToFirestore(info).catch(err => {
        console.warn('[ApiVersioning] Failed to log API warning to Firestore:', err);
      });
    }

    return { isDeprecated, sunsetDate, warningMessage };
  }

  /**
   * Async helper to log deprecation warnings directly to Firestore `admin_logs` 
   * to ensure admin awareness under our compliance guidelines.
   */
  private async logWarningToFirestore(info: ApiWarningInfo): Promise<void> {
    try {
      const formattedDate = info.sunsetDate ? info.sunsetDate.toLocaleDateString() : 'N/A';
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'system-governance@lingolive.ai',
        action: `AVISO DE DESCONTINUAÇÃO API: ${info.warningMessage} (Sunset: ${formattedDate}) no endpoint [${info.url}]`,
        timestamp: info.timestamp,
        meta: {
          url: info.url,
          warning: info.warningMessage,
          sunset: info.sunsetDate?.toISOString() || null,
          type: 'API_DEPRECATION'
        }
      });
    } catch (e) {
      console.warn('[ApiVersioning] Error writing to admin_logs:', e);
    }
  }
}

export const apiVersioning = new ApiVersioningManager();
