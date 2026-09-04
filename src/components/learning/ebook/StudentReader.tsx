import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Block {
  id: string;
  type: string;
  content: string;
  meta?: Record<string, unknown>;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  blocks?: Block[];
  content?: string; // markdown fallback
}

interface ChapterProgress {
  chapterId: string;
  read: boolean;
  exercisesCompleted: number;
  exercisesTotal: number;
}

interface Enrollment {
  ebookId: string;
  studentUid: string;
  currentCefr?: string;
  chapterProgress?: ChapterProgress[];
  enrolledAt: string;
  lastActiveAt?: string;
}

interface EbookData {
  id: string;
  title: string;
  subtitle?: string;
  language: string;
  cefrLevel: string;
  coverColor?: string;
  chapters: Chapter[];
  authorId: string;
}

type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_COLORS: Record<CefrLevel, string> = {
  A1: "#22c55e",
  A2: "#84cc16",
  B1: "#f59e0b",
  B2: "#f97316",
  C1: "#ef4444",
  C2: "#8b5cf6",
};
const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: "Iniciante",
  A2: "Elementar",
  B1: "Intermédio",
  B2: "Int. Superior",
  C1: "Avançado",
  C2: "Proficiente",
};

// ── API helpers ────────────────────────────────────────────────────────────────

async function authHeader(): Promise<Record<string, string>> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fetchEbookData(ebookId: string): Promise<EbookData | null> {
  try {
    const res = await fetch(`/api/ebook/${ebookId}`, { headers: await authHeader() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.ebook ?? json ?? null;
  } catch {
    return null;
  }
}

async function fetchProgress(ebookId: string): Promise<{ enrollment: Enrollment; totalChapters: number; completionPercent: number } | null> {
  try {
    const res = await fetch(`/api/ebook/student/progress/${ebookId}`, { headers: await authHeader() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAdaptedContent(
  ebookId: string,
  chapterId: string,
  blockId: string | null,
  originalText: string,
  targetLevel: string,
  language: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/ebook/student/adaptive-content", {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ ebookId, chapterId, blockId, originalText, targetLevel, language }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.adaptedText ?? null;
  } catch {
    return null;
  }
}

async function markChapterReadApi(
  ebookId: string,
  chapterId: string,
  exercisesCompleted = 0,
  exercisesTotal = 0
): Promise<void> {
  try {
    await fetch(`/api/ebook/student/progress/${ebookId}`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ chapterId, exercisesCompleted, exercisesTotal }),
    });
  } catch {}
}

async function updateCefrLevelApi(ebookId: string, cefrLevel: string): Promise<void> {
  try {
    await fetch("/api/ebook/student/cefr-level", {
      method: "PATCH",
      headers: await authHeader(),
      body: JSON.stringify({ ebookId, cefrLevel }),
    });
  } catch {}
}

// ── Block renderers (read-only) ───────────────────────────────────────────────

function ParagraphBlock({ content }: { content: string }) {
  return (
    <p style={{ lineHeight: 1.8, marginBottom: 16, color: "var(--text-primary)" }}>
      {content}
    </p>
  );
}

function DialogueBlock({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div style={{ marginBottom: 20 }}>
      {lines.map((line, i) => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (!match) return <p key={i} style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>{line}</p>;
        return (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "var(--accent)", minWidth: 100 }}>{match[1]}:</span>
            <span style={{ color: "var(--text-primary)" }}>{match[2]}</span>
          </div>
        );
      })}
    </div>
  );
}

