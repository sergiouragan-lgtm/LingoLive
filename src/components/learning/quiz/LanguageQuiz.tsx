import React, { useState, useEffect } from "react";
import { Language, SavedWord } from "../../../types";
import { LANGUAGES } from "../../../data";
import { 
  Trophy, 
  ArrowLeft, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  School, 
  Globe, 
  Star, 
  RotateCcw,
  Compass,
  Flame,
  Volume2,
  Brain,
  Bookmark
} from "lucide-react";
import { adaptiveQuizService } from "../../../services/adaptiveQuiz.service";

interface QuizQuestion {
  id: string;
  grade: typeof GRADES[number]["id"];
  category: "Cultura Geral" | "Disciplinas Escolares";
  languageCode: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  skill?: string;
  difficulty?: string;
}

export type TargetAgeGroup = 'CHILD' | 'TEEN' | 'ADULT';

export interface AssessmentProfileExperience {
  readonly heading: string;
  readonly description: string;
  readonly badge: string;
  readonly preparationMessage: string;
  readonly encouragement: string;
  readonly startActionLabel: string;
  readonly pageClassName: string;
  readonly accentClassName: string;
}

const CHILD_EXPERIENCE: AssessmentProfileExperience = Object.freeze({
  heading: "Vamos mostrar o que já aprendeste",
  description: "Responde com calma. Cada pergunta ajuda-nos a preparar actividades melhores para ti.",
  badge: "Desafio de aprendizagem",
  preparationMessage: "Lê cada pergunta e escolhe a resposta que te parecer melhor.",
  encouragement: "Não faz mal errar — estamos aqui para aprender.",
  startActionLabel: "Começar desafio",
  pageClassName: "bg-amber-50/30 border-amber-100",
  accentClassName: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
});

const TEEN_EXPERIENCE: AssessmentProfileExperience = Object.freeze({
  heading: "Pronto para testar o teu progresso?",
  description: "Completa este desafio para perceberes onde estás forte e o que podes melhorar.",
  badge: "Desafio de progresso",
  preparationMessage: "Responde ao teu ritmo e mantém o foco até ao fim.",
  encouragement: "Cada resposta ajuda a construir o teu próximo objectivo.",
  startActionLabel: "Aceitar desafio",
  pageClassName: "bg-indigo-50/30 border-indigo-100",
  accentClassName: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
});

const ADULT_EXPERIENCE: AssessmentProfileExperience = Object.freeze({
  heading: "Avaliação dos teus conhecimentos",
  description: "Esta avaliação ajuda a identificar competências consolidadas e áreas prioritárias para desenvolvimento.",
  badge: "Avaliação de progresso",
  preparationMessage: "Reserve alguns minutos e responda com base no que sabe actualmente.",
  encouragement: "O resultado será utilizado para orientar os próximos passos da aprendizagem.",
  startActionLabel: "Iniciar avaliação",
  pageClassName: "bg-slate-50/50 border-slate-200",
  accentClassName: "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
});

const NEUTRAL_EXPERIENCE: AssessmentProfileExperience = Object.freeze({
  heading: "Desafio Quiz Escolar",
  description: "Testa a tua cultura geral, conhecimentos escolares e habilidades de língua num divertido jogo adaptado ao teu ano de escolaridade!",
  badge: "LingoQuiz Escolar",
  preparationMessage: "Escolha as opções e responda ao teste.",
  encouragement: "Boa sorte na sua avaliação!",
  startActionLabel: "Começar Jogo!",
  pageClassName: "bg-white border-slate-100",
  accentClassName: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
});

export function getAssessmentProfileExperience(
  profile: TargetAgeGroup | null
): AssessmentProfileExperience {
  if (profile === 'CHILD') return CHILD_EXPERIENCE;
  if (profile === 'TEEN') return TEEN_EXPERIENCE;
  if (profile === 'ADULT') return ADULT_EXPERIENCE;
  return NEUTRAL_EXPERIENCE;
}

