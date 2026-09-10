import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Search, Globe, GraduationCap, ShoppingCart, Star,
  Clock, Loader2, BookMarked, ArrowLeft, Lock, CheckCircle,
  ChevronRight, Filter, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../../../firebase";
import { useToast } from "../../../context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EbookListing {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  language: string;
  cefrLevel: string;
  coverColor?: string;
  priceUsd: number;
  authorName?: string;
  chapterCount: number;
  totalWords: number;
  createdAt?: number;
  rating?: number;
  reviewCount?: number;
}

interface LibraryItem {
  ebookId: string;
  ebookTitle: string;
  ebookSubtitle?: string;
  ebookLanguage: string;
  ebookCefrLevel: string;
  ebookCoverColor?: string;
  totalChapters: number;
  completionPercent: number;
  enrolledAt: number;
  currentCefrLevel?: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error ?? "Erro na API");
  }
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const COVER_COLORS = [
  "from-indigo-600 to-purple-700",
  "from-emerald-600 to-teal-700",
  "from-orange-600 to-red-700",
  "from-blue-600 to-cyan-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-yellow-600",
];

function cefrColor(level: string): string {
  const map: Record<string, string> = {
    A1: "bg-emerald-500/20 text-emerald-300",
    A2: "bg-teal-500/20 text-teal-300",
    B1: "bg-blue-500/20 text-blue-300",
    B2: "bg-indigo-500/20 text-indigo-300",
    C1: "bg-purple-500/20 text-purple-300",
    C2: "bg-rose-500/20 text-rose-300",
  };
  return map[level] ?? "bg-slate-500/20 text-slate-300";
}

function wordReadingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function MarketplaceCard({
  ebook,
  onPurchase,
  owned,
  onRead,
  purchasing,
}: {
  ebook: EbookListing;
  onPurchase: (ebook: EbookListing) => void;
  owned: boolean;
  onRead: (ebookId: string) => void;
  purchasing: boolean;
}) {
  const color = ebook.coverColor ?? COVER_COLORS[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all flex flex-col"
    >
      <div className={`h-28 bg-gradient-to-br ${color} relative flex items-end p-4 flex-shrink-0`}>
        <BookOpen className="absolute top-4 right-4 w-8 h-8 text-white/20" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrColor(ebook.cefrLevel)}`}>
          {ebook.cefrLevel}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div>
          <h3 className="font-bold text-white line-clamp-2 leading-snug">{ebook.title}</h3>
          {ebook.subtitle && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ebook.subtitle}</p>}
        </div>

        {ebook.description && (
          <p className="text-xs text-slate-500 line-clamp-2 flex-1">{ebook.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{ebook.language}</span>
          <span className="flex items-center gap-1"><BookMarked className="w-3 h-3" />{ebook.chapterCount} caps.</span>
          {ebook.totalWords > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{wordReadingTime(ebook.totalWords)}</span>
          )}
        </div>

        {(ebook.reviewCount ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3 h-3"
                fill={s <= Math.round(ebook.rating ?? 0) ? "#f59e0b" : "none"}
                stroke={s <= Math.round(ebook.rating ?? 0) ? "#f59e0b" : "#64748b"}
              />
            ))}
            <span className="text-amber-400 font-semibold ml-1">{(ebook.rating ?? 0).toFixed(1)}</span>
            <span className="text-slate-500">({ebook.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-lg font-black text-white">
            {ebook.priceUsd === 0 ? (
              <span className="text-emerald-400">Grátis</span>
            ) : (
              `$${ebook.priceUsd.toFixed(2)}`
            )}
          </span>

          {owned ? (
            <button
              onClick={() => onRead(ebook.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Ler
            </button>
          ) : (
            <button
              onClick={() => onPurchase(ebook)}
              disabled={purchasing}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {purchasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
              Comprar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LibraryCard({
  item,
  onRead,
}: {
  item: LibraryItem;
  onRead: (ebookId: string) => void;
}) {
  const color = item.ebookCoverColor ?? COVER_COLORS[0];
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-indigo-500/40 transition-all cursor-pointer"
      onClick={() => onRead(item.ebookId)}
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <BookOpen className="w-6 h-6 text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white line-clamp-1">{item.ebookTitle}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cefrColor(item.ebookCefrLevel)}`}>
            {item.ebookCefrLevel}
          </span>
          <span>{item.ebookLanguage}</span>
          <span>·</span>
          <span>{item.completionPercent}% concluído</span>
        </div>
        <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${item.completionPercent}%` }}
          />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EbookMarketplace({
  onOpenReader,
}: {
  onOpenReader: (ebookId: string, enrollment: any) => void;
}) {
  const { showToast } = useToast();

  type Tab = "marketplace" | "library";
  const [tab, setTab] = useState<Tab>("marketplace");
  const [ebooks, setEbooks] = useState<EbookListing[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [librarySort, setLibrarySort] = useState<"enrolled" | "progress">("enrolled");

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const [mktRes, libRes] = await Promise.all([
        apiFetch("/api/ebook/sales/marketplace"),
        apiFetch("/api/ebook/student/library"),
      ]);
      const rawEbooks: EbookListing[] = mktRes.ebooks ?? [];
      // Enrich with ratings in parallel (best-effort)
      const enriched = await Promise.all(
        rawEbooks.map(async (ebook) => {
          try {
            const ratingData = await apiFetch(`/api/ebook/reviews/${ebook.id}`);
            return {
              ...ebook,
              rating: ratingData.aggregate?.average ?? 0,
              reviewCount: ratingData.aggregate?.total ?? 0,
            };
          } catch {
            return ebook;
          }
        })
      );
      setEbooks(enriched);
      setLibrary(libRes.library ?? []);
    } catch {
      showToast("Erro ao carregar marketplace", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadMarketplace(); }, [loadMarketplace]);

  const handlePurchase = async (ebook: EbookListing) => {
    setPurchasingId(ebook.id);
    try {
      const data = await apiFetch("/api/ebook/sales/checkout", {
        method: "POST",
        body: JSON.stringify({ ebookId: ebook.id }),
      });
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Compra processada!", "success");
        loadMarketplace();
      }
    } catch (err: any) {
      showToast(err.message ?? "Erro ao iniciar compra", "error");
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRead = async (ebookId: string) => {
    try {
      // Ensure enrollment exists (free ebooks can be enrolled without purchase)
      const data = await apiFetch("/api/ebook/student/enroll", {
        method: "POST",
        body: JSON.stringify({ ebookId }),
      });
      onOpenReader(ebookId, data.enrollment);
    } catch (err: any) {
      showToast(err.message ?? "Erro ao abrir e-book", "error");
    }
  };

  const ownedIds = new Set(library.map((l) => l.ebookId));

  const filteredEbooks = ebooks.filter((e) => {
    if (filterLevel !== "all" && e.cefrLevel !== filterLevel) return false;
    if (filterLanguage !== "all" && e.language !== filterLanguage) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const allLanguages = Array.from(new Set(ebooks.map((e) => e.language)));
  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  return (
    <div className="h-full bg-slate-900 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              E-books LingoLive
            </h1>
            <p className="text-slate-400 text-xs mt-1">Biblioteca de e-books adaptativos para aprendizagem de idiomas</p>
          </div>

          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {(["marketplace", "library"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "marketplace" ? "Marketplace" : `Biblioteca (${library.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === "marketplace" && (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisar por título ou descrição…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">Todos os níveis</option>
              {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">Todos os idiomas</option>
              {allLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {!loading && tab === "marketplace" && (
          <>
            {filteredEbooks.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum e-book disponível</p>
                <p className="text-sm mt-1">Os autores ainda não publicaram e-books neste marketplace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredEbooks.map((ebook) => (
                    <React.Fragment key={ebook.id}>
                      <MarketplaceCard
                        ebook={ebook}
                        onPurchase={handlePurchase}
                        owned={ownedIds.has(ebook.id)}
                        onRead={handleRead}
                        purchasing={purchasingId === ebook.id}
                      />
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {!loading && tab === "library" && (
          <>
            {library.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Biblioteca vazia</p>
                <p className="text-sm mt-1">Compre ou inscreva-se em e-books para começar a ler.</p>
                <button
                  onClick={() => setTab("marketplace")}
                  className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors"
                >
                  Explorar Marketplace
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-slate-500">Ordenar:</span>
                  {(["enrolled", "progress"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLibrarySort(opt)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                        librarySort === opt
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50"
                      }`}
                    >
                      {opt === "enrolled" ? "Mais recentes" : "Mais progresso"}
                    </button>
                  ))}
                </div>
                <div className="space-y-3 max-w-2xl">
                  {[...library]
                    .sort((a, b) =>
                      librarySort === "enrolled"
                        ? b.enrolledAt - a.enrolledAt
                        : b.completionPercent - a.completionPercent
                    )
                    .map((item) => (
                      <React.Fragment key={item.ebookId}>
                        <LibraryCard item={item} onRead={handleRead} />
                      </React.Fragment>
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
