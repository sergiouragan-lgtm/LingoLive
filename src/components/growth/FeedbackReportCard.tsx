import React, { useState, useEffect } from "react";
import { Language, Scenario, TranscriptItem, FeedbackReport, AgeGroup } from "../../types";
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Volume2, 
  RotateCcw, 
  ChevronRight, 
  Loader2, 
  Bookmark, 
  Sparkles,
  ArrowLeft,
  Flame,
  ThumbsUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FeedbackReportCardProps {
  language: Language;
  proficiency: string;
  scenario: Scenario;
  transcript: TranscriptItem[];
  audioUrl?: string | null;
  ageGroup: AgeGroup;
  onRestart: () => void;
  onViewSavedVocab: () => void;
}

export default function FeedbackReportCard({
  language,
  proficiency,
  scenario,
  transcript,
  audioUrl,
  ageGroup,
  onRestart,
  onViewSavedVocab
}: FeedbackReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Progressive loading text sequence to keep users engaged
  const loadingSteps = [
    "Analyzing sentence structure...",
    "Reviewing grammar and syntax patterns...",
    "Synthesizing vocabulary enhancements...",
    "Formulating helpful pronunciation tips...",
    "Assembling your custom LingoLive progress card..."
  ];

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    if (loading) {
      stepTimer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(stepTimer);
  }, [loading]);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true);
        setError(null);

        // Filter user lines only, to avoid analyzing tutor lines
        const userLines = transcript
          .filter((t) => t.role === "user")
          .map((t) => ({ role: "user" as const, text: t.text }));

        if (userLines.length === 0) {
          setError("It looks like there wasn't enough user speaking time in this session to generate a feedback report card. Try practicing speaking a bit more!");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: language.name,
            proficiency: proficiency,
            scenario: scenario.title,
            transcript: transcript.map(t => ({ role: t.role, text: t.text }))
          }),
        });

        if (!response.ok) {
          throw new Error("Feedback generator failed. Please check your network and try again.");
        }

        const result = await response.json();
        setReport(result);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred while analyzing your conversation.");
      } finally {
        setLoading(false);
      }
    }

    fetchFeedback();
  }, [language, proficiency, scenario, transcript]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-6" id="feedback-loading-view">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <Award className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-bold text-slate-800">
            Grading Your Conversation
          </h3>
          <p className="text-sm font-mono text-indigo-600 animate-pulse font-semibold h-6">
            {loadingSteps[loadingStep]}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Gemini is evaluating your native pacing, vocabulary, and grammar accuracy. This will only take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6" id="feedback-error-view">
        <div className="inline-flex p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500">
          <XCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">Review Generation Skipped</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            {error}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Another Session</span>
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  // Sentiment Analysis
  const calculateSentiment = () => {
    let positive = 0;
    let challenging = 0;
    let neutral = 0;

    const posKeywords = ["feliz", "bom", "legal", "ótimo", "adorei", "obrigado", "sucesso", "claro", "entendi"];
    const chalKeywords = ["difícil", "ajuda", "não entendi", "confuso", "problema", "tentei", "complicado"];

    transcript.forEach(line => {
      if (line.role === 'user') {
        const text = line.text.toLowerCase();
        if (posKeywords.some(word => text.includes(word))) positive++;
        else if (chalKeywords.some(word => text.includes(word))) challenging++;
        else neutral++;
      }
    });

    return [
      { name: 'Positivo', value: positive > 0 ? positive : 0.1 },
      { name: 'Neutro', value: neutral > 0 ? neutral : 0.1 },
      { name: 'Desafiador', value: challenging > 0 ? challenging : 0.1 },
    ];
  };
  const sentimentData = calculateSentiment();
  const COLORS = ['#10b981', '#94a3b8', '#f43f5e'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="feedback-report-card">
      {/* Upper Badge & Score summary */}
      <div className="bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background visual graphics */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute left-10 bottom-0 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Linguistic Feedback Card</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Congratulations on completing your session!
            </h2>
            <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">
              You practiced <span className="text-white font-medium">{scenario.title}</span> in <span className="text-white font-medium">{language.name}</span>. Let's see your personalized grammar and fluency review.
            </p>
          </div>

          {/* Large circular score grading */}
          <div className="flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
            <div className="text-center">
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Estimated Score</div>
              <div className="text-4xl font-display font-black text-amber-400 mt-1">
                {report.overallScore}/100
              </div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">CEFR Level</div>
              <div className="text-4xl font-display font-black text-indigo-300 mt-1">
                {report.fluencyLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Audio Playback */}
      {audioUrl && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Escute seu Desempenho / Listen back to your session</h4>
              <p className="text-xs text-slate-400">Play the combined recording of yourself and your AI tutor during this roleplay.</p>
            </div>
          </div>
          <div className="w-full md:w-auto shrink-0">
            <audio src={audioUrl} controls className="w-full md:w-72 rounded-lg bg-slate-50 border border-slate-100" />
          </div>
        </div>
      )}

      {/* 1. Primeira Infância & Crianças Pequenas: Playful Star Badge Certificate */}
      {(ageGroup === "Infancy" || ageGroup === "Kids") && (
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 rounded-2xl p-6 text-slate-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-4xl animate-bounce shadow-md">
              🏅
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg sm:text-xl">Super Campeão de Línguas! 🚀</h3>
              <p className="text-xs sm:text-sm text-amber-950 font-medium">
                Concluíste a tua missão de conversação com o {scenario.title}. Estás de parabéns!
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-2xl animate-pulse" style={{ animationDelay: `${s * 200}ms` }}>⭐</span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pré-Adolescentes: 3 Words Learned This Session */}
      {ageGroup === "PreTeens" && (
        <div className="bg-indigo-900/10 border border-indigo-100 rounded-2xl p-6">
          <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>3 Palavras que Aprendeste nesta Sessão! 💡</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.vocabularyTips.slice(0, 3).concat([
              { word: "Obrigado", definition: "Thank you / Expressing gratitude.", suggestion: "Use to thank someone." },
              { word: "Amigo", definition: "Friend / Companion.", suggestion: "A close buddy or pal." },
              { word: "Olá", definition: "Hello / Standard warm greeting.", suggestion: "Used to greet someone." }
            ]).slice(0, 3).map((tip, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Palavra #{idx + 1}</span>
                <strong className="text-slate-900 text-lg block">{tip.word}</strong>
                <p className="text-xs text-slate-500 leading-relaxed">{tip.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Adolescentes: Analytical Metrics Progress Charts */}
      {ageGroup === "Teens" && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Análise Detalhada de Desempenho / Performance Metrics</span>
          </h3>
          <div className="space-y-4">
            {[
              { label: "Pronúncia & Tons (Pronunciation Accuracy)", score: Math.max(45, report.overallScore - 3), color: "from-sky-500 to-indigo-500" },
              { label: "Variedade de Vocabulário (Vocabulary Range & Slang)", score: Math.min(100, report.overallScore + 4), color: "from-indigo-500 to-purple-500" },
              { label: "Precisão Gramatical (Grammar & Sentence Flow)", score: Math.max(45, report.overallScore - 1), color: "from-purple-500 to-pink-500" }
            ].map((metric, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-700">{metric.label}</span>
                  <span className="font-mono font-bold text-slate-900">{metric.score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-1000`} 
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Sentiment Analysis */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Tom Emocional da Conversa</span>
          </h3>
          <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                      >
                          {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                  </PieChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Grid: Strengths & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supportive Summary */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-indigo-600" />
              <span>Tutor Evaluation Summary</span>
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {report.encouragingSummary}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-indigo-600 text-xs font-medium">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span>Keep up the daily momentum to solidify these structures!</span>
          </div>
        </div>

        {/* Areas of Strength list */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>Linguistic Strengths Detected</span>
          </h3>
          <ul className="space-y-3">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grammar mistakes block */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-5">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Grammar & Natural Phrasing Review</span>
        </h3>

        {report.grammarMistakes.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-xl p-5 text-sm text-center">
            ✨ Excellent work! No major grammar errors or awkward structures were flagged. You expressed yourself naturally.
          </div>
        ) : (
          <div className="space-y-4">
            {report.grammarMistakes.map((mistake, idx) => (
              <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                {/* Header comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50 border-b border-slate-100 text-sm">
                  {/* Original with error */}
                  <div className="p-3 flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase mt-0.5 shrink-0">
                      Spoken
                    </span>
                    <span className="text-slate-500 line-through">"{mistake.original}"</span>
                  </div>

                  {/* Corrected phrasing */}
                  <div className="p-3 flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase mt-0.5 shrink-0">
                      Correct
                    </span>
                    <span className="text-slate-800 font-semibold">"{mistake.corrected}"</span>
                  </div>
                </div>

                {/* Grammar rule explanation */}
                <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 text-xs">Explanation: </strong>
                  {mistake.explanation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row: Vocabulary recommendations & Pronunciation tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario Vocab Booster Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Useful Scenario Vocabulary</span>
          </h3>
          <div className="space-y-4">
            {report.vocabularyTips.map((tip, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-indigo-950 font-semibold text-sm">{tip.word}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">Suggested</span>
                </div>
                <p className="text-xs text-slate-700">
                  <span className="font-medium text-slate-400">Meaning: </span>{tip.definition}
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  <span className="font-semibold text-slate-400">Context: </span>"{tip.suggestion}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pronunciation tips card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            <span>Phonetics & Pronunciation Coaching</span>
          </h3>
          <ul className="space-y-3.5">
            {report.pronunciationTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions bottom banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-indigo-950 text-sm">Review Saved Flashcards?</h4>
          <p className="text-xs text-indigo-700 mt-1">
            Browse and review the custom dictionary phrases you saved during your oral practice session.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={onViewSavedVocab}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Bookmark className="w-4 h-4 fill-indigo-700" />
            <span>Vocab Deck</span>
          </button>

          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
