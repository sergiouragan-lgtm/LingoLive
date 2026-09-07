import { ChevronRight, Home } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { sidebarConfig, type SidebarItem } from "../core/SidebarConfig";

interface AppShellProps {
  activeView: string;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  showBreadcrumbs?: boolean;
}

function findViewLabel(view: string): string {
  const normalizedView = view === "profile" ? "perfil" : view;
  const items = Object.values(sidebarConfig).flat() as SidebarItem[];

  for (const item of items) {
    if (item.id === normalizedView) return item.label;
    const child = item.children?.find((candidate) => candidate.id === normalizedView);
    if (child) return child.label;
  }

  return view
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AppShell({ activeView, sidebar, topbar, children, className = "", mainClassName = "", showBreadcrumbs = true }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const label = activeView === "dashboard" ? "Início" : findViewLabel(activeView);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [activeView]);

  return (
    <div className={`min-h-screen bg-ui-bg text-ui-text ${className}`} id="lingolive-root-app">
      <a href="#conteudo-principal" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-ui-md bg-brand-primary px-4 py-2 font-semibold text-white shadow-ui-lg transition-transform focus:translate-y-0">
        Saltar para o conteúdo principal
      </a>
      <div className="flex min-h-screen">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          {showBreadcrumbs && topbar && (
            <nav aria-label="Breadcrumb" className="border-b border-ui-border bg-white px-4 py-2 sm:px-6">
              <ol className="mx-auto flex max-w-7xl items-center gap-1.5 text-xs font-semibold text-ui-text-muted">
                <li className="flex items-center gap-1.5"><Home className="size-3.5" aria-hidden="true" /><span>Início</span></li>
                {activeView !== "dashboard" && <li className="flex min-w-0 items-center gap-1.5" aria-current="page"><ChevronRight className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate text-ui-text">{label}</span></li>}
              </ol>
            </nav>
          )}
          <main ref={mainRef} id="conteudo-principal" tabIndex={-1} className={`min-w-0 flex-1 outline-none ${mainClassName}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

