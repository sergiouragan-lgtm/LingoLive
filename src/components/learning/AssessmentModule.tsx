import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  CheckSquare, 
  Clock, 
  HelpCircle, 
  Play, 
  Award, 
  Settings, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle, 
  Mic, 
  Volume2, 
  Sparkles, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Search, 
  Plus, 
  GraduationCap, 
  ShieldCheck, 
  Map, 
  TrendingUp, 
  Briefcase, 
  Printer, 
  Share2,
  Lock,
  PlayCircle,
  Cpu,
  ShieldAlert,
  FileSignature,
  Brain,
  Activity,
  PenTool,
  MessageSquare,
  Database,
  Layout,
  Network,
  Fingerprint,
  Gavel,
  Zap,
  Target,
  Layers,
  Globe
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from "recharts";
import { AssessmentService } from "../../services/assessment.service";
import { Exam, ScheduledExam, ExamAttempt, Certificate, Question } from "../../types/assessment";

interface AssessmentModuleProps {
  setView?: (view: any) => void;

  onAddXp?: (xp: number) => void;
}

export const AssessmentModule: React.FC<AssessmentModuleProps> = ({ onAddXp, setView }) => {
  const service = React.useMemo(() => new AssessmentService(), []);

  // Mode: "portal" (selection/scheduler) | "active-exam" | "grading-result"
  const [moduleMode, setModuleMode] = useState<"portal" | "active-exam" | "grading-result">("portal");

  // Selection
  const [exams, setExams] = useState<Exam[]>([]);
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [historyAttempts, setHistoryAttempts] = useState<ExamAttempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Selected for exam-taking
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [adaptiveActivated, setAdaptiveActivated] = useState(false);
  const [studentName, setStudentName] = useState("Sérgio");

  // Exam engine runtime state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<{ [qId: string]: string }>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [examTotalDuration, setExamTotalDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastExamResult, setLastExamResult] = useState<{ attempt: ExamAttempt; certificate?: Certificate } | null>(null);

  // Scheduler creator
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [schedExamId, setSchedExamId] = useState("");
  const [schedTitle, setSchedTitle] = useState("");
  const [schedClass, setSchedClass] = useState("Vendas Internacionais S1");

  // Audio recording inside questions
  const [isRecordingAnswer, setIsRecordingAnswer] = useState<string | null>(null); // qId being recorded
  const [recordedBase64, setRecordedBase64] = useState<{ [qId: string]: string }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Analytics tab selection inside portal
  const [portalTab, setPortalTab] = useState<"exams" | "history" | "certificates" | "instructor" | "iace">("exams");

  // --- IACE ANTI-CHEATING STATE ---
  const [cheatWarnings, setCheatWarnings] = useState<number>(0);
  const [isAntiCheatEnabled, setIsAntiCheatEnabled] = useState(true);

  // Timer reference
  const countdownIntervalRef = useRef<any>(null);

  // Initialize and load
  useEffect(() => {
    async function loadData() {
      try {
        const exList = await service.getExams();
        setExams(exList);

        const sList = await service.getScheduledExams();
        setScheduledExams(sList);

        const attempts = await service.getAttempts();
        setHistoryAttempts(attempts);

        const certList = await service.getCertificates();
        setCertificates(certList);
      } catch (err) {
        console.error("Error loading assessment data:", err);
      }
    }
    loadData();
  }, [service, moduleMode]);

  // --- IACE ANTI-CHEATING EFFECT ---
  useEffect(() => {
    if (moduleMode !== "active-exam" || !isAntiCheatEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatingAttempt("Mudança de aba ou minimização de janela detectada");
      }
    };

    const handleWindowBlur = () => {
      handleCheatingAttempt("Foco da janela perdido");
    };

    const handleCheatingAttempt = (reason: string) => {
      setCheatWarnings((prev) => {
        const newWarnings = prev + 1;
        if (newWarnings >= 3) {
          alert(`IACE Anti-Cheat: ${reason}. Limite de advertências atingido (3/3). O exame será submetido automaticamente para avaliação de fraude.`);
          handleSubmitExam(); // Force submit
        } else {
          alert(`IACE Anti-Cheat Aviso (${newWarnings}/3): ${reason}. Por favor, mantenha o foco no exame. Múltiplas violações resultarão em submissão automática e anulação.`);
        }
        return newWarnings;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleMode, isAntiCheatEnabled]);

  // Exam Timer Countdown
  useEffect(() => {
    if (moduleMode === "active-exam" && examTimeRemaining > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownIntervalRef.current);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [moduleMode, examTimeRemaining]);

  // --- AUDIO QUESTION ANSWER CAPTURE ---
  const handleStartAudioAnswer = async (qId: string) => {
    audioChunksRef.current = [];
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
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Str = reader.result as string;
          setRecordedBase64(prev => ({ ...prev, [qId]: base64Str }));
          setTempAnswers(prev => ({ ...prev, [qId]: "Gravação de áudio guardada" }));
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecordingAnswer(qId);
    } catch (err) {
      console.error(err);
      alert("Microfone não acessível.");
    }
  };

  const handleStopAudioAnswer = () => {
    if (mediaRecorderRef.current && isRecordingAnswer) {
      mediaRecorderRef.current.stop();
      setIsRecordingAnswer(null);
    }
  };

  // --- START EXAM ---
  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setTempAnswers({});
    setRecordedBase64({});
    setCurrentQuestionIndex(0);
    setExamTotalDuration(exam.durationMin * 60);
    setExamTimeRemaining(exam.durationMin * 60);
    setModuleMode("active-exam");
  };

  // --- AUTO SUBMIT ON TIMEOUT ---
  const handleAutoSubmit = () => {
    alert("O tempo limite do exame expirou! Suas respostas serão enviadas automaticamente para correção por inteligência artificial.");
    handleSubmitExam();
  };

  // --- MANUAL EXAM SUBMIT ---
  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setIsSubmitting(true);

    try {
      const submissionsList = activeExam.questions.map(q => {
        // If speaking answer base64 exists, send it. Else send text
        const finalVal = recordedBase64[q.id] || tempAnswers[q.id] || "";
        return {
          questionId: q.id,
          value: finalVal
        };
      });

      const res = await service.submitExam(activeExam.id, submissionsList, studentName);
      setLastExamResult(res);
      setModuleMode("grading-result");

      if (res.attempt.passed && onAddXp) {
        onAddXp(150); // High points for passing formal enterprise certification
      }
    } catch (err: any) {
      alert(`Erro na correção: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EXAM SCHEDULER SUBMIT ---
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedExamId) return;
    try {
      await service.scheduleExam(schedExamId, schedTitle, schedClass);
      setShowSchedulerModal(false);
      setSchedTitle("");
      
      // reload
      const sList = await service.getScheduledExams();
      setScheduledExams(sList);
      alert("Exame agendado com sucesso para a turma!");
    } catch (err) {
      alert("Erro ao agendar.");
    }
  };

  // --- ADAPTIVE EXAM FILTER ---
  // If adaptive is checked, we can dynamically sort questions by current performance
  const getSortedQuestions = (): Question[] => {
    if (!activeExam) return [];
    if (!adaptiveActivated) return activeExam.questions;
    
    // Simple simulation: adaptive exams prioritize advanced grammar questions first,
    // and if the user gets the first ones correct, they see more challenging subjective pitches.
    // Let's sort them alphabetically/by difficulty
    const sorted = [...activeExam.questions];
    sorted.sort((a, b) => {
      const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });
    return sorted;
  };

  const activeQuestions = getSortedQuestions();
  const currentQuestion = activeQuestions[currentQuestionIndex];

  // Formatting remaining time helper
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`;
  };

  // Calculate radar analysis mock chart data based on history attempts
  const getRadarData = () => {
    if (historyAttempts.length === 0) {
      return [
        { subject: "Listening", score: 80 },
        { subject: "Speaking", score: 70 },
        { subject: "Writing", score: 65 },
        { subject: "Grammar", score: 85 },
        { subject: "Vocabulary", score: 75 }
      ];
    }
    // Aggregate scores from categories
    return [
      { subject: "Listening Comprehension", score: 82 },
      { subject: "Fluency & Pitch", score: 76 },
      { subject: "Structural Writing", score: 71 },
      { subject: "Syntactic Grammar", score: 84 },
      { subject: "Executive Lexicon", score: 79 }
    ];
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen" id="enterprise-assessment-platform">
      
      {/* ----------------- VIEW MODE 1: ASSESSMENT PORTAL ----------------- */}
      {moduleMode === "portal" && (
        <div className="space-y-8">
          
          {/* HEADER ROW */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl text-white shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
                  LingoLIVE Certification Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Plataforma de Avaliação Empresarial
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Aceda a exames de proficiência formais, veja o seu banco de questões e emita certificados verificados com IA.
              </p>
            </div>

            {/* Quick Profile config */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Nome do Aluno:</span>
              <input 
                type="text" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-indigo-500 w-28"
              />
            </div>
          </div>

          {/* INTERNAL TAB TOGGLE */}
          <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl max-w-lg scrollbar-none">
            {[
              { id: 'exams', label: 'Exames Disponíveis', icon: FileText },
              { id: 'history', label: 'Histórico de Provas', icon: Clock },
              { id: 'certificates', label: 'Certificados Emitidos', icon: Award },
              { id: 'instructor', label: 'Painel do Professor', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = portalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPortalTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
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

          {/* TAB 1: EXAMS & QUESTION BANK */}
          {portalTab === "exams" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Exams list */}
              <div className="lg:col-span-8 space-y-6">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" /> Exames e Provas Formativas Ativas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {exams.map((ex) => {
                    const isAssigned = scheduledExams.some(s => s.examId === ex.id && s.status === "pending");
                    return (
                      <div key={ex.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                        
                        {isAssigned && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white font-bold text-[9px] px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-wide">
                            Agendado
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                              {ex.language}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                              {ex.questions.length} Questões
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                            {ex.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                            {ex.description}
                          </p>
                        </div>

                        <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-300" /> {ex.durationMin} min</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-slate-300" /> Nota Mínima: {ex.passingScorePercent}%</span>
                          </div>

                          <button
                            onClick={() => handleStartExam(ex)}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-100 group-hover:scale-105"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side Question Bank / Adaptive controls info */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Adaptive mode setting */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Exame Adaptativo IA
                    </span>
                    
                    <button
                      onClick={() => setAdaptiveActivated(!adaptiveActivated)}
                      className={`w-9 h-5 rounded-full transition-all relative ${adaptiveActivated ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${adaptiveActivated ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200">Ajuste de Dificuldade Automático</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Quando ativo, o motor avalia o seu desempenho em tempo real. Respostas corretas introduzem progressivamente tópicos de nível C1 com rubricas rigorosas de redação corporativa.
                  </p>
                </div>

                {/* Rubrics Preview Info */}
                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Critérios de Rubricas IA
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nossas redações e respostas faladas são medidas sob parâmetros oficiais do Quadro Europeu Comum de Referência (CEFR):
                  </p>
                  
                  <div className="space-y-2 pt-2 text-[10px]">
                    {[
                      { d: "Alcance Lexical", desc: "Variedade de termos de marketing, finanças e governança corporativa." },
                      { d: "Coesão Sintática", desc: "Uso de conectores avançados de discurso e orações relativas." },
                      { d: "Fluência Oral", desc: "Redução de hesitações longas de áudio e pausas não naturais." }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <strong className="text-slate-700 block">{item.d}</strong>
                        <span className="text-slate-400">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: HISTORY ATTEMPTS & ANALYTICS */}
          {portalTab === "history" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* History list */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Histórico de Tentativas Realizadas
                </h3>

                {historyAttempts.length === 0 ? (
                  <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs text-slate-400">
                    Nenhuma prova finalizada de momento. Faça o seu primeiro exame corporativo!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyAttempts.map((att) => {
                      const examObj = exams.find(e => e.id === att.examId);
                      return (
                        <div key={att.id} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex justify-between items-center gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                                att.passed 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                                {att.passed ? "APROVADO" : "NÃO APROVADO"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(att.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-700">{examObj?.title || "Exame Corporativo"}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{att.generalFeedback}"</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-black text-slate-800 block">{att.scorePercent}%</span>
                            <span className="text-[9px] text-slate-400">{att.totalPointsEarned} / {att.totalPointsPossible} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Analytics Summary Charts */}
              <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Competências Globais de Negócios
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Análise poligonal de proficiência sintática e conversacional extraída do seu histórico.
                  </p>
                </div>

                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={8} />
                      <Radar name={studentName} dataKey="score" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
                  <strong>Recomendação IA para Próximos Passos:</strong><br/>
                  Sua pontuação estrutural em Gramática é estelar (84%), mas a clareza e ritmo de fala (Pitching) indicam necessidade de exercícios adicionais no Módulo de Pronúncia.
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CERTIFICATES EMITTED */}
          {portalTab === "certificates" && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-5 h-5 text-indigo-500" /> Seus Certificados Corporativos Oficiais
              </h3>

              {certificates.length === 0 ? (
                <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center text-xs text-slate-400 max-w-md mx-auto">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-600">Ainda sem Certificados</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Complete com sucesso qualquer exame de proficiência com aproveitamento acima de 70% para emitir o seu diploma digital verificado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="bg-white border-2 border-amber-100 p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between space-y-6">
                      
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -top-6 -right-6 w-20 h-20 border border-amber-100/50 rounded-full" />
                      
                      {/* Badge header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-amber-50 rounded-xl text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100">
                            ★
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 block">Certificado Verificado</span>
                            <span className="text-[9px] text-slate-400">LingoLIVE IA Language Assessment</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">{cert.verificationCode}</span>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 text-center py-4">
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">Este documento oficial comprova que</p>
                        <h4 className="text-xl font-black text-slate-800 font-serif tracking-wide">{cert.studentName}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                          completou com aproveitamento exemplar de <strong>{cert.scorePercent}%</strong> a avaliação oficial em {cert.examTitle}.
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-50 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Emitido em: {new Date(cert.issueDate).toLocaleDateString()}</span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.print()}
                            className="p-1.5 hover:bg-slate-50 rounded border border-slate-200 text-slate-500"
                            title="Imprimir Certificado"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEACHER ASSIGNMENTS / MANAGEMENT PANEL */}
          {portalTab === "instructor" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Schedulers list */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                      Agendamentos Activos de Exames
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Provas distribuídas às turmas de conversação e admissão LingoLIVE.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSchedExamId(exams[0]?.id || "");
                      setSchedTitle(exams[0]?.title || "");
                      setShowSchedulerModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md shadow-indigo-100"
                  >
                    <Plus className="w-4 h-4" /> Agendar Prova
                  </button>
                </div>

                <div className="space-y-3">
                  {scheduledExams.map((sc) => (
                    <div key={sc.id} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Turma: {sc.className || "Geral"}
                        </span>
                        <h4 className="text-xs font-black text-slate-700">{sc.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Limite: {new Date(sc.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          sc.status === "completed" 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                        }`}>
                          {sc.status === "completed" ? "Concluído" : "Pendente de Realização"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Class Performance */}
              <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Visão Colectiva de Exames
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Métricas gerais de aprovação das turmas corporativas administradas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Média Colectiva B2</span>
                    <strong className="text-lg text-indigo-600">79.2% de Acerto</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Taxa de Aprovação</span>
                    <strong className="text-lg text-emerald-600">84% Aprovados</strong>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">
                    "O uso de critérios subjetivos baseados nas rubricas da LingoLIVE reduziu o tempo de correção manual de ensaios orais em 92%."
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: INTELLIGENT ASSESSMENT & CERTIFICATION ENGINE (IACE) */}
          {portalTab === "iace" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cpu className="w-48 h-48" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="text-indigo-300 font-bold tracking-widest text-xs uppercase mb-2 block">Enterprise Assessment Module</span>
                  <h2 className="text-3xl font-black mb-4">Intelligent Assessment & Certification Engine (IACE)</h2>
                  <p className="text-indigo-100/80 mb-6 leading-relaxed">
                    Painel de Controlo Anti-Fraude e Motor de Avaliação Inteligente. Monitorize exames em tempo real com validação biométrica, scoring de pronúncia por IA, e bloqueio de ecrã (Anti-Cheating) para assegurar a integridade total dos certificados CEFR emitidos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* 1. Sistema Completo de Avaliações */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Avaliações Completas</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Testes rápidos, quizzes, trabalhos e simulações que englobam vertentes orais, escritas, auditivas e de leitura.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Omni-Canal</span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">360º</span>
                  </div>
                </div>

                {/* 2. Motor de Exames Adaptativos */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Exames Adaptativos</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow relative z-10">
                    A dificuldade altera-se em tempo real. Respostas certas aumentam a complexidade, identificando falhas e domínios com precisão cirúrgica.
                  </p>
                  <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out p-6 flex flex-col justify-center items-center text-center">
                    <p className="text-white text-xs font-bold mb-3">Experimente o motor adaptativo em ação!</p>
                    <button 
                      onClick={() => setView?.("adaptive-engine")}
                      className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-transform"
                    >
                      Testar Simulador IACE
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto relative z-10 group-hover:opacity-0 transition-opacity">
                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">Real-Time</span>
                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">Dinâmico</span>
                  </div>
                </div>

                {/* 3. Avaliação Contínua por IA */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Avaliação Contínua</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Auditoria passiva de fluência, gramática e vocabulário ao longo do tempo. Monitorização evolutiva sem a pressão de exames formais.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md">Background</span>
                    <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md">Evolutivo</span>
                  </div>
                </div>

                {/* 4. Avaliação Oral */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Análise Oral</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Análise semântica profunda: pausas, confiança, uso de expressões idiomáticas e adequação do discurso ao contexto.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-2 py-1 rounded-md">Semântica</span>
                    <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-2 py-1 rounded-md">Discurso</span>
                  </div>
                </div>

                {/* 5. Avaliação de Pronúncia Neural */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-4">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Pronúncia Neural</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Análise fonética ao nível do milissegundo: entoação, ligações lexicais e diferenças dialetais face a falantes nativos.
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-auto mb-2">
                    <div className="bg-pink-500 w-full h-full rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 block">MODELO ACÚSTICO V3</span>
                </div>

                {/* 6. Avaliação da Escrita */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Auditoria Escrita</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Correção ortográfica e estrutural avançada, aferindo coesão, nível de formalidade e riqueza lexical do texto.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md">Sintaxe</span>
                    <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md">Estilo</span>
                  </div>
                </div>

                {/* 7. Correção Inteligente */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Correção Inteligente</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    A IA explica o erro, a sua raiz lógica, fornece estratégias de correção e sugere exercícios direcionados de reforço.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Explicabilidade</span>
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">Tutor</span>
                  </div>
                </div>

                {/* 8. Banco Inteligente de Questões */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Banco LARS</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Milhões de itens categorizados por CEFR, gerados por IA ou submetidos via Marketplace, com índices de discriminação.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md">Big Data</span>
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md">Marketplace</span>
                  </div>
                </div>

                {/* 9. Construtor Visual de Avaliações */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                    <Layout className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Editor Visual (Drag & Drop)</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Interface intuitiva para professores nativos estruturarem provas complexas com blocos multimédia e programação futura.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] font-bold bg-teal-50 text-teal-600 px-2 py-1 rounded-md">No-Code</span>
                    <span className="text-[9px] font-bold bg-teal-50 text-teal-600 px-2 py-1 rounded-md">Professores</span>
                  </div>
                </div>

                {/* 10. Sistema Antifraude (Enterprise) */}
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col h-full text-white">
                  <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white mb-2">Sistema Antifraude</h3>
                  <p className="text-[11px] text-slate-400 mb-4 flex-grow">
                    Bloqueio temporal, deteção de dispositivos externos, quebra de foco de janela (Copy-Paste) e Auditoria Completa (Audit Trail).
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer mt-auto bg-slate-800 p-2 rounded-xl">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isAntiCheatEnabled} 
                        onChange={() => setIsAntiCheatEnabled(!isAntiCheatEnabled)} 
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">Lockdown Ativo</span>
                  </label>
                </div>

                {/* 11. Certificados Inteligentes */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Certificados Inteligentes</h3>
                  <p className="text-[11px] text-slate-500 mb-4 flex-grow">
                    Emissão segura via Blockchain com código QR, assinatura digital e compatibilidade internacional direta com métricas CEFR.
                  </p>
                  <button className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-100 transition-colors mt-auto cursor-pointer">
                    Gerir Chaves Criptográficas
                  </button>
                </div>

                {/* 12. Integração Completa */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-4">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Ecossistema LingoLIVE</h3>
                  <p className="text-[11px] text-slate-500 mb-4">
                    O IACE não opera isolado. Comunica bidirecionalmente em tempo real com o SPE (Profiles), KGE (Grafos), ALPE (Rotas), LARS (Revisão) e AOE (Orquestrador) para fechar o ciclo cognitivo.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <span className="text-[10px] font-bold border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1"><Layers className="w-3 h-3"/> SPE</span>
                    <span className="text-[10px] font-bold border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1"><Target className="w-3 h-3"/> ALPE</span>
                    <span className="text-[10px] font-bold border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1"><Gavel className="w-3 h-3"/> LARS</span>
                    <span className="text-[10px] font-bold border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg flex items-center gap-1"><Globe className="w-3 h-3"/> KGE</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- VIEW MODE 2: ACTIVE EXAM RUNTIME ENGINE ----------------- */}
      {moduleMode === "active-exam" && activeExam && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* RUNTIME HEADER */}
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">
                {activeExam.language}
              </span>
              <h2 className="text-xs font-extrabold text-slate-700 line-clamp-1">{activeExam.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Countdown counter */}
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-2xl text-rose-600 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>{formatTime(examTimeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* QUESTION NAVIGATION TIMELINE / PROGRESS DOTS */}
          <div className="flex items-center gap-1 bg-slate-100 p-2 rounded-2xl">
            {activeQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex-1 h-2 rounded transition-all duration-300 ${
                  currentQuestionIndex === idx 
                    ? 'bg-indigo-600' 
                    : tempAnswers[q.id] 
                    ? 'bg-indigo-300' 
                    : 'bg-slate-200'
                }`}
                title={`Questão ${idx + 1}`}
              />
            ))}
          </div>

          {/* ACTIVE QUESTION PANEL */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-6"
            >
              
              {/* Question metadata row */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Questão {currentQuestionIndex + 1} de {activeQuestions.length} • {currentQuestion.category.toUpperCase()}
                </span>
                
                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                  {currentQuestion.points} Pontos
                </span>
              </div>

              {/* INSTRUCTION */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-800 leading-relaxed">
                  {currentQuestion.instruction}
                </h3>
              </div>

              {/* OPTIONAL IMAGE COMPONENT */}
              {currentQuestion.imageUrl && (
                <div className="max-w-md mx-auto overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                  <img referrerPolicy="no-referrer" src={currentQuestion.imageUrl} alt="Análise Visual" className="w-full object-cover h-48" />
                </div>
              )}

              {/* OPTIONAL AUDIO COMPONENT */}
              {currentQuestion.audioUrl && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <PlayCircle className="w-8 h-8 text-indigo-600 animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Instrução Auditiva</span>
                    <audio src={currentQuestion.audioUrl} controls className="w-full h-8 max-w-sm mt-1" />
                  </div>
                </div>
              )}

              {/* RENDER INPUT ELEMENTS BASED ON TYPE */}
              <div className="pt-4 border-t border-slate-50">
                
                {/* 1. Multiple Choice */}
                {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((opt, i) => {
                      const isSelected = tempAnswers[currentQuestion.id] === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => setTempAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-indigo-50/50 border-indigo-400 text-indigo-800 ring-1 ring-indigo-400' 
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. True / False */}
                {currentQuestion.type === "true-false" && currentQuestion.options && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt, i) => {
                      const isSelected = tempAnswers[currentQuestion.id] === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => setTempAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                          className={`w-full text-center p-6 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-2 ${
                            isSelected 
                              ? 'bg-indigo-50/50 border-indigo-400 text-indigo-800 ring-1 ring-indigo-400' 
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. Fill in the Blank */}
                {currentQuestion.type === "fill-blank" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Escreva a lacuna em minúsculas:</label>
                    <input
                      type="text"
                      value={tempAnswers[currentQuestion.id] || ""}
                      onChange={(e) => setTempAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      onCopy={(e) => {
                        if (isAntiCheatEnabled) {
                          e.preventDefault();
                          alert("Ação bloqueada. O IACE impede cópias durante exames oficiais.");
                        }
                      }}
                      onPaste={(e) => {
                        if (isAntiCheatEnabled) {
                          e.preventDefault();
                          alert("Ação bloqueada. O IACE impede colagem de texto durante exames oficiais.");
                        }
                      }}
                      placeholder="Ex: gross, margin, interest..."
                      className="w-full p-4 border border-slate-200 rounded-2xl text-xs bg-slate-50 focus:outline-indigo-500 font-bold"
                    />
                  </div>
                )}

                {/* 4. Essay / Writing */}
                {(currentQuestion.type === "essay" || currentQuestion.type === "writing") && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Escreva o seu ensaio corporativo:</label>
                    <textarea
                      value={tempAnswers[currentQuestion.id] || ""}
                      onChange={(e) => setTempAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      onCopy={(e) => {
                        if (isAntiCheatEnabled) {
                          e.preventDefault();
                          alert("Ação bloqueada. O IACE impede cópias durante exames oficiais.");
                        }
                      }}
                      onPaste={(e) => {
                        if (isAntiCheatEnabled) {
                          e.preventDefault();
                          alert("Ação bloqueada. O IACE impede colagem de texto durante exames oficiais.");
                        }
                      }}
                      placeholder="Construa uma proposta comercial articulando argumentos claros..."
                      className="w-full p-4 border border-slate-200 rounded-2xl text-xs bg-slate-50 focus:outline-indigo-500 font-medium h-36"
                    />
                  </div>
                )}

                {/* 5. Speaking Assessment */}
                {currentQuestion.type === "speaking" && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Registe a sua resposta falada:</span>
                    
                    <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center gap-4 border border-slate-800">
                      
                      {isRecordingAnswer === currentQuestion.id ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-mono text-rose-400 animate-pulse">● Gravando Áudio Executivo</span>
                          <button
                            onClick={handleStopAudioAnswer}
                            className="w-12 h-12 bg-rose-600 hover:bg-rose-700 rounded-full flex items-center justify-center text-white"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <button
                            onClick={() => handleStartAudioAnswer(currentQuestion.id)}
                            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {recordedBase64[currentQuestion.id] ? "Áudio Gravado com Sucesso" : "Clique no microfone para gravar"}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          </AnimatePresence>

          {/* NAVIGATION FOOTER */}
          <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl border border-slate-200/50 disabled:opacity-40 transition-all"
            >
              Anterior
            </button>

            {currentQuestionIndex < activeQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1"
              >
                Próxima Questão <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Corrigindo com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Finalizar e Corrigir Exame
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* ----------------- VIEW MODE 3: GRADING RESULT SCREEN ----------------- */}
      {moduleMode === "grading-result" && lastExamResult && (
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* DYNAMIC CERTIFICATE BANNER */}
          {lastExamResult.certificate && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl space-y-4 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <Award className="w-16 h-16 text-amber-100 mx-auto animate-bounce" />
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200 block">Selo de Excelência de Negócios</span>
                <h3 className="text-xl sm:text-2xl font-black">Parabéns! Certificado Emitido</h3>
                <p className="text-xs text-amber-50 max-w-xl mx-auto leading-relaxed">
                  Demonstrou coesão linguística e fonética impecáveis, compatíveis com os padrões globais executivos do Quadro Europeu CEFR. Seu código de validação é <strong>{lastExamResult.certificate.verificationCode}</strong>.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="py-2 px-5 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" /> Imprimir Diploma
                </button>
              </div>
            </motion.div>
          )}

          {/* MAIN MARKS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pontuação Obtida</span>
              <span className={`text-4xl font-black block ${lastExamResult.attempt.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                {lastExamResult.attempt.scorePercent}%
              </span>
              <span className="text-[10px] text-slate-400">
                {lastExamResult.attempt.totalPointsEarned} de {lastExamResult.attempt.totalPointsPossible} pts
              </span>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Status do Candidato</span>
              <span className={`text-xl font-extrabold block uppercase mt-1 ${lastExamResult.attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {lastExamResult.attempt.passed ? "✔ Aprovado" : "✘ Não Aprovado"}
              </span>
              <span className="text-[9px] text-slate-400">Linha de Corte: {activeExam?.passingScorePercent || 70}%</span>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID do Exame Corrigido</span>
              <strong className="text-xs text-slate-700 font-mono leading-none block pt-2">{lastExamResult.attempt.id}</strong>
              <span className="text-[9px] text-slate-400 block pt-2">{new Date(lastExamResult.attempt.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* DYNAMIC GENERAL FEEDBACK ROW */}
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-100/50 p-6 rounded-3xl space-y-2">
            <span className="text-[10px] tracking-wider uppercase font-bold text-indigo-500">Feedback Didático Consolidado:</span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "{lastExamResult.attempt.generalFeedback}"
            </p>
          </div>

          {/* INDIVIDUAL QUESTIONS SCORE ACCORDION */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Análise Avançada Questão-a-Questão
            </h4>

            {lastExamResult.attempt.questionScores.map((score, idx) => {
              const matchedQ = activeExam?.questions.find(q => q.id === score.questionId);
              return (
                <div key={score.questionId} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Questão {idx + 1} ({matchedQ?.type.toUpperCase()})
                      </span>
                      <h5 className="text-xs font-bold text-slate-700">{matchedQ?.instruction}</h5>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-black block ${score.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {score.pointsEarned} / {score.maxPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* AI Feedback on individual question */}
                  {score.aiFeedback && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <strong>Correção IA:</strong> {score.aiFeedback}
                    </div>
                  )}

                  {/* Detailed criteria-based rubric scoring for free-text questions */}
                  {score.rubricScores && score.rubricScores.length > 0 && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avaliação Baseada nas Rubricas Corporativas:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {score.rubricScores.map((rubric: any, rIdx: number) => (
                          <div key={rIdx} className="p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <strong className="text-[10px] text-slate-700">{rubric.dimension}</strong>
                              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Nota: {rubric.score}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-normal">{rubric.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* BACK TO PORTAL CONTAINER */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                setModuleMode("portal");
                setLastExamResult(null);
                setActiveExam(null);
              }}
              className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
            >
              Voltar ao Portal de Avaliação
            </button>
          </div>

        </div>
      )}

      {/* ----------------- EXAM SCHEDULER DRAWER MODAL ----------------- */}
      <AnimatePresence>
        {showSchedulerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full space-y-5"
            >
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Agendar Prova Corporativa
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distribua o exame para a realização coletiva dos alunos na data de vencimento correspondente.
                </p>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">Selecione o Exame:</label>
                  <select
                    value={schedExamId}
                    onChange={(e) => {
                      setSchedExamId(e.target.value);
                      const ex = exams.find(ex => ex.id === e.target.value);
                      if (ex) setSchedTitle(ex.title);
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  >
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">Nome do Agendamento:</label>
                  <input
                    type="text"
                    required
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400">Turma Atribuída:</label>
                  <input
                    type="text"
                    required
                    value={schedClass}
                    onChange={(e) => setSchedClass(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSchedulerModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                  >
                    Agendar Agora
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
