/**
 * LingoLIVE IA - Geo Detection Route
 *
 * Deteta o país do visitante a partir do IP do pedido, para alimentar o
 * Motor GeoLinguístico (idioma → país → região → dialeto → cultura).
 *
 * Estratégia em cascata (do mais rápido/fiável para o mais lento):
 *   1. Cabeçalhos de geolocalização injetados pela plataforma de deploy
 *      (Vercel, Cloudflare, Fastly, Google App Engine) — grátis, instantâneo,
 *      sem chamada de rede externa.
 *   2. Serviço externo de geolocalização por IP (ip-api.com, gratuito, sem
 *      chave de API), usando o IP real do pedido.
 *   3. Falha graciosa: devolve status "undetected" e o frontend usa o idioma
 *      do browser como reserva (comportamento já existente).
 */
import { Router, Request } from "express";

const router = Router();

interface GeoResult {
  countryCode: string;
  countryName?: string;
  detectedVia: "platform-header" | "ip-lookup";
}

// 1. Cabeçalhos de plataformas de hosting (Vercel, Cloudflare, Fastly, GAE, etc.)
function detectFromPlatformHeaders(req: Request): GeoResult | null {
  const headerCandidates: Record<string, string> = {
    "x-vercel-ip-country": "Vercel",
    "cf-ipcountry": "Cloudflare",
    "x-appengine-country": "Google App Engine",
    "fastly-client-ip-country": "Fastly",
  };

  for (const headerName of Object.keys(headerCandidates)) {
    const value = req.headers[headerName];
    const countryCode = Array.isArray(value) ? value[0] : value;
    if (countryCode && typeof countryCode === "string" && countryCode.length === 2 && countryCode.toUpperCase() !== "XX") {
      return { countryCode: countryCode.toUpperCase(), detectedVia: "platform-header" };
    }
  }
  return null;
}

// Extrai o IP real do visitante, tendo em conta proxies/CDNs à frente do servidor.
function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    const ip = first?.trim();
    if (ip) return ip;
  }
  return req.socket?.remoteAddress || null;
}

// 2. Fallback: serviço externo de geolocalização por IP (sem necessidade de chave).
async function detectFromIpLookup(ip: string | null): Promise<GeoResult | null> {
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return null; // IP local/dev — não há nada para consultar
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === "success" && data.countryCode) {
      return { countryCode: data.countryCode, countryName: data.country, detectedVia: "ip-lookup" };
    }
  } catch (err) {
    // Falha silenciosa: o frontend cai para o idioma do browser.
  }
  return null;
}

router.get("/detect", async (req, res) => {
  try {
    const viaHeader = detectFromPlatformHeaders(req);
    if (viaHeader) {
      return res.json({ status: "detected", ...viaHeader });
    }

    const ip = getClientIp(req);
    const viaIp = await detectFromIpLookup(ip);
    if (viaIp) {
      return res.json({ status: "detected", ...viaIp });
    }

    return res.json({ status: "undetected" });
  } catch (err: any) {
    console.error("[Geo Detect] Erro inesperado:", err.message || err);
    return res.json({ status: "undetected" });
  }
});

export default router;
