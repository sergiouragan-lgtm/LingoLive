import { describe, expect, it } from "vitest";
import { renderSafeMarkdown } from "./renderSafeMarkdown";

describe("renderSafeMarkdown", () => {
  it("escapes raw HTML and event handlers before rendering", () => {
    const html = renderSafeMarkdown(
      '<img src=x onerror="alert(1)"><script>alert(2)</script><svg onload="alert(3)"></svg>'
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<svg");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;svg");
  });

  it("renders only the supported static Markdown markup", () => {
    const html = renderSafeMarkdown(
      "# Título\n\nTexto com **negrito** e *itálico*.\n\n- item\n2. segundo"
    );

    expect(html).toContain("<h1");
    expect(html).toContain("<strong");
    expect(html).toContain("<em");
    expect(html).toContain("<li");
  });
});