export function normalizeAssessmentProfile(
  selectedAgeGroup?: TargetAgeGroup | string | null,
  userAge?: number
): TargetAgeGroup | null {
  if (selectedAgeGroup) {
    const upper = String(selectedAgeGroup).trim().toUpperCase();
    if (
      upper === 'CHILD' ||
      upper === 'CRIANÇA' ||
      upper === 'CRIANCA' ||
      upper === 'CRIANÇAS' ||
      upper === 'CRIANCAS' ||
      upper === 'INFÂNCIA' ||
      upper === 'INFANCIA' ||
      upper === 'KIDS' ||
      upper === 'INFANCY'
    ) {
      return 'CHILD';
    }
    if (
      upper === 'TEEN' ||
      upper === 'ADOLESCENTE' ||
      upper === 'ADOLESCENTES' ||
      upper === 'PRÉ-ADOLESCENTE' ||
      upper === 'PRÉ-ADOLESCENTES' ||
      upper === 'PRE-ADOLESCENTE' ||
      upper === 'PRE-ADOLESCENTES' ||
      upper === 'TEENS' ||
      upper === 'PRETEENS' ||
      upper === 'PRÉ-TEENS' ||
      upper === 'PRE-TEENS'
    ) {
      return 'TEEN';
    }
    if (
      upper === 'ADULT' ||
      upper === 'ADULTO' ||
      upper === 'ADULTOS' ||
      upper === 'ADULTS'
    ) {
      return 'ADULT';
    }
  }

  if (typeof userAge === 'number' && Number.isFinite(userAge) && userAge >= 0) {
    if (userAge < 12) return 'CHILD';
    if (userAge < 18) return 'TEEN';
    return 'ADULT';
  }

  return null;
}

export interface LanguageQuizProps {
  currentLanguage: Language;
  savedWords?: SavedWord[];
  onAddWords?: (words: SavedWord[]) => void;
  onBack: () => void;
  onCompleteQuiz?: (result: { score: number; correctAnswers: number; totalQuestions: number; durationMinutes: number }) => void;
  selectedAgeGroup?: TargetAgeGroup | string | null;
  userAge?: number;
}

