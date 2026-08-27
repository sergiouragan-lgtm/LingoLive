import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users, 
  Target, 
  ChevronRight, 
  Activity, 
  Globe, 
  HelpCircle,
  FileText,
  Play,
  Settings,
  Flame,
  ArrowRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { PronunciationService } from "../../services/pronunciation.service";
import { PronunciationResult, PronunciationReport } from "../../types/pronunciation";
import { learningProgressService } from "../../services/learningProgress.service";

interface PronunciationModuleProps {
  onAddXp?: (xp: number) => void;
  languageCode: string;
  languageName: string;
}

const PRESET_SCENARIOS = [
  {
    id: "scen_1",
    level: "Iniciante (A2)",
    title: "Apresentação Pessoal",
    text: "Hello, my name is João and I am very happy to join the global technology team.",
    translation: "Olá, o meu nome é João e estou muito feliz por me juntar à equipa global de tecnologia."
  },
  {
    id: "scen_2",
    level: "Intermédio (B2)",
    title: "Estratégia Corporativa",
    text: "In today's fast-paced corporate environment, continuous adaptability is the key indicator of long-term commercial success.",
    translation: "No ambiente corporativo acelerado de hoje, a adaptabilidade contínua é o principal indicador de sucesso comercial a longo prazo."
  },
  {
    id: "scen_3",
    level: "Avançado (C1)",
    title: "Apresentação a Investidores",
    text: "Let me briefly outline the strategic paradigm shift we are proposing to maximize shareholder value while ensuring organizational agility.",
    translation: "Permitam-me delinear brevemente a mudança de paradigma estratégico que estamos a propor para maximizar o valor dos acionistas e garantir a agilidade organizacional."
  }
];

