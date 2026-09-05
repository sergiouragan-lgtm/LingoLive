import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  BookOpen, Plus, Sparkles, ChevronLeft, ChevronRight, Save, Download,
  Trash2, Edit3, Eye, Layers, Sliders, MessageSquare, CheckCircle,
  RefreshCw, Copy, AlertTriangle, GraduationCap, Globe, Users,
  FileText, Zap, BarChart3, Settings, ArrowLeft, X, ChevronDown,
  ChevronUp, Star, Wand2, PenTool, BookMarked, Target, Award,
  RotateCcw, Check, Loader2, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2,
  MoreHorizontal, Grid, Clock, TrendingUp, Lock, Unlock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../../../firebase";
import { useToast } from "../../../context/ToastContext";
import { useUserRole } from "../../../context/UserRoleContext";
import jsPDF from "jspdf";
import { BlockEditor, type Block, blocksToMarkdown, markdownToBlocks } from "./BlockEditor";

// ─────────────────────────── types ───────────────────────────

interface ToneConfig {
  formality: "informal" | "neutral" | "formal" | "academic";
  style: "conversational" | "narrative" | "instructional" | "analytical";
  audience: "children" | "teens" | "adults" | "professionals";
  richness: "simple" | "standard" | "rich" | "elaborate";
}

interface ChapterOutline {
  id: string;
  number: number;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedWords: number;
}

interface Chapter extends ChapterOutline {
  content: string;
  blocks?: Block[];
  exercises?: object[];
  wordCount: number;
  locked: boolean;
  toneScore?: number;
  toneFeedback?: string;
}

interface EbookProject {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  language: string;
  cefrLevel: string;
  tone: ToneConfig;
  chapters: Chapter[];
  status: "draft" | "review" | "published";
  createdAt?: number;
  updatedAt?: number;
  coverColor?: string;
  priceUsd?: number;
}

// ─────────────────────────── constants ───────────────────────────

const LANGUAGES = ["Inglês", "Português", "Espanhol", "Francês", "Alemão", "Italiano", "Japonês", "Mandarim", "Árabe"];
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const COVER_COLORS = [
  "from-indigo-600 to-purple-700",
  "from-emerald-600 to-teal-700",
  "from-orange-600 to-red-700",
  "from-blue-600 to-cyan-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-yellow-600",
];

const DEFAULT_TONE: ToneConfig = {
  formality: "neutral",
  style: "instructional",
  audience: "adults",
  richness: "standard",
};

const FORMALITY_LABELS = {
  informal: "Informal",
  neutral: "Neutro",
  formal: "Formal",
  academic: "Académico",
};

const STYLE_LABELS = {
  conversational: "Conversacional",
  narrative: "Narrativo",
  instructional: "Instrucional",
  analytical: "Analítico",
};

const AUDIENCE_LABELS = {
  children: "Crianças",
  teens: "Adolescentes",
  adults: "Adultos",
  professionals: "Profissionais",
};

const RICHNESS_LABELS = {
  simple: "Simples",
  standard: "Padrão",
  rich: "Rico",
  elaborate: "Elaborado",
};

// ─────────────────────────── api helpers ───────────────────────────

async function apiFetch(path: string, body: object) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro na API");
  }
  return res.json();
}

async function apiDelete(ebookId: string) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/${ebookId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Falha ao eliminar");
}

async function apiList() {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/ebook/list", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Falha ao listar");
  return res.json();
}

// ─────────────────────────── utils ───────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(wordCount: number): string {
  const mins = Math.ceil(wordCount / 200);
  return mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
}

function newChapterFromOutline(outline: ChapterOutline): Chapter {
  return { ...outline, content: "", wordCount: 0, locked: false };
}

function generateCoverId() {
  return `ebook-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────── sub-components ───────────────────────────

function Badge({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
    rose: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
    slate: "bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.indigo}`}>
      {children}
    </span>
  );
}

function ToneSlider({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
}) {
  const keys = Object.keys(options);
  const idx = keys.indexOf(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold text-indigo-400">{options[value]}</span>
      </div>
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`flex-1 h-2 rounded-full transition-all ${i <= idx ? "bg-indigo-500" : "bg-slate-700"}`}
            title={options[k]}
          />
        ))}
      </div>
    </div>
  );
}

