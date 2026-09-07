import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppRouter } from "./useAppRouter";

describe("useAppRouter", () => {
  beforeEach(() => window.history.replaceState({}, "", "/"));
  afterEach(cleanup);

  it("keeps legacy setView calls synchronized with URLs", () => {
    const { result } = renderHook(() => useAppRouter());
    act(() => result.current[1]("biblioteca"));
    expect(result.current[0]).toBe("biblioteca");
    expect(window.location.pathname).toBe("/app/biblioteca");
  });

  it("supports browser back and direct payment return URLs", () => {
    window.history.replaceState({}, "", "/billing/success");
    const { result } = renderHook(() => useAppRouter());
    expect(result.current[0]).toBe("pagamentos-sucesso");
    act(() => {
      window.history.replaceState({}, "", "/app/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current[0]).toBe("dashboard");
  });

  it("replaces protected return routes when navigation completes", () => {
    window.history.replaceState({}, "", "/billing/success");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useAppRouter());
    act(() => result.current[1]("dashboard"));
    expect(replaceState).toHaveBeenCalledWith({ view: "dashboard" }, "", "/app/dashboard");
    replaceState.mockRestore();
  });

  it("normalizes unknown direct URLs to the public entry route", () => {
    window.history.replaceState({}, "", "/rota-inexistente");
    const { result } = renderHook(() => useAppRouter());
    expect(result.current[0]).toBe("landing");
    expect(window.location.pathname).toBe("/");
  });
});
