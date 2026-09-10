import { describe, expect, it } from "vitest";

import { APP_VIEW_IDS, canAccessRoute, getRoute, isProtectedReturnRoute, resolveRoute, routeRegistry } from "./routeRegistry";

describe("routeRegistry", () => {
  it("registers every legacy AppView with a stable, shareable path", () => {
    expect(routeRegistry.size).toBe(APP_VIEW_IDS.length);
    for (const view of APP_VIEW_IDS) expect(resolveRoute(getRoute(view).path)?.view).toBe(view);
  });

  it("recognizes protected onboarding and payment return routes", () => {
    expect(resolveRoute("/billing/success")?.view).toBe("pagamentos-sucesso");
    expect(isProtectedReturnRoute("pagamentos-sucesso")).toBe(true);
    expect(getRoute("pagamentos-sucesso").history).toBe("replace");
    expect(getRoute("onboarding").history).toBe("replace");
  });

  it("enforces explicit role policies while retaining authenticated legacy routes", () => {
    expect(canAccessRoute(getRoute("admin-dashboard"), "STUDENT", true)).toBe(false);
    expect(canAccessRoute(getRoute("admin-dashboard"), "SUPER_ADMIN", true)).toBe(true);
    expect(canAccessRoute(getRoute("biblioteca"), "STUDENT", true)).toBe(true);
    expect(canAccessRoute(getRoute("dashboard"), null, false)).toBe(false);
    expect(canAccessRoute(getRoute("landing"), null, false)).toBe(true);
  });
});
