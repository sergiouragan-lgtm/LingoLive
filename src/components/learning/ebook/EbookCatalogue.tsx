import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  CheckCircle,
  Plus,
  BookMarked,
  Globe,
  BarChart3,
  RefreshCw,
  X,
  Star,
  Filter,
} from "lucide-react";
import { auth } from "../../../firebase";
import EbookReviews from "./EbookReviews";

interface PublishedEbook {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  language: string;
  cefrLevel: string;
  coverColor?: string;
  chapters?: { id: string }[];
  priceUsd?: number;
}

interface EnrollmentStatus {
  [ebookId: string]: "enrolled" | "loading" | null;
}

const COVER_GRADIENTS: Record<string, string> = {
  "from-indigo-600 to-purple-700": "from-indigo-600 to-purple-700",
  "from-emerald-600 to-teal-700": "from-emerald-600 to-teal-700",
  "from-orange-600 to-red-700": "from-orange-600 to-red-700",
  "from-blue-600 to-cyan-700": "from-blue-600 to-cyan-700",
  "from-rose-600 to-pink-700": "from-rose-600 to-pink-700",
  "from-amber-600 to-yellow-600": "from-amber-600 to-yellow-600",
};

const CEFR_BADGE: Record<string, string> = {
  A1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  B1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

const LEVELS = ["Todos", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface EbookCatalogueProps {
  onOpenReader?: (ebookId: string) => void;
}

export function EbookCatalogue({ onOpenReader }: EbookCatalogueProps) {
  const [ebooks, setEbooks] = useState<PublishedEbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cefrFilter, setCefrFilter] = useState<(typeof LEVELS)[number]>("Todos");
  const [langFilter, setLangFilter] = useState<string>("Todos");
  const [enrollStatus, setEnrollStatus] = useState<EnrollmentStatus>({});
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [selectedEbook, setSelectedEbook] = useState<PublishedEbook | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogueRes, libraryRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; ebooks: PublishedEbook[] }>("/api/ebook/published/catalogue"),
        apiFetch<{ success: boolean; library: { ebookId: string }[] }>("/api/ebook/student/library"),
      ]);

      if (catalogueRes.status === "fulfilled") {
        setEbooks(catalogueRes.value.ebooks ?? []);
      } else {
        setError("Não foi possível carregar o catálogo.");
      }

      if (libraryRes.status === "fulfilled") {
        setLibraryIds(new Set(libraryRes.value.library?.map((e) => e.ebookId) ?? []));
      }
    } catch {
      setError("Erro ao carregar catálogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts: Escape closes drawer, "/" focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEbook(null);
      } else if (e.key === "/" && !selectedEbook) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedEbook]);

  const enroll = useCallback(async (ebookId: string) => {
    setEnrollStatus((prev) => ({ ...prev, [ebookId]: "loading" }));
    try {
      await apiFetch("/api/ebook/student/enroll", {
        method: "POST",
        body: JSON.stringify({ ebookId }),
      });
      setLibraryIds((prev) => new Set([...prev, ebookId]));
      setEnrollStatus((prev) => ({ ...prev, [ebookId]: "enrolled" }));
    } catch {
      setEnrollStatus((prev) => ({ ...prev, [ebookId]: null }));
    }
  }, []);

  const languages = ["Todos", ...Array.from(new Set(ebooks.map((e) => e.language))).sort()];

  const filtered = ebooks.filter((e) => {
    const matchQuery =
      !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.language.toLowerCase().includes(query.toLowerCase());
    const matchLevel = cefrFilter === "Todos" || e.cefrLevel === cefrFilter;
    const matchLang = langFilter === "Todos" || e.language === langFilter;
    return matchQuery && matchLevel && matchLang;
  });

  const hasActiveFilters = query || cefrFilter !== "Todos" || langFilter !== "Todos";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <BookOpen className="w-12 h-12 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-indigo-500" />
            Catálogo E-books
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {hasActiveFilters
              ? `${filtered.length} de ${ebooks.length} e-book${ebooks.length !== 1 ? "s" : ""}`
              : `${ebooks.length} e-book${ebooks.length !== 1 ? "s" : ""} disponíveis`}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => { setQuery(""); setCefrFilter("Todos"); setLangFilter("Todos"); }}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mt-1 shrink-0"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Pesquisar por título… (pressione / para focar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CEFR filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Nível:
          </span>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCefrFilter(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                cefrFilter === lvl
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Language filter (only shown when multiple languages exist) */}
        {languages.length > 2 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
              <Globe className="w-3 h-3" /> Idioma:
            </span>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  langFilter === lang
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {query || cefrFilter !== "Todos"
              ? "Nenhum e-book encontrado com esses filtros."
              : "Ainda não há e-books publicados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((ebook) => {
            const gradient = COVER_GRADIENTS[ebook.coverColor ?? ""] ?? "from-indigo-600 to-purple-700";
            const isInLibrary = libraryIds.has(ebook.id);
            const statusKey = enrollStatus[ebook.id];
            const isEnrolling = statusKey === "loading";
            const chapterCount = ebook.chapters?.length ?? 0;

            return (
              <div
                key={ebook.id}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cover */}
                <div
                  className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
                >
                  <BookOpen className="w-10 h-10 text-white/70" />
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${CEFR_BADGE[ebook.cefrLevel] ?? "bg-slate-200 text-slate-700"}`}>
                    {ebook.cefrLevel}
                  </span>
                  {isInLibrary && (
                    <span className="absolute top-3 left-3 flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Na biblioteca
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                    {ebook.title}
                  </h3>
                  {ebook.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ebook.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto pt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />{ebook.language}
                    </span>
                    {chapterCount > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />{chapterCount} cap.
                      </span>
                    )}
                    {ebook.priceUsd != null && (
                      <span className={`ml-auto font-semibold ${ebook.priceUsd === 0 ? "text-emerald-500" : "text-slate-600 dark:text-slate-300"}`}>
                        {ebook.priceUsd === 0 ? "Grátis" : `$${ebook.priceUsd.toFixed(2)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => setSelectedEbook(ebook)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Detalhes
                  </button>
                  {isInLibrary || statusKey === "enrolled" ? (
                    <button
                      onClick={() => onOpenReader?.(ebook.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ler
                    </button>
                  ) : (
                    <button
                      onClick={() => enroll(ebook.id)}
                      disabled={isEnrolling}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {isEnrolling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Inscrever
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Drawer ───────────────────────────────────────────────── */}
      {selectedEbook && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEbook(null)}
          />
          {/* Panel */}
          <div className="relative w-full sm:max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className={`h-32 bg-gradient-to-br ${COVER_GRADIENTS[selectedEbook.coverColor ?? ""] ?? "from-indigo-600 to-purple-700"} flex items-end shrink-0`}>
              <div className="flex items-end justify-between w-full px-5 pb-4">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${CEFR_BADGE[selectedEbook.cefrLevel] ?? "bg-slate-200 text-slate-700"}`}>
                    {selectedEbook.cefrLevel}
                  </span>
                  <h2 className="text-white font-bold text-lg leading-tight line-clamp-2">{selectedEbook.title}</h2>
                  {selectedEbook.subtitle && (
                    <p className="text-white/70 text-xs mt-0.5">{selectedEbook.subtitle}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEbook(null)}
                  className="ml-4 shrink-0 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta strip */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{selectedEbook.language}</span>
              {(selectedEbook.chapters?.length ?? 0) > 0 && (
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{selectedEbook.chapters!.length} capítulos</span>
              )}
              {selectedEbook.priceUsd != null && (
                <span className={`ml-auto font-semibold ${selectedEbook.priceUsd === 0 ? "text-emerald-500" : "text-slate-700 dark:text-slate-200"}`}>
                  {selectedEbook.priceUsd === 0 ? "Grátis" : `$${selectedEbook.priceUsd.toFixed(2)}`}
                </span>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {selectedEbook.description && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Descrição</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedEbook.description}</p>
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Avaliações</h3>
                <EbookReviews ebookId={selectedEbook.id} />
              </div>
            </div>

            {/* Sticky CTA */}
            <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              {libraryIds.has(selectedEbook.id) || enrollStatus[selectedEbook.id] === "enrolled" ? (
                <button
                  onClick={() => { setSelectedEbook(null); onOpenReader?.(selectedEbook.id); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Ler agora
                </button>
              ) : (
                <button
                  onClick={() => enroll(selectedEbook.id)}
                  disabled={enrollStatus[selectedEbook.id] === "loading"}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-60"
                >
                  {enrollStatus[selectedEbook.id] === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Inscrever-me neste e-book
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
