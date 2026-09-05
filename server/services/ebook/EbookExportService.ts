import JSZip from "jszip";
import PDFDocument from "pdfkit";
import crypto from "crypto";

export interface DrmBuyerInfo {
  name: string;
  email: string;
  nif?: string;
  ip?: string;
  purchaseId: string;
  purchasedAt: number;
}

export interface ExportChapter {
  number: number;
  title: string;
  content: string;
}

export interface ExportBook {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  language: string;
  cefrLevel: string;
  authorName: string;
  authorEmail: string;
  chapters: ExportChapter[];
  coverColor?: string;
}

// ─── ePub 3.2 ────────────────────────────────────────────────────────────────

export async function generateEpub(book: ExportBook): Promise<Buffer> {
  const zip = new JSZip();
  const bookId = book.id || crypto.randomUUID();
  const now = new Date().toISOString().split("T")[0];

  // mimetype MUST be first, uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.folder("META-INF")!.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:schemas:container">
  <rootfiles>
    <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const epub = zip.folder("EPUB")!;
  const text = epub.folder("Text")!;

  // chapter HTML files
  for (const ch of book.chapters) {
    const htmlContent = markdownToHtml(ch.content);
    text.file(
      `chapter${ch.number}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="../Styles/main.css"/>
</head>
<body>
  <section epub:type="chapter">
    <h1>${escapeXml(ch.title)}</h1>
    ${htmlContent}
  </section>
</body>
</html>`
    );
  }

  // CSS
  epub.folder("Styles")!.file(
    "main.css",
    `body { font-family: Georgia, serif; line-height: 1.6; margin: 2em; color: #1a1a1a; }
h1 { font-size: 1.8em; margin-bottom: 0.5em; }
h2 { font-size: 1.4em; margin-top: 1.5em; }
h3 { font-size: 1.2em; margin-top: 1.2em; }
p { margin-bottom: 0.8em; text-align: justify; }
blockquote { border-left: 4px solid #5558E8; padding-left: 1em; margin: 1em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ccc; padding: 0.5em; }
th { background: #f0f0f0; }
code { font-family: monospace; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; }`
  );

  // nav.xhtml (ePub 3 navigation)
  const navItems = book.chapters
    .map((ch) => `    <li><a href="Text/chapter${ch.number}.xhtml">${escapeXml(ch.title)}</a></li>`)
    .join("\n");

  epub.file(
    "nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="UTF-8"/><title>Índice</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>Índice</h2>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`
  );

  // content.opf
  const manifestItems = book.chapters
    .map(
      (ch) =>
        `    <item id="chapter${ch.number}" href="Text/chapter${ch.number}.xhtml" media-type="application/xhtml+xml"/>`
    )
    .join("\n");

  const spineItems = book.chapters
    .map((ch) => `    <itemref idref="chapter${ch.number}"/>`)
    .join("\n");

  epub.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.authorName)}</dc:creator>
    <dc:language>${book.language}</dc:language>
    <dc:description>${escapeXml(book.description ?? "")}</dc:description>
    <dc:date>${now}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="Styles/main.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`
  );

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return buffer;
}

// ─── DRM PDF with Social Watermark ───────────────────────────────────────────