function VocabCard({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
      {lines.map((line, i) => {
        const [word, ...rest] = line.split("—");
        return (
          <div key={i} style={{ background: "var(--card-bg)", borderRadius: 8, padding: "12px 16px", border: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>{word?.trim()}</div>
            {rest.length > 0 && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{rest.join("—").trim()}</div>}
          </div>
        );
      })}
    </div>
  );
}

function GrammarTable({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) return <ParagraphBlock content={content} />;
  const [header, ...rows] = lines;
  const cols = header.split("|").map(s => s.trim()).filter(Boolean);
  return (
    <div style={{ overflowX: "auto", marginBottom: 20 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "var(--accent)" }}>
            {cols.map((col, i) => (
              <th key={i} style={{ padding: "8px 12px", color: "#fff", textAlign: "left", fontWeight: 600 }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const cells = row.split("|").map(s => s.trim()).filter(Boolean);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "transparent", borderBottom: "1px solid var(--border)" }}>
                {cells.map((cell, j) => (
                  <td key={j} style={{ padding: "8px 12px", color: "var(--text-primary)" }}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AccordionBlock({ content, blockId }: { content: string; blockId: string }) {
  const [open, setOpen] = useState(false);
  const [question, ...rest] = content.split("\n");
  const answer = rest.join("\n");
  return (
    <div style={{ marginBottom: 12, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--card-bg)", border: "none", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: 15, textAlign: "left" }}
      >
        {question}
        <span style={{ fontSize: 18, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "12px 16px", color: "var(--text-secondary)", lineHeight: 1.7, borderTop: "1px solid var(--border)" }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function QuizBlock({ content, blockId }: { content: string; blockId: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const lines = content.split("\n").filter(Boolean);
  const question = lines[0] ?? "Quiz";
  const options = lines.slice(1).map(line => {
    const correct = line.startsWith("*");
    return { text: line.replace(/^\*/, "").trim(), correct };
  });

  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid var(--border)" }}>
      <p style={{ fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>{question}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          const answered = selected !== null;
          const isSelected = selected === i;
          let bg = "var(--bg-alt)";
          let color = "var(--text-primary)";
          if (answered && opt.correct) { bg = "#22c55e20"; color = "#16a34a"; }
          if (answered && isSelected && !opt.correct) { bg = "#ef444420"; color = "#dc2626"; }
          return (
            <button
              key={i}
              onClick={() => { if (!answered) setSelected(i); }}
              style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid var(--border)", background: bg, color, cursor: answered ? "default" : "pointer", textAlign: "left", fontWeight: isSelected ? 600 : 400, transition: "background 0.2s" }}
            >
              {opt.text}
              {answered && opt.correct && " ✓"}
            </button>
          );
        })}
      </div>
      {selected !== null && !options[selected]?.correct && (
        <p style={{ marginTop: 10, fontSize: 13, color: "#16a34a" }}>
          Correto: {options.find(o => o.correct)?.text}
        </p>
      )}
    </div>
  );
}

function AudioPlayerBlock({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  const title = lines[0] ?? "Áudio";
  const url = lines[1] ?? "";
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>🎵 {title}</div>
      {url ? (
        <audio controls style={{ width: "100%" }} src={url} />
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>URL de áudio não configurada</div>
      )}
    </div>
  );
}

function ReadOnlyBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph": return <ParagraphBlock content={block.content} />;
    case "dialogue": return <DialogueBlock content={block.content} />;
    case "vocab-card": return <VocabCard content={block.content} />;
    case "grammar-table": return <GrammarTable content={block.content} />;
    case "accordion": return <AccordionBlock content={block.content} blockId={block.id} />;
    case "quiz": return <QuizBlock content={block.content} blockId={block.id} />;
    case "audio-player": return <AudioPlayerBlock content={block.content} />;
    default: return <ParagraphBlock content={block.content} />;
  }
}

function markdownToBlocks(md: string): Block[] {
  if (!md?.trim()) return [];
  return md.split("\n\n").filter(Boolean).map((chunk, i) => ({
    id: `md-block-${i}`,
    type: "paragraph",
    content: chunk.trim(),
  }));
}

// ── Adapted content cache (local session) ──────────────────────────────────────
const adaptedCache: Record<string, string> = {};

// ── Main component ─────────────────────────────────────────────────────────────

interface StudentReaderProps {
  ebookId: string;
  enrollment: Enrollment;
  onBack: () => void;
}

export function StudentReader({ ebookId, enrollment, onBack }: StudentReaderProps) {
  const [ebook, setEbook] = useState<EbookData | null>(null);
  const [progress, setProgress] = useState<Enrollment>(enrollment);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>((enrollment.currentCefr as CefrLevel) ?? "B1");
  const [adaptedBlocks, setAdaptedBlocks] = useState<Block[]>([]);
  const [adapting, setAdapting] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load ebook data
  useEffect(() => {
    fetchEbookData(ebookId).then(data => {
      if (data) {
        setEbook(data);
        // Select first chapter by default
        if (data.chapters?.length > 0) {
          setSelectedChapter(data.chapters[0]);
        }
      }
    });

    fetchProgress(ebookId).then(data => {
      if (data) {
        setProgress(data.enrollment);
        setCompletionPercent(data.completionPercent);
      }
    });
  }, [ebookId]);

  // Load / adapt blocks when chapter or CEFR changes
  useEffect(() => {
    if (!selectedChapter || !ebook) return;
    loadChapterContent(selectedChapter, cefrLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter?.id, cefrLevel]);

  const loadChapterContent = useCallback(
    async (chapter: Chapter, level: CefrLevel) => {
      const rawBlocks: Block[] = chapter.blocks?.length
        ? chapter.blocks
        : markdownToBlocks(chapter.content ?? "");

      if (rawBlocks.length === 0) {
        setAdaptedBlocks([]);
        return;
      }

      const ebookCefr = ebook!.cefrLevel as CefrLevel;
      // If student level matches ebook native level, no adaptation needed
      if (level === ebookCefr) {
        setAdaptedBlocks(rawBlocks);
        return;
      }

      setAdapting(true);
      const adapted: Block[] = await Promise.all(
        rawBlocks.map(async block => {
          if (!["paragraph", "dialogue"].includes(block.type)) return block;
          const cacheKey = `${chapter.id}|${block.id}|${level}|${block.content.slice(0, 64)}`;
          if (adaptedCache[cacheKey]) {
            return { ...block, content: adaptedCache[cacheKey] };
          }
          const text = await fetchAdaptedContent(
            ebookId,
            chapter.id,
            block.id,
            block.content,
            level,
            ebook!.language
          );
          if (text) {
            adaptedCache[cacheKey] = text;
            return { ...block, content: text };
          }
          return block;
        })
      );
      setAdapting(false);
      setAdaptedBlocks(adapted);
    },
    [ebook, ebookId]
  );

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkRead = async () => {
    if (!selectedChapter) return;
    setMarkingRead(true);
    await markChapterReadApi(ebookId, selectedChapter.id);
    const data = await fetchProgress(ebookId);
    if (data) {
      setProgress(data.enrollment);
      setCompletionPercent(data.completionPercent);
    }
    setMarkingRead(false);
  };

  const handleCefrChange = async (level: CefrLevel) => {
    setCefrLevel(level);
    await updateCefrLevelApi(ebookId, level);
  };

  const isChapterRead = (chapterId: string) =>
    progress.chapterProgress?.some(cp => cp.chapterId === chapterId && cp.read) ?? false;

  const navigateChapter = (dir: -1 | 1) => {
    if (!ebook || !selectedChapter) return;
    const idx = ebook.chapters.findIndex(c => c.id === selectedChapter.id);
    const next = ebook.chapters[idx + dir];
    if (next) handleSelectChapter(next);
  };

  const chapterIdx = ebook && selectedChapter
    ? ebook.chapters.findIndex(c => c.id === selectedChapter.id)
    : -1;

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column", background: "var(--bg)", color: "var(--text-primary)" }}>
      {/* ─── Top bar ─── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--card-bg)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 22, lineHeight: 1, padding: "0 4px" }}>←</button>
        <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18 }}>☰</button>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
          {ebook?.title ?? "A carregar..."}
          {selectedChapter && <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 8, fontSize: 14 }}>— {selectedChapter.title}</span>}
        </div>

        {/* CEFR Selector */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginRight: 4 }}>Nível:</span>
          {CEFR_LEVELS.map(lvl => (
            <button
              key={lvl}
              onClick={() => handleCefrChange(lvl)}
              title={CEFR_LABELS[lvl]}
              style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid", fontSize: 12, fontWeight: cefrLevel === lvl ? 700 : 400, cursor: "pointer", background: cefrLevel === lvl ? CEFR_COLORS[lvl] : "transparent", color: cefrLevel === lvl ? "#fff" : CEFR_COLORS[lvl], borderColor: CEFR_COLORS[lvl], transition: "all 0.15s" }}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ width: `${completionPercent}%`, height: "100%", background: "var(--accent)", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{Math.round(completionPercent)}%</span>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Sidebar ─── */}
        {sidebarOpen && (
          <aside style={{ width: 260, borderRight: "1px solid var(--border)", background: "var(--card-bg)", overflowY: "auto", flexShrink: 0 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>
              Índice
            </div>
            {ebook?.chapters.map((ch, i) => {
              const read = isChapterRead(ch.id);
              const active = selectedChapter?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(ch)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: active ? "var(--accent)10" : "transparent", borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent", cursor: "pointer", textAlign: "left", color: active ? "var(--accent)" : "var(--text-primary)", fontWeight: active ? 600 : 400, fontSize: 14, lineHeight: 1.4 }}
                >
                  <span style={{ fontSize: 14, opacity: 0.6, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{ch.title}</span>
                  {read && <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>}
                </button>
              );
            })}
          </aside>
        )}

        {/* ─── Content ─── */}
        <main ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
          {adapting && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
              <div style={{ fontSize: 15 }}>Adaptando conteúdo para {cefrLevel} ({CEFR_LABELS[cefrLevel]})…</div>
            </div>
          )}

          {!adapting && selectedChapter && (
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px" }}>
              {/* Chapter header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Capítulo {chapterIdx + 1}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, color: "var(--text-primary)", marginBottom: 8 }}>
                  {selectedChapter.title}
                </h1>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12, background: CEFR_COLORS[cefrLevel] + "20", color: CEFR_COLORS[cefrLevel], fontWeight: 700 }}>
                    {cefrLevel} — {CEFR_LABELS[cefrLevel]}
                  </span>
                  {isChapterRead(selectedChapter.id) && (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12, background: "#22c55e20", color: "#16a34a", fontWeight: 700 }}>✓ Lido</span>
                  )}
                </div>
              </div>

              {/* Blocks */}
              {adaptedBlocks.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Este capítulo ainda não tem conteúdo.</div>
              ) : (
                adaptedBlocks.map(block => (
                  <React.Fragment key={block.id}>
                    <ReadOnlyBlock block={block} />
                  </React.Fragment>
                ))
              )}

              {/* Chapter navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => navigateChapter(-1)}
                  disabled={chapterIdx <= 0}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: chapterIdx <= 0 ? "not-allowed" : "pointer", color: chapterIdx <= 0 ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: 600, opacity: chapterIdx <= 0 ? 0.4 : 1 }}
                >
                  ← Anterior
                </button>

                {!isChapterRead(selectedChapter.id) && (
                  <button
                    onClick={handleMarkRead}
                    disabled={markingRead}
                    style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 700, cursor: markingRead ? "wait" : "pointer", fontSize: 14 }}
                  >
                    {markingRead ? "A guardar…" : "✓ Marcar como Lido"}
                  </button>
                )}

                <button
                  onClick={() => navigateChapter(1)}
                  disabled={!ebook || chapterIdx >= ebook.chapters.length - 1}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: (!ebook || chapterIdx >= ebook.chapters.length - 1) ? "not-allowed" : "pointer", color: (!ebook || chapterIdx >= ebook.chapters.length - 1) ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: 600, opacity: (!ebook || chapterIdx >= ebook.chapters.length - 1) ? 0.4 : 1 }}
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {!adapting && !selectedChapter && (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Selecione um capítulo para começar a ler</div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        :root {
          --bg: #f9fafb;
          --card-bg: #ffffff;
          --text-primary: #111827;
          --text-secondary: #6b7280;
          --border: #e5e7eb;
          --accent: #4f46e5;
          --bg-alt: #f3f4f6;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border: #334155;
            --accent: #818cf8;
            --bg-alt: #1e293b;
          }
        }
        :root[data-theme="dark"] {
          --bg: #0f172a;
          --card-bg: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border: #334155;
          --accent: #818cf8;
          --bg-alt: #1e293b;
        }
      `}</style>
    </div>
  );
}

export default StudentReader;
