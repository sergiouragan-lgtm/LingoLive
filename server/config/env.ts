// Environment variables are already loaded by server/config/preload.ts
// Do not call dotenv.config() again here to avoid overriding test variables

// Enable sandbox fallback ONLY in development/demo environments, disabled in production
// Function instead of constant to ensure evaluation happens at runtime, after preload.ts loads env vars
export const getSandboxFallbackEnabled = () => process.env.NODE_ENV !== "production" && process.env.ENABLE_SANDBOX_FALLBACK === "true";

// Keep constant for backward compatibility if other modules import it
export const ENABLE_SANDBOX_FALLBACK = getSandboxFallbackEnabled();
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
