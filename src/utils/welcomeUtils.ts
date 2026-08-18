// Utility to manage and reset the welcome flow in LingoLIVE

declare global {
  interface Window {
    lingoliveNavigation: {
      navigateTo: (route: string) => void;
    };
  }
}

/**
 * Forces the restart of the welcome/onboarding flow.
 * Clears local state and redirects to the first welcome step.
 */
export function reiniciarFluxoBoasVindas() {
  console.warn("[LingoLive] ⚠️ Forçando reinício da janela de boas-vindas...");

  // 1. Clear local cache/storage flags
  localStorage.removeItem('lingolive_auth_token'); 
  localStorage.removeItem('lingolive_wizard_completed'); 
  sessionStorage.clear();

  // 2. Reset app state if navigation helper exists
  if (window.lingoliveNavigation) {
    window.lingoliveNavigation.navigateTo('WELCOME_STEP_ONE');
  } else {
    // 3. Fallback: Full page reload
    window.location.reload();
  }
}
