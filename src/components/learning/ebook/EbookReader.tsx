import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Zap,
  Trophy,
  X,
} from "lucide-react";
import { auth } from "../../../firebase";

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount?: number;
}

interface Ebook {
  id: string;
  title: string;
  subtitle?: string;
  language: string;
  cefrLevel: string;
  coverColor?: string;
  chapters: Chapter[];
}

interface Enrollment {
  progress: Record<string, { read: boolean; readAt?: number }>;
  currentCefrLevel?: string;
}

interface GamificationResponse {
  xp: number;
  level: number;
  streakDays: number;
  badges?: { id: string; name: string; icon: string }[];
}

interface XpToastProps {
  xp: number;
  newBadges: { name: string; icon: string }[];
  onClose: () => void;
}

function XpToast({ xp, newBadges, onClose }: XpToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-indigo-700 text-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2 max-w-xs">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-300 shrink-0" />
        <span className="font-bold text-sm">+{xp} XP ganho!</span>
        <button onClick={onClose} className="ml-auto text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      {newBadges.map((b) => (
        <div key={b.name} className="flex items-center gap-2 text-xs bg-white/10 rounded-xl px-3 py-1.5">
          <span>{b.icon}</span>
          <span>Conquista desbloqueada: <strong>{b.name}</strong></span>
        </div>
      ))}
    </div>
  );
}

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

interface EbookReaderProps {
  ebookId: string;
  onClose?: () => void;
}

export function EbookReader({ ebookId, onClose }: EbookReaderProps) {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ xpGained: number; newBadges: { name: string; icon: string }[] } | null>(null);
  const [prevBadges, setPrevBadges] = useState<string[]>([]);

  // Load ebook + enrollment in parallel
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<{ success: boolean; ebook: Ebook }>(`/api/ebook/${ebookId}`),
      apiFetch<{ success: boolean; enrollment: Enrollment | null }>(`/api/ebook/student/progress/${ebookId}`)
        .catch(() => ({ success: true, enrollment: null })),
    ])
      .then(([ebookRes, progressRes]) => {
        setEbook(ebookRes.ebook);
        setEnrollment(progressRes.enrollment);
      })
      .catch(() => setError("Não foi possível carregar o e-book. Tenta novamente."))
      .finally(() => setLoading(false));
  }, [ebookId]);

  // Auto-resume at last unread chapter
  useEffect(() => {
    if (!ebook || !enrollment) return;
    const firstUnread = ebook.chapters.findIndex(
      (c) => !enrollment.progress?.[c.id]?.read
    );
    if (firstUnread >= 0) setChapterIndex(firstUnread);
  }, [ebook, enrollment]);

  const currentChapter = ebook?.chapters[chapterIndex];
  const isRead = currentChapter ? !!enrollment?.progress?.[currentChapter.id]?.read : false;
  const readCount = ebook?.chapters.filter((c) => !!enrollment?.progress?.[c.id]?.read).length ?? 0;
  const totalChapters = ebook?.chapters.length ?? 0;

  const markRead = useCallback(async () => {
    if (!currentChapter || isRead || marking) return;
    setMarking(true);

    try {
      const data = await apiFetch<{ success: boolean; gamification?: GamificationResponse }>(
        `/api/ebook/student/progress/${ebookId}`,
        {
          method: "POST",
          body: JSON.stringify({ chapterId: currentChapter.id }),
        }
      );

      // Update local enrollment state
      setEnrollment((prev) => ({
        ...prev!,
        progress: {
          ...(prev?.progress ?? {}),
          [currentChapter.id]: { read: true, readAt: Date.now() },
        },
      }));

      // Detect new badges for toast
      if (data.gamification) {
        const currentBadgeIds = data.gamification.badges?.map((b) => b.id) ?? [];
        const newBadges = data.gamification.badges?.filter((b) => !prevBadges.includes(b.id)) ?? [];
        setPrevBadges(currentBadgeIds);
        setToast({ xpGained: 10, newBadges });
      }
    } catch {
      // Silently ignore — chapter still shown as unread
    } finally {
      setMarking(false);
    }
  }, [currentChapter, isRead, marking, ebookId, prevBadges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <BookOpen className="w-12 h-12 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-400">{error ?? "E-book não encontrado."}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Voltar
          </button>
        )}
      </div>
    );
  }

  const completionPct = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 dark:text-white text-sm truncate">{ebook.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              {ebook.cefrLevel}
            </span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{ebook.language}</span>
          </div>
        </div>
        {/* Progress pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full shrink-0">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{readCount}/{totalChapters}</span>
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div className="h-1 bg-slate-200 dark:bg-slate-700 shrink-0">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* ── Chapter nav + content ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar TOC */}
        <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-3 gap-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 mb-1">Capítulos</p>
          {ebook.chapters.map((ch, i) => {
            const chRead = !!enrollment?.progress?.[ch.id]?.read;
            const isActive = i === chapterIndex;
            return (
              <button
                key={ch.id}
                onClick={() => setChapterIndex(i)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {chRead ? (
                  <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                ) : (
                  <span className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 ${isActive ? "border-white" : "border-slate-300 dark:border-slate-600"}`} />
                )}
                <span className="truncate">{ch.number}. {ch.title}</span>
              </button>
            );
          })}
        </div>

        {/* Chapter content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {currentChapter ? (
            <div className="max-w-2xl mx-auto">
              {/* Chapter header */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">
                  Capítulo {currentChapter.number}
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {currentChapter.title}
                </h2>
              </div>

              {/* Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">
                {currentChapter.content
                  ? currentChapter.content.split("\n").map((para, i) =>
                      para.trim() ? (
                        <p key={i} className="mb-4">{para}</p>
                      ) : null
                    )
                  : <p className="text-slate-400 italic">Conteúdo deste capítulo ainda não disponível.</p>
                }
              </div>

              {/* Mark as read CTA */}
              {!isRead ? (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    onClick={markRead}
                    disabled={marking}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-60"
                  >
                    {marking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Marcar capítulo como lido
                    <span className="text-indigo-200 text-xs ml-1">+10 XP</span>
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Capítulo concluído
                </div>
              )}

              {/* Completion banner */}
              {completionPct === 100 && (
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center">
                  <Trophy className="w-10 h-10 mx-auto mb-2 text-yellow-300" />
                  <p className="font-bold text-lg">E-book concluído!</p>
                  <p className="text-sm text-indigo-200 mt-1">Podes agora obter o teu certificado de conclusão.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Nenhum capítulo disponível.
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
          disabled={chapterIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="text-xs text-slate-400">
          {chapterIndex + 1} / {totalChapters}
        </span>

        <button
          onClick={() => setChapterIndex((i) => Math.min(totalChapters - 1, i + 1))}
          disabled={chapterIndex === totalChapters - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Seguinte
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── XP Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <XpToast
          xp={toast.xpGained}
          newBadges={toast.newBadges}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