export async function generateDrmPdf(
  book: ExportBook,
  buyer: DrmBuyerInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 72 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const raw = Buffer.concat(chunks);
      const watermarked = injectSteganographicWatermark(raw, buyer);
      resolve(watermarked);
    });
    doc.on("error", reject);

    const accent = "#5558E8";
    const gray = "#666666";
    const lightGray = "#F5F5F5";

    const watermarkLine = buildWatermarkLine(buyer);

    // ── Cover page ──
    doc.rect(0, 0, doc.page.width, 200).fill(accent);
    doc.fillColor("#FFFFFF").fontSize(28).font("Helvetica-Bold").text(book.title, 72, 72, { width: doc.page.width - 144 });
    if (book.subtitle) {
      doc.fontSize(14).font("Helvetica").text(book.subtitle, 72, 120, { width: doc.page.width - 144 });
    }
    doc.fillColor(accent).fontSize(11).text(`Nível CEFR: ${book.cefrLevel}  •  Idioma: ${book.language}`, 72, 220);
    doc.fillColor(gray).fontSize(10).text(`Autor: ${book.authorName}`, 72, 240);

    // DRM notice box
    doc.rect(72, 280, doc.page.width - 144, 80).fill(lightGray).stroke("#DDDDDD");
    doc.fillColor("#CC0000").fontSize(9).font("Helvetica-Bold").text("DOCUMENTO PROTEGIDO — USO PESSOAL E INTRANSFERÍVEL", 84, 292);
    doc.fillColor(gray).font("Helvetica").fontSize(8).text(watermarkLine, 84, 308, { width: doc.page.width - 170 });
    doc.text(`ID de Compra: ${buyer.purchaseId}  •  Adquirido em: ${new Date(buyer.purchasedAt).toLocaleString("pt-PT")}`, 84, 320);

    doc.addPage();

    // ── Chapter pages ──
    for (const ch of book.chapters) {
      addFooterWatermark(doc, watermarkLine, accent, gray);

      doc.fillColor(accent).fontSize(20).font("Helvetica-Bold").text(`Capítulo ${ch.number}`, { align: "left" });
      doc.moveDown(0.3);
      doc.fillColor("#1a1a1a").fontSize(16).text(ch.title, { align: "left" });
      doc.moveDown(1);

      renderMarkdownToPdf(doc, ch.content, gray);

      if (book.chapters.indexOf(ch) < book.chapters.length - 1) {
        doc.addPage();
      }
    }

    addFooterWatermark(doc, watermarkLine, accent, gray);
    doc.end();
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWatermarkLine(buyer: DrmBuyerInfo): string {
  const parts = [`Licenciado para: ${buyer.name}`, `<${buyer.email}>`];
  if (buyer.nif) parts.push(`NIF/CPF: ${buyer.nif}`);
  if (buyer.ip) parts.push(`IP: ${buyer.ip}`);
  return parts.join("  •  ");
}

function addFooterWatermark(
  doc: PDFKit.PDFDocument,
  line: string,
  accent: string,
  gray: string
): void {
  const bottom = doc.page.height - 40;
  doc.save();
  doc.strokeColor(accent).lineWidth(0.5).moveTo(72, bottom).lineTo(doc.page.width - 72, bottom).stroke();
  doc.fillColor(gray).fontSize(7).font("Helvetica").text(line, 72, bottom + 6, {
    width: doc.page.width - 144,
    align: "center",
  });
  doc.restore();
}

function injectSteganographicWatermark(pdfBuffer: Buffer, buyer: DrmBuyerInfo): Buffer {
  const payload = JSON.stringify({
    purchaseId: buyer.purchaseId,
    email: buyer.email,
    ts: buyer.purchasedAt,
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  // Embed as a PDF comment at the end of the binary — invisible in viewers
  const marker = Buffer.from(`\n%% LINGOLIVE-DRM:${hash} %%\n`);
  return Buffer.concat([pdfBuffer, marker]);
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hbulp])(.+)$/gm, "<p>$1</p>");
}

function renderMarkdownToPdf(doc: PDFKit.PDFDocument, md: string, gray: string): void {
  const lines = md.split("\n");
  for (const line of lines) {
    if (!line.trim()) { doc.moveDown(0.4); continue; }
    if (line.startsWith("### ")) {
      doc.fillColor("#333333").fontSize(13).font("Helvetica-Bold").text(line.slice(4)).moveDown(0.3);
    } else if (line.startsWith("## ")) {
      doc.fillColor("#1a1a1a").fontSize(15).font("Helvetica-Bold").text(line.slice(3)).moveDown(0.4);
    } else if (line.startsWith("# ")) {
      doc.fillColor("#1a1a1a").fontSize(18).font("Helvetica-Bold").text(line.slice(2)).moveDown(0.5);
    } else if (line.startsWith("> ")) {
      doc.fillColor(gray).fontSize(10).font("Helvetica-Oblique").text(line.slice(2), { indent: 20 }).moveDown(0.3);
    } else if (line.startsWith("- ") || /^\d+\. /.test(line)) {
      const text = line.replace(/^- /, "• ").replace(/^\d+\. /, (m) => m);
      doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica").text(text, { indent: 16 }).moveDown(0.2);
    } else {
      const clean = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
      doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica").text(clean).moveDown(0.3);
    }
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