function EbookCard({
  ebook,
  onOpen,
  onDelete,
}: {
  ebook: EbookProject & { id: string };
  onOpen: () => void;
  onDelete: () => void;
}) {
  const totalWords = ebook.chapters.reduce((s, c) => s + (c.wordCount ?? 0), 0);
  const completedChapters = ebook.chapters.filter((c) => c.content.length > 100).length;
  const progress = ebook.chapters.length > 0 ? Math.round((completedChapters / ebook.chapters.length) * 100) : 0;
  const coverColor = ebook.coverColor ?? COVER_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* Cover strip */}
      <div className={`h-24 bg-gradient-to-br ${coverColor} relative flex items-end p-4`}>
        <BookOpen className="absolute top-4 right-4 w-8 h-8 text-white/20" />
        <div>
          <Badge color="slate">{ebook.cefrLevel}</Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white line-clamp-1">{ebook.title}</h3>
          {ebook.subtitle && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ebook.subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe className="w-3 h-3" />
          <span>{ebook.language}</span>
          <span>·</span>
          <span>{ebook.chapters.length} caps.</span>
          <span>·</span>
          <Clock className="w-3 h-3" />
          <span>{estimateReadingTime(totalWords)}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{completedChapters}/{ebook.chapters.length} capítulos</span>
            <span className="text-indigo-400 font-semibold">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Badge color={ebook.status === "published" ? "emerald" : ebook.status === "review" ? "amber" : "slate"}>
              {ebook.status === "published" ? "Publicado" : ebook.status === "review" ? "Em revisão" : "Rascunho"}
            </Badge>
            {ebook.status === "published" && ebook.priceUsd != null && (
              <span className="text-xs font-semibold text-emerald-400">
                {ebook.priceUsd === 0 ? "Grátis" : `$${ebook.priceUsd.toFixed(2)}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ebook.updatedAt && (
              <span className="text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date(ebook.updatedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────── main component ───────────────────────────

export function EbookCurationPlatform() {
  const { showToast } = useToast();
  const { role } = useUserRole();

  // navigation
  type Screen = "dashboard" | "create" | "editor" | "preview" | "analytics";
  const [screen, setScreen] = useState<Screen>("dashboard");

  // ebooks list
  const [ebooks, setEbooks] = useState<(EbookProject & { id: string })[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  // current project
  const [project, setProject] = useState<EbookProject | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();

  // create wizard
  const [wizardStep, setWizardStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("Inglês");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [numChapters, setNumChapters] = useState(8);
  const [tone, setTone] = useState<ToneConfig>(DEFAULT_TONE);
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [generatingStructure, setGeneratingStructure] = useState(false);
  const [generatingTitles, setGeneratingTitles] = useState(false);

  // editor
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [editorPanel, setEditorPanel] = useState<"edit" | "ai" | "exercises">("edit");
  const [generatingChapter, setGeneratingChapter] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [improvingContent, setImprovingContent] = useState(false);
  const [analyzingTone, setAnalyzingTone] = useState(false);
  const [generatingExercises, setGeneratingExercises] = useState(false);

  // ─── load ebooks ───
  const loadEbooks = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiList();
      setEbooks((data.ebooks ?? []).filter((e: any) => !e.deleted));
      setListLoaded(true);
    } catch {
      showToast("Erro ao carregar e-books", "error");
    } finally {
      setLoadingList(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    if (!listLoaded) loadEbooks();
  }, [listLoaded, loadEbooks]);

  // ─── wizard helpers ───
  const fetchTitleSuggestions = async () => {
    if (!topic) return;
    setGeneratingTitles(true);
    try {
      const data = await apiFetch("title-suggestions", {
        topic,
        language,
        audience: tone.audience,
      });
      setTitleSuggestions(data.titles ?? []);
    } catch {
      showToast("Não foi possível gerar sugestões de títulos", "error");
    } finally {
      setGeneratingTitles(false);
    }
  };

  const handleGenerateStructure = async () => {
    if (!topic.trim()) {
      showToast("Descreva o tópico do e-book", "error");
      return;
    }
    setGeneratingStructure(true);
    try {
      const data = await apiFetch("generate-structure", {
        topic,
        language,
        cefrLevel,
        tone,
        numChapters,
      });
      const structure = data.structure;
      const newProject: EbookProject = {
        title: structure.title,
        subtitle: structure.subtitle,
        description: structure.description,
        language,
        cefrLevel,
        tone,
        coverColor,
        chapters: (structure.chapters as ChapterOutline[]).map(newChapterFromOutline),
        status: "draft",
      };
      setProject(newProject);
      setProjectId(undefined);
      setSelectedChapterIdx(0);
      setScreen("editor");
      showToast("Estrutura gerada com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message ?? "Erro ao gerar estrutura", "error");
    } finally {
      setGeneratingStructure(false);
    }
  };

  // ─── editor helpers ───
  const currentChapter = project?.chapters[selectedChapterIdx];

  const updateChapterContent = (content: string) => {
    if (!project) return;
    const updated = project.chapters.map((ch, i) =>
      i === selectedChapterIdx
        ? { ...ch, content, wordCount: countWords(content) }
        : ch
    );
    setProject({ ...project, chapters: updated });
  };

  const updateChapterBlocks = (blocks: Block[]) => {
    if (!project) return;
    const content = blocksToMarkdown(blocks);
    const updated = project.chapters.map((ch, i) =>
      i === selectedChapterIdx
        ? { ...ch, blocks, content, wordCount: countWords(content) }
        : ch
    );
    setProject({ ...project, chapters: updated });
  };

  const handleAdaptBlock = async (blockId: string, text: string, targetLevel: string): Promise<string> => {
    const data = await apiFetch("adapt-level", {
      text,
      targetLevel,
      language: project?.language ?? "pt",
    });
    return data.adapted ?? text;
  };

  const handleExportEpub = async () => {
    if (!project || !projectId) {
      showToast("Guarde o e-book antes de exportar ePub", "error");
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ebook/export/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ebookId: projectId, authorName: auth.currentUser?.displayName }),
      });
      if (!res.ok) throw new Error("Falha ao gerar ePub");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("ePub exportado com sucesso!", "success");
    } catch {
      showToast("Erro ao exportar ePub", "error");
    }
  };

  const handleGenerateChapterContent = async () => {
    if (!project || !currentChapter) return;
    setGeneratingChapter(true);
    try {
      const previousContext = project.chapters
        .slice(0, selectedChapterIdx)
        .map((c) => `Capítulo ${c.number}: ${c.title}\n${c.content.slice(0, 300)}`)
        .join("\n\n");

      const data = await apiFetch("generate-chapter", {
        ebookTitle: project.title,
        chapter: currentChapter,
        language: project.language,
        tone: project.tone,
        previousContext,
      });
      updateChapterContent(data.content ?? "");
      showToast("Conteúdo gerado!", "success");
    } catch (err: any) {
      showToast(err.message ?? "Erro ao gerar capítulo", "error");
    } finally {
      setGeneratingChapter(false);
    }
  };

  const handleImproveContent = async () => {
    if (!project || !currentChapter || !aiInstruction.trim()) return;
    setImprovingContent(true);
    try {
      const data = await apiFetch("improve-content", {
        content: currentChapter.content,
        instruction: aiInstruction,
        tone: project.tone,
        language: project.language,
      });
      updateChapterContent(data.content ?? currentChapter.content);
      setAiInstruction("");
      showToast("Conteúdo melhorado!", "success");
    } catch (err: any) {
      showToast(err.message ?? "Erro ao melhorar conteúdo", "error");
    } finally {
      setImprovingContent(false);
    }
  };

  const handleAnalyzeTone = async () => {
    if (!project || !currentChapter || !currentChapter.content) return;
    setAnalyzingTone(true);
    try {
      const data = await apiFetch("analyze-tone", {
        content: currentChapter.content,
        targetTone: project.tone,
      });
      const updated = project.chapters.map((ch, i) =>
        i === selectedChapterIdx
          ? { ...ch, toneScore: data.analysis.score, toneFeedback: data.analysis.feedback }
          : ch
      );
      setProject({ ...project, chapters: updated });
      showToast(`Análise de tom: ${data.analysis.score}/100`, "success");
    } catch {
      showToast("Erro ao analisar tom", "error");
    } finally {
      setAnalyzingTone(false);
    }
  };

  const handleGenerateExercises = async () => {
    if (!project || !currentChapter || !currentChapter.content) return;
    setGeneratingExercises(true);
    try {
      const data = await apiFetch("generate-exercises", {
        chapterContent: currentChapter.content,
        cefrLevel: project.cefrLevel,
        language: project.language,
        count: 5,
      });
      const updated = project.chapters.map((ch, i) =>
        i === selectedChapterIdx ? { ...ch, exercises: data.exercises ?? [] } : ch
      );
      setProject({ ...project, chapters: updated });
      showToast(`${data.exercises?.length ?? 0} exercícios gerados!`, "success");
    } catch {
      showToast("Erro ao gerar exercícios", "error");
    } finally {
      setGeneratingExercises(false);
    }
  };

  const handleSaveProject = async () => {
    if (!project) return;
    setSavingProject(true);
    try {
      const data = await apiFetch("save", {
        id: projectId,
        ...project,
      } as any);
      if (!projectId && data.id) setProjectId(data.id);
      showToast("E-book guardado!", "success");
      setListLoaded(false);
    } catch {
      showToast("Erro ao guardar e-book", "error");
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteEbook = async (id: string) => {
    if (!confirm("Tem a certeza que quer eliminar este e-book?")) return;
    try {
      await apiDelete(id);
      setEbooks((prev) => prev.filter((e) => e.id !== id));
      showToast("E-book eliminado", "success");
    } catch {
      showToast("Erro ao eliminar e-book", "error");
    }
  };

  const handleExportPDF = () => {
    if (!project) return;
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Cover page
      doc.setFillColor(67, 56, 202);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(project.title, contentWidth);
      doc.text(titleLines, pageWidth / 2, 80, { align: "center" });
      if (project.subtitle) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(200, 200, 255);
        const subtitleLines = doc.splitTextToSize(project.subtitle, contentWidth);
        doc.text(subtitleLines, pageWidth / 2, 100, { align: "center" });
      }
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 255);
      doc.text(`${project.language}  ·  CEFR ${project.cefrLevel}`, pageWidth / 2, 130, { align: "center" });

      // Chapters
      project.chapters.forEach((ch) => {
        if (!ch.content) return;
        doc.addPage();
        doc.setFillColor(248, 248, 255);
        doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

        doc.setTextColor(67, 56, 202);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`Capítulo ${ch.number}`, margin, 20);

        doc.setTextColor(30, 30, 60);
        doc.setFontSize(18);
        const chTitleLines = doc.splitTextToSize(ch.title, contentWidth);
        doc.text(chTitleLines, margin, 30);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 100);
        const plainText = ch.content.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "");
        const bodyLines = doc.splitTextToSize(plainText, contentWidth);
        let y = 48;
        const pageH = doc.internal.pageSize.getHeight() - margin;
        bodyLines.forEach((line: string) => {
          if (y > pageH) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 5;
        });
      });

      doc.save(`${project.title.replace(/\s+/g, "_")}.pdf`);
      showToast("PDF exportado com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao exportar PDF", "error");
    }
  };

  // ─── render screens ───

  if (screen === "analytics") {
    return <AnalyticsScreen onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "dashboard") {
    return <DashboardScreen
      ebooks={ebooks}
      loading={loadingList}
      onNew={() => { setWizardStep(0); setTopic(""); setTitleSuggestions([]); setScreen("create"); }}
      onOpen={(eb) => {
        setProject(eb);
        setProjectId(eb.id);
        setSelectedChapterIdx(0);
        setScreen("editor");
      }}
      onDelete={handleDeleteEbook}
      onRefresh={loadEbooks}
      onAnalytics={() => setScreen("analytics")}
    />;
  }

  if (screen === "create") {
    return <CreateWizard
      step={wizardStep}
      topic={topic}
      language={language}
      cefrLevel={cefrLevel}
      numChapters={numChapters}
      tone={tone}
      coverColor={coverColor}
      titleSuggestions={titleSuggestions}
      generatingStructure={generatingStructure}
      generatingTitles={generatingTitles}
      onTopicChange={setTopic}
      onLanguageChange={setLanguage}
      onCefrChange={setCefrLevel}
      onNumChaptersChange={setNumChapters}
      onToneChange={(key, val) => setTone((t) => ({ ...t, [key]: val }))}
      onCoverColorChange={setCoverColor}
      onBack={() => setScreen("dashboard")}
      onNext={() => setWizardStep((s) => s + 1)}
      onPrev={() => setWizardStep((s) => s - 1)}
      onFetchTitles={fetchTitleSuggestions}
      onGenerate={handleGenerateStructure}
    />;
  }

  if (screen === "preview") {
    return <PreviewScreen
      project={project!}
      onBack={() => setScreen("editor")}
      onExportPDF={handleExportPDF}
      onExportEpub={handleExportEpub}
    />;
  }

  // ─── editor screen ───
  if (!project) return null;

  const totalWords = project.chapters.reduce((s, c) => s + (c.wordCount ?? 0), 0);
  const completedChapters = project.chapters.filter((c) => c.content.length > 100).length;

  return (
    <div className="flex h-full bg-slate-900 text-white overflow-hidden">

      {/* ── Left: chapter list ── */}
      <div className="w-64 border-r border-slate-700/50 flex flex-col bg-slate-900/80 flex-shrink-0">
        {/* header */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
          <div className={`h-16 rounded-xl bg-gradient-to-br ${project.coverColor ?? COVER_COLORS[0]} flex items-center justify-center mb-3 relative overflow-hidden`}>
            <BookOpen className="w-7 h-7 text-white/70" />
            <Badge color="slate" >{project.cefrLevel}</Badge>
          </div>
          <h2 className="text-sm font-bold text-white line-clamp-2">{project.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{project.language}</p>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{completedChapters}/{project.chapters.length} caps.</span>
              <span>{totalWords.toLocaleString()} palavras</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${project.chapters.length > 0 ? Math.round((completedChapters / project.chapters.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* chapter list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.chapters.map((ch, i) => {
            const hasContent = ch.content.length > 100;
            const isSelected = i === selectedChapterIdx;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterIdx(i)}
                className={`w-full text-left p-2.5 rounded-xl transition-all group ${isSelected
                  ? "bg-indigo-600/30 border border-indigo-500/50"
                  : "hover:bg-slate-800/60 border border-transparent"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${hasContent ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    {hasContent ? <Check className="w-3 h-3" /> : ch.number}
                  </span>
                  <span className={`text-xs line-clamp-2 ${isSelected ? "text-white font-medium" : "text-slate-300"}`}>
                    {ch.title}
                  </span>
                </div>
                {hasContent && (
                  <p className="text-xs text-slate-500 mt-1 ml-7">{ch.wordCount.toLocaleString()} palavras</p>
                )}
              </button>
            );
          })}
        </div>

        {/* actions */}
        <div className="p-3 border-t border-slate-700/50 space-y-2">
          <button
            onClick={handleSaveProject}
            disabled={savingProject}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {savingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingProject ? "A guardar..." : "Guardar"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setScreen("preview")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
          <button
            onClick={handleExportEpub}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700/50 hover:bg-emerald-600/50 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Exportar ePub
          </button>
        </div>
      </div>

      {/* ── Center: editor ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-900/60">
          {(["edit", "ai", "exercises"] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setEditorPanel(panel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${editorPanel === panel
                ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              {panel === "edit" && <PenTool className="w-3.5 h-3.5" />}
              {panel === "ai" && <Sparkles className="w-3.5 h-3.5" />}
              {panel === "exercises" && <BookMarked className="w-3.5 h-3.5" />}
              {panel === "edit" && "Editar"}
              {panel === "ai" && "Assistente IA"}
              {panel === "exercises" && "Exercícios"}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            {currentChapter && (
              <>
                <span>{currentChapter.wordCount.toLocaleString()} palavras</span>
                <span>·</span>
                <span>{estimateReadingTime(currentChapter.wordCount)}</span>
                {currentChapter.toneScore !== undefined && (
                  <>
                    <span>·</span>
                    <span className={`font-semibold ${currentChapter.toneScore >= 80 ? "text-emerald-400" : currentChapter.toneScore >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                      Tom: {currentChapter.toneScore}/100
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* chapter header */}
        {currentChapter && (
          <div className="px-6 py-4 border-b border-slate-700/30 bg-slate-800/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Capítulo {currentChapter.number}
              </span>
              {currentChapter.toneScore !== undefined && (
                <Badge color={currentChapter.toneScore >= 80 ? "emerald" : currentChapter.toneScore >= 60 ? "amber" : "rose"}>
                  Tom {currentChapter.toneScore}/100
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{currentChapter.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{currentChapter.summary}</p>
            {currentChapter.keyPoints.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentChapter.keyPoints.map((kp, i) => (
                  <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                    {kp}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* main editor area */}
        <div className="flex-1 overflow-y-auto p-6">
          {editorPanel === "edit" && currentChapter && (
            <div className="space-y-4">
              {!currentChapter.content && (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-600/50">
                  <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium mb-1">Capítulo sem conteúdo</p>
                  <p className="text-slate-500 text-sm mb-4">Gere o conteúdo com IA ou escreva manualmente</p>
                  <button
                    onClick={handleGenerateChapterContent}
                    disabled={generatingChapter}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {generatingChapter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {generatingChapter ? "A gerar..." : "Gerar com IA"}
                  </button>
                </div>
              )}

              {currentChapter.content && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Use os blocos abaixo ou o Assistente IA</span>
                    <button
                      onClick={handleGenerateChapterContent}
                      disabled={generatingChapter}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                    >
                      {generatingChapter ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Regenerar
                    </button>
                  </div>
                  <BlockEditor
                    blocks={currentChapter.blocks ?? markdownToBlocks(currentChapter.content)}
                    onChange={updateChapterBlocks}
                    onAdaptBlock={handleAdaptBlock}
                    language={project.language}
                  />
                </>
              )}
            </div>
          )}

          {editorPanel === "ai" && currentChapter && (
            <AIAssistantPanel
              chapter={currentChapter}
              project={project}
              aiInstruction={aiInstruction}
              improvingContent={improvingContent}
              analyzingTone={analyzingTone}
              onAiInstructionChange={setAiInstruction}
              onImprove={handleImproveContent}
              onAnalyzeTone={handleAnalyzeTone}
              onGenerateContent={handleGenerateChapterContent}
              generatingChapter={generatingChapter}
            />
          )}

          {editorPanel === "exercises" && currentChapter && (
            <ExercisesPanel
              chapter={currentChapter}
              generatingExercises={generatingExercises}
              onGenerate={handleGenerateExercises}
            />
          )}
        </div>
      </div>

      {/* ── Right: tone panel ── */}
      <ToneControlPanel
        tone={project.tone}
        onChange={(key, val) => setProject({ ...project, tone: { ...project.tone, [key]: val } })}
        cefrLevel={project.cefrLevel}
        onCefrChange={(v) => setProject({ ...project, cefrLevel: v })}
        projectStatus={project.status}
        onStatusChange={(v) => setProject({ ...project, status: v as EbookProject["status"] })}
        priceUsd={project.priceUsd}
        onPriceChange={(v) => setProject({ ...project, priceUsd: v })}
      />
    </div>
  );
}

// ─────────────────────────── DashboardScreen ───────────────────────────

function DashboardScreen({
  ebooks, loading, onNew, onOpen, onDelete, onRefresh, onAnalytics,
}: {
  ebooks: (EbookProject & { id: string })[];
  loading: boolean;
  onNew: () => void;
  onOpen: (eb: EbookProject & { id: string }) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onAnalytics: () => void;
}) {
  const totalWords = ebooks.reduce((s, e) => s + e.chapters.reduce((c, ch) => c + (ch.wordCount ?? 0), 0), 0);
  const totalChapters = ebooks.reduce((s, e) => s + e.chapters.length, 0);

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </span>
              Plataforma de E-books
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Curadoria assistida por IA para criar e-books de nível profissional
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAnalytics}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Analytics
            </button>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Novo E-book
            </button>
          </div>
        </div>

        {/* stats */}
        {ebooks.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "E-books", value: ebooks.length, icon: BookOpen, color: "indigo" },
              { label: "Capítulos", value: totalChapters, icon: Layers, color: "purple" },
              { label: "Palavras", value: totalWords.toLocaleString(), icon: FileText, color: "emerald" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 text-${s.color}-400`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ebooks grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400">A carregar e-books...</p>
        </div>
      ) : ebooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">Nenhum e-book ainda</p>
            <p className="text-slate-400 text-sm mt-1">Crie o seu primeiro e-book profissional com IA</p>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Criar E-book com IA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ebooks.map((eb) => (
            <React.Fragment key={eb.id}>
              <EbookCard
                ebook={eb}
                onOpen={() => onOpen(eb)}
                onDelete={() => onDelete(eb.id)}
              />
            </React.Fragment>
          ))}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={onNew}
            className="border-2 border-dashed border-slate-600/50 rounded-2xl flex flex-col items-center justify-center p-8 gap-3 cursor-pointer hover:border-indigo-500/50 transition-all min-h-[200px]"
          >
            <Plus className="w-8 h-8 text-slate-500" />
            <span className="text-sm text-slate-500 font-medium">Novo E-book</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── CreateWizard ───────────────────────────

function CreateWizard({
  step, topic, language, cefrLevel, numChapters, tone, coverColor,
  titleSuggestions, generatingStructure, generatingTitles,
  onTopicChange, onLanguageChange, onCefrChange, onNumChaptersChange,
  onToneChange, onCoverColorChange, onBack, onNext, onPrev, onFetchTitles, onGenerate,
}: {
  step: number;
  topic: string;
  language: string;
  cefrLevel: string;
  numChapters: number;
  tone: ToneConfig;
  coverColor: string;
  titleSuggestions: string[];
  generatingStructure: boolean;
  generatingTitles: boolean;
  onTopicChange: (v: string) => void;
  onLanguageChange: (v: string) => void;
  onCefrChange: (v: string) => void;
  onNumChaptersChange: (v: number) => void;
  onToneChange: (key: keyof ToneConfig, val: string) => void;
  onCoverColorChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFetchTitles: () => void;
  onGenerate: () => void;
}) {
  const steps = ["Tópico & Idioma", "Tom Editorial", "Estilo Visual", "Confirmar"];

  return (
    <div className="h-full bg-slate-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </button>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${i <= step ? "text-indigo-400" : "text-slate-600"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-indigo-500 text-white" : i === step ? "bg-indigo-600/40 ring-2 ring-indigo-500 text-indigo-300" : "bg-slate-800 text-slate-500"}`}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? "bg-indigo-500" : "bg-slate-700"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Tópico & Idioma</h2>
                <p className="text-slate-400 text-sm">Descreva o tema do e-book e configure o idioma</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tópico do E-book</label>
                <textarea
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  rows={4}
                  placeholder="Ex: Gramática avançada do inglês empresarial para executivos portugueses, com foco em apresentações, negociações e correspondência profissional..."
                  className="w-full bg-slate-800 border border-slate-600/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Seja específico — quanto mais detalhe, melhor a estrutura gerada pela IA</p>
              </div>

              {/* Title suggestions */}
              {topic.length > 20 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sugestões de Título</label>
                    <button
                      onClick={onFetchTitles}
                      disabled={generatingTitles}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-60"
                    >
                      {generatingTitles ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {generatingTitles ? "A gerar..." : "Gerar sugestões"}
                    </button>
                  </div>
                  {titleSuggestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {titleSuggestions.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => onTopicChange(topic)}
                          className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-lg p-2.5 text-slate-300 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Idioma do Conteúdo</label>
                  <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600/50 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nível CEFR</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CEFR_LEVELS.map((l) => (
                      <button
                        key={l}
                        onClick={() => onCefrChange(l)}
                        className={`py-2 rounded-lg text-sm font-bold transition-colors ${cefrLevel === l ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Número de Capítulos: <span className="text-indigo-400">{numChapters}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={numChapters}
                  onChange={(e) => onNumChaptersChange(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>2 (Mini)</span>
                  <span>10 (Padrão)</span>
                  <span>20 (Abrangente)</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Tom Editorial</h2>
                <p className="text-slate-400 text-sm">Define o estilo e personalidade do seu e-book</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-6">
                <ToneSlider label="Formalidade" value={tone.formality} options={FORMALITY_LABELS} onChange={(v) => onToneChange("formality", v)} />
                <ToneSlider label="Estilo Narrativo" value={tone.style} options={STYLE_LABELS} onChange={(v) => onToneChange("style", v)} />
                <ToneSlider label="Público-Alvo" value={tone.audience} options={AUDIENCE_LABELS} onChange={(v) => onToneChange("audience", v)} />
                <ToneSlider label="Riqueza Linguística" value={tone.richness} options={RICHNESS_LABELS} onChange={(v) => onToneChange("richness", v)} />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                <p className="text-xs text-indigo-300 font-medium mb-1">Pré-visualização do tom selecionado:</p>
                <p className="text-sm text-slate-300 italic">
                  {tone.formality === "informal" && "Hey, vamos lá explorar..."}
                  {tone.formality === "neutral" && "Neste capítulo, vamos explorar..."}
                  {tone.formality === "formal" && "O presente capítulo dedica-se à análise de..."}
                  {tone.formality === "academic" && "A presente investigação tem por objetivo examinar de forma rigorosa..."}
                  {" "}
                  {tone.style === "conversational" && "O que acha, faz sentido?"}
                  {tone.style === "narrative" && "Imagine a seguinte situação..."}
                  {tone.style === "instructional" && "Siga os seguintes passos:"}
                  {tone.style === "analytical" && "Analisando os dados disponíveis, conclui-se que..."}
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Estilo Visual</h2>
                <p className="text-slate-400 text-sm">Escolha a cor de capa do e-book</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {COVER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onCoverColorChange(c)}
                    className={`h-24 rounded-2xl bg-gradient-to-br ${c} transition-all relative ${coverColor === c ? "ring-2 ring-white scale-105" : "hover:scale-102"}`}
                  >
                    {coverColor === c && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className={`h-40 rounded-2xl bg-gradient-to-br ${coverColor} flex flex-col items-center justify-center gap-2 p-6`}>
                <BookOpen className="w-10 h-10 text-white/60" />
                <p className="text-white font-bold text-center text-lg">Seu E-book</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{language}</span>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{cefrLevel}</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Confirmar e Gerar</h2>
                <p className="text-slate-400 text-sm">Reveja as configurações antes de gerar a estrutura</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Tópico", value: topic, icon: FileText },
                  { label: "Idioma", value: language, icon: Globe },
                  { label: "Nível CEFR", value: cefrLevel, icon: GraduationCap },
                  { label: "Capítulos", value: `${numChapters} capítulos`, icon: Layers },
                  { label: "Formalidade", value: FORMALITY_LABELS[tone.formality], icon: Sliders },
                  { label: "Estilo", value: STYLE_LABELS[tone.style], icon: PenTool },
                  { label: "Público", value: AUDIENCE_LABELS[tone.audience], icon: Users },
                  { label: "Riqueza", value: RICHNESS_LABELS[tone.richness], icon: Star },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3">
                    <item.icon className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm text-white font-medium line-clamp-2">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">A geração pode demorar 30-60 segundos</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    A IA irá criar a estrutura completa com {numChapters} capítulos personalizados para o seu tópico.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={step === 0 ? onBack : onPrev}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancelar" : "Anterior"}
          </button>

          {step < 3 ? (
            <button
              onClick={onNext}
              disabled={step === 0 && !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Seguinte
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onGenerate}
              disabled={generatingStructure}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30"
            >
              {generatingStructure ? (
                <><Loader2 className="w-4 h-4 animate-spin" />A gerar estrutura...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Gerar E-book</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── ToneControlPanel ───────────────────────────

function ToneControlPanel({
  tone, onChange, cefrLevel, onCefrChange, projectStatus, onStatusChange, priceUsd, onPriceChange,
}: {
  tone: ToneConfig;
  onChange: (key: keyof ToneConfig, val: string) => void;
  cefrLevel: string;
  onCefrChange: (v: string) => void;
  projectStatus: string;
  onStatusChange: (v: string) => void;
  priceUsd?: number;
  onPriceChange?: (v: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`${collapsed ? "w-12" : "w-72"} border-l border-slate-700/50 flex flex-col bg-slate-900/80 transition-all flex-shrink-0`}>
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        {!collapsed && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Controlos Editoriais</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Tom */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Tom & Estilo
            </p>
            <div className="space-y-4">
              <ToneSlider label="Formalidade" value={tone.formality} options={FORMALITY_LABELS} onChange={(v) => onChange("formality", v)} />
              <ToneSlider label="Estilo" value={tone.style} options={STYLE_LABELS} onChange={(v) => onChange("style", v)} />
              <ToneSlider label="Público" value={tone.audience} options={AUDIENCE_LABELS} onChange={(v) => onChange("audience", v)} />
              <ToneSlider label="Riqueza" value={tone.richness} options={RICHNESS_LABELS} onChange={(v) => onChange("richness", v)} />
            </div>
          </div>

          {/* CEFR */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Nível CEFR
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {CEFR_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => onCefrChange(l)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${cefrLevel === l ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Estado Editorial
            </p>
            <div className="space-y-1.5">
              {[
                { value: "draft", label: "Rascunho", color: "slate" },
                { value: "review", label: "Em Revisão", color: "amber" },
                { value: "published", label: "Publicado", color: "emerald" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStatusChange(s.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${projectStatus === s.value
                    ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50"
                    : "text-slate-400 hover:bg-slate-800"}`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.color === "emerald" ? "bg-emerald-400" : s.color === "amber" ? "bg-amber-400" : "bg-slate-500"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          {onPriceChange && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Preço de Venda (USD)
              </p>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-600/50 rounded-xl px-3 py-2">
                <span className="text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.99"
                  value={priceUsd ?? ""}
                  onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                  placeholder="9.99"
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Defina 0 para disponibilizar gratuitamente</p>
            </div>
          )}

          {/* quick tips */}
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3">
            <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              Dicas
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li>• Altere o tom a qualquer momento — a IA aplica automaticamente na geração</li>
              <li>• Use "Analisar Tom" no painel IA para verificar consistência</li>
              <li>• Nível CEFR adapta vocabulário e complexidade</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── AIAssistantPanel ───────────────────────────

function AIAssistantPanel({
  chapter, project, aiInstruction, improvingContent, analyzingTone,
  onAiInstructionChange, onImprove, onAnalyzeTone, onGenerateContent, generatingChapter,
}: {
  chapter: Chapter;
  project: EbookProject;
  aiInstruction: string;
  improvingContent: boolean;
  analyzingTone: boolean;
  onAiInstructionChange: (v: string) => void;
  onImprove: () => void;
  onAnalyzeTone: () => void;
  onGenerateContent: () => void;
  generatingChapter: boolean;
}) {
  const quickActions = [
    "Simplifique o vocabulário para tornar mais acessível",
    "Adicione mais exemplos práticos e ilustrativos",
    "Melhore a fluidez e transições entre parágrafos",
    "Torne o conteúdo mais envolvente e dinâmico",
    "Reescreva de forma mais formal e académica",
    "Adicione uma secção de dicas práticas no final",
    "Expanda os conceitos principais com mais detalhe",
    "Comprima e torne o conteúdo mais conciso",
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Generate */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white text-sm">Gerar Conteúdo</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          {chapter.content ? "Regenere o conteúdo do capítulo com base no outline e nas configurações de tom atuais." : "Gere o conteúdo completo deste capítulo com IA."}
        </p>
        <button
          onClick={onGenerateContent}
          disabled={generatingChapter}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {generatingChapter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generatingChapter ? "A gerar..." : chapter.content ? "Regenerar Capítulo" : "Gerar Capítulo"}
        </button>
      </div>

      {/* Improve */}
      {chapter.content && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white text-sm">Melhorar Conteúdo</span>
          </div>

          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-2">Ações rápidas:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((qa) => (
                <button
                  key={qa}
                  onClick={() => onAiInstructionChange(qa)}
                  className="text-xs bg-slate-700/60 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 px-2.5 py-1 rounded-full transition-colors border border-slate-600/50 hover:border-indigo-500/50"
                >
                  {qa}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={aiInstruction}
            onChange={(e) => onAiInstructionChange(e.target.value)}
            rows={3}
            placeholder="Descreva como quer melhorar o conteúdo... Ex: 'Adicione mais exemplos com vocabulário de negócios'"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={onImprove}
            disabled={improvingContent || !aiInstruction.trim()}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {improvingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {improvingContent ? "A melhorar..." : "Aplicar Melhoria"}
          </button>
        </div>
      )}

      {/* Tone Analysis */}
      {chapter.content && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white text-sm">Análise de Tom</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Verifique se o tom do conteúdo está consistente com as diretrizes editoriais definidas.
          </p>
          {chapter.toneScore !== undefined && (
            <div className="mb-3 bg-slate-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Consistência de Tom</span>
                <span className={`text-lg font-bold ${chapter.toneScore >= 80 ? "text-emerald-400" : chapter.toneScore >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                  {chapter.toneScore}/100
                </span>
              </div>
              <div className="h-2 bg-slate-600 rounded-full">
                <div
                  className={`h-full rounded-full ${chapter.toneScore >= 80 ? "bg-emerald-500" : chapter.toneScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${chapter.toneScore}%` }}
                />
              </div>
              {chapter.toneFeedback && (
                <p className="text-xs text-slate-300 mt-2">{chapter.toneFeedback}</p>
              )}
            </div>
          )}
          <button
            onClick={onAnalyzeTone}
            disabled={analyzingTone}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700/50 hover:bg-emerald-600/50 border border-emerald-500/30 rounded-xl text-sm font-semibold text-emerald-300 transition-colors disabled:opacity-60"
          >
            {analyzingTone ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {analyzingTone ? "A analisar..." : "Analisar Tom"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── ExercisesPanel ───────────────────────────

function ExercisesPanel({
  chapter, generatingExercises, onGenerate,
}: {
  chapter: Chapter;
  generatingExercises: boolean;
  onGenerate: () => void;
}) {
  const exercises = (chapter.exercises ?? []) as any[];
  const typeLabels: Record<string, string> = {
    "multiple-choice": "Escolha Múltipla",
    "fill-blank": "Preencher Espaços",
    "true-false": "Verdadeiro/Falso",
    "translation": "Tradução",
    "open-question": "Resposta Aberta",
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Exercícios do Capítulo</h3>
          <p className="text-xs text-slate-400">
            {exercises.length === 0 ? "Nenhum exercício gerado" : `${exercises.length} exercícios`}
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generatingExercises || !chapter.content}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
        >
          {generatingExercises ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generatingExercises ? "A gerar..." : "Gerar Exercícios"}
        </button>
      </div>

      {!chapter.content && (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-600/50">
          <BookMarked className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Gere o conteúdo do capítulo antes de criar exercícios</p>
        </div>
      )}

      {exercises.map((ex, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-indigo-600/30 text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
            <Badge color={ex.difficulty === "hard" ? "rose" : ex.difficulty === "medium" ? "amber" : "emerald"}>
              {ex.difficulty === "hard" ? "Difícil" : ex.difficulty === "medium" ? "Médio" : "Fácil"}
            </Badge>
            <Badge color="slate">{typeLabels[ex.type] ?? ex.type}</Badge>
          </div>
          <p className="text-sm text-white font-medium mb-3">{ex.question}</p>
          {ex.options && ex.options.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {ex.options.map((opt: string, j: number) => (
                <div key={j} className={`text-xs px-3 py-2 rounded-lg ${opt === ex.answer ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-slate-700/50 text-slate-300"}`}>
                  {String.fromCharCode(65 + j)}. {opt}
                </div>
              ))}
            </div>
          )}
          {ex.explanation && (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Explicação:</p>
              <p className="text-xs text-slate-300">{ex.explanation}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────── AnalyticsScreen ───────────────────────────

interface AuthorStats {
  totalSales: number;
  totalRevenueUsd: number;
  uniqueBuyers: number;
  byEbook: {
    ebookId: string;
    title: string;
    totalSales: number;
    totalRevenueUsd: number;
    uniqueBuyers: number;
    firstSaleAt?: string;
    lastSaleAt?: string;
  }[];
  recentSales: {
    ebookTitle: string;
    buyerEmail: string;
    amountUsd: number;
    paidAt: string;
  }[];
}

function AnalyticsScreen({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/ebook/sales/stats", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Falha ao carregar estatísticas");
        const json = await res.json();
        setStats(json.stats ?? json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-6">
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </span>
          Analytics de Vendas
        </h1>
        <p className="text-slate-400 text-sm mt-1">Receita, vendas e alcance dos seus e-books</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-400">A carregar analytics...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <div className="space-y-6">
          {/* KPI tiles */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Receita Total", value: `$${(stats.totalRevenueUsd ?? 0).toFixed(2)}`, icon: TrendingUp, color: "emerald" },
              { label: "Total de Vendas", value: stats.totalSales ?? 0, icon: CheckCircle, color: "indigo" },
              { label: "Compradores Únicos", value: stats.uniqueBuyers ?? 0, icon: Users, color: "purple" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${s.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-6 h-6 text-${s.color}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-ebook table */}
          {stats.byEbook && stats.byEbook.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Desempenho por E-book
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {["Título", "Vendas", "Receita (USD)", "Compradores", "Último venda"].map(col => (
                        <th key={col} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byEbook.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-3 font-medium text-white">{row.title}</td>
                        <td className="px-5 py-3 text-slate-300">{row.totalSales}</td>
                        <td className="px-5 py-3 text-emerald-400 font-semibold">${(row.totalRevenueUsd ?? 0).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-300">{row.uniqueBuyers}</td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{row.lastSaleAt ? new Date(row.lastSaleAt).toLocaleDateString("pt-PT") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent sales */}
          {stats.recentSales && stats.recentSales.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Vendas Recentes
                </h2>
              </div>
              <div className="divide-y divide-slate-700/30">
                {stats.recentSales.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{sale.ebookTitle}</p>
                      <p className="text-xs text-slate-400">{sale.buyerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">${(sale.amountUsd ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{sale.paidAt ? new Date(sale.paidAt).toLocaleDateString("pt-PT") : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalSales === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">Ainda não há vendas registadas. Publique um e-book e partilhe com os seus alunos!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── PreviewScreen ───────────────────────────

function PreviewScreen({
  project, onBack, onExportPDF, onExportEpub,
}: {
  project: EbookProject;
  onBack: () => void;
  onExportPDF: () => void;
  onExportEpub: () => void;
}) {
  const [activeChapter, setActiveChapter] = useState(0);
  const totalWords = project.chapters.reduce((s, c) => s + (c.wordCount ?? 0), 0);

  function renderMarkdown(text: string) {
    return text
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-3">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-800 mt-5 mb-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-700 mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1"><span class="font-bold">$1.</span> $2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3 text-slate-700 leading-relaxed">')
      .replace(/^(?!<[hli])/, '<p class="mb-3 text-slate-700 leading-relaxed">')
      .replace(/$/, '</p>');
  }

  return (
    <div className="h-full flex bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r border-slate-700/50 flex flex-col bg-slate-900/80 flex-shrink-0">
        <div className="p-4 border-b border-slate-700/50">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Editor
          </button>
          <div className={`h-12 rounded-xl bg-gradient-to-br ${project.coverColor ?? COVER_COLORS[0]} flex items-center justify-center mb-2`}>
            <BookOpen className="w-5 h-5 text-white/70" />
          </div>
          <p className="text-xs font-bold text-white line-clamp-2">{project.title}</p>
          <div className="flex gap-1.5 mt-2">
            <Badge color="slate">{project.cefrLevel}</Badge>
            <Badge color="slate">{estimateReadingTime(totalWords)}</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => setActiveChapter(i)}
              className={`w-full text-left p-2 rounded-lg text-xs transition-all ${activeChapter === i ? "bg-indigo-600/30 text-indigo-300" : "text-slate-400 hover:bg-slate-800"}`}
            >
              <span className="font-bold">{ch.number}.</span> {ch.title}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700/50 space-y-2">
          <button
            onClick={onExportPDF}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </button>
          <button
            onClick={onExportEpub}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-700/50 hover:bg-emerald-600/50 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Exportar ePub
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {project.chapters[activeChapter] && (
          <div className="max-w-2xl mx-auto px-12 py-16">
            <div className="mb-8">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Capítulo {project.chapters[activeChapter].number}
              </span>
              <h1 className="text-3xl font-black text-slate-900 mt-2 leading-tight">
                {project.chapters[activeChapter].title}
              </h1>
              {project.chapters[activeChapter].wordCount > 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  {project.chapters[activeChapter].wordCount.toLocaleString()} palavras · {estimateReadingTime(project.chapters[activeChapter].wordCount)}
                </p>
              )}
            </div>

            {project.chapters[activeChapter].content ? (
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(project.chapters[activeChapter].content)
                }}
              />
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Este capítulo ainda não tem conteúdo.</p>
              </div>
            )}

            {/* Exercises in preview */}
            {(project.chapters[activeChapter].exercises ?? []).length > 0 && (
              <div className="mt-12 border-t-2 border-slate-100 pt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Exercícios</h2>
                {(project.chapters[activeChapter].exercises as any[]).map((ex: any, i: number) => (
                  <div key={i} className="mb-6 bg-slate-50 rounded-xl p-5">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Exercício {i + 1}</span>
                    <p className="text-sm font-semibold text-slate-900 mt-2 mb-3">{ex.question}</p>
                    {ex.options?.map((opt: string, j: number) => (
                      <div key={j} className="text-sm text-slate-600 mb-1.5">
                        <span className="font-bold">{String.fromCharCode(65 + j)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-16 pt-8 border-t border-slate-100">
              <button
                onClick={() => setActiveChapter((c) => Math.max(0, c - 1))}
                disabled={activeChapter === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Capítulo anterior
              </button>
              <button
                onClick={() => setActiveChapter((c) => Math.min(project.chapters.length - 1, c + 1))}
                disabled={activeChapter === project.chapters.length - 1}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 disabled:opacity-40 transition-colors"
              >
                Próximo capítulo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
