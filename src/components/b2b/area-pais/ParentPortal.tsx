import React, { useState, useEffect } from "react";
import { 
  Users, TrendingUp, Calendar, CreditCard, Award, MessageSquare, 
  Shield, Bell, Sparkles, Download, CheckCircle, AlertCircle, 
  ChevronRight, ArrowRight, Heart, FileText, UserPlus, Trash2, 
  DollarSign, Activity, Lock, Settings, RefreshCw, Star, Info,
  Check, Mail, ShieldCheck, Database, Zap, BookOpen, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "../../../context/ToastContext";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// ----------------------------------------------------------------------
// DATA TYPES & SCHEMAS
// ----------------------------------------------------------------------
interface Dependent {
  id: string;
  name: string;
  age: number;
  grade: string;
  language: string;
  progress: number; // percentage
  weeklyMinutes: number;
  xp: number;
  level: number;
  attendanceRate: number; // percentage
  coppaConsent: boolean;
  avatar: string;
}

interface TeacherMessage {
  id: string;
  senderName: string;
  subject: string;
  childName: string;
  content: string;
  date: string;
  isRead: boolean;
  replies: Array<{ sender: "parent" | "teacher"; text: string; date: string }>;
}

interface SchoolMessage {
  id: string;
  title: string;
  content: string;
  date: string;
  isCritical: boolean;
}

interface PaymentInvoice {
  id: string;
  date: string;
  amount: string;
  plan: string;
  status: "pago" | "pendente" | "reembolsado";
  invoiceUrl?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  ip: string;
  device: string;
}

export const ParentPortal: React.FC<{ setView?: (v: string) => void }> = ({ setView }) => {
  const { addToast } = useToast();
  const user = auth.currentUser;

  // Active tab inside the parent portal
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Dynamic States
  const [dependents, setDependents] = useState<Dependent[]>([
    { id: "dep-1", name: "Gabriel Uragan", age: 11, grade: "5º Ano", language: "Kimbundu (B1)", progress: 78, weeklyMinutes: 180, xp: 2450, level: 6, attendanceRate: 95, coppaConsent: true, avatar: "GU" },
    { id: "dep-2", name: "Beatriz Uragan", age: 8, grade: "3º Ano", language: "Kimbundu (Iniciante)", progress: 45, weeklyMinutes: 120, xp: 1200, level: 3, attendanceRate: 100, coppaConsent: true, avatar: "BU" }
  ]);
  const [selectedChildId, setSelectedChildId] = useState<string>("dep-1");

  // Co-Pilot Personalized Suggestions (AI recommendations)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Gabriel está apresentando excelente pronúncia fonética do dialeto de Malanje. Recomendamos aumentar o foco em provérbios tradicionais nesta semana.",
    "Beatriz completou todas as tarefas diárias antes das 18h. Que tal celebrar liberando um novo jogo de vocabulário hoje à noite?",
    "Identificamos uma ligeira queda de engajamento às quintas-feiras. Tente estabelecer um horário fixo de 15 minutos de estudo de manhã para manter a consistência."
  ]);

  // Messages States
  const [teacherMessages, setTeacherMessages] = useState<TeacherMessage[]>([
    {
      id: "msg-1",
      senderName: "Prof. Sérgio Bento",
      childName: "Gabriel Uragan",
      subject: "Progresso em Expressão Oral",
      content: "Olá! O Gabriel participou de forma brilhante do nosso círculo de conversação ontem. Ele demonstrou domínio impressionante de saudações avançadas. Gostaria de sugerir a gravação de um áudio curto em conjunto em casa para fixação.",
      date: "Ontem, 14:30",
      isRead: false,
      replies: []
    },
    {
      id: "msg-2",
      senderName: "Profa. Maria Inês",
      childName: "Beatriz Uragan",
      subject: "Dificuldade de Conexão Fonética",
      content: "Percebi que a Beatriz teve alguma hesitação na calibração do som de 'Nzambi'. Vou incluir uma lição de fixação na plataforma para ela. Se puderem praticar a pronúncia do fonema /N-z/ ajudará bastante.",
      date: "12 de Julho, 10:15",
      isRead: true,
      replies: [
        { sender: "parent", text: "Muito obrigado pelo retorno, professora! Já ativamos o exercício em casa e ela adorou a atividade.", date: "12 de Julho, 16:00" }
      ]
    }
  ]);
  const [replyText, setReplyText] = useState<string>("");

  // School General Announcements
  const schoolMessages: SchoolMessage[] = [
    { id: "sch-1", title: "Webinar Exclusivo para Encarregados de Educação", content: "Amanhã teremos nosso encontro pedagógico trimestral sobre o impacto das línguas nacionais no neurodesenvolvimento infantil. Link de acesso enviado ao e-mail cadastrado.", date: "Hoje, 09:00", isCritical: true },
    { id: "sch-2", title: "Manutenção Preventiva de Infraestrutura", content: "Nosso laboratório Whisper AI passará por otimização técnica no domingo, das 02h às 04h. A experiência do aluno não sofrerá interrupções críticas.", date: "10 de Julho", isCritical: false }
  ];

  // Subscription Billing and Family Plans
  const [billingPlan, setBillingPlan] = useState<string>("Plano Familiar LingoLIVE Premium");
  const [billingCycle, setBillingCycle] = useState<string>("Mensal (Próxima fatura: 14/08/2026)");
  const [billingAmount, setBillingAmount] = useState<string>("14.900,00 Kz");
  const [paymentHistory, setPaymentHistory] = useState<PaymentInvoice[]>([
    { id: "fat-304", date: "14/07/2026", amount: "14.900,00 Kz", plan: "Familiar Premium", status: "pago" },
    { id: "fat-201", date: "14/06/2026", amount: "14.900,00 Kz", plan: "Familiar Premium", status: "pago" },
    { id: "fat-102", date: "14/05/2026", amount: "14.900,00 Kz", plan: "Familiar Premium", status: "pago" }
  ]);

  // Privacy COPPA & Safety parameters
  const [coppaAgreementModal, setCoppaAgreementModal] = useState<boolean>(false);
  const [dataSharingEnabled, setDataSharingEnabled] = useState<boolean>(true);
  const [isCreditCardVerified, setIsCreditCardVerified] = useState<boolean>(true);

  // Security and Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "log-1", timestamp: "14/07/2026, 06:12", action: "Consentimento COPPA revalidado", ip: "197.80.244.15", device: "Chrome / Windows 11" },
    { id: "log-2", timestamp: "14/07/2026, 05:44", action: "Fatura de Julho descarregada", ip: "197.80.244.15", device: "Chrome / Windows 11" },
    { id: "log-3", timestamp: "10/07/2026, 19:30", action: "Compartilhamento de dados analíticos ativado", ip: "197.80.244.15", device: "Safari / iPhone 15" }
  ]);

  // Homework pending tasks
  const childHomework = {
    "dep-1": [
      { id: "hw-1", title: "Tarefa 3: Vocabulário da Feira", due: "Amanhã", completed: false, subject: "Kimbundu" },
      { id: "hw-2", title: "Pronúncia de Cortesia: Saudações", due: "18 de Julho", completed: true, subject: "Fonética" }
    ],
    "dep-2": [
      { id: "hw-3", title: "Aprender 5 Palavras de Animais", due: "Hoje", completed: false, subject: "Kimbundu" },
      { id: "hw-4", title: "Círculo de Cantigas de Cabinda", due: "22 de Julho", completed: true, subject: "História" }
    ]
  };

  // Grades & Simulado CEFR
  const childGrades = {
    "dep-1": [
      { exam: "Avaliação Escrita Módulo 1", score: 85, level: "B1", date: "05/07" },
      { exam: "Pronúncia Whisper AI Módulo 1", score: 92, level: "B1", date: "10/07" },
      { exam: "Conversação Oral Síncrona", score: 88, level: "B1", date: "12/07" }
    ],
    "dep-2": [
      { exam: "Vocabulário de Alimentos", score: 90, level: "A1", date: "02/07" },
      { exam: "Saudações Diárias", score: 95, level: "A1", date: "08/07" }
    ]
  };

  // Sync to firestore if logged in
  useEffect(() => {
    if (!user) return;
    const fetchParentData = async () => {
      try {
        const docRef = doc(db, "parent_portal", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.dependents) setDependents(data.dependents);
          if (data.dataSharingEnabled !== undefined) setDataSharingEnabled(data.dataSharingEnabled);
          if (data.billingPlan) setBillingPlan(data.billingPlan);
        } else {
          // Initialize in firestore
          await setDoc(docRef, {
            parentId: user.uid,
            dependents,
            dataSharingEnabled,
            billingPlan,
            lastAccess: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Failed fetching parent portal data from Firestore, using offline fallback.", e);
      }
    };
    fetchParentData();
  }, [user]);

  const savePrivacyState = async (sharing: boolean) => {
    setDataSharingEnabled(sharing);
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString("pt-BR"),
      action: `Compartilhamento de dados pedagógicos: ${sharing ? "Ativado" : "Desativado"}`,
      ip: "197.80.244.15",
      device: "Navegador"
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (!user) return;
    try {
      await updateDoc(doc(db, "parent_portal", user.uid), {
        dataSharingEnabled: sharing,
        auditLogs: [newLog, ...auditLogs]
      });
    } catch (e) {
      // Offline fallback
    }
  };

  const handleSendReply = (msgId: string) => {
    if (!replyText.trim()) return;
    setTeacherMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        const updatedReplies = [...msg.replies, {
          sender: "parent",
          text: replyText,
          date: "Agora mesmo"
        }];
        return { ...msg, replies: updatedReplies };
      }
      return msg;
    }));
    setReplyText("");
    addToast("Resposta enviada com sucesso ao professor!", "success");

    // Add Audit Log
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString("pt-BR"),
      action: "Mensagem enviada para o professor",
      ip: "197.80.244.15",
      device: "Navegador"
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Mock Export PDF Action
  const handleExportReport = (childName: string) => {
    addToast(`A compilar Relatório Pedagógico Integrado de ${childName} com assinaturas digitais...`, "info");
    setTimeout(() => {
      addToast(`Relatório exportado em formato PDF de Alta Fidelidade com selo LingoLIVE!`, "success");
    }, 2000);
  };

  // Add Child simulator
  const handleAddChild = () => {
    addToast("Funcionalidade de inclusão de dependente requer validação de identidade COPPA por Cartão de Crédito.", "info");
    setCoppaAgreementModal(true);
  };

  const confirmCoppaValidation = () => {
    setCoppaAgreementModal(false);
    const newChild: Dependent = {
      id: "dep-" + (dependents.length + 1),
      name: "Clara Uragan",
      age: 6,
      grade: "1º Ano",
      language: "Kimbundu (Iniciante)",
      progress: 5,
      weeklyMinutes: 0,
      xp: 150,
      level: 1,
      attendanceRate: 100,
      coppaConsent: true,
      avatar: "CU"
    };
    setDependents([...dependents, newChild]);
    addToast("Identidade validada com sucesso! Dependente Clara Uragan incluída no Plano Familiar.", "success");
    
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString("pt-BR"),
      action: "Dependente adicionada com consentimento COPPA",
      ip: "197.80.244.15",
      device: "Navegador"
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const selectedChild = dependents.find(d => d.id === selectedChildId) || dependents[0];

  // Analytics graph mock data
  const progressData = [
    { name: "Semana 1", "Gabriel": 45, "Beatriz": 20 },
    { name: "Semana 2", "Gabriel": 55, "Beatriz": 30 },
    { name: "Semana 3", "Gabriel": 68, "Beatriz": 38 },
    { name: "Semana 4", "Gabriel": 78, "Beatriz": 45 }
  ];

  const attendanceData = [
    { name: "Gabriel", "Frequência (%)": selectedChild.id === "dep-1" ? 95 : 100 },
    { name: "Meta Mínima", "Frequência (%)": 85 }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-2 md:p-6" id="parent-portal-root">
      
      {/* 1. PORTAL BRANDING HERO */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-black text-2xl font-mono shadow-inner">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold font-mono text-[10px] uppercase rounded-full border border-indigo-500/30">
                  Portal de Encarregados de Educação
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  COPPA Verificado
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1">Olá, Encarregado {user?.displayName || "Uragan"}!</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Gerencie com segurança o progresso pedagógico e a privacidade de seus dependentes.
              </p>
            </div>
          </div>

          {/* Quick Stats on Family Plan */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5 font-mono text-center">
            <div className="px-3">
              <span className="text-slate-500 text-[9px] block uppercase font-bold tracking-wider">Dependentes</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-indigo-400 font-extrabold text-lg">
                <Users className="w-4 h-4" />
                <span>{dependents.length}</span>
              </div>
            </div>
            <div className="px-3 border-l border-slate-800">
              <span className="text-slate-500 text-[9px] block uppercase font-bold tracking-wider">Faturamento</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-emerald-400 font-extrabold text-lg">
                <DollarSign className="w-4 h-4" />
                <span>Ativo</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. COPPA COMPLIANCE NOTICE BAR */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs text-amber-900 leading-relaxed font-sans">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <strong>Proteção de Dados e Privacidade Infantil (GDPR Kids & COPPA):</strong>
          <p className="text-amber-800 text-[11px]">
            LingoLIVE atua sob estrita conformidade de proteção de menores de 13 anos. Nenhuma informação de geolocalização ou imagem facial das crianças é compartilhada publicamente ou processada fora de nossos servidores locais seguros em Angola e servidores dedicados na nuvem. Você possui controle total de exclusão de dados e compartilhamento.
          </p>
        </div>
      </div>

      {/* 3. WORKSPACE SECTIONS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" id="parent-portal-navigation">
        {[
          { id: "dashboard", label: "Visão Geral Familiar", icon: Users },
          { id: "reports", label: "Relatórios & Monitoramento", icon: FileText },
          { id: "communication", label: "Comunicação com Escola & Professores", icon: MessageSquare },
          { id: "billing", label: "Assinatura & Faturamento", icon: CreditCard }
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

      {/* 4. ACTIVE WORKSPACE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ============================================== */}
        {/* TAB 1: DASHBOARD & FAMILY OVERVIEW */}
        {/* ============================================== */}
        {activeTab === "dashboard" && (
          <>
            {/* Left/Middle Columns: Dependents Overview Cards & Analytics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Children Quick Switch Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Os Meus Filhos</h3>
                    <p className="text-slate-400 text-xs">Selecione o perfil para ver o andamento imediato.</p>
                  </div>
                  <button
                    onClick={handleAddChild}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Incluir Filho
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dependents.map(child => {
                    const isSelected = selectedChildId === child.id;
                    return (
                      <div
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/10 shadow-xs" 
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-bl-xl font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[4px]" />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-xl font-extrabold flex items-center justify-center text-sm font-mono">
                            {child.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-950 text-sm">{child.name}</h4>
                            <p className="text-slate-400 text-xs">{child.grade} • {child.age} Anos</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Progresso do Curso:</span>
                            <span className="font-bold text-slate-900">{child.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${child.progress}%` }} />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100/60 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div>
                            <span className="text-slate-400 block uppercase">Nível</span>
                            <strong className="text-slate-800 text-xs block mt-0.5">Lvl {child.level}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase">Frequência</span>
                            <strong className="text-emerald-600 text-xs block mt-0.5">{child.attendanceRate}%</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase">Minutos</span>
                            <strong className="text-indigo-600 text-xs block mt-0.5">{child.weeklyMinutes}m/s</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Monitoring Area Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Histórico Comparativo de Rendimento</h3>
                    <p className="text-slate-400 text-xs">Evolução do engajamento de metas semanais completas (%) nos últimos 30 dias.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold font-mono text-[10px] rounded">Tendência Mensal</span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="colorGabriel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBeatriz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Gabriel" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorGabriel)" />
                      <Area type="monotone" dataKey="Beatriz" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorBeatriz)" />
                      <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Right Column: AI Tutor Suggestions & Instant Alerts */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Co-Pilot AI Advisor Widget */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm block">Conselheiro IA Co-Pilot</h4>
                    <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">Análise Sociolinguística</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {aiSuggestions.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] leading-relaxed text-slate-300 font-sans flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    addToast("Recomendações atualizadas em tempo real com base no desempenho mais recente dos alunos!", "success");
                    setAiSuggestions(prev => [
                      "Foco em termos rurais de Kimbundu recomendado para Gabriel. As notas de gramática dele aumentaram 12% após os novos exercícios de imersão.",
                      ...prev.slice(0, 2)
                    ]);
                  }}
                  className="w-full py-2 bg-white text-indigo-950 font-extrabold text-xs rounded-xl hover:bg-indigo-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar Análise IA
                </button>
              </div>

              {/* Verified Security Rule Info card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Configurações de Privacidade do Menor</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Partilhar métricas com a Escola:</span>
                    <button 
                      onClick={() => savePrivacyState(!dataSharingEnabled)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${dataSharingEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${dataSharingEnabled ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ao ativar, os relatórios analíticos de progresso fonético são partilhados de forma encriptada diretamente com os professores das turmas para calibração de sala de aula.
                  </p>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ============================================== */}
        {/* TAB 2: REPORTS & PROGRESS MONITORING */}
        {/* ============================================== */}
        {activeTab === "reports" && (
          <div className="lg:col-span-3 space-y-6">
            
            {/* Child Selection Header for report */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  {selectedChild.avatar}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Monitoramento Pedagógico Completo</h3>
                  <p className="text-slate-400 text-xs">Exibindo dados ativos de <strong>{selectedChild.name}</strong></p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {dependents.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedChildId === c.id 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={() => handleExportReport(selectedChild.name)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </button>
              </div>
            </div>

            {/* Sub-grid of report analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card A: Homework Tasks Checklist */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm block">Deveres de Casa & Atividades</h4>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Hoje</span>
                </div>

                <div className="space-y-3">
                  {(childHomework[selectedChild.id as keyof typeof childHomework] || []).map(task => (
                    <div 
                      key={task.id} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        task.completed ? "bg-slate-50/50 border-slate-100/50" : "bg-indigo-50/10 border-indigo-100"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block text-slate-900">{task.title}</span>
                        <span className="text-[10px] text-slate-400">Disciplina: {task.subject} • Vence: {task.due}</span>
                      </div>
                      {task.completed ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Entregue
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Grades, Simulado & Assessments */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm block">Histórico de Provas & Notas CEFR</h4>
                
                <div className="space-y-3">
                  {(childGrades[selectedChild.id as keyof typeof childGrades] || []).map((grade, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold block text-slate-900">{grade.exam}</span>
                        <span className="text-[10px] text-slate-400">Nível do Exame: {grade.level} • Data: {grade.date}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-mono font-black ${grade.score >= 90 ? "text-emerald-600" : "text-indigo-600"}`}>
                          {grade.score}/100
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">Aprovado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card C: Attendance and Activity Monitoring */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm block">Frequência Escolar & Tempo de Estudo</h4>

                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 flex items-center justify-between text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Presenças</span>
                      <strong className="text-indigo-900 text-2xl font-black">{selectedChild.attendanceRate}%</strong>
                    </div>
                    <div className="h-10 w-px bg-indigo-100" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Estudo Semanal</span>
                      <strong className="text-indigo-900 text-2xl font-black">{selectedChild.weeklyMinutes}m</strong>
                    </div>
                  </div>

                  {/* Attendance Bar Chart Representation */}
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Bar dataKey="Frequência (%)" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#4f46e5" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================== */}
        {/* TAB 3: SCHOOL & TEACHER CHAT */}
        {/* ============================================== */}
        {activeTab === "communication" && (
          <div className="lg:col-span-3 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Teacher Conversations List */}
              <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm block">Conversas de Acompanhamento (Professores)</h4>
                
                <div className="space-y-2">
                  {teacherMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      onClick={() => {
                        setTeacherMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
                        setSelectedChildId(msg.childName === "Gabriel Uragan" ? "dep-1" : "dep-2");
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        !msg.isRead ? "border-indigo-600 bg-indigo-50/10" : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {!msg.isRead && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                      )}
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{msg.senderName}</span>
                        <span>{msg.date}</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-950 mt-1">{msg.subject}</h5>
                      <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">Filho: {msg.childName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Chat Canvas */}
              <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col h-[420px]">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Linha Direta Escolar Segura</h4>
                    <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-emerald-500" /> Comunicação Protegida e Auditada
                    </span>
                  </div>
                </div>

                {/* Message stream */}
                <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
                  {/* Find messages relating to selected child to display dynamic simulation */}
                  {teacherMessages.filter(m => m.childName === selectedChild.name).map((msg, idx) => (
                    <div key={idx} className="space-y-4">
                      {/* Teacher message */}
                      <div className="max-w-[85%] bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs rounded-tl-xs">
                        <span className="text-[9px] text-indigo-600 font-bold block mb-1">Tutor: {msg.senderName}</span>
                        <p className="leading-relaxed text-slate-700">{msg.content}</p>
                      </div>

                      {/* Parent Replies */}
                      {msg.replies.map((reply, rIdx) => (
                        <div key={rIdx} className="max-w-[85%] bg-indigo-600 text-white p-4 rounded-2xl text-xs rounded-tr-xs ml-auto">
                          <span className="text-[9px] text-indigo-200 font-bold block mb-1">Você (Encarregado de Educação)</span>
                          <p className="leading-relaxed">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Reply interface */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder={`Responder ao tutor de ${selectedChild.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const targetMsg = teacherMessages.find(m => m.childName === selectedChild.name);
                        if (targetMsg) handleSendReply(targetMsg.id);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => {
                      const targetMsg = teacherMessages.find(m => m.childName === selectedChild.name);
                      if (targetMsg) handleSendReply(targetMsg.id);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Responder
                  </button>
                </div>
              </div>

            </div>

            {/* School General Announcements Broadcast Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm block">Boletins de Informação & Comunicados Oficiais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schoolMessages.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border ${
                      item.isCritical ? "bg-rose-50/20 border-rose-100" : "bg-slate-50/30 border-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                      {item.isCritical && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 font-extrabold font-mono text-[9px] rounded-full uppercase">
                          Importante
                        </span>
                      )}
                    </div>
                    <h5 className="font-extrabold text-xs text-slate-900 mt-1.5">{item.title}</h5>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================== */}
        {/* TAB 4: BILLING & FAMILY SUBSCRIPTIONS */}
        {/* ============================================== */}
        {activeTab === "billing" && (
          <div className="lg:col-span-3 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box A: Active subscription profile */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm block">Minha Assinatura</h4>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold font-mono text-[10px] rounded-full uppercase">
                    Ativo
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 font-sans">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">PLANO ATUAL</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{billingPlan}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">CICLO & VALOR</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{billingAmount} • {billingCycle}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">MÉTODO DE COBRANÇA</span>
                    <span className="text-xs text-slate-500 block mt-0.5 font-mono">Cartão de Crédito final *4092 (Multicaixa/Visa)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      addToast("Migração de plano agendada para o fim do ciclo atual.", "success");
                      setBillingPlan("Plano Anual LingoLIVE Premium");
                      setBillingAmount("149.000,00 Kz");
                      setBillingCycle("Anual (Fatura seguinte: 14/08/2026)");
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm text-center"
                  >
                    Upgrade para Anual
                  </button>
                  <button 
                    onClick={() => addToast("Suporte financeiro acionado para cancelamento.", "info")}
                    className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                  >
                    Cancelar Plano
                  </button>
                </div>
              </div>

              {/* Box B: Payment History / Invoices */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm block">Histórico de Transações</h4>
                
                <div className="space-y-2">
                  {paymentHistory.map(invoice => (
                    <div key={invoice.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold block text-slate-800">{invoice.plan}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {invoice.id} • {invoice.date}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-slate-900 font-mono block">{invoice.amount}</strong>
                        <button 
                          onClick={() => addToast(`Recibo ${invoice.id} baixado com sucesso em PDF!`, "success")}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          Baixar Recibo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box C: Security audit log for parent actions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm block">Histórico de Auditoria & Segurança</h4>
                  <span className="text-[10px] text-indigo-600 font-bold font-mono">Logs Ativos</span>
                </div>

                <div className="space-y-3 h-52 overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50/50 border border-slate-150/50 rounded-xl text-[10px] font-mono leading-relaxed space-y-1">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{log.action}</span>
                        <span className="text-slate-400">{log.timestamp}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[9px]">
                        <span>IP: {log.ip}</span>
                        <span>Dispositivo: {log.device}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* 5. COPPA ID VERIFICATION / PARENTAL VERIFICATION MODAL */}
      <AnimatePresence>
        {coppaAgreementModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 text-slate-900">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
                <div>
                  <h3 className="font-black text-base">Consentimento Parental Verificado</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Mecanismo de Segurança COPPA</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                As regulamentações internacionais exigem que o LingoLIVE obtenha o consentimento verificável de um dos pais ou responsável antes de coletar qualquer informação de menores de 13 anos.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] font-mono text-slate-600 space-y-2">
                <strong>Para validar que você é maior de idade:</strong>
                <p>
                  Por favor, simule o código de verificação do Cartão de Crédito cadastrado (Nenhum valor será cobrado):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="MM/AA" className="col-span-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-center text-xs" />
                  <input type="password" placeholder="CVV" className="col-span-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-center text-xs" />
                  <button 
                    onClick={confirmCoppaValidation}
                    className="col-span-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded shadow-xs cursor-pointer"
                  >
                    Validar
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setCoppaAgreementModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