const GRADES = [
  { id: "Creche", label: "Creche / Maternal", labelEn: "Daycare", color: "bg-pink-500 hover:bg-pink-600 text-white" },
  { id: "Pré-escolar", label: "Pré-escolar", labelEn: "Preschool", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { id: "1º Ano", label: "1º Ano", labelEn: "1st Grade", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  { id: "2º Ano", label: "2º Ano", labelEn: "2nd Grade", color: "bg-yellow-500 hover:bg-yellow-600 text-slate-900" },
  { id: "3º Ano", label: "3º Ano", labelEn: "3rd Grade", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { id: "4º Ano", label: "4º Ano", labelEn: "4th Grade", color: "bg-teal-500 hover:bg-teal-600 text-white" },
  { id: "5º Ano", label: "5º Ano", labelEn: "5th Grade", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { id: "6º Ano", label: "6º Ano", labelEn: "6th Grade", color: "bg-indigo-500 hover:bg-indigo-600 text-white" },
  { id: "7º Ano", label: "7º Ano", labelEn: "7th Grade", color: "bg-purple-500 hover:bg-purple-600 text-white" }
] as const;

export default function LanguageQuiz({ 
  currentLanguage, 
  savedWords = [], 
  onAddWords, 
  onBack, 
  onCompleteQuiz,
  selectedAgeGroup,
  userAge
}: LanguageQuizProps) {
  const activeProfile = normalizeAssessmentProfile(selectedAgeGroup, userAge);
  const profileExp = getAssessmentProfileExperience(activeProfile);

  // State for configuration
  const [quizMode, setQuizMode] = useState<"school" | "flashcard">("school");
  const [selectedGrade, setSelectedGrade] = useState<typeof GRADES[number]["id"]>("1º Ano");
  const [selectedCategory, setSelectedCategory] = useState<"Cultura Geral" | "Disciplinas Escolares">("Cultura Geral");
  const [quizLanguage, setQuizLanguage] = useState<Language>(currentLanguage);

  // Quiz execution states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [adaptiveSessionId, setAdaptiveSessionId] = useState<string | null>(null);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizError, setQuizError] = useState("");
  const quizStartedAt = React.useRef(0);

  // Extra feedback state
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Sound effects emulation using simple Web Audio API synthesis for fun kids experience!
  const playSoundEffect = (type: "correct" | "incorrect" | "finish") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === "correct") {
        // --- 1. Synthesize Clapping / Applause (Som de Palmas) ---
        // Create 1.2 seconds of white noise
        const bufferSize = ctx.sampleRate * 1.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        // Schedule multiple overlapping short clap bursts to form a friendly crowd applause
        const clapCount = 14;
        const now = ctx.currentTime;
        for (let i = 0; i < clapCount; i++) {
          // Stagger claps with dense timing overlaps
          const timeOffset = i * 0.07 + Math.random() * 0.05;
          
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = buffer;
          
          // Bandpass filter centered at ~1000Hz simulates human cupped hands
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(950 + Math.random() * 300, now + timeOffset);
          filter.Q.setValueAtTime(3.5, now + timeOffset);
          
          const gainNode = ctx.createGain();
          // Very rapid burst attack-decay curve
          gainNode.gain.setValueAtTime(0, now + timeOffset);
          gainNode.gain.linearRampToValueAtTime(0.18, now + timeOffset + 0.005);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.065);
          
          noiseSource.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          noiseSource.start(now + timeOffset);
          noiseSource.stop(now + timeOffset + 0.08);
        }

        // Also add a bright happy musical chime in the background
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.08, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });

      } else if (type === "incorrect") {
        // --- 2. Voice saying "ohhhhhhhhhh" & Cartoon Slide-Down Synth ---
        try {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            // Cancel any current speaking so feedback doesn't delay
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance("ohhhhhhhhhh");
            utterance.pitch = 0.95; // Slightly childish / humorous
            utterance.rate = 0.70;  // Long drawn out sigh
            
            // Try to match current selected quiz language or fallback to Portuguese
            const voices = window.speechSynthesis.getVoices() || [];
            const matchingVoice = (quizLanguage && quizLanguage.code)
              ? voices.find(v => v && typeof v.lang === "string" && v.lang.toLowerCase().includes(quizLanguage.code.toLowerCase())) || 
                voices.find(v => v && typeof v.lang === "string" && v.lang.toLowerCase().startsWith("pt")) ||
                voices[0]
              : voices.find(v => v && typeof v.lang === "string" && v.lang.toLowerCase().startsWith("pt")) ||
                voices[0];
            if (matchingVoice) {
              utterance.voice = matchingVoice;
            }
            window.speechSynthesis.speak(utterance);
          }
        } catch (speechErr) {
          console.warn("Speech Synthesis vocal failed:", speechErr);
        }

        // Accompanying sliding-down buzzer sound (like a friendly cartoon "aww")
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.65);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);

      } else if (type === "finish") {
        // Glorious fanfare!
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
        });
      }
    } catch (e) {
      console.warn("Audio Context sound failed to play", e);
    }
  };

  const startFlashcardQuiz = () => {
    const normalizedCode = (quizLanguage?.code || "en").toLowerCase().split("-")[0];
    let filteredWords = (savedWords || []).filter(item => 
      item.id && item.id.toLowerCase().startsWith(normalizedCode + "_")
    );

    if (filteredWords.length === 0) {
      filteredWords = savedWords || [];
    }

    if (filteredWords.length < 4) {
      setQuizError("Guarda pelo menos quatro palavras reais neste idioma para criar flashcards com opções válidas.");
      return;
    }

    // Generate up to 5 questions
    const questionsToGenerate = [...filteredWords].sort(() => 0.5 - Math.random()).slice(0, 5);

    const generated: QuizQuestion[] = questionsToGenerate.map((wordItem, index) => {
      const isTranslateToNative = Math.random() > 0.5;

      let questionText = "";
      let correctAnswer = "";
      let options: string[] = [];
      let explanation = "";

      if (isTranslateToNative) {
        questionText = `Qual é a tradução correta para a expressão: "${wordItem.word}"?`;
        correctAnswer = wordItem.meaning;
        
        const otherMeanings = filteredWords
          .filter(w => w.id !== wordItem.id)
          .map(w => w.meaning);
        
        const allPotentialDistractors = Array.from(new Set(otherMeanings))
          .filter(m => typeof m === "string" && typeof correctAnswer === "string" && m.toLowerCase() !== correctAnswer.toLowerCase());

        const selectedDistractors = allPotentialDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctAnswer, ...selectedDistractors].sort(() => 0.5 - Math.random());
        explanation = `A expressão "${wordItem.word}" significa "${wordItem.meaning}".${wordItem.pronunciation ? ` Pronúncia: [${wordItem.pronunciation}]` : ""}`;
      } else {
        questionText = `Como se diz em ${quizLanguage.name}: "${wordItem.meaning}"?`;
        correctAnswer = wordItem.word;

        const otherWords = filteredWords
          .filter(w => w.id !== wordItem.id)
          .map(w => w.word);
        
        const allPotentialDistractors = Array.from(new Set(otherWords))
          .filter(w => typeof w === "string" && typeof correctAnswer === "string" && w.toLowerCase() !== correctAnswer.toLowerCase());

        const selectedDistractors = allPotentialDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctAnswer, ...selectedDistractors].sort(() => 0.5 - Math.random());
        explanation = `Para dizer "${wordItem.meaning}" em ${quizLanguage.name}, dizemos "${wordItem.word}".`;
      }

      const correctAnswerIndex = options.indexOf(correctAnswer);

      return {
        id: `flashcard_${wordItem.id}_${index}`,
        grade: "1º Ano" as const,
        category: "Disciplinas Escolares" as const,
        languageCode: (["pt", "en", "fr", "zh"].includes(normalizedCode) ? normalizedCode : "en") as "pt" | "en" | "fr" | "zh",
        question: questionText,
        options,
        correctAnswerIndex,
        explanation
      };
    });

    setCurrentQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerConfirmed(false);
    setScore(0);
    setIsFinished(false);
    setIsPlaying(true);
    setFeedbackMessage("");
  };

  // Build/filter question list based on parameters
  const startQuiz = async () => {
    if (quizMode === "flashcard") {
      startFlashcardQuiz();
      return;
    }

    setIsGenerating(true);
    setQuizError("");
    try {
      const generated = await adaptiveQuizService.generate({ language: quizLanguage.name, ageGroup: activeProfile, grade: selectedGrade });
      const finalSet: QuizQuestion[] = generated.questions.map(question => ({ ...question, grade: selectedGrade, category: selectedCategory, languageCode: quizLanguage.code as any, correctAnswerIndex: -1, explanation: "" }));
      setAdaptiveSessionId(generated.sessionId);
      setAdaptiveAnswers([]);
      quizStartedAt.current = Date.now();

      setCurrentQuestions(finalSet);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerConfirmed(false);
    setScore(0);
    setIsFinished(false);
    setIsPlaying(true);
      setFeedbackMessage("");
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Não foi possível gerar o quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerConfirmed) return;
    setSelectedAnswerIndex(idx);
  };

  const handleConfirmAnswer = async () => {
    if (selectedAnswerIndex === null || isAnswerConfirmed) return;

    const nextAnswers = [...adaptiveAnswers, selectedAnswerIndex];
    setAdaptiveAnswers(nextAnswers);
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      return;
    }
    if (!adaptiveSessionId) return;
    setIsGenerating(true);
    try {
      const result = await adaptiveQuizService.submit(adaptiveSessionId, nextAnswers, Math.max(0.1, (Date.now() - quizStartedAt.current) / 60_000));
      setScore(result.correctAnswers);
      setIsFinished(true);
      playSoundEffect("finish");
      onCompleteQuiz?.({ score: result.score, correctAnswers: result.correctAnswers, totalQuestions: result.totalQuestions, durationMinutes: Math.max(0.1, (Date.now() - quizStartedAt.current) / 60_000) });
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Não foi possível corrigir o quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerConfirmed(false);
      setFeedbackMessage("");
    } else {
      playSoundEffect("finish");
      setIsFinished(true);
      if (onCompleteQuiz) {
        onCompleteQuiz({
          score: currentQuestions.length > 0 ? Math.round((score / currentQuestions.length) * 100) : 0,
          correctAnswers: score,
          totalQuestions: currentQuestions.length,
          durationMinutes: Math.max(1, Math.ceil(currentQuestions.length * 0.75)),
        });
      }
    }
  };

  // Score description based on performance
  const getScoreRating = () => {
    const percent = (score / currentQuestions.length) * 100;
    if (percent === 100) return { title: "Mestre da Língua 👑", desc: "Perfeito! Acertaste em cheio em todas as perguntas!" };
    if (percent >= 70) return { title: "Explorador Brilhante 🌟", desc: "Muito bem! Demonstras um excelente conhecimento!" };
    if (percent >= 40) return { title: "Estudante Esforçado 📚", desc: "Bom progresso! Continua a praticar para dominares!" };
    return { title: "Curioso Aprendiz 🌱", desc: "Uma óptima oportunidade para ler as explicações e tentar de novo!" };
  };

  const rating = getScoreRating();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6" id="language-quiz-container">
      {/* Quiz Screen Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>
        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
          <span>{quizMode === "school" ? profileExp.badge : "LingoQuiz Vocabulário"}</span>
        </div>
      </div>

      {!isPlaying ? (
        /* ==================== CONFIGURATION SCREEN ==================== */
        <div className={`border rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-fade-in ${profileExp.pageClassName}`}>
          {/* Mode Tabs Selection */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md mx-auto" id="quiz-mode-tabs">
            <button
              onClick={() => setQuizMode("school")}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                quizMode === "school"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="tab-quiz-school"
            >
              <School className="w-4 h-4" />
              <span>Desafio Escolar</span>
            </button>
            <button
              onClick={() => setQuizMode("flashcard")}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                quizMode === "flashcard"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="tab-quiz-flashcard"
            >
              <Brain className="w-4 h-4" />
              <span>Quiz de Vocabulário</span>
            </button>
          </div>

          {quizMode === "school" ? (
            <>
              {/* Main Title Banner */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100/50">
                  <Compass className="w-9 h-9 animate-bounce" />
                </div>
                {activeProfile && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-1" id="assessment-profile-badge">
                    {profileExp.badge}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight" id="assessment-profile-heading">
                  {profileExp.heading}
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto" id="assessment-profile-description">
                  {profileExp.description}
                </p>

                {activeProfile && (
                  <div className="mt-4 p-4 rounded-2xl bg-white/80 border border-slate-200/60 text-left max-w-xl mx-auto space-y-1 shadow-sm">
                    <p className="text-xs font-semibold text-slate-800" id="assessment-prep-msg">
                      💡 {profileExp.preparationMessage}
                    </p>
                    <p className="text-xs text-slate-600" id="assessment-encouragement-msg">
                      ✨ {profileExp.encouragement}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {/* 1. Language Toggle */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Idioma do Jogo / Language</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setQuizLanguage(lang)}
                        className={`flex items-center justify-start gap-3 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                          quizLanguage.code === lang.code
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm"
                            : "border-slate-200 hover:border-indigo-200 text-slate-700 bg-white"
                        }`}
                      >
                        <span className="text-xl select-none">{lang.flag}</span>
                        <span className="text-left">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Category Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Área de Conhecimento</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setSelectedCategory("Cultura Geral")}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer text-left ${
                        selectedCategory === "Cultura Geral"
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm"
                          : "border-slate-200 hover:border-emerald-200 text-slate-700 bg-white"
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg ${selectedCategory === "Cultura Geral" ? "bg-emerald-100" : "bg-emerald-50"}`}>
                        <Compass className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base">Cultura Geral</p>
                        <p className="text-xs text-slate-500 font-medium">História, geografia, curiosidades de Angola.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedCategory("Disciplinas Escolares")}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer text-left ${
                        selectedCategory === "Disciplinas Escolares"
                          ? "border-teal-600 bg-teal-50/50 text-teal-900 shadow-sm"
                          : "border-slate-200 hover:border-teal-200 text-slate-700 bg-white"
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg ${selectedCategory === "Disciplinas Escolares" ? "bg-teal-100" : "bg-teal-50"}`}>
                        <BookOpen className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base">Disciplinas Escolares</p>
                        <p className="text-xs text-slate-500 font-medium">Matemática, Português, Ciências, etc.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Year of Schooling Grade Selector */}
                <div className="space-y-3 md:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Nível de Escolaridade</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {GRADES.map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setSelectedGrade(grade.id)}
                        className={`p-3 rounded-xl text-sm font-semibold text-center transition-all cursor-pointer border ${
                          selectedGrade === grade.id
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                            : "border-slate-200 hover:border-indigo-200 bg-white text-slate-700"
                        }`}
                      >
                        <div className="font-bold">{grade.label}</div>
                        <span className="text-[10px] opacity-75 font-normal block">{grade.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Main Title Banner */}
              <div className="text-center space-y-2 animate-fade-in">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-100/50">
                  <Brain className="w-9 h-9 animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
                  Quiz de Vocabulário Guardado
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Testa e consolida o teu domínio sobre as expressões guardadas no teu dicionário pessoal de conversas e aulas!
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-100 text-left animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border border-indigo-100/50 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700 self-start md:self-center">
                      <Sparkles className="w-6 h-6 text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Prática Personalizada Ativa</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        Geramos perguntas automáticas com as palavras que adicionaste no baralho. O sistema avalia a tua taxa de acerto e actualiza o teu perfil!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: Choose Language for Vocab */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Selecionar Idioma do Vocabulário</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setQuizLanguage(lang)}
                          className={`flex items-center justify-start gap-3 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                            quizLanguage.code === lang.code
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm"
                              : "border-slate-200 hover:border-indigo-200 text-slate-700 bg-white"
                          }`}
                        >
                          <span className="text-xl select-none">{lang.flag}</span>
                          <span className="text-left">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Stats & Actions */}
                  <div className="space-y-4">
                    {(() => {
                      const normalizedCode = (quizLanguage?.code || "en").toLowerCase().split("-")[0];
                      const languageSavedWords = (savedWords || []).filter(item => 
                        item.id && item.id.toLowerCase().startsWith(normalizedCode + "_")
                      );

                      if (languageSavedWords.length < 4) {
                        return (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4" id="vocab-empty-card">
                            <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-700 text-sm">Vocabulário insuficiente</h4>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Tens {languageSavedWords.length} de 4 palavras necessárias. Guarda vocabulário real na Biblioteca para gerar opções sem conteúdo demonstrativo.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-6 space-y-4" id="vocab-stats-card">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado do Baralho</span>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase tracking-wide">Pronto</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-xs">
                              <p className="text-2xl font-black text-indigo-600">{languageSavedWords.length}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Palavras Guardadas</p>
                            </div>
                            <div className="bg-white border border-slate-100 p-4 rounded-xl text-center shadow-xs">
                              <p className="text-2xl font-black text-amber-500">
                                {Math.min(5, languageSavedWords.length)}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Nº de Perguntas</p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed text-center">
                            O quiz irá testar a tua capacidade de traduzir termos entre <strong>Português</strong> e <strong>{quizLanguage.name}</strong>, alternando o sentido para treinar a fluência ativa e passiva!
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Trigger Button */}
          {quizError && (
            <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {quizError}
            </div>
          )}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-medium">
              {quizMode === "school" 
                ? "Nota: Perguntas customizadas para inspirar o interesse em sotaques, geografia e ciências angolanas e mundiais."
                : `Nota: Perguntas geradas dinamicamente com base nas expressões memorizadas no teu perfil de ${quizLanguage.name}.`}
            </div>
            {(() => {
              const normalizedCode = (quizLanguage?.code || "en").toLowerCase().split("-")[0];
              const languageSavedWords = (savedWords || []).filter(item => 
                item.id && item.id.toLowerCase().startsWith(normalizedCode + "_")
              );
              const disabled = isGenerating || (quizMode === "flashcard" && languageSavedWords.length < 4);

              return (
                <button
                  onClick={startQuiz}
                  disabled={disabled}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-2xl text-base shadow-lg transition-all cursor-pointer ${
                    disabled 
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none" 
                      : `${profileExp.accentClassName} hover:-translate-y-0.5`
                  }`}
                  id="btn-start-dynamic-quiz"
                >
                  <Flame className={`w-5 h-5 ${disabled ? "text-slate-400" : "text-amber-300 fill-amber-300 animate-pulse"}`} />
                  <span>{isGenerating ? "A criar quiz adaptado…" : profileExp.startActionLabel}</span>
                </button>
              );
            })()}
          </div>
        </div>
      ) : isFinished ? (
        /* ==================== FINAL SCOREBOARD SCREEN ==================== */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm text-center space-y-6 animate-fade-in">
          <div className="max-w-md mx-auto space-y-4">
            {/* Large Cup/Star Indicator */}
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-100 animate-bounce">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full animate-ping">
                <Star className="w-3 h-3 fill-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{rating.title}</h3>
              <p className="text-sm text-slate-500">{rating.desc}</p>
            </div>

            {/* Score Ring Display */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 inline-block w-full">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pontuação Final</p>
              <p className="text-5xl font-extrabold text-indigo-600">
                {score} <span className="text-2xl text-slate-400 font-semibold">/ {currentQuestions.length}</span>
              </p>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(score / currentQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Configuration Details Card */}
            <div className="flex justify-center gap-3 text-xs text-slate-500 font-semibold">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{selectedGrade}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">{selectedCategory}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                {quizLanguage.flag} {quizLanguage.name}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setIsPlaying(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Mudar Opções</span>
              </button>

              <button
                onClick={startQuiz}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-indigo-100 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jogar Outra Vez</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ACTIVE GAMEPLAY SCREEN ==================== */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Active Question Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pergunta {currentQuestionIndex + 1} de {currentQuestions.length}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <School className="w-3.5 h-3.5" />
                <span>{selectedGrade} — {selectedCategory} ({quizLanguage.name})</span>
              </div>
            </div>
            
            {/* Micro Timer or Score indicator */}
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-bold">
              <Trophy className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>{score} Certas</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + (isAnswerConfirmed ? 1 : 0)) / currentQuestions.length) * 100}%` }}
            />
          </div>

          {/* Active Question Box */}
          <div className="space-y-6 pt-2">
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 md:p-6 text-center">
              <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-60 animate-bounce" />
              <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-relaxed">
                {currentQuestions[currentQuestionIndex]?.question}
              </h3>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                const isSelected = selectedAnswerIndex === idx;
                const isCorrect = idx === currentQuestions[currentQuestionIndex].correctAnswerIndex;
                
                let optionStyle = "border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700";
                
                if (isSelected) {
                  optionStyle = "border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/10";
                }

                if (isAnswerConfirmed) {
                  if (isCorrect) {
                    // Always show correct in green
                    optionStyle = "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold";
                  } else if (isSelected) {
                    // If selected but incorrect, show in red
                    optionStyle = "border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20";
                  } else {
                    // Other incorrect choices get greyed out slightly
                    optionStyle = "border-slate-100 bg-slate-50/20 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerConfirmed}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border text-left font-semibold text-sm transition-all duration-200 flex items-center justify-between gap-3 ${optionStyle} ${!isAnswerConfirmed ? "cursor-pointer active:scale-98" : "cursor-default"}`}
                  >
                    <span>{option}</span>
                    <div className="shrink-0">
                      {isAnswerConfirmed ? (
                        isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        ) : null
                      ) : (
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-400"}`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Feedback / Explanations Block */}
          {isAnswerConfirmed && (
            <div className={`border rounded-2xl p-4 md:p-5 text-sm space-y-2 animate-fade-in ${
              selectedAnswerIndex === currentQuestions[currentQuestionIndex].correctAnswerIndex
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-800"
                : "bg-rose-50/40 border-rose-100 text-rose-800"
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {selectedAnswerIndex === currentQuestions[currentQuestionIndex].correctAnswerIndex ? (
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: "3s" }} />
                ) : (
                  <HelpCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{feedbackMessage}</span>
              </div>
              <p className="text-slate-600 font-medium font-normal leading-relaxed text-xs md:text-sm pt-1 border-t border-dashed border-slate-100">
                <strong>Explicação / Facto Curioso:</strong> {currentQuestions[currentQuestionIndex].explanation}
              </p>
            </div>
          )}

          {/* Action Footer */}
          {quizError && <p role="alert" className="mr-auto text-sm text-rose-600">{quizError}</p>}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            {!isAnswerConfirmed ? (
              <button
                disabled={selectedAnswerIndex === null || isGenerating}
                onClick={handleConfirmAnswer}
                className={`inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedAnswerIndex !== null
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>{isGenerating ? "A corrigir…" : currentQuestionIndex + 1 === currentQuestions.length ? "Enviar respostas" : "Guardar e continuar"}</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                <span>
                  {currentQuestionIndex + 1 === currentQuestions.length ? "Ver Resultados" : "Próxima Pergunta"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
