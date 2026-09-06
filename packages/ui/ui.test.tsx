import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, Checkbox, Dropdown, Input, Modal, Tabs } from "./index";

describe("@lingolive/ui", () => {
  afterEach(cleanup);

  it("disables a loading button and exposes busy state", () => {
    render(<Button loading>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("connects field errors and checkbox descriptions", () => {
    render(<><Input label="E-mail" error="E-mail inválido" /><Checkbox label="Lembretes" description="Um por dia" /></>);
    const input = screen.getByLabelText("E-mail");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("E-mail inválido").id).toBe(input.getAttribute("aria-describedby"));
    expect(screen.getByRole("checkbox", { name: /Lembretes/ }).getAttribute("aria-describedby")).toBe(screen.getByText("Um por dia").id);
  });

  it("closes a modal with Escape", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Perfil">Conteúdo</Modal>);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("selects a dropdown action and closes the menu", () => {
    const onSelect = vi.fn();
    render(<Dropdown trigger="Ações" items={[{ id: "edit", label: "Editar", onSelect }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("changes the selected tab and rendered panel", () => {
    function Example() {
      const [value, setValue] = useState("one");
      return <Tabs value={value} onValueChange={setValue} tabs={[{ id: "one", label: "Primeiro", panel: "Painel um" }, { id: "two", label: "Segundo", panel: "Painel dois" }]} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("tab", { name: "Segundo" }));
    expect(screen.getByRole("tab", { name: "Segundo" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Painel dois");
  });

  it("supports keyboard navigation between tabs", () => {
    function Example() {
      const [value, setValue] = useState("one");
      return <Tabs value={value} onValueChange={setValue} tabs={[{ id: "one", label: "Primeiro", panel: "Painel um" }, { id: "two", label: "Segundo", panel: "Painel dois" }]} />;
    }
    render(<Example />);
    const first = screen.getByRole("tab", { name: "Primeiro" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Segundo" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Segundo" }));
  });
});
