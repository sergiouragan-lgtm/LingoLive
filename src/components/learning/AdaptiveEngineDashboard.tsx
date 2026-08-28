import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Compass, 
  CheckCircle2, 
  Target, 
  Calendar, 
  BookOpen, 
  Lock, 
  Unlock, 
  Play, 
  RotateCw, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sliders,
  Smile,
  Zap,
  Award,
  ChevronRight,
  ChevronLeft,
  Network,
  Cpu,
  FileText,
  BarChart2,
  MessageSquare,
  ListTodo,
  CheckSquare,
  GraduationCap
} from "lucide-react";
import { AdaptiveService } from "../../services/adaptive.service";
import { 
  AdaptiveLearningProfile, 
  AdaptiveGoal, 
  AdaptivePath, 
  AdaptiveRecommendation 
} from "../../types/adaptive";
import { useToast } from "../../context/ToastContext";

interface AdaptiveEngineDashboardProps {
  selectedLanguage: { code: string; name: string; flag: string };
  onStartPractice?: (view: string) => void;
  onAddXp?: (xp: number) => void;
}

export const AdaptiveEngineDashboard: React.FC<AdaptiveEngineDashboardProps> = ({
  selectedLanguage,
  onStartPractice,
  onAddXp
}) => {
  const service = React.useMemo(() => new AdaptiveService(), []);
  const { addToast } = useToast();

  // States
  const [profile, setProfile] = useState<AdaptiveLearningProfile | null>(null);
  const [goals, setGoals] = useState<AdaptiveGoal[]>([]);
  const [path, setPath] = useState<AdaptivePath | null>(null);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [schedule, setSchedule] = useState<any>(null);

  // Status and UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'path' | 'goals' | 'schedule' | 'docs' | 'cycle'>('cycle');
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<AdaptiveGoal['category']>("vocabulary");
  const [newGoalTarget, setNewGoalTarget] = useState(3);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [confettiGoalId, setConfettiGoalId] = useState<string | null>(null);

  // Adaptive Learning Cycle Simulator States
  const [cycleStep, setCycleStep] = useState<number>(0);
  const [step1Selected, setStep1Selected] = useState<string | null>(null);
  const [step1Submitted, setStep1Submitted] = useState<boolean>(false);
  const [step3SelectedNode, setStep3SelectedNode] = useState<string>('phrasal');
  const [step5Messages, setStep5Messages] = useState<Array<{ sender: 'user' | 'tutor', text: string }>>([
    { sender: 'tutor', text: 'Olá! Analisei as métricas do seu último Exame e reparei que o seu domínio gramatical está sólido, mas há uma lacuna no uso de Phrasal Verbs de Negócios (ex: "pivot on").' },
    { sender: 'tutor', text: 'Eu preparei um conjunto de micro-lições dedicadas para você dominar esse conectivo hoje mesmo. Podemos começar com os exercícios práticos?' }
  ]);
  const [step5Input, setStep5Input] = useState<string>('');
  const [step8Selected, setStep8Selected] = useState<string | null>(null);
  const [step8Submitted, setStep8Submitted] = useState<boolean>(false);
  const [cycleProgressCount, setCycleProgressCount] = useState<number>(1);

  // Edit sliders values
  const [sliders, setSliders] = useState({
    performanceScore: 0,
    quizScoreAverage: 0,
    speakingScore: 0,
    listeningScore: 0,
    writingQualityScore: 0,
    learningStreak: 0,
    motivationLevel: 'medium' as 'low' | 'medium' | 'high'
  });

  // Load all data
  useEffect(() => {
    async function loadAllData() {
      try {
        const p = await service.getProfile();
        setProfile(p);
        setSliders({
          performanceScore: p.performanceScore,
          quizScoreAverage: p.quizScoreAverage,
          speakingScore: p.speakingScore,
          listeningScore: p.listeningScore,
          writingQualityScore: p.writingQualityScore,
          learningStreak: p.learningStreak,
          motivationLevel: p.motivationLevel
        });

        const g = await service.getGoals();
        setGoals(g);

        const pa = await service.getPath(selectedLanguage.name);
        setPath(pa);

        const r = await service.getRecommendations(selectedLanguage.name);
        setRecommendations(r);

        const s = await service.getStudySchedule();
        setSchedule(s);
      } catch (err) {
        console.error("Error loading adaptive data:", err);
      }
    }
    loadAllData();
  }, [selectedLanguage, service]);

  // Handle slider update with local Recalculation (Difficulty Engine)
  const handleSliderChange = async (key: string, value: any) => {
    const nextSliders = { ...sliders, [key]: value };
    setSliders(nextSliders);
    
    setIsUpdatingProfile(true);
    try {
      const updated = await service.updateProfile(nextSliders);
      setProfile(updated);
      
      // Auto regenerate study schedule since profile changed
      const s = await service.getStudySchedule();
      setSchedule(s);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Trigger Gemini recommendation generation
  const handleRegenerateRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const r = await service.getRecommendations(selectedLanguage.name);
      setRecommendations(r);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // Trigger Gemini learning path generation
  const handleRegeneratePath = async () => {
    setIsLoadingPath(true);
    try {
      const pa = await service.generateNewPath(selectedLanguage.name);
      setPath(pa);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPath(false);
    }
  };

  // Complete a path node
  const handleCompleteNode = async (nodeId: string, xpReward: number) => {
    if (!path) return;
    
    // Mark current as completed, unlock next
    const updatedNodes = path.nodes.map((node, idx) => {
      if (node.id === nodeId) {
        return { ...node, status: 'completed' as const };
      }
      // Unlock the very next one if it was locked
      if (idx > 0 && path.nodes[idx - 1].id === nodeId && node.status === 'locked') {
        return { ...node, status: 'unlocked' as const };
      }
      return node;
    });

    const updatedPath = { ...path, nodes: updatedNodes };
    setPath(updatedPath);
    await service.savePath(updatedPath);

    if (onAddXp) {
      onAddXp(xpReward);
    }
  };

  // Complete Goal Increment
  const handleIncrementGoal = async (goalId: string, xpReward: number) => {
    try {
      const updated = await service.updateGoalProgress(goalId, 1);
      setGoals(updated);
      
      const justCompleted = updated.find(g => g.id === goalId && g.completed);
      if (justCompleted) {
        setConfettiGoalId(goalId);
        if (onAddXp) onAddXp(xpReward);
        setTimeout(() => setConfettiGoalId(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const reward = newGoalCategory === 'consistency' ? 250 : 150;
      const created = await service.createCustomGoal(
        newGoalTitle,
        newGoalCategory,
        newGoalTarget,
        7, // 7 days deadline
        reward
      );
      setGoals(prev => [...prev, created]);
      setNewGoalTitle("");
      setShowGoalForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await service.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper level coloring
  const getCefrBadgeStyle = (cefr: string) => {
    switch (cefr) {
      case 'A1': case 'A2': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'B1': case 'B2': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'C1': case 'C2': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen" id="adaptive-learning-engine">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
              Sistema Adaptativo Ativo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Motor de Aprendizagem Adaptativa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ajuste e visualize como a inteligência artificial calibra as suas aulas com base em suas métricas reais.
          </p>
        </div>
        
        {/* Dynamic Level Dial */}
        {profile && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm self-start">
            <div className="relative flex items-center justify-center w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                <circle 
                  cx="28" 
                  cy="28" 
                  r="24" 
                  stroke="url(#indigoGrad)" 
                  strokeWidth="4" 
                  fill="transparent"
                  strokeDasharray={150}
                  strokeDashoffset={150 - (150 * profile.difficultyIndex)}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-indigo-600">{profile.estimatedCefr}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getCefrBadgeStyle(profile.estimatedCefr)}`}>
                  Nível {profile.estimatedCefr}
                </span>
                {isUpdatingProfile && (
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Índice de Dificuldade: {(profile.difficultyIndex * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TABS SELECTOR */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl mb-6 scrollbar-none">
        {[
          { id: 'overview', label: 'Painel Geral', icon: Sliders },
          { id: 'cycle', label: 'Ciclo LingoLIVE (Fluxo IA)', icon: Zap },
          { id: 'path', label: 'Caminho Adaptativo', icon: Compass },
          { id: 'goals', label: 'Metas Inteligentes', icon: Target },
          { id: 'schedule', label: 'Agenda Pessoal', icon: Calendar },
          { id: 'docs', label: 'Documentação', icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INTERACTIVE SIDEBAR: METRICS CALIBRATION */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Perfil calculado
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              As pontuações abaixo vêm exclusivamente das atividades concluídas pelo aluno.
            </p>
          </div>

          <div className="space-y-4">
            {/* Motivation Selector */}
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Nível de Motivação</span>
                <span className="text-indigo-600 uppercase text-[10px] bg-indigo-50 px-2 py-0.5 rounded">
                  {sliders.motivationLevel === 'high' ? 'Alta 🌟' : sliders.motivationLevel === 'medium' ? 'Média ⏱️' : 'Baixa 💤'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSliderChange('motivationLevel', m)}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                      sliders.motivationLevel === m 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'low' ? 'Baixa' : m === 'medium' ? 'Média' : 'Alta'}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Proficiência Geral</span>
                <span className="font-mono text-indigo-600">{sliders.performanceScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={sliders.performanceScore}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>

            {/* Quiz Average Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Média em Quizzes</span>
                <span className="font-mono text-indigo-600">{sliders.quizScoreAverage}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={sliders.quizScoreAverage}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>

            {/* Speaking Score Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Conversação (Speaking)</span>
                <span className="font-mono text-indigo-600">{sliders.speakingScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={sliders.speakingScore}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>

            {/* Listening Score Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Compreensão Oral (Listening)</span>
                <span className="font-mono text-indigo-600">{sliders.listeningScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={sliders.listeningScore}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>

            {/* Writing Quality Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Qualidade da Escrita</span>
                <span className="font-mono text-indigo-600">{sliders.writingQualityScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={sliders.writingQualityScore}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>

            {/* Streak Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Sequência Diária (Streak)</span>
                <span className="font-mono text-indigo-600">{sliders.learningStreak} dias</span>
              </div>
              <input 
                type="range" min="0" max="30" 
                value={sliders.learningStreak}
                disabled
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-500">
              <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>O motor calcula o nível de desafio com evidências reais. A motivação continua sendo uma preferência declarada pelo aluno.</span>
            </div>
          </div>
        </div>

        {/* CONTENT CONTENT AREA (TABS COMPONENT) */}
        <div className="lg:col-span-2">
          
          {/* TAB 0: ADAPTIVE CYCLE STEPPER */}
          {activeTab === 'cycle' && (
            <div className="space-y-6">
              
              {/* Cycle Title Header */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>Ciclo de Aprendizagem Adaptativo</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Pipeline de Evolução do Aluno</h3>
                  <p className="text-xs text-slate-400">Acompanhe e simule em tempo real como o motor de IA da LingoLIVE calibra o seu desenvolvimento.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                    Ciclo Ativo: #{cycleProgressCount}
                  </span>
                </div>
              </div>

              {/* HORIZONTAL STEPPER GRAPHIC */}
              <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-3xl shadow-sm">
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-2 relative">
                  {[
                    { name: "Exame", desc: "Avaliação Inicial", icon: GraduationCap },
                    { name: "Resultados", desc: "Análise Métricas", icon: BarChart2 },
                    { name: "Knowledge Graph", desc: "Mapeamento Cognitivo", icon: Network },
                    { name: "Perfil Inteligente", desc: "Calibração IA", icon: Sliders },
                    { name: "Tutor IA", desc: "Alinhamento Virtual", icon: Cpu },
                    { name: "Plano Personalizado", desc: "Roteiro sob Medida", icon: ListTodo },
                    { name: "Novas Lições", desc: "Micro-aulas", icon: FileText },
                    { name: "Nova Avaliação", desc: "Feedback Loop", icon: CheckSquare },
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    const isPassed = idx < cycleStep;
                    const isActive = idx === cycleStep;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCycleStep(idx);
                          addToast(`Acessando etapa: ${step.name}`, "info");
                        }}
                        className="flex flex-col items-center text-center transition-all focus:outline-none relative group cursor-pointer"
                        id={`cycle-step-trigger-${idx}`}
                      >
                        {/* Connecting line */}
                        {idx < 7 && (
                          <div className="hidden sm:block absolute top-5 left-[60%] right-[-40%] h-0.5 z-0">
                            <div className={`h-full w-full ${idx < cycleStep ? 'bg-indigo-600' : 'bg-slate-150'}`} />
                          </div>
                        )}
                        
                        {/* Step Circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                          isPassed 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : isActive 
                            ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600 font-bold scale-105' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        
                        <span className={`text-[9px] font-bold mt-2 leading-tight block ${
                          isActive ? 'text-indigo-600 font-extrabold' : isPassed ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {step.name}
                        </span>
                        
                        <span className="text-[7px] text-slate-400 font-medium hidden md:block mt-0.5">
                          {step.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE STEP WORKSPACE */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={cycleStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm min-h-[300px] flex flex-col justify-between"
                  id={`cycle-workspace-${cycleStep}`}
                >
                  
                  {/* STEP 1: EXAME */}
                  {cycleStep === 0 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 1 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          Exame Adaptativo de Proficiência (CEFR Simulado)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          O ciclo adaptativo inicia com um exame ou nivelamento focado no tema e dialeto escolhidos pelo aluno para rastrear lacunas imediatas.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                        <div className="text-xs font-extrabold text-slate-700 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                          Questão Temática de Negócios: "Our financial targets have changed, so we must ________ the core strategy to survive this quarter."
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { id: 'a', text: 'pivot on', desc: 'reestruturar ou alterar a estratégia com base em' },
                            { id: 'b', text: 'call off', desc: 'cancelar definitivamente um compromisso' },
                            { id: 'c', text: 'look into', desc: 'investigar detalhadamente um problema' },
                            { id: 'd', text: 'stand by', desc: 'esperar ordens ou apoiar alguém' }
                          ].map((opt) => {
                            const isSelected = step1Selected === opt.id;
                            return (
                              <button
                                key={opt.id}
                                disabled={step1Submitted}
                                onClick={() => setStep1Selected(opt.id)}
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                                    : 'bg-white hover:bg-slate-50 border-slate-200'
                                }`}
                                id={`step1-opt-${opt.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center border ${
                                    isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    {opt.id.toUpperCase()}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">{opt.text}</span>
                                </div>
                                <p className="text-[10px] text-slate-450 mt-1 pl-7">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>

                        {step1Selected && !step1Submitted && (
                          <button
                            onClick={() => {
                              setStep1Submitted(true);
                              if (step1Selected === 'a') {
                                addToast("🎉 Excelente escolha! Resposta correta.", "success");
                              } else {
                                addToast("Desvio detectado! O phrasal verb correto seria 'pivot on'.", "info");
                              }
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                            id="submit-step1-btn"
                          >
                            Submeter Resposta do Exame
                          </button>
                        )}

                        {step1Submitted && (
                          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            step1Selected === 'a' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                              : 'bg-rose-50 border-rose-100 text-rose-800'
                          }`}>
                            <strong className="block mb-0.5">{step1Selected === 'a' ? '✓ Correto!' : '✗ Desvio de Transição Detectado!'}</strong>
                            {step1Selected === 'a' 
                              ? 'Excelente! "Pivot on" significa mudar o foco de uma linha estratégica para outra. O motor adaptativo observou alto domínio teórico inicial.' 
                              : 'O correto seria "pivot on". Você escolheu uma alternativa incorreta para este contexto. O motor registrou um gap pedagógico imediato.'}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-50">
                        <button
                          onClick={() => {
                            setCycleStep(1);
                            addToast("Analisando resultados do exame...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm shadow-indigo-100"
                        >
                          Analisar Resultados <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: RESULTADOS */}
                  {cycleStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 2 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-indigo-600" />
                          Resultados de Proficiência e Diagnóstico Ativo
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          Com base nas respostas do Exame anterior, o motor adaptativo compila as métricas do estudante e isola desvios estruturais.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3">
                          <h5 className="text-xs font-bold text-slate-700 uppercase">Métricas Detalhadas</h5>
                          
                          {[
                            { name: "Sintaxe & Gramática Geral", val: 82, color: "bg-indigo-600" },
                            { name: "Léxico Profissional", val: 74, color: "bg-purple-600" },
                            { name: "Conectores de Transição (Phrasal)", val: 35, color: "bg-rose-500" },
                            { name: "Acento e Dialeto Prático", val: 68, color: "bg-amber-500" }
                          ].map((bar, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{bar.name}</span>
                                <span>{bar.val}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-rose-50/20 border border-rose-100/50 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 uppercase mb-2">
                              <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                              <span>ALERTA DE VULNERABILIDADE</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              "Identificada vulnerabilidade severa em <strong>Phrasal Verbs de Pivot e Redirecionamento Corporativo</strong> (pontuação de 35%). O sistema restringirá o avanço teórico livre até a devida correção pedagógica."
                            </p>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-3 pt-2 border-t border-rose-100/20">
                            Módulo de Diagnóstico: DIAG-PV-2026
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(0)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(2);
                            addToast("Injetando desvio no Grafo de Conhecimento...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Mapear no Knowledge Graph <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: KNOWLEDGE GRAPH */}
                  {cycleStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 3 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <Network className="w-4 h-4 text-indigo-600 animate-pulse" />
                          Atualização Dinâmica do Knowledge Graph (Grafo de Competências)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          Os desvios e lacunas são mapeados imediatamente como nós deficitários no Grafo de Conhecimento, alterando as conexões e dependências de conteúdo.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Interactive Graph Display */}
                        <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-4 rounded-2xl min-h-[180px] flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                          
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '180px' }}>
                            <path d="M 60,90 L 160,50 M 160,50 L 260,50 M 160,50 L 160,130 M 160,130 L 260,130 M 260,50 L 340,90" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
                            <path d="M 60,90 L 160,130" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                          </svg>

                          <div className="flex flex-wrap items-center justify-around gap-y-8 gap-x-4 relative z-10">
                            
                            <button 
                              onClick={() => {
                                setStep3SelectedNode('vocabulary');
                                addToast("Visualizando nó: Business Vocabulary", "info");
                              }}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all relative cursor-pointer ${
                                step3SelectedNode === 'vocabulary'
                                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                              Business Vocabulary
                            </button>

                            <button 
                              onClick={() => {
                                setStep3SelectedNode('phrasal');
                                addToast("Visualizando nó crítico: Phrasal Verbs", "info");
                              }}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all relative cursor-pointer ${
                                step3SelectedNode === 'phrasal'
                                  ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500 scale-105 animate-pulse'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                              Phrasal Verbs (Pivot)
                            </button>

                            <button 
                              onClick={() => {
                                setStep3SelectedNode('grammar');
                                addToast("Visualizando nó: Conditional Clauses", "info");
                              }}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all relative cursor-pointer ${
                                step3SelectedNode === 'grammar'
                                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                              Conditional Clauses
                            </button>

                            <button 
                              onClick={() => {
                                setStep3SelectedNode('accent');
                                addToast("Visualizando nó: Received Pronunciation", "info");
                              }}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all relative cursor-pointer ${
                                step3SelectedNode === 'accent'
                                  ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                              Received Pronunciation
                            </button>

                          </div>
                        </div>

                        {/* Node details */}
                        <div className="md:col-span-5 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between">
                          {step3SelectedNode === 'phrasal' ? (
                            <div className="space-y-2">
                              <span className="text-[8px] font-mono bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-md font-black uppercase">Lacuna Crítica</span>
                              <h5 className="text-xs font-black text-slate-800">Phrasal Verbs (Pivot on)</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Este nó conecta o vocabulário básico e a conversação de pitch avançada. O erro no Exame acendeu o alerta vermelho neste nó.
                              </p>
                              <div className="p-2 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-400 font-mono">
                                Dependência: Business Vocab (OK)
                              </div>
                            </div>
                          ) : step3SelectedNode === 'vocabulary' ? (
                            <div className="space-y-2">
                              <span className="text-[8px] font-mono bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md font-black uppercase">Domínio Teórico Concluído</span>
                              <h5 className="text-xs font-black text-slate-800">Business Vocabulary</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Termos técnicos de negociações corporativas internacionais, precificação e KPI (Nível CEFR C1).
                              </p>
                            </div>
                          ) : step3SelectedNode === 'accent' ? (
                            <div className="space-y-2">
                              <span className="text-[8px] font-mono bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md font-black uppercase">Em Desenvolvimento</span>
                              <h5 className="text-xs font-black text-slate-800">Received Pronunciation</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Modulação de pronúncia britânica formal, focado em clareza auditiva em pitches e debates.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="text-[8px] font-mono bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md font-black uppercase">Domínio Teórico Concluído</span>
                              <h5 className="text-xs font-black text-slate-800">Conditional Clauses</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Uso polido de condicionais híbridas e inversões formais na fala acadêmica ou técnica.
                              </p>
                            </div>
                          )}

                          <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50/50 p-2 rounded-xl mt-3 text-center">
                            💡 Clique nas tags do Grafo para consultar o estado de cada competência.
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(1)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(3);
                            addToast("Recalculando métricas de estresse cognitivo...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Atualizar Perfil Inteligente <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: PERFIL INTELIGENTE */}
                  {cycleStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 4 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-indigo-600" />
                          Perfil Adaptativo e Alinhamento Cognitivo
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          Com os nós mapeados no Knowledge Graph, o perfil cognitivo recalcula o índice de dificuldade ideal e parametriza a curva de esquecimento.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Índice de Dificuldade</span>
                          <span className="text-lg font-black text-indigo-600 block mt-1">0.74 / 1.0</span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Ajustado de forma incremental para B2+ a fim de fornecer desafios focados na correção de phrasal verbs sem gerar frustração.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Frequência Sináptica</span>
                          <span className="text-lg font-black text-violet-600 block mt-1">Janela de 24 horas</span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            A curva de Ebbinghaus estipula que o aluno deve ver o conceito "pivot on" 3 vezes nas próximas 24h para consolidar a fixação.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Diretiva de Conteúdo</span>
                          <span className="text-lg font-black text-emerald-600 block mt-1">Foco de Sobrevivência</span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Conteúdos teóricos mais densos de C2 estão bloqueados temporariamente até a conclusão dos exercícios de Phrasal Verbs.
                          </p>
                        </div>
                      </div>

                      {/* Interactive sync buttons */}
                      <div className="bg-indigo-50/20 border border-indigo-100/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-indigo-950">Calibrar Barra Lateral de Parâmetros</h5>
                          <p className="text-[10px] text-indigo-800">
                            Aperte o botão para ajustar instantaneamente as barras deslizantes do painel esquerdo com as métricas recalculadas da IA.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSliders({
                              performanceScore: profile.performanceScore,
                              quizScoreAverage: profile.quizScoreAverage,
                              speakingScore: profile.speakingScore,
                              listeningScore: profile.listeningScore,
                              writingQualityScore: profile.writingQualityScore,
                              learningStreak: profile.learningStreak,
                              motivationLevel: profile.motivationLevel
                            });
                            addToast("Métricas reais sincronizadas com sucesso!", "success");
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0"
                          id="sync-sliders-btn"
                        >
                          Sincronizar Sliders
                        </button>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(2)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(4);
                            addToast("Buscando diretrizes do Tutor IA...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Alinhar com Tutor IA <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: TUTOR IA */}
                  {cycleStep === 4 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 5 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                          Coaching Conversacional com Tutor IA
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          O Tutor IA de conversação da LingoLIVE entra em contato para detalhar a estratégia e orientar as ações práticas do estudante.
                        </p>
                      </div>

                      {/* Tutor Chat Widget */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">Tutor Pedagógico IA</span>
                          </div>
                          <span className="text-[9px] text-slate-400">Modo: Ajuste Curricular</span>
                        </div>

                        <div className="p-4 space-y-3 max-h-[160px] overflow-y-auto bg-slate-900/50">
                          {step5Messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                                msg.sender === 'user'
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none shadow-sm'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-2 bg-slate-950 border-t border-slate-900 flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Responda ao Tutor IA (Ex: 'Quero focar na lição', 'Sim, me ajude')..."
                            value={step5Input}
                            onChange={(e) => setStep5Input(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (!step5Input.trim()) return;
                                const userMsg = step5Input.trim();
                                setStep5Messages(prev => [...prev, { sender: 'user', text: userMsg }]);
                                setStep5Input('');
                                setTimeout(() => {
                                  setStep5Messages(prev => [...prev, { sender: 'tutor', text: `Excelente decisão! Vamos focar nisso. Já alinhei o seu plano de estudos semanal para destacar exercícios fáceis de fixação sobre "pivot on".` }]);
                                  addToast("Mensagem processada pelo Tutor IA!", "success");
                                }, 1000);
                              }
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            id="tutor-chat-input"
                          />
                          <button
                            onClick={() => {
                              if (!step5Input.trim()) return;
                              const userMsg = step5Input.trim();
                              setStep5Messages(prev => [...prev, { sender: 'user', text: userMsg }]);
                              setStep5Input('');
                              setTimeout(() => {
                                setStep5Messages(prev => [...prev, { sender: 'tutor', text: `Entendi perfeitamente. O seu feedback foi computado. O plano adaptativo foi reestruturado para o phrasal verb "pivot on" nas aulas de hoje.` }]);
                                addToast("Mensagem processada pelo Tutor IA!", "success");
                              }, 1000);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl transition-all cursor-pointer"
                            id="send-tutor-msg-btn"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(3)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(5);
                            addToast("Personalizando plano de aulas adaptativo...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Ver Plano Adaptado <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 6: PLANO PERSONALIZADO */}
                  {cycleStep === 5 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 6 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <ListTodo className="w-4 h-4 text-indigo-600" />
                          Plano Personalizado Adaptativo do Aluno
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          O roteiro de estudos semanal é atualizado de forma cirúrgica para que o aluno ataque diretamente os nós deficitários de hoje.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                        <div className="border-l-2 border-indigo-500 pl-4 space-y-4">
                          
                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-indigo-600 rounded-full" />
                            <h5 className="text-xs font-bold text-slate-700">Fase 1: Diagnóstico CEFR (Concluído hoje)</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Nivelamento inicial identificou lacuna em Phrasal Verbs.</p>
                          </div>

                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                            <h5 className="text-xs font-bold text-indigo-600">Fase 2: Exercícios do Verbo "Pivot On" (Ativo agora)</h5>
                            <p className="text-[10px] text-indigo-500 mt-0.5">Aulas teóricas práticas de transições em discursos de pitches de negócios.</p>
                          </div>

                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-slate-300 rounded-full" />
                            <h5 className="text-xs font-bold text-slate-400">Fase 3: Roleplay e Conversação Local (Amanhã)</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Treino de fala ativa usando o microfone do navegador para consolidar o acento.</p>
                          </div>

                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2 h-2 bg-slate-300 rounded-full" />
                            <h5 className="text-xs font-bold text-slate-400">Fase 4: Validação de Retenção (Breve)</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Quiz final rápido para autorizar promoção de nível no Knowledge Graph.</p>
                          </div>

                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(4)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(6);
                            addToast("Compilando micro-aulas teóricas...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Ir para Novas Lições <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 7: NOVAS LIÇÕES */}
                  {cycleStep === 6 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 7 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          Novas Lições Geradas pela IA (Micro-Learning)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          O Gemini formula micro-aulas compactas sob medida com expressões idiomáticas e vocabulário real para sanar a lacuna ativamente.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full font-bold">Vocabulário de Transição & Pivot</span>
                          <span className="text-[9px] font-mono text-slate-400">Nível Ideal: B2/C1</span>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-800">Expressão de Hoje: O Phrasal Verb "Pivot On"</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            O phrasal verb <strong>"pivot on"</strong> significa redefinir, girar ou estruturar uma estratégia corporativa ao redor de um fator chave. É a expressão mais polida e valorizada em conselhos de startups para demonstrar resiliência técnica.
                          </p>
                          
                          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                            <span className="font-extrabold text-indigo-600 text-[10px] block uppercase">Exemplo no Dialeto Anglo-saxão:</span>
                            <em className="text-xs text-slate-700 block mt-1">"Our expansion model must pivot on localized partnerships to capture market share."</em>
                            <span className="text-[10px] text-slate-450 block mt-1">(Nosso modelo de expansão deve se basear em parcerias locais para ganhar mercado.)</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onAddXp) onAddXp(50);
                            addToast("Fabuloso! Você absorveu este micro-conteúdo e ganhou +50 XP!", "success");
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                          id="complete-micro-lesson-btn"
                        >
                          Marcar Lição como Concluída (+50 XP)
                        </button>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(5)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(7);
                            addToast("Carregando teste de fixação de ciclo...", "info");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          Ir para Nova Avaliação <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 8: NOVA AVALIAÇÃO */}
                  {cycleStep === 7 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded">PASSO 8 DE 8</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                          Nova Avaliação (Fechamento do Loop Adaptativo)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          O ciclo encerra-se com um micro-quiz de retenção de longo prazo. O sucesso valida o aprendizado e re-escreve o nó no Knowledge Graph.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                        <div className="text-xs font-extrabold text-slate-700 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                          Micro-Desafio Final: "The startup had to pivot _______ a SaaS subscription model after their initial sales stagnated."
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {['on', 'for', 'with', 'at'].map((opt) => {
                            const isSelected = step8Selected === opt;
                            return (
                              <button
                                key={opt}
                                disabled={step8Submitted}
                                onClick={() => setStep8Selected(opt)}
                                className={`p-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                                    : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-500'
                                }`}
                                id={`step8-opt-${opt}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {step8Selected && !step8Submitted && (
                          <button
                            onClick={() => {
                              setStep8Submitted(true);
                              if (step8Selected === 'on') {
                                if (onAddXp) onAddXp(100);
                                addToast("🏆 Fenomenal! Ciclo adaptativo fechado com sucesso e +100 XP acumulado!", "success");
                              } else {
                                addToast("Quase lá! Lembre-se que o phrasal verb correto é pivot 'on'.", "info");
                              }
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                            id="submit-step8-btn"
                          >
                            Finalizar Avaliação do Ciclo
                          </button>
                        )}

                        {step8Submitted && (
                          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            step8Selected === 'on' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                              : 'bg-rose-50 border-rose-100 text-rose-800'
                          }`}>
                            <strong className="block mb-0.5">{step8Selected === 'on' ? '✓ EXCELENTE! CICLO CONCLUÍDO!' : '✗ Necessita Nova Tentativa.'}</strong>
                            {step8Selected === 'on' 
                              ? 'Sensacional! Sua proficiência foi gravada com sucesso. O nó "Phrasal Verbs (Pivot)" do seu Knowledge Graph foi promovido para "DOMINADO (100%)"!' 
                              : 'Recomendamos voltar ao passo 7 (Novas Lições) para revisar o conceito de pivotamento estratégico.'}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-50">
                        <button
                          onClick={() => setCycleStep(6)}
                          className="flex items-center gap-1 py-2 px-3 text-xs text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <button
                          onClick={() => {
                            setCycleStep(0);
                            setStep1Selected(null);
                            setStep1Submitted(false);
                            setStep8Selected(null);
                            setStep8Submitted(false);
                            setCycleProgressCount(prev => prev + 1);
                            addToast("Reiniciando ciclo adaptativo com dificuldade ajustada!", "success");
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-indigo-100"
                          id="restart-cycle-btn"
                        >
                          Reiniciar Novo Ciclo (+Dificuldade) <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Profile Summary Box */}
              {profile && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Média Quizzes", value: `${profile.quizScoreAverage}%`, color: "text-indigo-600" },
                    { label: "Conversação", value: `${profile.speakingScore}%`, color: "text-violet-600" },
                    { label: "Compreensão Oral", value: `${profile.listeningScore}%`, color: "text-pink-600" },
                    { label: "Escrita de Ensaio", value: `${profile.writingQualityScore}%`, color: "text-emerald-600" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {stat.label}
                      </span>
                      <span className={`text-xl font-extrabold ${stat.color}`}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gemini Recommendations list */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Recomendações da IA Inteligente
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Conselhos táticos baseados nas suas lacunas e potencializados pelo Gemini.
                    </p>
                  </div>
                  <button
                    onClick={handleRegenerateRecommendations}
                    disabled={isLoadingRecs}
                    className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${isLoadingRecs ? 'animate-spin' : ''}`} />
                    Atualizar IA
                  </button>
                </div>

                <div className="space-y-3">
                  {recommendations.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Nenhuma recomendação carregada. Clique em "Atualizar IA" para gerar.
                    </div>
                  ) : (
                    recommendations.map((rec) => (
                      <div 
                        key={rec.id} 
                        className="bg-slate-50 hover:bg-indigo-50/20 border border-slate-100 hover:border-indigo-100/40 p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded ${
                              rec.priority === 'high' 
                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                : rec.priority === 'medium' 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              Prioridade {rec.priority === 'high' ? 'Crítica' : rec.priority === 'medium' ? 'Moderada' : 'Geral'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rec.estimatedTimeMin} min
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-700">{rec.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{rec.description}</p>
                          <p className="text-[10px] text-indigo-600 font-semibold italic mt-1 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                            Motivo: {rec.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => onStartPractice && onStartPractice(rec.actionView)}
                          className="py-1.5 px-3.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1 self-start sm:self-center"
                        >
                          Praticar <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Attendance and Schedule Recommendation */}
              {schedule && (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] tracking-widest font-extrabold text-indigo-300 uppercase">
                      Planeamento Pessoal de Estudos
                    </span>
                  </div>
                  <h4 className="text-sm font-bold mb-1.5 text-indigo-100">Recomendação de Agenda Inteligente</h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">{schedule.advice}</p>
                  
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Frequência Semanal</span>
                      <span className="text-sm font-extrabold text-indigo-300">{schedule.frequencyDaysPerWeek} Dias / semana</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Duração de Sessão</span>
                      <span className="text-sm font-extrabold text-indigo-300">{schedule.recommendedDurationMin} Minutos</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Janela de Estudo Ideal</span>
                      <span className="text-sm font-extrabold text-indigo-300">{schedule.timeSlotRecommendation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEARNING PATH */}
          {activeTab === 'path' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      Jornada Sequencial Personalizada
                    </h3>
                    {path?.pathType && (
                      <span className="text-[9px] font-black tracking-widest text-white bg-slate-800 px-2 py-0.5 rounded uppercase">
                        {path.pathType.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Caminhos gerados pelo Gemini específicos para treinar e cobrir os seus pontos fracos.
                  </p>
                </div>
                <button
                  onClick={handleRegeneratePath}
                  disabled={isLoadingPath}
                  className="flex items-center gap-1.5 py-1.5 px-3 border border-indigo-100 text-[10px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isLoadingPath ? 'animate-spin' : ''}`} />
                  Regerar Caminho AI
                </button>
              </div>

              {/* Dynamic Map Nodes */}
              <div className="relative pl-6 border-l-2 border-dashed border-slate-200 ml-4 py-2 space-y-8">
                {path?.nodes.map((node, index) => {
                  const isCompleted = node.status === 'completed';
                  const isLocked = node.status === 'locked';
                  const isUnlocked = node.status === 'unlocked';
                  
                  return (
                    <div key={node.id} className="relative">
                      {/* Left Dot Icon */}
                      <span className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : isUnlocked 
                          ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' 
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : isUnlocked ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </span>

                      {/* Content Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        isCompleted 
                          ? 'bg-emerald-50/30 border-emerald-100/60' 
                          : isUnlocked 
                          ? 'bg-white border-indigo-500 shadow-md shadow-indigo-50/50' 
                          : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-extrabold tracking-widest uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              {node.type}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
                              {node.difficulty}
                            </span>
                            {node.durationMin && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {node.durationMin}m (Microlearning)
                              </span>
                            )}
                            {node.isReview && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 flex items-center gap-1 border border-emerald-200">
                                <RotateCw className="w-2.5 h-2.5" /> Spaced Repetition
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded self-start">
                            +{node.xpReward} XP
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-700">{node.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{node.description}</p>
                        
                        {/* Targeted skills tags */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {node.skillsTargeted.map((skill, idx) => (
                            <span key={idx} className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                              #{skill}
                            </span>
                          ))}
                        </div>

                        {/* Action buttons */}
                        {isUnlocked && (
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => onStartPractice && onStartPractice(node.type)}
                              className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                            >
                              Praticar Agora <Play className="w-3 h-3 fill-white" />
                            </button>
                            <button
                              onClick={() => handleCompleteNode(node.id, node.xpReward)}
                              className="py-1.5 px-3 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-xl transition-all"
                            >
                              Marcar como Feito
                            </button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Atividade concluída com sucesso!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SMART GOALS */}
          {activeTab === 'goals' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Metas Pedagógicas Inteligentes
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defina e complete metas direcionadas para receber grandes recompensas de experiência.
                  </p>
                </div>
                <button
                  onClick={() => setShowGoalForm(!showGoalForm)}
                  className="flex items-center gap-1 py-1.5 px-3 border border-indigo-200 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Meta
                </button>
              </div>

              {/* Goal Insertion Form */}
              <AnimatePresence>
                {showGoalForm && (
                  <motion.form 
                    onSubmit={handleAddGoal}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 overflow-hidden space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Meta</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Praticar conversação"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                        <select 
                          value={newGoalCategory}
                          onChange={(e: any) => setNewGoalCategory(e.target.value)}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-indigo-500"
                        >
                          <option value="vocabulary">Vocabulário</option>
                          <option value="speaking">Conversação</option>
                          <option value="listening">Compreensão</option>
                          <option value="reading">Leitura</option>
                          <option value="writing">Escrita</option>
                          <option value="consistency">Frequência</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade Alvo</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={newGoalTarget}
                          onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setShowGoalForm(false)}
                        className="py-1 px-3 border border-slate-200 rounded-lg text-[10px] font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold"
                      >
                        Adicionar
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Goals Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  const isCompleted = goal.completed;
                  const isConfetti = confettiGoalId === goal.id;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={`border p-4 rounded-2xl relative transition-all overflow-hidden ${
                        isCompleted 
                          ? 'bg-emerald-50/10 border-emerald-100/60' 
                          : isConfetti 
                          ? 'bg-indigo-50/30 border-indigo-300' 
                          : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      {isConfetti && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-200/20 to-indigo-100/20 animate-pulse-border pointer-events-none" />
                      )}

                      <div className="flex justify-between items-start gap-4 mb-1.5">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded text-indigo-600">
                          {goal.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            +{goal.xpReward} XP
                          </span>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-700">{goal.title}</h4>
                      
                      {/* Goal progress indicator bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Progresso: {goal.currentValue} / {goal.targetValue}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Goal Completion Trigger Button */}
                      {!isCompleted ? (
                        <button
                          onClick={() => handleIncrementGoal(goal.id, goal.xpReward)}
                          className="mt-4 w-full py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-700 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          Progredir Atividade <Plus className="w-3 h-3" />
                        </button>
                      ) : (
                        <div className="mt-4 flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[10px] bg-emerald-50 py-1 rounded-xl">
                          <Award className="w-4 h-4 text-emerald-500 animate-bounce" /> Meta Concluída!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULE */}
          {activeTab === 'schedule' && schedule && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Agendador e Planeador de Rotina
                </h3>
                <p className="text-[11px] text-slate-400">
                  Conselhos estratégicos para garantir o máximo aproveitamento intelectual sem sobrecarga mental.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Advice Card */}
                <div className="bg-indigo-50/30 border border-indigo-100/50 p-5 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-700 mb-2 flex items-center gap-1.5">
                    <Smile className="w-4 h-4" /> Recomendação Cognitiva
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{schedule.advice}</p>
                </div>

                {/* Clock Setup Panel */}
                <div className="border border-slate-100 p-5 rounded-2xl flex flex-col gap-4">
                  <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Planeador de Ritmo
                  </h4>
                  <div className="space-y-3 text-xs text-slate-500">
                    <div className="flex justify-between border-b pb-1.5 border-slate-50">
                      <span>Duração sugerida</span>
                      <strong className="text-slate-800">{schedule.recommendedDurationMin} min / dia</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 border-slate-50">
                      <span>Frequência ideal</span>
                      <strong className="text-slate-800">{schedule.frequencyDaysPerWeek} dias / semana</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 border-slate-50">
                      <span>Janela horária sugerida</span>
                      <strong className="text-slate-800">{schedule.timeSlotRecommendation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Próxima sessão recomendada</span>
                      <strong className="text-indigo-600 font-mono">{schedule.nextRecommendedSession}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Nota: O motor de aprendizagem acompanha o seu horário de maior engajamento diário para calibrar esses tempos.</span>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTATION */}
          {activeTab === 'docs' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  Como Funciona o Motor Adaptativo?
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compreenda a ciência e a arquitetura didática automatizada da LingoLIVE IA.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">1. O Perfil de Aprendizagem Dinâmico</h4>
                  <p>
                    O sistema agrega continuamente as suas métricas de interação, incluindo taxas de acerto em quizzes, a sua velocidade média de leitura (WPM), notas dadas pelos avaliadores de áudio e texto nas sessões de speaking/writing, além do seu nível de assiduidade diária e o Streak.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">2. O Motor de Dificuldade (Difficulty Engine)</h4>
                  <p>
                    Utilizando uma ponderação didática refinada, o sistema gera o seu <strong>Índice de Dificuldade</strong> entre 0.1 e 1.0. Ele traduz esse valor nas categorias clássicas do Quadro Europeu Comum de Referência para as Línguas (CEFR, de A1 a C2), garantindo que as perguntas nunca sejam fáceis demais a ponto de entediar, nem difíceis a ponto de desmotivar.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">3. O Motor de Recomendações e Jornada Personalizada</h4>
                  <p>
                    Por meio de chamadas altamente contextualizadas à API do Gemini, enviamos as suas métricas de lacunas gramaticais e de pronúncia para que o modelo construa roteiros de aulas e conselhos táticos em formato JSON. Esses conselhos trazem links diretos para exercitar a sua menor nota, otimizando o seu tempo de estudo de forma cirúrgica.
                  </p>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                  <h5 className="font-extrabold text-indigo-700 mb-1">Vantagem Cognitiva</h5>
                  <p className="text-[11px] text-slate-500">
                    Estudar de forma adaptativa comprovadamente reduz o tempo de aquisição de novos idiomas em até 40% em comparação com cronogramas tradicionais e estáticos de livros didáticos.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
