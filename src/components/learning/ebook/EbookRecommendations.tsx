import React, { useEffect, useState } from "react";
import { Sparkles, BookOpen, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { auth } from "../../../firebase";

interface EbookRecommendation {
  ebookId: string;
  title: string;
  subtitle: string;
  language: string;
  cefrLevel: string;
  coverColor: string;
  reason: string;
  score: number;
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  B1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function RecommendationCard({
  rec,
  onEnroll,
}: {
  rec: EbookRecommendation;
  onEnroll: (id: string) => void;
}) {
  const [enrolling, setEnrolling] = useState(false);

  const handleStart = async () => {
    setEnrolling(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/ebook/student/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ebookId: rec.ebookId }),
      });
    } catch {
      // enroll-or-ignore: reader will still open; backend may already have enrollment
    } finally {
      setEnrolling(false);
      onEnroll(rec.ebookId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Cover strip */}
      <div
        className="h-24 flex items-center justify-center"
        style={{ backgroundColor: rec.coverColor }}
      >
        <BookOpen className="w-10 h-10 text-white/80" />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-gray-800 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
            {rec.title}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CEFR_COLORS[rec.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}>
            {rec.cefrLevel}
          </span>
        </div>

        {rec.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{rec.subtitle}</p>
        )}

        <div className="mt-auto">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 italic mb-3 flex items-start gap-1">
            <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {rec.reason}
          </p>

          <button
            onClick={handleStart}
            disabled={enrolling}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {enrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {enrolling ? "A inscrever..." : "Começar a Ler"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EbookRecommendations({
  onEnroll,
}: {
  onEnroll?: (ebookId: string) => void;
}) {
  const [recs, setRecs] = useState<EbookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ebook/recommendations?limit=6", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecs(data.recommendations ?? []);
    } catch {
      setError("Não foi possível carregar as recomendações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Recomendados para Si
        </h3>
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && recs.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          Nenhuma recomendação disponível de momento.
          <br />
          Inscreva-se em alguns e-books para personalizar as suas sugestões.
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {recs.map((rec) => (
            <React.Fragment key={rec.ebookId}>
              <RecommendationCard rec={rec} onEnroll={(id) => onEnroll?.(id)} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
