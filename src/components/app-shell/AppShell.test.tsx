import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  afterEach(cleanup);

  it("provides global landmarks, breadcrumbs and a skip link", () => {
    render(<AppShell activeView="biblioteca" sidebar={<aside>Menu</aside>} topbar={<header>Topo</header>}><h1>Biblioteca</h1></AppShell>);
    expect(screen.getByRole("link", { name: "Saltar para o conteúdo principal" }).getAttribute("href")).toBe("#conteudo-principal");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toContain("InícioBiblioteca");
    expect(screen.getByRole("main").getAttribute("tabindex")).toBe("-1");
  });

  it("moves focus to the main area after navigation", () => {
    const { rerender } = render(<AppShell activeView="dashboard"><p>Painel</p></AppShell>);
    rerender(<AppShell activeView="settings"><p>Definições</p></AppShell>);
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });
});
