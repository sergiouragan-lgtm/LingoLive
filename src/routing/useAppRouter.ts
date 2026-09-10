import { startTransition, useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { getRoute, resolveRoute } from "./routeRegistry";

function initialView(): string {
  if (typeof window === "undefined") return "landing";
  return resolveRoute(window.location.pathname)?.view ?? "landing";
}

export function useAppRouter(): [string, Dispatch<SetStateAction<any>>] {
  const [view, setViewState] = useState<string>(initialView);
  const viewRef = useRef(view);

  const setView = useCallback<Dispatch<SetStateAction<any>>>((action) => {
    const nextView = typeof action === "function" ? action(viewRef.current) : action;
    const route = getRoute(nextView);
    const currentRoute = getRoute(viewRef.current);
    const currentPath = window.location.pathname.length > 1 ? window.location.pathname.replace(/\/+$/, "") : window.location.pathname;

    viewRef.current = nextView;
    if (currentPath !== route.path) {
      const historyMethod = route.history === "replace" || currentRoute.history === "replace" ? "replaceState" : "pushState";
      window.history[historyMethod]({ view: nextView }, "", route.path);
    }
    startTransition(() => setViewState(nextView));
  }, []);

  useEffect(() => {
    if (!resolveRoute(window.location.pathname)) {
      window.history.replaceState({ view: "landing" }, "", getRoute("landing").path);
    }
    const onPopState = () => {
      const route = resolveRoute(window.location.pathname);
      if (!route) return;
      viewRef.current = route.view;
      startTransition(() => setViewState(route.view));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [view, setView];
}
