import React, { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  RotateCcw,
  CheckCircle,
  XCircle,
  Minus,
  RefreshCw,
  AlertCircle,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { auth } from "../../../firebase";

interface VocabWord {
  word: string;
  definition: string;
  example: string;
  cefrLevel: string;
  translation: string;
}

interface VocabDeck {
  ebookId: string;
  ebookTitle: string;
  language: string;
  words: VocabWord[];
  generatedAt: string;
}

interface CardProgress {
  word: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/vocabulary${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  B1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

// ── Flashcard flip component ───────────────────────────────────────────────────

function FlipCard({
  word,
  flipped,
  onFlip,
}: {
  word: VocabWord;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: "1000px", minHeight: "220px" }}
      onClick={onFlip}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "220px",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center p-6 gap-3"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CEFR_COLORS[word.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}
          >
            {word.cefrLevel}
          </span>
          <p className="text-3xl font-bold text-gray-800 dark:text-white tracking-wide">{word.word}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Clique para ver a resposta
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-700 shadow-sm flex flex-col items-start justify-center p-6 gap-3"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-xs">
            Definição
          </p>
          <p className="text-gray-800 dark:text-white font-medium leading-snug">{word.definition}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{word.example}"</p>
          <div className="mt-1 px-3 py-1 bg-white/70 dark:bg-gray-800/60 rounded-lg text-sm text-gray-600 dark:text-gray-300">
            🇵🇹 {word.translation}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Review session ─────────────────────────────────────────────────────────────

function ReviewSession({
  deck,
  progressCards,
  onFinish,
}: {
  deck: VocabDeck;
  progressCards: CardProgress[];
  onFinish: (results: { word: string; quality: number }[]) => void;
}) {
  const now = new Date();

  // Words due for review, or all words if student has no progress yet
  const dueWords = deck.words.filter((w) => {
    const card = progressCards.find((c) => c.word === w.word);
    if (!card) return true; // never reviewed
    return new Date(card.nextReviewAt) <= now;
  });

  const [queue, setQueue] = useState<VocabWord[]>(dueWords);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ word: string; quality: number }[]>([]);
  const [done, setDone] = useState(false);

  const answer = useCallback(
    (quality: number) => {
      const word = queue[current];
      const newResults = [...results, { word: word.word, quality }];
      setResults(newResults);
      setFlipped(false);

      if (current + 1 >= queue.length) {
        setDone(true);
        onFinish(newResults);
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [current, queue, results, onFinish]
  );

  // Keyboard shortcuts: Space = flip, 1 = Errei, 2 = Quase, 3 = Sabia!
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      } else if (flipped) {
        if (e.key === "1") answer(1);
        else if (e.key === "2") answer(3);
        else if (e.key === "3") answer(5);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, done, answer]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 space-y-3">
        <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Nenhum cartão para rever agora.
        </p>
        <p className="text-xs text-gray-400">Volte mais tarde para a próxima sessão.</p>
      </div>
    );
  }

  if (done) {
    const correct = results.filter((r) => r.quality >= 3).length;
    const pct = Math.round((correct / results.length) * 100);
    const pctColor = pct >= 80 ? "text-green-600 dark:text-green-400" : pct >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
        <h4 className="font-semibold text-gray-800 dark:text-white">Sessão concluída!</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {correct} / {results.length} corretas —{" "}
          <span className={`font-semibold ${pctColor}`}>{pct}%</span>
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setQueue(dueWords);
              setCurrent(0);
              setResults([]);
              setDone(false);
              setFlipped(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-1.5" />
            Repetir
          </button>
        </div>
      </div>
    );
  }

  const card = queue[current];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{current + 1} / {queue.length}</span>
        <span>{results.filter((r) => r.quality >= 3).length} corretas</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${((current) / queue.length) * 100}%` }}
        />
      </div>

      <FlipCard word={card} flipped={flipped} onFlip={() => setFlipped(true)} />

      {!flipped && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">Prima <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 font-mono">Espaço</kbd> para revelar</p>
      )}

      {flipped && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => answer(1)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Errei</span>
              <kbd className="text-[10px] px-1 bg-red-100 dark:bg-red-900/40 rounded font-mono">1</kbd>
            </button>
            <button
              onClick={() => answer(3)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 transition-colors"
            >
              <Minus className="w-6 h-6" />
              <span className="text-xs font-medium">Quase</span>
              <kbd className="text-[10px] px-1 bg-yellow-100 dark:bg-yellow-900/40 rounded font-mono">2</kbd>
            </button>
            <button
              onClick={() => answer(5)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Sabia!</span>
              <kbd className="text-[10px] px-1 bg-green-100 dark:bg-green-900/40 rounded font-mono">3</kbd>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Deck browser ───────────────────────────────────────────────────────────────

function DeckBrowser({
  deck,
  progressCards,
  onStartReview,
}: {
  deck: VocabDeck;
  progressCards: CardProgress[];
  onStartReview: () => void;
}) {
  const now = new Date();
  const dueCount = deck.words.filter((w) => {
    const card = progressCards.find((c) => c.word === w.word);
    if (!card) return true;
    return new Date(card.nextReviewAt) <= now;
  }).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{deck.words.length}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Total</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            {progressCards.filter((c) => c.repetitions >= 1).length}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">Aprendidas</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
          <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{dueCount}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">Para rever</p>
        </div>
      </div>

      <button
        onClick={onStartReview}
        disabled={dueCount === 0}
        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-40"
      >
        {dueCount > 0 ? `Rever ${dueCount} cartões agora` : "Tudo em dia — volte mais tarde!"}
      </button>

      {/* Word list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {deck.words.map((w) => {
            const card = progressCards.find((c) => c.word === w.word);
            return (
              <div key={w.word} className="px-4 py-3 flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CEFR_COLORS[w.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {w.cefrLevel}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{w.word}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{w.translation}</p>
                </div>
                {card && card.repetitions >= 1 ? (
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {(() => {
                        const diff = Math.ceil((new Date(card.nextReviewAt).getTime() - Date.now()) / 86400000);
                        if (diff <= 0) return "Rever";
                        if (diff === 1) return "Amanhã";
                        return `${diff}d`;
                      })()}
                    </span>
                  </div>
                ) : (
                  <span className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface LibraryEntry {
  ebookId: string;
  ebookTitle: string;
  ebookLanguage?: string;
  ebookCefrLevel?: string;
}

async function fetchLibrary(): Promise<LibraryEntry[]> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/ebook/student/library", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.library ?? [];
}

// ── Public export ──────────────────────────────────────────────────────────────

export function EbookFlashcards({ ebookId }: { ebookId?: string }) {
  const [deckId, setDeckId] = useState<string | null>(ebookId ?? null);
  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [progressCards, setProgressCards] = useState<CardProgress[]>([]);
  const [mode, setMode] = useState<"pick" | "browse" | "review">(ebookId ? "browse" : "pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Load library for picker
  useEffect(() => {
    if (mode !== "pick") return;
    setLibraryLoading(true);
    fetchLibrary()
      .then(setLibrary)
      .finally(() => setLibraryLoading(false));
  }, [mode]);

  const loadDeck = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [d, p] = await Promise.all([
        apiFetch<VocabDeck>(`/deck/${id}`),
        apiFetch<{ cards: CardProgress[] }>(`/progress/${id}`).then((r) => r.cards).catch(() => []),
      ]);
      setDeck(d);
      setProgressCards(p as CardProgress[]);
      setDeckId(id);
      setMode("browse");
    } catch {
      setError("Não foi possível carregar o vocabulário deste e-book.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ebookId) loadDeck(ebookId);
  }, []);

  const handleReviewFinish = async (results: { word: string; quality: number }[]) => {
    if (!deckId) return;
    try {
      const updated = await apiFetch<{ cards: CardProgress[] }>(`/review/${deckId}`, {
        method: "POST",
        body: JSON.stringify({ results }),
      });
      setProgressCards(updated.cards);
    } catch {
      // Best-effort — keep local state
    }
    setMode("browse");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          {mode === "review" ? "Sessão de Revisão" : "Flashcards de Vocabulário"}
        </h3>
        {(mode === "review" || mode === "browse") && (
          <button
            onClick={() => {
              if (mode === "review") { setMode("browse"); return; }
              setDeck(null); setDeckId(null); setMode("pick");
            }}
            className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            {mode === "review" ? "Voltar" : "Trocar e-book"}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Library picker ── */}
      {mode === "pick" && (
        libraryLoading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
          </div>
        ) : library.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ainda não tens e-books inscritos. Vai ao Catálogo para explorar!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
              Escolhe um e-book da tua biblioteca
            </p>
            {library.map((item) => (
              <button
                key={item.ebookId}
                onClick={() => loadDeck(item.ebookId)}
                disabled={loading}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3 text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.ebookTitle}</p>
                  {item.ebookLanguage && (
                    <p className="text-xs text-gray-400">{item.ebookLanguage}{item.ebookCefrLevel ? ` · ${item.ebookCefrLevel}` : ""}</p>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 flex-shrink-0" />
              </button>
            ))}
          </div>
        )
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
          </div>
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      )}

      {!loading && deck && mode === "browse" && (
        <DeckBrowser
          deck={deck}
          progressCards={progressCards}
          onStartReview={() => setMode("review")}
        />
      )}

      {!loading && deck && mode === "review" && (
        <ReviewSession
          deck={deck}
          progressCards={progressCards}
          onFinish={handleReviewFinish}
        />
      )}
    </div>
  );
}
