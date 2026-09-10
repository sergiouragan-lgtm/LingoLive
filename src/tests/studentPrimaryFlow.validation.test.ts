import { describe, expect, it } from "vitest";

import { CentralEntryController, type CentralEntrySnapshot } from "../entryFlow/CentralEntryController";
import { canAccessRoute, getRoute } from "../routing/routeRegistry";

describe("Stage 6 — primary student flow contract", () => {
  const journey = ["onboarding", "dashboard", "practice", "feedback", "analytics"];

  it("exposes stable and shareable URLs for the complete post-login journey", () => {
    expect(journey.map((view) => getRoute(view).path)).toEqual([
      "/onboarding", "/app/dashboard", "/app/practice", "/app/feedback", "/app/analytics",
    ]);
  });

  it.each(journey)("protects %s from unauthenticated access", (view) => {
    expect(canAccessRoute(getRoute(view), null, false)).toBe(false);
  });

  it.each(["STUDENT", "LEARNER"])("allows the canonical student role %s through the journey", (role) => {
    for (const view of journey) expect(canAccessRoute(getRoute(view), role, true)).toBe(true);
  });

  it("does not grant a student access to an administrative route", () => {
    expect(canAccessRoute(getRoute("admin-dashboard"), "STUDENT", true)).toBe(false);
  });

  it("stops an expired or missing session at the first entry gate", () => {
    const snapshot = {
      session: { status: "NOT_FOUND" }, account: { status: "NOT_FOUND" },
      profile: { status: "NOT_FOUND" }, access: { status: "NOT_FOUND" },
      subscription: { status: "NOT_FOUND" },
    } as CentralEntrySnapshot;
    const result = new CentralEntryController().resolveEntryState(snapshot);
    expect(result.status).toBe("BLOCKED");
    if (result.status === "BLOCKED") expect(result.gate).toBe("SESSION");
  });
});
