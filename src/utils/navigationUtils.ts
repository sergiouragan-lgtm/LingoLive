/**
 * Safely redirects the browser to an external checkout URL (e.g. Stripe Checkout)
 * handling sandboxed iframe restrictions gracefully without throwing cross-origin exceptions.
 */
export function navigateToExternalCheckout(url: string): void {
  if (!url) return;

  // 1. Try navigating the current window directly
  try {
    window.location.href = url;
    return;
  } catch (err) {
    console.warn("[Navigation] Direct window.location.href failed:", err);
  }

  // 2. Safely attempt top frame navigation if embedded in an iframe
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch (err) {
    console.warn("[Navigation] Top frame navigation restricted by browser/iframe policy:", err);
  }

  // 3. Fallback to opening checkout in a new window/tab
  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) {
      opened.focus();
      return;
    }
  } catch (err) {
    console.warn("[Navigation] window.open failed:", err);
  }

  // 4. Final fallback: invisible link click
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (err) {
    console.error("[Navigation] Anchor click redirect failed:", err);
  }
}
