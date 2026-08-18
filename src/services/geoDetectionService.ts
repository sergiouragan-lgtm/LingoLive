/**
 * LingoLIVE IA - Geo Detection Service (frontend)
 *
 * Consulta o backend para saber o país do visitante (via IP), com cache local
 * de 24h para não repetir o pedido a cada carregamento da página.
 */

const CACHE_KEY = "lingolive_geo_detection";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface GeoDetectionResult {
  status: "detected" | "undetected";
  countryCode?: string;
  countryName?: string;
  detectedVia?: "platform-header" | "ip-lookup";
}

interface CachedGeoDetection extends GeoDetectionResult {
  cachedAt: number;
}

function readCache(): GeoDetectionResult | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGeoDetection;
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      return null; // cache expirado
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(result: GeoDetectionResult) {
  if (typeof localStorage === "undefined") return;
  try {
    const toCache: CachedGeoDetection = { ...result, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  } catch {
    // localStorage indisponível/cheio — não é crítico, apenas perde-se o cache
  }
}

/**
 * Deteta o país do visitante. Usa cache local quando disponível.
 * Nunca lança exceção — em caso de falha devolve { status: 'undetected' }
 * para que o chamador possa recorrer ao idioma do browser como reserva.
 */
export async function detectVisitorCountry(): Promise<GeoDetectionResult> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch("/api/geo/detect", { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { status: "undetected" };
    }

    const result: GeoDetectionResult = await response.json();
    writeCache(result);
    return result;
  } catch {
    return { status: "undetected" };
  }
}
