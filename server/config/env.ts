import dotenv from "dotenv";
dotenv.config();

// Enable sandbox fallback ONLY in development/demo environments, disabled in production
export const ENABLE_SANDBOX_FALLBACK = process.env.NODE_ENV !== "production" && process.env.ENABLE_SANDBOX_FALLBACK === "true";
export const appBaseUrl = (() => {
  let url = process.env.APP_BASE_URL || "https://ais-dev-xmdxh67v3yosfwweey4e65-221304552169.europe-west2.run.app";
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
})();
// PORT: Cloud Run, Render e a generalidade das plataformas de nuvem atribuem
// a porta dinamicamente via variável de ambiente PORT. Um valor fixo aqui
// impede o arranque correto em produção nessas plataformas. 3000 mantém-se
// como reserva apenas para desenvolvimento local.
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Esquema de deep link da aplicação mobile. É usado para devolver o utilizador
// à app nativa depois do checkout e tem de coincidir com o `scheme` declarado
// no AndroidManifest.xml e no Info.plist.
export const MOBILE_DEEP_LINK_SCHEME = (process.env.MOBILE_DEEP_LINK_SCHEME || "lingolive")
  .replace(/[^a-z0-9+.-]/gi, "")
  .toLowerCase();

/** Constrói um deep link para a app mobile (ex.: lingolive://billing/success). */
export function mobileDeepLink(path: string, params: Record<string, string> = {}): string {
  const cleanPath = path.replace(/^\/+/, "");
  const query = new URLSearchParams(params).toString();
  return `${MOBILE_DEEP_LINK_SCHEME}://${cleanPath}${query ? `?${query}` : ""}`;
}
