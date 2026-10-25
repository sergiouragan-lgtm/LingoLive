const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInlineMarkdown = (value: string): string =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

/**
 * Renders the intentionally small Markdown subset used by the e-book preview.
 * User and AI supplied HTML is escaped before any static markup is added.
 */
export function renderSafeMarkdown(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");

      return lines
        .map((line) => {
          const heading = line.match(/^(#{1,3})\s+(.+)$/);
          if (heading) {
            const level = heading[1].length;
            const classes = {
              1: "text-2xl font-bold text-slate-900 mt-6 mb-3",
              2: "text-xl font-bold text-slate-800 mt-5 mb-2",
              3: "text-lg font-semibold text-slate-700 mt-4 mb-2",
            } as const;
            return `<h${level} class="${classes[level as keyof typeof classes]}">${renderInlineMarkdown(heading[2])}</h${level}>`;
          }

          const unorderedItem = line.match(/^-\s+(.+)$/);
          if (unorderedItem) {
            return `<li class="ml-4 mb-1">• ${renderInlineMarkdown(unorderedItem[1])}</li>`;
          }

          const orderedItem = line.match(/^(\d+)\.\s+(.+)$/);
          if (orderedItem) {
            return `<li class="ml-4 mb-1"><span class="font-bold">${orderedItem[1]}.</span> ${renderInlineMarkdown(orderedItem[2])}</li>`;
          }

          return `<p class="mb-3 text-slate-700 leading-relaxed">${renderInlineMarkdown(line)}</p>`;
        })
        .join("");
    })
    .join("");
}