export const PronunciationModule: React.FC<PronunciationModuleProps> = ({ onAddXp, languageCode, languageName }) => {
  const service = React.useMemo(() => new PronunciationService(), []);

  // System status
  const [isOnline, setIsOnline] = useState(service.isOnline());
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Active View Tab: 'practice' | 'student-report' | 'teacher-report'
  const [activeTab, setActiveTab] = useState<'practice' | 'student-report' | 'teacher-report'>('practice');

  // Selection
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0]);
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  
  // Waveform effect simulator
  const [waveHeights, setWaveHeights] = useState<number[]>(new Array(15).fill(4));

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [selectedPhoneme, setSelectedPhoneme] = useState<any>(null);

  // Report States
  const [studentReport, setStudentReport] = useState<PronunciationReport | null>(null);
  const [teacherReport, setTeacherReport] = useState<any>(null);
  const [historyResults, setHistoryResults] = useState<PronunciationResult[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Monitor online status & offline queue
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(service.isOnline());
    };
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    // Initial check
    setOfflineQueueCount(service.getOfflineQueue().length);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, [service]);

  // Load history and reports
  useEffect(() => {
    async function loadData() {
      try {
        const hist = await service.getResults();
        setHistoryResults(hist);

        const rep = await service.getReport();
        setStudentReport(rep);

        const tRep = await service.getTeacherReport();
        setTeacherReport(tRep);
      } catch (err) {
        console.error("Error loading pronunciation analytics:", err);
      }
    }
    loadData();
  }, [service, result]);

  // Handle waveform dynamic bounce during recording
  useEffect(() => {
    let animRef: any;
    if (isRecording) {
      animRef = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 24) + 6));
      }, 100);
    } else {
      setWaveHeights(new Array(15).fill(4));
    }
    return () => clearInterval(animRef);
  }, [isRecording]);

  // Timer counter for recording limit
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 25) {
            handleStopRecording();
            return 25;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // --- RECORDING MECHANICS ---
  const handleStartRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordedBase64(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const playUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(playUrl);

        // Convert blob to base64 for enterprise submission
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setRecordedBase64(base64Data);
        };

        // Stop all track streams to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("Para utilizar a avaliação de pronúncia, por favor permita o acesso ao microfone no seu navegador.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- SUBMISSION FOR ANALYSIS ---
  const handleEvaluate = async () => {
    if (!recordedBase64) return;
    const targetText = isCustomMode ? customText : selectedScenario.text;
    if (!targetText.trim()) return;

    setIsEvaluating(true);
    setResult(null);
    setSelectedPhoneme(null);

    try {
      const evaluation = await service.evaluatePronunciation(
        targetText,
        recordedBase64,
        languageName,
        "audio/webm"
      );

      setResult(evaluation);
      void learningProgressService.recordEvent({
        type: "pronunciation",
        language: languageCode,
        durationMinutes: Math.max(0.1, recordingDuration / 60),
        score: evaluation.overallScore,
        skills: ["speaking", "listening"],
      }).catch((error) => console.warn("Pronunciation progress sync failed:", error));
      if (onAddXp) {
        onAddXp(evaluation.overallScore >= 80 ? 100 : 50);
      }
    } catch (err: any) {
      if (err.message === "OFFLINE_MODE_SAVED") {
        setOfflineQueueCount(service.getOfflineQueue().length);
        alert("Modo Offline Ativado! O seu áudio foi gravado de forma segura localmente e será analisado automaticamente assim que reestabelecer a sua ligação à internet.");
      } else {
        console.error("Evaluation error:", err);
        alert(`Não foi possível completar a análise: ${err.message}`);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- OFFLINE SYNCING TRIGGER ---
  const handleOfflineSync = async () => {
    if (!isOnline) {
      alert("Ainda se encontra offline. Ligue-se a uma rede para sincronizar os seus áudios.");
      return;
    }

    try {
      const synced = await service.syncOfflineQueue((res) => {
        setResult(res);
      });
      setOfflineQueueCount(0);
      alert(`Sincronização Concluída! ${synced} gravação(ões) foram avaliadas com sucesso.`);
    } catch (err) {
      console.error("Error syncing offline queue:", err);
    }
  };

  // Helper dynamic coloring for scores
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-500 stroke-amber-500 bg-amber-50 border-amber-100";
    return "text-red-500 stroke-red-500 bg-red-50 border-red-100";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen" id="pronunciation-evaluation-module">
      
      {/* ENTERPRISE MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-md shadow-sky-200">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
              Módulo de Pronúncia Corporativa
            </span>
            
            {/* Online/Offline Badge */}
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">
                <Wifi className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-bold">
                <WifiOff className="w-3 h-3" /> Modo Offline
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Análise Avançada de Pronúncia IA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Grave a sua fala, receba feedback fonético phoneme-by-phoneme e reduza o seu sotaque em tempo real.
          </p>
        </div>

        {/* Offline queue warning banner */}
        {offlineQueueCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-3 rounded-2xl shadow-sm self-start">
            <div className="text-xs">
              <span className="font-bold text-amber-800 block">Modo Offline Ativo ({offlineQueueCount} áudio(s))</span>
              <span className="text-amber-600 text-[11px]">Grave offline, clique ao lado para sincronizar agora.</span>
            </div>
            <button
              onClick={handleOfflineSync}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Sincronizar
            </button>
          </div>
        )}
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 max-w-md">
        {[
          { id: 'practice', label: 'Treino de Pronúncia', icon: Mic },
          { id: 'student-report', label: 'Relatório do Aluno', icon: FileText },
          { id: 'teacher-report', label: 'Visão de Educador', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN VIEW CONTENTS */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PRACTICE & INTERACTIVE RECORDER */}
        {activeTab === 'practice' && (
          <motion.div 
            key="practice-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Control Column (Preset selection and Recorder UI) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Context Selector */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-500" /> Selecione o Contexto Empresarial
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Modo Personalizado:</span>
                    <button
                      onClick={() => setIsCustomMode(!isCustomMode)}
                      className={`w-8 h-4 rounded-full transition-all relative ${isCustomMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${isCustomMode ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                {!isCustomMode ? (
                  <div className="space-y-2.5">
                    {PRESET_SCENARIOS.map((scen) => (
                      <button
                        key={scen.id}
                        onClick={() => {
                          setSelectedScenario(scen);
                          setResult(null);
                          setRecordedAudioUrl(null);
                          setRecordedBase64(null);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                          selectedScenario.id === scen.id 
                            ? 'bg-indigo-50/40 border-indigo-200' 
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-extrabold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                              {scen.level}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{scen.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{scen.text}"</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 mt-1 transition-all ${selectedScenario.id === scen.id ? 'text-indigo-600' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400">Escreva o seu próprio texto a praticar:</label>
                    <textarea
                      placeholder="Ex: Good morning colleagues, today we are going to analyse the sales conversion metrics for our Luanda branch..."
                      value={customText}
                      onChange={(e) => {
                        setCustomText(e.target.value);
                        setResult(null);
                        setRecordedAudioUrl(null);
                        setRecordedBase64(null);
                      }}
                      className="w-full p-3 border border-slate-200 rounded-2xl text-xs bg-slate-50 focus:outline-indigo-500 h-24"
                    />
                  </div>
                )}
              </div>

              {/* ACTIVE SPEECH RECORDER PANEL */}
              <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    Sua Pronúncia Alvo
                  </span>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 min-h-16 flex items-center justify-center">
                    <p className="text-sm font-semibold text-slate-200 italic leading-relaxed">
                      "{isCustomMode ? (customText || "Escreva algo...") : selectedScenario.text}"
                    </p>
                  </div>
                  {!isCustomMode && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Trad: {selectedScenario.translation}
                    </p>
                  )}
                </div>

                {/* VISUAL SPECTRUM SIMULATOR */}
                <div className="h-16 flex items-end justify-center gap-1.5 px-8">
                  {waveHeights.map((h, i) => (
                    <motion.span 
                      key={i} 
                      animate={{ height: isRecording ? h : 4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`w-1 rounded-full ${isRecording ? 'bg-sky-400 shadow-md shadow-sky-500/50' : 'bg-slate-700'}`} 
                    />
                  ))}
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="flex flex-col items-center gap-4">
                  {isRecording && (
                    <span className="text-xs font-mono text-rose-400 animate-pulse flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                      <Flame className="w-3.5 h-3.5" /> A Gravar: {recordingDuration}s / 25s
                    </span>
                  )}

                  <div className="flex items-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all group"
                      >
                        <Mic className="w-6 h-6 group-hover:scale-110 transition-all" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="w-16 h-16 bg-rose-600 hover:bg-rose-700 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30 hover:scale-105 transition-all group animate-pulse"
                      >
                        <Square className="w-6 h-6 fill-white" />
                      </button>
                    )}
                  </div>

                  {/* Audio Playback feedback and Evaluation triggers */}
                  {recordedAudioUrl && (
                    <div className="w-full space-y-4 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
                        <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-sky-400" /> A sua gravação está pronta!
                        </span>
                        <audio src={recordedAudioUrl} controls className="w-40 h-8 accent-sky-400" />
                      </div>

                      <button
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-indigo-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            A Analisar Ondas Sonoras...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Submeter para Análise Avançada
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Report Column (Bento grid visualizer) */}
            <div className="lg:col-span-7">
              {result ? (
                <div className="space-y-6">
                  {/* BENTO ROW 1: PRIMARY DIALS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Nota Global", val: result.overallScore, color: getScoreColor(result.overallScore) },
                      { label: "Precisão Fonética", val: result.accuracyScore, color: getScoreColor(result.accuracyScore) },
                      { label: "Fluência / Ritmo", val: result.fluencyScore, color: getScoreColor(result.fluencyScore) },
                      { label: "Completude", val: result.completenessScore, color: getScoreColor(result.completenessScore) }
                    ].map((dial, index) => (
                      <div key={index} className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                          {dial.label}
                        </span>
                        
                        {/* Circular progress SVG */}
                        <div className="relative w-16 h-16 mb-2">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="4.5" fill="transparent" />
                            <circle 
                              cx="32" 
                              cy="32" 
                              r="28" 
                              strokeWidth="4.5" 
                              fill="transparent"
                              strokeDasharray={175}
                              strokeDashoffset={175 - (175 * dial.val) / 100}
                              strokeLinecap="round"
                              className={`transition-all duration-1000 ease-out ${dial.color.split(" ")[1]}`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-700">{dial.val}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* BENTO ROW 2: TRANSCRIPTION & NATIVE ACCENT */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                    {/* Transcription */}
                    <div className="sm:col-span-7 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Transcrição Reconhecida
                      </span>
                      <p className="text-xs text-slate-500 font-mono p-3 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed italic">
                        "{result.transcription}"
                      </p>
                      <p className="text-[10px] text-slate-400">
                        O motor comparou as ondas sonoras com as referências fonéticas nativas correspondentes.
                      </p>
                    </div>

                    {/* Accent Detection */}
                    <div className="sm:col-span-5 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                          Sotaque & Fluência
                        </span>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700">{result.accentDetected}</h4>
                            <p className="text-[10px] text-slate-400">Confiança: {result.accentConfidence}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2.5 mt-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Velocidade:</span>
                          <strong className="text-slate-700">{result.speechSpeedWpm} WPM</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Pausas Atípicas:</span>
                          <strong className="text-slate-700">{result.pauseCount}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BENTO ROW 3: DETAILED PHONEME ANALYSIS */}
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Análise de Fonemas Individuais (IPA)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Clique em cada fonema para visualizar o diagrama de colocação da língua e correção.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {result.phonemeAnalysis.map((ph, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPhoneme(ph)}
                          className={`px-3 py-2 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                            selectedPhoneme?.phoneme === ph.phoneme 
                              ? 'ring-2 ring-indigo-500 border-indigo-500' 
                              : ''
                          } ${
                            ph.accuracy >= 80 
                              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                              : ph.accuracy >= 60 
                              ? 'bg-amber-50/50 border-amber-100 text-amber-800' 
                              : 'bg-rose-50/50 border-rose-100 text-rose-800'
                          }`}
                        >
                          <span className="text-xs font-black font-mono">/{ph.ipaSymbol}/</span>
                          <div className="text-[9px]">
                            <span className="font-bold block">{ph.phoneme}</span>
                            <span className="opacity-80">{ph.accuracy}% precisão</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Selected Phoneme Details box */}
                    <AnimatePresence mode="wait">
                      {selectedPhoneme && (
                        <motion.div
                          key={selectedPhoneme.phoneme}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 border border-slate-100 p-4 rounded-2xl overflow-hidden space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-indigo-500" />
                              Guia de Pronúncia: /{selectedPhoneme.ipaSymbol}/ ({selectedPhoneme.phoneme})
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedPhoneme.accuracy >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Precisão: {selectedPhoneme.accuracy}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {selectedPhoneme.feedback}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* BENTO ROW 4: FEEDBACK & ACTION PLAN */}
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-100/50 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-600 rounded-xl text-white mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-700">Resumo de Treino & Melhoria</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {result.generalFeedback}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-sky-100/60 pt-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Dicas e Planos de Acção Recomendados:
                      </span>
                      <ul className="space-y-1.5">
                        {result.improvementTips.map((tip, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 animate-bounce">
                    <Mic className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Aguardando Gravação</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Escolha um cenário ou digite um texto personalizado, fale ao microfone e clique em submeter para ver o seu relatório fonético detalhado.
                  </p>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* VIEW 2: STUDENT ANALYTICS HISTORICAL REPORT */}
        {activeTab === 'student-report' && studentReport && (
          <motion.div
            key="student-report-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Overview stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Média Global", val: `${studentReport.averageOverall}%`, color: "text-indigo-600" },
                { label: "Precisão de Fonemas", val: `${studentReport.averageAccuracy}%`, color: "text-sky-600" },
                { label: "Ritmo e Fluência", val: `${studentReport.averageFluency}%`, color: "text-violet-600" },
                { label: "Tentativas Registadas", val: studentReport.totalAttempts, color: "text-emerald-600" }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {stat.label}
                  </span>
                  <span className={`text-xl font-extrabold ${stat.color}`}>
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Historical graph and critical errors list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Trend Chart */}
              <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                    Evolução de Pontuação Geral
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Acompanhamento de progresso didático ao longo das suas últimas tentativas.
                  </p>
                </div>

                <div className="h-64">
                  {studentReport.timelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studentReport.timelineData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Sem dados históricos suficientes. Faça o seu primeiro teste de fala para começar a traçar a evolução.
                    </div>
                  )}
                </div>
              </div>

              {/* Critical Phonemes List */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Sons Mais Críticos
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Sons e fonemas que mais reduziram a precisão geral.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {studentReport.commonErrorPhonemes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Nenhum fonema crítico registado de momento. Bom trabalho!
                      </div>
                    ) : (
                      studentReport.commonErrorPhonemes.map((ph, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                          <span className="w-7 h-7 bg-rose-500 rounded-xl text-white font-mono font-bold flex items-center justify-center text-xs">
                            !
                          </span>
                          <span className="text-xs font-bold text-slate-700">{ph}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 mt-4">
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    "Foque o seu tempo de treino individual nas fricativas interdentais para acelerar o progresso."
                  </p>
                </div>
              </div>

            </div>

            {/* Consolidated pedagogical feedback card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg">
              <h4 className="text-xs uppercase tracking-widest font-bold text-indigo-300 mb-2">
                Conclusão Pedagógica Consolidada
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {studentReport.feedbackSummary}
              </p>
              <div className="flex gap-4 items-center border-t border-slate-800 pt-4 text-[10px] text-slate-400">
                <span>Relatório Gerado: {new Date(studentReport.generatedAt).toLocaleDateString("pt-PT")}</span>
                <span>•</span>
                <span>Status da Conta: Estudante Ativo LingoLIVE</span>
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW 3: TEACHER MANAGEMENT OVERVIEW */}
        {activeTab === 'teacher-report' && teacherReport && (
          <motion.div
            key="teacher-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left teacher summary stats column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Analytics Summary */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Visão Geral da Turma síncrona
                </span>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Fluência Média</span>
                    <strong className="text-lg text-indigo-600">{teacherReport.averageClassFluency}%</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Precisão Fonética Média</span>
                    <strong className="text-lg text-sky-600">{teacherReport.averageClassAccuracy}%</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Alunos Avaliados</span>
                    <strong className="text-lg text-emerald-600">{teacherReport.activeStudentsScoredCount} Alunos</strong>
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 text-white p-6 rounded-3xl shadow-lg space-y-3">
                <span className="text-[10px] tracking-wider uppercase font-bold text-indigo-100">Roteiro Recomendado IA</span>
                <h4 className="text-xs font-black">Plano de Aula Automatizado para o Professor:</h4>
                <p className="text-xs text-indigo-50 leading-relaxed">
                  "{teacherReport.pedagogicalActionPlan}"
                </p>
              </div>

            </div>

            {/* Right details column */}
            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Avaliação Coletiva e Tendências Fonéticas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Resumo gerado com inteligência artificial para que o professor otimize a alocação de tempo didático.
                </p>
              </div>

              {/* Class Critical Phonemes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600">Sons com Menor Índice de Acerto Coletivo:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {teacherReport.criticalPhonemesToWorkOn.map((ph: string, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-700">{ph}</span>
                      <span className="text-[10px] text-red-500 font-bold mt-2.5">Abaixo do Alvo (A1-C2)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Teacher Logs */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-600">Recomendações da Direção Pedagógica:</h4>
                <ul className="space-y-2.5 text-xs text-slate-500 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                    <span>Incentive os estudantes angolanos a realizarem exercícios vocálicos de duração (Long vs Short Vowels), pois a língua portuguesa possui características monotongais que interferem em ditongos complexos do inglês.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                    <span>Utilize a ferramenta de feedback imediato de ondas de áudio do LingoLIVE IA durante as sessões presenciais para dar reforço positivo visual aos alunos em tempo real.</span>
                  </li>
                </ul>
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
