import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Sparkles, Trophy, Calendar, Download, Bookmark, Flame, 
  Award, BarChart3, HelpCircle, MessageSquare, Mic, PenTool, Play, 
  CheckCircle, Plus, Send, RefreshCw, Volume2, BookmarkCheck, ArrowRight,
  TrendingUp, Star, Shield, Lock, ChevronRight, Zap, Coffee, Clock, Heart,
  Smartphone, Eye, HelpCircle as HelpIcon, FileText, Check, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "../../context/ToastContext";
import { useUserRole } from "../../context/UserRoleContext";
import { PronunciationService } from "../../services/pronunciation.service";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// ----------------------------------------------------------------------
// TYPES & SCHEMAS
// ----------------------------------------------------------------------
interface StudentGoal {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly";
  target: number;
  current: number;
  unit: string;
  completed: boolean;
  xpReward: number;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  pronunciation: string;
  category: string;
}

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const StudentPortal: React.FC<{ setView?: (v: string) => void }> = ({ setView }) => {
  const { addToast } = useToast();
  const { role } = useUserRole();
  const user = auth.currentUser;

  // Tabs: dashboard (painel), ai-tutor (laboratórios), stats (métricas), downloads (offline)
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [aiLabTab, setAiLabTab] = useState<string>("conversation");

  // ----------------------------------------------------------------------
  // DYNAMIC STATES & LOCAL STORAGE SYNC
  // ----------------------------------------------------------------------
  const [xp, setXp] = useState<number>(3450);
  const [coins, setCoins] = useState<number>(120);
  const [level, setLevel] = useState<number>(8);
  const [streak, setStreak] = useState<number>(14);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [savedWords, setSavedWords] = useState<string[]>([
    "Wazekele (Bom dia)",
    "Mena (Água)",
    "Nzambi (Deus)",
    "Uazekela kyambote (Dormiste bem?)"
  ]);

  // Gamification load from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const docRef = doc(db, "user_gamification", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.xp) setXp(data.xp);
          if (data.coins) setCoins(data.coins);
          if (data.level) setLevel(data.level);
          if (data.streak) setStreak(data.streak);
        } else {
          // Initialize in Firestore safely
          await setDoc(docRef, {
            userId: user.uid,
            xp: 3450,
            level: 8,
            coins: 120,
            streak: 14,
            lastActiveDate: new Date().toISOString().split("T")[0],
            badges: ["Iniciante Kimbundu", "Streak de 7 dias", "Pronúncia de Ouro"],
            league: "Ouro"
          });
        }
      } catch (err) {
        console.warn("Failed loading user gamification, using fallback states.", err);
      }
    };
    fetchStats();
  }, [user]);

  const saveGamification = async (newXp: number, newCoins: number) => {
    setXp(newXp);
    setCoins(newCoins);
    if (!user) return;
    try {
      const docRef = doc(db, "user_gamification", user.uid);
      await updateDoc(docRef, {
        xp: newXp,
        coins: newCoins
      });
    } catch (e) {
      // Quiet fail if offline
    }
  };

  // ----------------------------------------------------------------------
  // MOCK RECORDS & ADAPTIVE DATA
  // ----------------------------------------------------------------------
  const [goals, setGoals] = useState<StudentGoal[]>([
    { id: "g-1", title: "Praticar conversação oral", type: "daily", target: 15, current: 15, unit: "minutos", completed: true, xpReward: 50 },
    { id: "g-2", title: "Completar lição diária", type: "daily", target: 1, current: 0, unit: "lição", completed: false, xpReward: 30 },
    { id: "g-3", title: "Aprender novo vocabulário", type: "weekly", target: 30, current: 18, unit: "palavras", completed: false, xpReward: 150 },
    { id: "g-4", title: "Acertar pronúncia fonética", type: "weekly", target: 10, current: 10, unit: "frases", completed: true, xpReward: 100 },
    { id: "g-5", title: "Milestone de proficiência CEFR", type: "monthly", target: 1, current: 0, unit: "milestone", completed: false, xpReward: 500 }
  ]);

  const leaderboard: LeaderboardUser[] = [
    { rank: 1, name: "António Miguel", avatar: "AM", xp: 4890, level: 11 },
    { rank: 2, name: "Lúcia Bento", avatar: "LB", xp: 4120, level: 10 },
    { rank: 3, name: user?.displayName || "Você", avatar: "VC", xp: xp, level: level, isCurrentUser: true },
    { rank: 4, name: "Sérgio Uragan", avatar: "SU", xp: 3200, level: 8 },
    { rank: 5, name: "Maria Inês", avatar: "MI", xp: 2950, level: 7 }
  ];

  const journeySteps = [
    { id: "j-1", title: "Saudações & Etiqueta", desc: "Cumprimentos básicos tradicionais em Kimbundu e Português Regional.", status: "completed", xp: 120 },
    { id: "j-2", title: "Mercados e Comércio", desc: "Vocabulário prático e negociação em feiras de Luanda.", status: "active", xp: 180 },
    { id: "j-3", title: "Gastronomia Tradicional", desc: "Ingredientes locais, pratos típicos e gírias de mesa.", status: "locked", xp: 200 },
    { id: "j-4", title: "Expressões de Cortesia", desc: "Formalidade e respeito em contextos rurais e profissionais.", status: "locked", xp: 250 },
    { id: "j-5", title: "Provérbios e Tradição", desc: "Histórias contadas por anciãos, sotaque de Cabinda e gírias.", status: "locked", xp: 300 }
  ];

  // ----------------------------------------------------------------------
  // COMPONENT WORKSPACES
  // ----------------------------------------------------------------------

  // A. AI Conversation & Labs States
  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: "AI Tutor", text: "Olá! Wazekele! Eu sou o teu tutor de inteligência artificial da LingoLIVE. Hoje vamos treinar conversação sobre 'Mercados de Luanda'. Como dirias 'Bom dia, quanto custa esta água?'", time: "Agora" }
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [sendingAi, setSendingAi] = useState<boolean>(false);
  const [grammarTips, setGrammarTips] = useState<string>("");

  const handleSendAiMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg = { sender: "Você", text: userInput, time: "Agora" };
    setAiMessages(prev => [...prev, userMsg]);
    const prompt = userInput;
    setUserInput("");
    setSendingAi(true);
    setGrammarTips("");

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("AUTH_REQUIRED");
      const res = await fetch("/api/learning-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          message: prompt,
          task: "angolan-cultural-conversation",
          context: {
            localization: { country: "AO" },
            targetRegion: "AO",
            allowRegionalExpressions: true,
          },
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiMessages(prev => [...prev, { sender: "AI Tutor", text: data.response, time: "Agora" }]);
        saveGamification(Number(data.progress?.xp || xp), coins + 2);
      } else {
        throw new Error("LEARNING_INTERACTION_FAILED");
      }
    } catch (e) {
      setAiMessages(prev => [...prev, {
        sender: "AI Tutor",
        text: "O Tutor IA está temporariamente indisponível. A tua resposta não foi pontuada nem gravada; tenta novamente dentro de instantes.",
        time: "Agora"
      }]);
    } finally {
      setSendingAi(false);
    }
  };

  // B. Speaking & pronunciation evaluation
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzingPronunciation, setIsAnalyzingPronunciation] = useState<boolean>(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [phoneticFeedback, setPhoneticFeedback] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pronunciationServiceRef = useRef(new PronunciationService());
  const pronunciationTarget = "Wazekele kyambote!";

  const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("AUDIO_READ_FAILED"));
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });

  const releaseMicrophone = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  useEffect(() => () => releaseMicrophone(), []);

  const evaluateRecordedAudio = async (blob: Blob) => {
    setIsAnalyzingPronunciation(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const result = await pronunciationServiceRef.current.evaluatePronunciation(
        pronunciationTarget,
        audioBase64,
        "Kimbundu / Português de Angola",
        blob.type || "audio/webm",
      );
      setTranscription(result.transcription);
      setPronunciationScore(result.overallScore);
      setPhoneticFeedback([result.generalFeedback, ...(result.improvementTips || [])].filter(Boolean).join(" "));
      saveGamification(xp + Math.max(5, Math.round(result.overallScore / 4)), coins + 4);
      addToast("Pronúncia avaliada com áudio real.", "success");
    } catch (error: any) {
      if (error?.message === "OFFLINE_MODE_SAVED") {
        addToast("Áudio guardado no dispositivo; será avaliado quando a ligação voltar.", "info");
      } else {
        addToast("Não foi possível avaliar o áudio. Nenhuma pontuação foi inventada.", "error");
      }
    } finally {
      setIsAnalyzingPronunciation(false);
    }
  };

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      addToast("Este navegador não suporta gravação de áudio.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : undefined);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onerror = () => {
        setIsRecording(false);
        releaseMicrophone();
        addToast("A gravação foi interrompida pelo navegador.", "error");
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setIsRecording(false);
        releaseMicrophone();
        if (blob.size === 0) {
          addToast("Nenhum áudio foi capturado. Tente novamente.", "error");
          return;
        }
        await evaluateRecordedAudio(blob);
      };
      recorder.start(250);
      setTranscription("");
      setPronunciationScore(null);
      setPhoneticFeedback("");
      setIsRecording(true);
      addToast(`Microfone ativo. Fale: “${pronunciationTarget}”`, "info");
    } catch (error: any) {
      releaseMicrophone();
      addToast(error?.name === "NotAllowedError" ? "Permissão do microfone recusada." : "Não foi possível iniciar o microfone.", "error");
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  };

  // C. Flashcard States
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: "fc-1", front: "Wazekele", back: "Bom dia (Singular)", pronunciation: "/wa-ze-ke-le/", category: "Saudações" },
    { id: "fc-2", front: "Mena", back: "Água", pronunciation: "/me-na/", category: "Vocabulário Básico" },
    { id: "fc-3", front: "Kimbundo", back: "Língua nacional do norte de Angola", pronunciation: "/kim-bun-do/", category: "Cultura" },
    { id: "fc-4", front: "Nzambi", back: "Deus / Força Criadora", pronunciation: "/n-zam-bi/", category: "Espiritualidade" },
    { id: "fc-5", front: "Kyambote", back: "Muito bem / Ótimo", pronunciation: "/kyam-bo-te/", category: "Expressões" }
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((currentCardIndex + 1) % flashcards.length);
    }, 200);
  };

  // D. Mock Exam Simulation
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [examScore, setExamScore] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [examFinished, setExamFinished] = useState<boolean>(false);

  const examQuestions: PracticeQuestion[] = [
    {
      id: "q-1",
      question: "Qual prefixo de concordância nominal é usado para indicar respeito ao falar com um ancião em Kimbundu?",
      options: ["Prefixo Ki- (Singular comum)", "Prefixo Ba- (Plural de dignidade)", "Prefixo Mu- (Classe pessoal)", "Prefixo Ka- (Diminutivo)"],
      correctAnswer: 1,
      explanation: "O prefixo Ba- demonstra respeito superlativo quando nos referimos a anciãos e líderes locais."
    },
    {
      id: "q-2",
      question: "A palavra gíria 'Bazar' no cotidiano de Luanda significa:",
      options: ["Montar uma feira comercial", "Comprar roupas baratas", "Ir embora rapidamente", "Beber água fresca"],
      correctAnswer: 2,
      explanation: "Bazar é uma das expressões informais mais comuns para indicar saída imediata ou despedida."
    },
    {
      id: "q-3",
      question: "Como se traduz corretamente a frase: 'Mwazekeleny kyambote'?",
      options: ["Dormiram bem, senhores?", "Até amanhã de manhã", "Como estão as crianças?", "Por favor, tragam água"],
      correctAnswer: 0,
      explanation: "A terminação '-ny' e o termo 'kyambote' criam o plural respeitoso formal de saudar pela manhã."
    }
  ];

  const handleAnswerQuestion = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNextExamQuestion = () => {
    if (selectedAnswer === null) return;
    if (currentQuestionIdx < examQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
    } else {
      // Calculate score
      let correct = 0;
      // In a real flow we would collect all answers, here we simulate based on this last actions
      setExamFinished(true);
      setExamScore(88); // mock score
      saveGamification(xp + 100, coins + 20);
      addToast("Parabéns! Exame simulado CEFR concluído com sucesso.", "success");
    }
  };

  // Offline Download Trigger
  const handleDownloadLesson = (lessonName: string) => {
    addToast(`Descarregando "${lessonName}" para armazenamento local IndexedDB...`, "info");
    setTimeout(() => {
      addToast(`"${lessonName}" disponível offline! (2.4 MB)`, "success");
    }, 1500);
  };

  // Goal Complete simulator
  const toggleGoalComplete = (goalId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextCompleted = !g.completed;
        if (nextCompleted) {
          saveGamification(xp + g.xpReward, coins + 5);
          addToast(`Meta concluída! +${g.xpReward} XP e +5 Moedas!`, "success");
        }
        return { ...g, completed: nextCompleted, current: nextCompleted ? g.target : 0 };
      }
      return g;
    }));
  };

  // ----------------------------------------------------------------------
  // RENDER INTERFACE
  // ----------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-2 md:p-6" id="student-portal-root">
      
      {/* 1. BRANDING HERO BANNER WITH USER PROFILE STATS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Welcome Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-black text-2xl font-mono shadow-inner">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AL"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold font-mono text-[10px] uppercase rounded-full border border-indigo-500/30">
                  LingoLive Student Pro
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1">Olá, {user?.displayName || "Estudante"}!</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Nível atual: <strong className="text-white">Kimbundu B2 (Malanje/Luanda)</strong> • Estudo Offline Ativo
              </p>
            </div>
          </div>

          {/* Gamified Widgets (XP, Coins, Streak) */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 font-mono text-center">
            
            {/* Streak widget */}
            <div className="px-3">
              <span className="text-slate-500 text-[9px] block uppercase font-bold tracking-wider">Streak</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-orange-400 font-extrabold text-base">
                <Flame className="w-4 h-4 fill-orange-400 text-orange-400 animate-bounce" />
                <span>{streak} d</span>
              </div>
            </div>

            {/* XP widget */}
            <div className="px-3 border-x border-slate-800">
              <span className="text-slate-500 text-[9px] block uppercase font-bold tracking-wider">XP Total</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-indigo-400 font-extrabold text-base">
                <Trophy className="w-4 h-4" />
                <span>{xp}</span>
              </div>
            </div>

            {/* Coins widget */}
            <div className="px-3">
              <span className="text-slate-500 text-[9px] block uppercase font-bold tracking-wider">Moedas</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-yellow-400 font-extrabold text-base">
                <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{coins}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. NAVIGATION BAR (Subtabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" id="student-dashboard-navigation">
        {[
          { id: "dashboard", label: "Meu Painel", icon: BookOpen },
          { id: "ai-tutor", label: "Tutor & Laboratórios IA", icon: Sparkles },
          { id: "stats", label: "Estatísticas & Progresso", icon: BarChart3 },
          { id: "downloads", label: "Estudo Offline & Biblioteca", icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isSelected 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-102" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TABS CONTENT SWITCHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TAB 1: MEU PAINEL (DASHBOARD) */}
        {activeTab === "dashboard" && (
          <>
            {/* Column A: Journey Roadmap & Today's Lessons (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Continue Learning Widget */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-3xl border border-indigo-500/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-200 font-mono text-[10px] uppercase font-bold">
                    <Clock className="w-3.5 h-3.5" /> Continuar de Onde Parou
                  </div>
                  <h3 className="text-lg font-black">Módulo 2: O Mercado de Luanda Sul</h3>
                  <p className="text-indigo-100 text-xs">Aprende a negociar preços, expressar valores em Kwanza e compreender sotaques regionais.</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("ai-tutor");
                    setAiLabTab("conversation");
                  }}
                  className="px-4 py-2.5 bg-white text-indigo-700 font-extrabold text-xs rounded-xl hover:bg-indigo-50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-700" /> Praticar Agora
                </button>
              </div>

              {/* Today's Lessons & Roadmap */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Minha Jornada de Aprendizado</h3>
                  <p className="text-slate-400 text-xs">Completa as lições ativas para desbloquear os próximos níveis e ganhar conquistas.</p>
                </div>

                <div className="space-y-4 relative pl-4 border-l border-slate-100 ml-2">
                  {journeySteps.map((step, idx) => (
                    <div key={step.id} className="relative">
                      {/* Interactive indicator pin */}
                      <div className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        step.status === "completed" ? "bg-emerald-500 border-emerald-600 text-white" :
                        step.status === "active" ? "bg-indigo-600 border-indigo-700 animate-pulse" :
                        "bg-white border-slate-200"
                      }`}>
                        {step.status === "completed" && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        step.status === "active" 
                          ? "bg-indigo-50/10 border-indigo-200 shadow-xs" 
                          : step.status === "completed"
                          ? "bg-slate-50/40 border-slate-100"
                          : "bg-white border-slate-100 opacity-60"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-slate-900 text-sm block">{step.title}</span>
                            <p className="text-slate-400 text-xs mt-1">{step.desc}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            +{step.xp} XP
                          </span>
                        </div>
                        {step.status === "active" && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="w-3/4 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "40%" }} />
                            </div>
                            <span className="text-[10px] text-indigo-600 font-bold font-mono">40% Completo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Column B: Goals & Leaderboard */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Daily Goals Panel */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wider">Metas de Aprendizado</h4>
                  <span className="text-[10px] text-indigo-600 font-bold font-mono bg-indigo-50 px-2 py-0.5 rounded">Checklists</span>
                </div>

                <div className="space-y-3">
                  {goals.map(goal => (
                    <div 
                      key={goal.id} 
                      onClick={() => toggleGoalComplete(goal.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        goal.completed 
                          ? "bg-emerald-50/20 border-emerald-100" 
                          : "bg-slate-50/60 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          goal.completed ? "bg-emerald-500 border-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {goal.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${goal.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {goal.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {goal.current}/{goal.target} {goal.unit} • {goal.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-indigo-600">
                        +{goal.xpReward} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard Section */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wider">Tabela de Liderança</h4>
                  <span className="text-[10px] text-amber-600 font-extrabold font-mono bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> Liga Ouro
                  </span>
                </div>

                <div className="space-y-2">
                  {leaderboard.map(userItem => (
                    <div 
                      key={userItem.rank}
                      className={`p-3 rounded-2xl flex items-center justify-between ${
                        userItem.isCurrentUser 
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md scale-102" 
                          : "bg-slate-50/50 border-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-black w-4 text-center ${
                          userItem.rank === 1 ? "text-yellow-500" :
                          userItem.rank === 2 ? "text-slate-400" :
                          userItem.isCurrentUser ? "text-white" : "text-slate-500"
                        }`}>
                          #{userItem.rank}
                        </span>
                        <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                          userItem.isCurrentUser ? "bg-white text-indigo-700 font-black" : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {userItem.avatar}
                        </div>
                        <div>
                          <span className="font-bold text-xs block">{userItem.name}</span>
                          <span className={`text-[9px] ${userItem.isCurrentUser ? "text-indigo-200" : "text-slate-400"}`}>
                            Nível {userItem.level}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-extrabold">{userItem.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 2: AI TUTOR & LABS */}
        {activeTab === "ai-tutor" && (
          <div className="lg:col-span-3 space-y-6">
            
            {/* Labs Vertical Navigation Header */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none border-b border-slate-100">
              {[
                { id: "conversation", label: "Conversação Diária", icon: MessageSquare },
                { id: "speaking", label: "Laboratório de Pronúncia (Whisper)", icon: Mic },
                { id: "writing", label: "Laboratório de Escrita", icon: PenTool },
                { id: "flashcards", label: "Flashcards Espaçados", icon: BookOpen },
                { id: "exams", label: "Exame CEFR Simulado", icon: Award }
              ].map(subTab => {
                const Icon = subTab.icon;
                const isSelected = aiLabTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setAiLabTab(subTab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs" 
                        : "bg-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB VIEW: AI CONVERSATION */}
            {aiLabTab === "conversation" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Scenario Selection Column */}
                <div className="md:col-span-1 space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm block">Cenário de Conversação</h4>
                  <p className="text-slate-400 text-xs">Escolha um contexto sociocultural adaptativo para simular com o tutor.</p>
                  
                  <div className="space-y-2">
                    {[
                      { id: "market", title: "Feira de Luanda Sul", desc: "Comércio de mantimentos", xp: "+15 XP/fala" },
                      { id: "restaurant", title: "Almoço no Kwanza Norte", desc: "Expressar preferências culinárias", xp: "+20 XP/fala" },
                      { id: "job", title: "Entrevista B2B / Corporativa", desc: "Sotaque técnico formal", xp: "+30 XP/fala" }
                    ].map(scene => (
                      <div key={scene.id} className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl cursor-pointer hover:border-indigo-200 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs text-indigo-950 block">{scene.title}</span>
                          <span className="text-[9px] text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded">{scene.xp}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-1">{scene.desc}</p>
                      </div>
                    ))}
                  </div>

                  {grammarTips && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed font-mono">
                      <div className="flex items-center gap-1.5 mb-1.5 font-bold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Dica de Calibração
                      </div>
                      {grammarTips}
                    </div>
                  )}
                </div>

                {/* Live Chat Interface */}
                <div className="md:col-span-2 flex flex-col h-[400px] border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold text-xs text-slate-900">Conversa com Co-Pilot AI (Kimbundu & PT-AO)</span>
                    </div>
                    <button 
                      onClick={() => setAiMessages([{ sender: "AI Tutor", text: "Reiniciando sessão de conversação. Como desejas saudar hoje?", time: "Agora" }])}
                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Limpar Chat
                    </button>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-3.5 my-4 pr-1">
                    {aiMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-sans leading-relaxed ${
                          msg.sender === "Você" 
                            ? "bg-indigo-600 text-white ml-auto rounded-tr-xs" 
                            : "bg-white text-slate-800 border border-slate-100 shadow-xs rounded-tl-xs"
                        }`}
                      >
                        <span className="text-[9px] block font-bold opacity-85 mb-1">{msg.sender}</span>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                    {sendingAi && (
                      <div className="max-w-[85%] p-3.5 rounded-2xl text-xs bg-white text-slate-400 border border-slate-100 shadow-xs rounded-tl-xs animate-pulse">
                        <span className="font-bold text-[9px] block">AI Tutor</span>
                        <span>Pensando e corrigindo gramática...</span>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Responda em Kimbundu ou Português..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSendAiMessage}
                      disabled={sendingAi}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-sm cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB VIEW: SPEAKING (WHISPER API CALL) */}
            {aiLabTab === "speaking" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Laboratório Neural de Pronúncia</h3>
                    <p className="text-slate-400 text-xs">Pressione o microfone para gravar uma frase. Analisamos ritmo, fonemas regionais e silabação.</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-mono text-[11px] font-bold">
                    Whisper API sintonizada para sotaques de Angola
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl relative overflow-hidden">
                  
                  {isRecording ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[...Array(6)].map((_, i) => (
                          <span key={i} className="w-1.5 h-8 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></span>
                        ))}
                      </div>
                      <p className="text-xs font-bold text-indigo-950 font-mono animate-pulse">Gravando... Fale “{pronunciationTarget}”</p>
                      <button onClick={handleStopRecording} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">Parar e avaliar</button>
                    </div>
                  ) : isAnalyzingPronunciation ? (
                    <div className="text-center space-y-3">
                      <RefreshCw className="w-9 h-9 text-indigo-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-indigo-950 font-mono">A avaliar áudio real…</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartRecording}
                      className="w-20 h-20 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-md border-4 border-indigo-100"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  )}

                  {!isRecording && !transcription && (
                    <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">Clique para iniciar</p>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {transcription && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6"
                    >
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Nota de Precisão</span>
                        <span className="text-4xl font-black text-indigo-600 block mt-1">{pronunciationScore}%</span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">Resultado real do avaliador</span>
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Transcrição de Áudio (Whisper API)</span>
                        <div className="p-3 bg-slate-900 text-white rounded-xl font-mono text-xs">
                          "{transcription}"
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic mt-2">
                          <strong>Comentário Fonético:</strong> {phoneticFeedback}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SUB-TAB VIEW: WRITING LAB */}
            {aiLabTab === "writing" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Laboratório de Escrita Acadêmica & Redação</h3>
                  <p className="text-slate-400 text-xs">Gere e submeta ensaios livres baseados em provérbios ou tradição oral de Angola para correção imediata.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Escreve o teu ensaio ou frase para calibração</label>
                  <textarea
                    rows={5}
                    placeholder="Cole ou escreva aqui o teu texto em Português Regional ou Kimbundu para análise gramatical..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => {
                    addToast("Ensaio enviado com sucesso para calibração corretiva por IA!", "success");
                    saveGamification(xp + 30, coins + 6);
                  }}
                  className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Analisar Gramática e Fluência
                </button>
              </div>
            )}

            {/* SUB-TAB VIEW: FLASHCARDS */}
            {aiLabTab === "flashcards" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <h3 className="font-extrabold text-slate-900 text-base">Flashcards Espaçados (Spaced Repetition)</h3>
                  <p className="text-slate-400 text-xs mt-1">Toque no card para revelar a tradução e a pronúncia fonética.</p>
                </div>

                {/* Flip Card Container */}
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full max-w-sm h-60 bg-gradient-to-br rounded-3xl cursor-pointer transition-all duration-500 shadow-lg relative p-6 flex flex-col items-center justify-center border text-center ${
                    isFlipped 
                      ? "from-slate-900 to-slate-950 text-white border-slate-800" 
                      : "from-indigo-600 to-indigo-800 text-white border-indigo-700"
                  }`}
                >
                  <span className="absolute top-4 left-4 text-[10px] uppercase font-mono tracking-wider opacity-60">
                    {flashcards[currentCardIndex].category}
                  </span>

                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div
                        key="front"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-2"
                      >
                        <h2 className="text-3xl font-black tracking-tight">{flashcards[currentCardIndex].front}</h2>
                        <span className="text-xs font-mono opacity-80 block">{flashcards[currentCardIndex].pronunciation}</span>
                        <span className="text-[10px] opacity-50 block mt-4 uppercase">Toque para ver a resposta</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="back"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-2"
                      >
                        <h2 className="text-2xl font-black tracking-tight">{flashcards[currentCardIndex].back}</h2>
                        <span className="text-xs opacity-60 block mt-4 uppercase">Toque para voltar ao termo</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card navigation tools */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      addToast("Salvou o termo nas suas palavras favoritas!", "success");
                      if (!savedWords.includes(flashcards[currentCardIndex].front)) {
                        setSavedWords([...savedWords, `${flashcards[currentCardIndex].front} (${flashcards[currentCardIndex].back})`]);
                      }
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer text-slate-600"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextCard}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                  >
                    Próximo Card <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-TAB VIEW: EXAMS */}
            {aiLabTab === "exams" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                
                {!examStarted ? (
                  <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                    <Award className="w-14 h-14 text-indigo-600 mx-auto" />
                    <h3 className="font-extrabold text-slate-900 text-lg">Simulado de Proficiência LingoLIVE</h3>
                    <p className="text-slate-400 text-xs">
                      Este simulado consiste em 3 questões estruturadas de gramática, cultura e fonética. Finalizar com sucesso recompensa um bônus massivo de XP.
                    </p>
                    <button
                      onClick={() => setExamStarted(true)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Iniciar Simulado Agora
                    </button>
                  </div>
                ) : examFinished ? (
                  <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                    <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
                    <h3 className="font-extrabold text-slate-900 text-lg">Simulado Concluído!</h3>
                    <p className="text-slate-400 text-xs">
                      A tua nota calculada foi de <strong>{examScore}%</strong>. Aprovado com calibração acadêmica no nível de fluência!
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-left space-y-1">
                      <span className="text-slate-500">Respostas corretas: **3/3**</span>
                      <span className="text-slate-500">Recompensas recebidas: **+100 XP, +20 Moedas**</span>
                    </div>
                    <button
                      onClick={() => {
                        setExamStarted(false);
                        setExamFinished(false);
                        setCurrentQuestionIdx(0);
                        setSelectedAnswer(null);
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Voltar ao Início do Exame
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-slate-400 font-mono">Questão {currentQuestionIdx + 1} de {examQuestions.length}</span>
                      <span className="text-xs font-bold text-indigo-600 font-mono">Bônus: +100 XP</span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-relaxed">
                      {examQuestions[currentQuestionIdx].question}
                    </h4>

                    <div className="space-y-2.5">
                      {examQuestions[currentQuestionIdx].options.map((option, optIdx) => (
                        <div 
                          key={optIdx}
                          onClick={() => handleAnswerQuestion(optIdx)}
                          className={`p-3.5 rounded-2xl border text-xs font-medium cursor-pointer transition-all ${
                            selectedAnswer === optIdx 
                              ? "bg-indigo-600 text-white border-indigo-700" 
                              : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleNextExamQuestion}
                      disabled={selectedAnswer === null}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                    >
                      {currentQuestionIdx === examQuestions.length - 1 ? "Finalizar Simulado" : "Próxima Questão"}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* TAB 3: STATISTICS & PROGRESS */}
        {activeTab === "stats" && (
          <>
            {/* Visual Charts spans 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Radar Chart: Domain distribution */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Evolução do Domínio Linguístico</h3>
                <p className="text-slate-400 text-xs">Métricas integradas de gramática, vocabulário, ritmo e pronúncia sintonizadas por IA.</p>
                
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Gramática', A: 85, fullMark: 100 },
                      { subject: 'Vocabulário', A: 92, fullMark: 100 },
                      { subject: 'Pronúncia', A: 78, fullMark: 100 },
                      { subject: 'Escrita', A: 88, fullMark: 100 },
                      { subject: 'Compreensão', A: 95, fullMark: 100 }
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" fontSize={11} stroke="#475569" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={9} />
                      <Radar name="Você" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Line Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Frequência Semanal e Retenção</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Seg', XP: 120 },
                      { name: 'Ter', XP: 240 },
                      { name: 'Qua', XP: 180 },
                      { name: 'Qui', XP: 310 },
                      { name: 'Sex', XP: 150 },
                      { name: 'Sáb', XP: 450 },
                      { name: 'Dom', XP: 380 }
                    ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={9} stroke="#94a3b8" />
                      <YAxis fontSize={9} stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="XP" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Column B: Recommendations and Certificate View */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Recommendations */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wider">Diretrizes do Tutor</h4>
                
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-2xl text-amber-900 flex items-start gap-2.5">
                    <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5">Treino de Pronúncia Pendente</strong>
                      <span>A tua fonética em contrações sintáticas reduziu. Grava 3 frases no Laboratório de Pronúncia hoje.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 flex items-start gap-2.5">
                    <Star className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5">Pronto para Novo Milestone</strong>
                      <span>Completaste saudações com 96% de assiduidade. Inicia o simulado CEFR de nível B2.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shareable Certificate Wrapper */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
                <Award className="w-12 h-12 text-yellow-400 mx-auto fill-yellow-400/20" />
                
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm tracking-tight text-white">Certificado Milestones B2</h4>
                  <p className="text-slate-400 text-xs">Conquistaste a proficiência teórica nos dialetos e cultura do norte de Angola.</p>
                </div>

                <button
                  onClick={() => addToast("Certificado PDF exportado para transferência com sucesso!", "success")}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Baixar Certificado Acadêmico (PDF)
                </button>
              </div>

            </div>
          </>
        )}

        {/* TAB 4: OFFLINE DOWNLOADS & FAVORITES */}
        {activeTab === "downloads" && (
          <div className="lg:col-span-3 space-y-6">
            
            {/* Interactive Bookmarks list */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Vocabulário Favorito & Bookmarks</h3>
                  <p className="text-slate-400 text-xs">Estes termos são salvos localmente e sincronizados no seu dispositivo móvel.</p>
                </div>
                <button
                  onClick={() => {
                    addToast("Limpou o histórico de termos favoritos.", "info");
                    setSavedWords([]);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Limpar Todos
                </button>
              </div>

              {savedWords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedWords.map((word, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100/85 rounded-xl flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{word}</span>
                      <BookmarkCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Nenhuma palavra salva nos favoritos ainda. Navegue nos flashcards para salvar!
                </div>
              )}
            </div>

            {/* Simulated Offline Study download cards */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Módulos para Estudo Offline</h3>
                  <p className="text-slate-400 text-xs">Transfira áudios fonéticos e textos para estudar sem ligação de internet.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold font-mono">Modo Offline Simulado:</span>
                  <button
                    onClick={() => {
                      setOfflineMode(!offlineMode);
                      addToast(offlineMode ? "Modo online restabelecido!" : "Modo offline simulado ativo!", "info");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      offlineMode ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                    }`}
                  >
                    {offlineMode ? "OFFLINE ATIVO" : "SINC. ONLINE"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Gramática Kimbundu Básica", size: "1.8 MB", lessons: "4 lições" },
                  { name: "Sotaques Provinciais de Cabinda", size: "4.2 MB", lessons: "6 áudios de treino" },
                  { name: "Culinária e Conversas de Mesa", size: "2.1 MB", lessons: "3 simulações" }
                ].map((mod, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex flex-col justify-between h-36 hover:border-slate-200 transition-all">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{mod.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">{mod.lessons} • {mod.size}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadLesson(mod.name)}
                      className="mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar para o Aparelho
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
