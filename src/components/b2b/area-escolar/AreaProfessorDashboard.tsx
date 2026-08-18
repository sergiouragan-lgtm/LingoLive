import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, BookOpen, FileText, CheckSquare, Sparkles, 
  MessageSquare, Calendar, TrendingUp, Award, Clock, ArrowRight, 
  ChevronRight, Play, CheckCircle, AlertCircle, RefreshCw, Send, Plus, 
  Trash2, Filter, Search, Download, Edit2, Check, BarChart2, PieChart, 
  Trophy, BookOpenCheck, HelpCircle, FileSignature, ThumbsUp, Volume2,
  Sliders, Settings, GraduationCap, Cpu, Image, Library, ShoppingCart, 
  Globe, ShieldCheck, HeartHandshake, FolderOpen, Newspaper, FileCode, 
  Layers, ListTodo, ClipboardList, Target, Bookmark, Share2, Eye, PlayCircle, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import {
  AlunosView, AulasView, CalendarioView, ChatView, RelatoriosGeraisView, 
  CertificacoesView, EmbaixadoresView, ConfiguracoesView, AssessmentStudioExtendedView,
  CreatorAssessmentView, CourseBuilderView, LessonBuilderView, ActivityBuilderView,
  FlashcardBuilderView, StoryBuilderView, PronunciationBuilderView, ConversationBuilderView,
  AssignmentBuilderView, HomeworkBuilderView, AIContentGeneratorView, MediaLibraryView,
  QuestionBankView, ResourceMarketplaceView, PublishingCenterView, LarsView
} from './CreatorAndProfessorViews';

interface AreaProfessorDashboardProps {
  setView: (view: any) => void;
}

// Type declarations
interface Course {
  id: string;
  title: string;
  level: string;
  studentsCount: number;
  progress: number;
  lessonsCount: number;
  image: string;
  description: string;
}

interface Class {
  id: string;
  name: string;
  course: string;
  studentsCount: number;
  avgFluency: number;
  attendance: number;
  activeStreak: number;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  fluencyScore: number;
  attendance: number;
  streak: number;
  lastActive: string;
  confidence: 'High' | 'Medium' | 'Low';
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple' | 'gap-fill' | 'speaking';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  bancoMundial?: string;
  idioma?: string;
  pais?: string;
  dialeto?: string;
  nivelCefr?: string;
  tema?: string;
  profissao?: string;
  dificuldade?: string;
  autor?: string;
  versao?: string;
}

interface Exam {
  id: string;
  title: string;
  targetClass: string;
  status: 'Active' | 'Scheduled' | 'Completed';
  submissionsCount: number;
  totalStudents: number;
  dueDate: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentAvatar: string;
  className: string;
  activityTitle: string;
  submittedAt: string;
  rawText: string;
  status: 'Pending' | 'Graded';
}

export const AreaProfessorDashboard: React.FC<AreaProfessorDashboardProps> = ({ setView }) => {
  // Navigation State & Modes
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [platformMode, setPlatformMode] = useState<'professor' | 'creator'>('professor');
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    assessment: true,
    creatorAssessment: true
  });
  
  // Avaliações Sub-tabs: 'studio' | 'banco' | 'exames' | 'correcoes' | 'relatorios' | 'exercicios' | 'testes' | 'rubricas' | 'ia-assistente' | 'biblioteca' | 'marketplace'
  const [activeSubTab, setActiveSubTab] = useState<string>('studio');

  // Interactive State Storage
  const [courses, setCourses] = useState<Course[]>([
    { id: 'c1', title: 'Inglês Corporativo Avançado', level: 'C1', studentsCount: 45, progress: 78, lessonsCount: 24, image: '👔', description: 'Foco em negociações globais, apresentações executivas e lingo corporativa de alto impacto.' },
    { id: 'c2', title: 'Preparatório IELTS & Cambridge', level: 'B2-C2', studentsCount: 28, progress: 62, lessonsCount: 30, image: '🎓', description: 'Treinamento intensivo cobrindo todas as competências do exame com ênfase em speaking livre.' },
    { id: 'c3', title: 'Espanhol de Negócios e Networking', level: 'B1-B2', studentsCount: 15, progress: 45, lessonsCount: 16, image: '🇪🇸', description: 'Desenvolvimento de fluência em ambientes de comércio internacional e relações públicas.' },
  ]);

  const [classes, setClasses] = useState<Class[]>([
    { id: 't1', name: 'Turma Alfa (Inglês Executive)', course: 'Inglês Corporativo Avançado', studentsCount: 18, avgFluency: 82, attendance: 95, activeStreak: 12 },
    { id: 't2', name: 'Turma Beta (IELTS Preparation)', course: 'Preparatório IELTS & Cambridge', studentsCount: 12, avgFluency: 76, attendance: 91, activeStreak: 8 },
    { id: 't3', name: 'Turma Gama (Beginners English)', course: 'Introdução ao Inglês Geral', studentsCount: 15, avgFluency: 44, attendance: 88, activeStreak: 5 },
  ]);

  const [selectedClassId, setSelectedClassId] = useState<string>('t1');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Syllabus Builder States
  const [syllTopic, setSyllTopic] = useState('');
  const [syllLang, setSyllLang] = useState('Inglês');
  const [syllLevel, setSyllLevel] = useState('B2');
  const [generatingSyllabus, setGeneratingSyllabus] = useState(false);
  const [aiSyllabusResult, setAiSyllabusResult] = useState<any | null>(null);

  // AI Assessment Studio States
  const [assessLang, setAssessLang] = useState('Inglês');
  const [assessLevel, setAssessLevel] = useState('B2');
  const [assessFocus, setAssessFocus] = useState('Speaking & Pronúncia');
  const [assessTopic, setAssessTopic] = useState('Entrevista de Emprego na Área de Tech');
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [aiAssessmentResult, setAiAssessmentResult] = useState<any | null>(null);

  // AI Question Bank States
  const [selectedBanco, setSelectedBanco] = useState<string>('Todos');
  const [selectedIdioma, setSelectedIdioma] = useState<string>('Todos');
  const [selectedPais, setSelectedPais] = useState<string>('Todos');
  const [selectedDialeto, setSelectedDialeto] = useState<string>('Todos');
  const [selectedCefr, setSelectedCefr] = useState<string>('Todos');
  const [selectedTema, setSelectedTema] = useState<string>('Todos');
  const [selectedProfissao, setSelectedProfissao] = useState<string>('Todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos');
  const [selectedDificuldade, setSelectedDificuldade] = useState<string>('Todos');
  const [selectedAutor, setSelectedAutor] = useState<string>('Todos');
  const [selectedVersao, setSelectedVersao] = useState<string>('Todos');

  const [questionBank, setQuestionBank] = useState<QuizQuestion[]>([
    { 
      id: 'q1', 
      text: 'Which of the following prepositions is correct: "He is interested ___ purchasing the premium subscription."', 
      type: 'multiple', 
      options: ['in', 'on', 'at', 'with'], 
      correctAnswer: 'in', 
      explanation: 'The adjective "interested" takes the preposition "in".',
      bancoMundial: 'LingoLIVE Global Standard',
      idioma: 'Inglês',
      pais: 'Estados Unidos',
      dialeto: 'General American',
      nivelCefr: 'B2',
      tema: 'Vendas & Negociações',
      profissao: 'Executivo de Contas',
      dificuldade: 'Médio',
      autor: 'Prof. Marta Rebelo',
      versao: 'v1.2'
    },
    { 
      id: 'q2', 
      text: 'How do you correctly pitch a budget cut to senior stakeholders? Record a 30-second explanation.', 
      type: 'speaking', 
      correctAnswer: '[Vocal Model Check]', 
      explanation: 'Should start with a formal hook, address the why, and focus on resource optimization.',
      bancoMundial: 'LingoLIVE Global Standard',
      idioma: 'Inglês',
      pais: 'Reino Unido',
      dialeto: 'Received Pronunciation',
      nivelCefr: 'C1',
      tema: 'Apresentações de Resultados',
      profissao: 'Gerente de Produtos',
      dificuldade: 'Difícil',
      autor: 'Dr. Michael Johnson',
      versao: 'v2.1'
    },
    { 
      id: 'q3', 
      text: 'Complete: "If we had closed the deal yesterday, we _______ celebrating today."', 
      type: 'multiple', 
      options: ['would be', 'will be', 'had been', 'are'], 
      correctAnswer: 'would be', 
      explanation: 'This is a mixed conditional expressing present result of a past event.',
      bancoMundial: 'TOEFL Practice Base',
      idioma: 'Inglês',
      pais: 'Estados Unidos',
      dialeto: 'General American',
      nivelCefr: 'B2',
      tema: 'Discussões Financeiras',
      profissao: 'Gerente Financeiro',
      dificuldade: 'Médio',
      autor: 'Prof. Sarah Jenkins',
      versao: 'v1.5'
    },
    {
      id: 'q4',
      text: '¿Cuál es la forma correcta del verbo en la frase: "Espero que nosotros _______ el acuerdo antes del viernes."',
      type: 'multiple',
      options: ['cerremos', 'cerramos', 'cerremos de', 'cerráramos'],
      correctAnswer: 'cerremos',
      explanation: 'Usa el subjuntivo de la primera persona del plural del verbo cerrar.',
      bancoMundial: 'LingoLIVE Global Standard',
      idioma: 'Espanhol',
      pais: 'Espanha',
      dialeto: 'Castelhano (Madrid)',
      nivelCefr: 'B1',
      tema: 'Reuniões e Negociações',
      profissao: 'Executivo de Vendas',
      dificuldade: 'Fácil',
      autor: 'Prof. Javier Gómez',
      versao: 'v1.2'
    }
  ]);
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [generatingQuestion, setGeneratingQuestion] = useState(false);

  // Exames States
  const [exams, setExams] = useState<Exam[]>([
    { id: 'e1', title: 'Simulado Oral: Hotel Check-in', targetClass: 'Turma Gama (Beginners English)', status: 'Active', submissionsCount: 11, totalStudents: 15, dueDate: '2026-07-22' },
    { id: 'e2', title: 'Pitch de Vendas & Feedback de IA', targetClass: 'Turma Alfa (Inglês Executive)', status: 'Active', submissionsCount: 16, totalStudents: 18, dueDate: '2026-07-20' },
    { id: 'e3', title: 'Redação: Futuro da Tecnologia', targetClass: 'Turma Beta (IELTS Preparation)', status: 'Scheduled', submissionsCount: 0, totalStudents: 12, dueDate: '2026-07-25' },
  ]);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamClass, setNewExamClass] = useState('t1');
  const [newExamDueDate, setNewExamDueDate] = useState('');

  // Submissions Awaiting AI Corrections
  const [submissions, setSubmissions] = useState<Submission[]>([
    { 
      id: 'sub1', 
      studentName: 'Marta Rebelo', 
      studentAvatar: '👩‍💼', 
      className: 'Turma Alfa (Inglês Executive)', 
      activityTitle: 'Desafio Oral: Negociação Salarial', 
      submittedAt: 'Há 2 horas',
      rawText: "Hello. Thank you for your time today. I want to ask for a salary increase because I have delivered very good results on the last quarter, bringing three new major clients and increasing overall revenue. I hope we can agree in a fair adjustment.",
      status: 'Pending'
    },
    { 
      id: 'sub2', 
      studentName: 'Carlos Cruz', 
      studentAvatar: '👨‍💻', 
      className: 'Turma Beta (IELTS Preparation)', 
      activityTitle: 'Ensaio IELTS: Desafios Ambientais', 
      submittedAt: 'Há 5 horas',
      rawText: "The climate change is one of the most critical issue that humanity faces today. In my perspective, governments should invest more in clean energy sources like solar and wind power, instead to continue burning fossil fuels. If we don't act quick, the consequences will be severe for future generations.",
      status: 'Pending'
    }
  ]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [analyzingSub, setAnalyzingSub] = useState(false);
  const [subAnalysisResult, setSubAnalysisResult] = useState<any | null>(null);
  const [customTeacherScore, setCustomTeacherScore] = useState<number>(85);
  const [customTeacherNote, setCustomTeacherNote] = useState<string>('');

  // Toast handler
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Trigger TTS
  const speakTarget = (text: string, lang = 'en-US') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
    triggerToast(`🔊 Reproduzindo áudio nativo para: "${text}"`);
  };

  // AI Syllabus Builder Simulation
  const handleGenerateSyllabus = () => {
    if (!syllTopic.trim()) {
      triggerToast('⚠️ Por favor, digite um tema ou foco para o plano de aula.');
      return;
    }
    setGeneratingSyllabus(true);
    setAiSyllabusResult(null);

    setTimeout(() => {
      setAiSyllabusResult({
        topic: syllTopic,
        level: syllLevel,
        weeks: [
          {
            week: 1,
            title: `Introdução a ${syllTopic}`,
            objectives: `Dominar vocabulário básico e termos de jargão de ${syllTopic}.`,
            scenario: `Conversação básica simulando uma introdução de ${syllTopic}.`,
            vocab: ['Estrutura inicial', 'Terminologia básica', 'Fórmula de abordagem']
          },
          {
            week: 2,
            title: `Aprofundamento e Roleplay Ativo`,
            objectives: `Utilizar expressões idiomáticas aplicadas a ${syllTopic}.`,
            scenario: `Simulação de debate ou discussão de grupo sobre o assunto.`,
            vocab: ['Argumentação', 'Contraponto linguístico', 'Sustentação oral']
          },
          {
            week: 3,
            title: `Expressão Avançada e Apresentação`,
            objectives: `Apresentar um minicase estruturado sobre ${syllTopic} recebendo dicas de pronúncia.`,
            scenario: `Pitch executivo individual para o tutor virtual de IA.`,
            vocab: ['Projeção vocal', 'Estruturação lógica', 'Metáforas profissionais']
          },
          {
            week: 4,
            title: `Revisão Pedagógica & Simulado Final`,
            objectives: `Consolidar fluência espontânea em cenários estressantes de conversação.`,
            scenario: `Simulado surpresa com interações rápidas no LingoLIVE.`,
            vocab: ['Expressividade', 'Gestão de silêncio', 'Retomada de raciocínio']
          }
        ]
      });
      setGeneratingSyllabus(false);
      triggerToast('✨ Plano de aula com IA gerado com sucesso!');
    }, 2000);
  };

  // AI Assessment Studio Simulation
  const handleGenerateAssessment = () => {
    setGeneratingAssessment(true);
    setAiAssessmentResult(null);

    setTimeout(() => {
      setAiAssessmentResult({
        title: `Exame de Performance: ${assessTopic}`,
        level: assessLevel,
        focus: assessFocus,
        scenarioConfig: {
          tutorName: 'Rachel (Tutor Executivo)',
          role: 'Entrevistadora Sênior de Tecnologia',
          initialPrompt: `Hello! Welcome to your technical assessment. I see you're applying for the position related to ${assessTopic}. Can you start by explaining how you resolved a major bug under high-pressure conditions in your previous role?`
        },
        rubrics: [
          { name: 'Fluência & Coesão', desc: 'Capacidade de encadear ideias lógicas de forma contínua, sem pausas prolongadas ou preenchimentos robóticos.' },
          { name: 'Precisão de Pronúncia', desc: 'Uso correto da articulação fonética, ênfase nas sílabas tônicas (stress patterns) e clareza vocal geral.' },
          { name: 'Riqueza de Vocabulário', desc: 'Uso de verbos de ação específicos, jargões técnicos da área e ausência de repetição excessiva de palavras.' }
        ],
        theoreticalQuestions: [
          { q: 'Identify the correct professional phrasing to interrupt politely during a meeting:', choices: ['Stop talking, I need to say something.', 'Could I just jump in here for a moment?', 'Shut up please.', 'I want to speak now.'], correct: 'Could I just jump in here for a moment?' },
          { q: 'Which idiom best describes "working late into the night"?', choices: ['Burning the midnight oil', 'Biting the bullet', 'Under the weather', 'Spilling the beans'], correct: 'Burning the midnight oil' }
        ]
      });
      setGeneratingAssessment(false);
      triggerToast('🔮 Avaliação avançada de IA montada!');
    }, 2500);
  };

  // AI Question Generation Simulation
  const handleGenerateQuestion = () => {
    if (!newQuestionTopic.trim() && selectedTema === 'Todos') {
      triggerToast('⚠️ Digite o tema da questão ou selecione um Tema na taxonomia para guiar a IA.');
      return;
    }
    setGeneratingQuestion(true);
    
    setTimeout(() => {
      const topic = newQuestionTopic.trim() || selectedTema;
      const questionType = selectedTipo !== 'Todos' ? (selectedTipo === 'multiple' || selectedTipo === 'speaking' || selectedTipo === 'gap-fill' ? selectedTipo : 'multiple') : 'multiple';
      
      let questionText = `Choose the correct option containing the ideal expression for ${topic}: "We ________ completed the project before the absolute deadline, but the API crashed."`;
      let opts = ['would have', 'will have', 'should have to', 'must to'];
      let correct = 'would have';
      let expl = `This uses the third conditional modal structure 'would have' to describe a hypothetical past outcome that was prevented for theme: ${topic}.`;

      if (questionType === 'speaking') {
        questionText = `Record a 45-second explanation addressing the topic: "${topic}". How would you explain this situation professionally?`;
        opts = undefined as any;
        correct = '[Vocal Model Check]';
        expl = `Evaluates speaking fluency, professional accent, and technical vocabulary related to ${topic}.`;
      } else if (questionType === 'gap-fill') {
        questionText = `Complete: "Regarding our discussion on ${topic}, we need to ________ a consensus before the next fiscal review."`;
        opts = ['reach', 'attain', 'make', 'do'];
        correct = 'reach';
        expl = `The verb "reach" is the standard collocated verb to use with "consensus" in business English.`;
      }

      const generated: QuizQuestion = {
        id: `q-gen-${Date.now()}`,
        text: questionText,
        type: questionType,
        options: opts,
        correctAnswer: correct,
        explanation: expl,
        bancoMundial: selectedBanco !== 'Todos' ? selectedBanco : 'LingoLIVE Global Standard',
        idioma: selectedIdioma !== 'Todos' ? selectedIdioma : 'Inglês',
        pais: selectedPais !== 'Todos' ? selectedPais : 'Estados Unidos',
        dialeto: selectedDialeto !== 'Todos' ? selectedDialeto : 'General American',
        nivelCefr: selectedCefr !== 'Todos' ? selectedCefr : 'B2',
        tema: selectedTema !== 'Todos' ? selectedTema : (newQuestionTopic || 'Geral'),
        profissao: selectedProfissao !== 'Todos' ? selectedProfissao : 'Geral',
        dificuldade: selectedDificuldade !== 'Todos' ? selectedDificuldade : 'Médio',
        autor: selectedAutor !== 'Todos' ? selectedAutor : 'LingoLIVE IA',
        versao: selectedVersao !== 'Todos' ? selectedVersao : 'v1.0'
      };

      setQuestionBank(prev => [generated, ...prev]);
      setNewQuestionTopic('');
      setGeneratingQuestion(false);
      triggerToast('🎉 Nova questão gerada com IA usando a Taxonomia Selecionada!');
    }, 1500);
  };

  // Schedule Exam Action
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDueDate) {
      triggerToast('⚠️ Preencha todos os campos do exame.');
      return;
    }

    const selectedClass = classes.find(c => c.id === newExamClass);
    const newExam: Exam = {
      id: `e-${Date.now()}`,
      title: newExamTitle,
      targetClass: selectedClass ? selectedClass.name : 'Turma Alfa',
      status: 'Active',
      submissionsCount: 0,
      totalStudents: selectedClass ? selectedClass.studentsCount : 15,
      dueDate: newExamDueDate
    };

    setExams(prev => [newExam, ...prev]);
    setNewExamTitle('');
    setNewExamDueDate('');
    triggerToast(`🚀 Exame "${newExam.title}" publicado para os alunos!`);
  };

  // Simulate Submission Analysis with IA
  const handleAnalyzeSubmission = (sub: Submission) => {
    setAnalyzingSub(true);
    setSelectedSub(sub);
    setSubAnalysisResult(null);

    setTimeout(() => {
      let analysis = {
        grade: sub.id === 'sub1' ? 88 : 74,
        grammarMistakes: sub.id === 'sub1' ? [
          { error: "agree in a fair adjustment", correction: "agree on a fair adjustment", reason: "The verb 'agree' takes the preposition 'on' or 'to' when referencing terms/adjustments." },
          { error: "results on the last quarter", correction: "results in the last quarter", reason: "Use 'in the last quarter' for timeframes." }
        ] : [
          { error: "The climate change is...", correction: "Climate change is...", reason: "General atmospheric concepts do not require the definite article 'the' at the beginning of sentences." },
          { error: "most critical issue", correction: "most critical issues", reason: "Plural nouns should follow 'one of the'." },
          { error: "instead to continue", correction: "instead of continuing", reason: "The phrase 'instead of' requires the gerund form of the verb." },
          { error: "don't act quick", correction: "don't act quickly", reason: "Use the adverb 'quickly' to modify the verb 'act'." }
        ],
        pronunciationAnalysis: sub.id === 'sub1' ? [
          {
            word: "agree",
            userPhonetic: "ah-gree",
            nativePhonetic: "uh-GREE",
            tip: "Soften the first vowel into a neutral 'schwa' sound and prolong the 'ee' sound on the second syllable."
          },
          {
            word: "quarter",
            userPhonetic: "kuar-ter",
            nativePhonetic: "KWAWR-ter",
            tip: "Round your lips firmly at the beginning to capture the proper 'kw' glide and make the first syllable stress clear."
          }
        ] : [
          {
            word: "climate",
            userPhonetic: "klee-mate",
            nativePhonetic: "KLAHY-mit",
            tip: "The first vowel is a long 'I' dipthong (ai). The second syllable is very short, sounding like 'mit' instead of 'mate'."
          },
          {
            word: "consequences",
            userPhonetic: "kon-se-kuen-ses",
            nativePhonetic: "KON-si-kwuhn-siz",
            tip: "Focus the main emphasis on the first syllable 'KON'. The remaining syllables are unstressed and rapid."
          }
        ],
        vocabularySuggestions: sub.id === 'sub1' ? [
          { original: "very good results", recommendation: "exceptional milestones / outstanding performance", reason: "Sounds far more professional in an executive salary review scenario." },
          { original: "bringing three clients", recommendation: "onboarding / securing three major corporate accounts", reason: "Strong business action verbs demonstrate higher language proficiency." }
        ] : [
          { original: "most critical issue", recommendation: "pressing environmental menace / existential crisis", reason: "Adds emotional resonance and academic weight appropriate for IELTS level." }
        ],
        motivationalSummary: sub.id === 'sub1' 
          ? "Great pitch structure! Marta did an outstanding job outlining her commercial achievements clearly. With minor adjustments to prepositional accuracy and higher-tier business action verbs, her oral confidence will be absolutely world-class."
          : "Carlos shows a strong vocabulary baseline and highly relevant points. The primary area of development is adverb/preposition syntax coherence and avoiding literal Portuguese translations. He is very close to a solid Band 7.5."
      };

      setSubAnalysisResult(analysis);
      setCustomTeacherScore(analysis.grade);
      setAnalyzingSub(false);
      triggerToast('🔬 Análise de Redação e Pronúncia por IA concluída!');
    }, 2000);
  };

  // Publish Grade
  const handlePublishGrade = () => {
    if (!selectedSub) return;
    
    // Update the submission status in local state
    setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? { ...s, status: 'Graded' } : s));
    triggerToast(`⭐ Nota ${customTeacherScore}/100 e feedbacks publicados para ${selectedSub.studentName}!`);
    setSelectedSub(null);
    setSubAnalysisResult(null);
  };

  // Mock Student Roster Data for Selected Class
  const getStudentsForClass = (classId: string): Student[] => {
    if (classId === 't1') {
      return [
        { id: 's1', name: 'Marta Rebelo', avatar: '👩‍💼', fluencyScore: 84, attendance: 96, streak: 12, lastActive: 'Hoje', confidence: 'High' },
        { id: 's2', name: 'Ricardo Dias', avatar: '👨‍💼', fluencyScore: 78, attendance: 92, streak: 9, lastActive: 'Ontem', confidence: 'Medium' },
        { id: 's3', name: 'Ana Filipa', avatar: '👩‍💻', fluencyScore: 88, attendance: 98, streak: 15, lastActive: 'Há 2 dias', confidence: 'High' },
        { id: 's4', name: 'Tiago Santos', avatar: '👨‍🎨', fluencyScore: 68, attendance: 85, streak: 4, lastActive: 'Ontem', confidence: 'Medium' },
        { id: 's5', name: 'Sara Costa', avatar: '👩‍🔬', fluencyScore: 92, attendance: 100, streak: 22, lastActive: 'Hoje', confidence: 'High' },
      ];
    } else if (classId === 't2') {
      return [
        { id: 's6', name: 'Carlos Cruz', avatar: '👨‍💻', fluencyScore: 74, attendance: 90, streak: 8, lastActive: 'Ontem', confidence: 'Medium' },
        { id: 's7', name: 'Beatriz Lima', avatar: '👩‍⚕️', fluencyScore: 80, attendance: 94, streak: 11, lastActive: 'Hoje', confidence: 'High' },
        { id: 's8', name: 'Nuno Rocha', avatar: '👨‍✈️', fluencyScore: 64, attendance: 82, streak: 3, lastActive: 'Há 4 dias', confidence: 'Low' },
        { id: 's9', name: 'Gabriela Fernandes', avatar: '👩‍🏫', fluencyScore: 86, attendance: 97, streak: 14, lastActive: 'Hoje', confidence: 'High' },
      ];
    } else {
      return [
        { id: 's10', name: 'João Silva', avatar: '👨‍🌾', fluencyScore: 42, attendance: 88, streak: 5, lastActive: 'Ontem', confidence: 'Medium' },
        { id: 's11', name: 'Maria Santos', avatar: '👩‍🍳', fluencyScore: 48, attendance: 90, streak: 7, lastActive: 'Hoje', confidence: 'Medium' },
        { id: 's12', name: 'Pedro Alves', avatar: '👨‍🔧', fluencyScore: 38, attendance: 82, streak: 2, lastActive: 'Há 3 dias', confidence: 'Low' },
      ];
    }
  };

  // Filter student roster
  const filteredStudents = getStudentsForClass(selectedClassId).filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats computed dynamically
  const selectedClassDetails = classes.find(c => c.id === selectedClassId) || classes[0];

  // Mock stats graphs data
  const dataWeeklyFluency = [
    { name: 'Semana 1', 'Média Alfa': 72, 'Média Beta': 68, 'Média Gama': 34 },
    { name: 'Semana 2', 'Média Alfa': 75, 'Média Beta': 70, 'Média Gama': 38 },
    { name: 'Semana 3', 'Média Alfa': 78, 'Média Beta': 72, 'Média Gama': 40 },
    { name: 'Semana 4', 'Média Alfa': 82, 'Média Beta': 76, 'Média Gama': 44 },
  ];

  const dataSkillsRadar = [
    { subject: 'Speaking (Fluência)', A: 85, B: 72, fullMark: 100 },
    { subject: 'Listening (Audição)', A: 90, B: 85, fullMark: 100 },
    { subject: 'Vocabulary (Léxico)', A: 80, B: 76, fullMark: 100 },
    { subject: 'Grammar (Escrita)', A: 75, B: 78, fullMark: 100 },
    { subject: 'Pronunciation (Fônica)', A: 82, B: 70, fullMark: 100 },
  ];

  const dataEngagementPie = [
    { name: 'Conversações Ativas com IA', value: 245, color: '#6366f1' },
    { name: 'Mini-Quizzes de Prática', value: 120, color: '#10b981' },
    { name: 'Provas & Exames Orais', value: 47, color: '#f43f5e' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-indigo-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-xs sm:text-sm font-bold text-slate-100">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Panel */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-xl shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              LingoLIVE <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent font-extrabold text-xs uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-indigo-500/20 bg-slate-900">Educator IA</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Painel Escolar & Controle do Professor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-300 font-semibold">Tutor AI Core: Ativo</span>
          </div>
          
          <button 
            onClick={() => setView('dashboard')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            Voltar ao Onboarding
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 relative z-10">
        
        {/* Navigation Sidebar with Collapsible Tree */}
        <aside className="lg:w-72 w-full flex flex-col gap-4 shrink-0 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-900/60 pr-0 lg:pr-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Mode Switcher Buttons */}
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 flex gap-1">
            <button
              onClick={() => {
                setPlatformMode('professor');
                setActiveTab('dashboard');
                triggerToast('👨‍🏫 Modo: Painel de Controle do Professor');
              }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                platformMode === 'professor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Professor</span>
            </button>
            <button
              onClick={() => {
                setPlatformMode('creator');
                setActiveTab('course-builder');
                triggerToast('🎨 Modo: LingoLIVE Creator Platform');
              }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                platformMode === 'creator'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Creator</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {platformMode === 'professor' ? (
              <>
                {/* 1. Dashboard */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Dashboard</span>
                </button>

                {/* 2. Minhas Turmas */}
                <button
                  onClick={() => setActiveTab('turmas')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'turmas'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Minhas Turmas</span>
                </button>

                {/* 3. Alunos */}
                <button
                  onClick={() => setActiveTab('alunos')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'alunos'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Alunos</span>
                </button>

                {/* 4. Aulas */}
                <button
                  onClick={() => setActiveTab('aulas')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'aulas'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Aulas</span>
                </button>

                {/* 5. Calendário */}
                <button
                  onClick={() => setActiveTab('calendario')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'calendario'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Calendário</span>
                </button>

                {/* 6. Chat */}
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Chat</span>
                </button>

                {/* 7. Assessment Studio (Collapsible Item) */}
                <div className="space-y-1">
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, assessment: !prev.assessment }))}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpenCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span>Assessment Studio</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expandedMenus.assessment ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedMenus.assessment && (
                    <div className="pl-6 border-l border-slate-850 ml-6 flex flex-col gap-1 py-1">
                      {[
                        { id: 'banco', label: 'Banco de Questões', icon: Database },
                        { id: 'exercicios', label: 'Exercícios', icon: FileSignature },
                        { id: 'testes', label: 'Testes', icon: Target },
                        { id: 'exames', label: 'Exames', icon: CheckSquare },
                        { id: 'correcoes', label: 'Correções', icon: Sliders },
                        { id: 'rubricas', label: 'Rubricas', icon: ClipboardList },
                        { id: 'ia-assistente', label: 'IA Assistente', icon: Sparkles },
                        { id: 'biblioteca', label: 'Biblioteca', icon: Library },
                        { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart }
                      ].map((sub) => {
                        let isSelected = false;
                        if (sub.id === 'banco') {
                          isSelected = activeTab === 'avaliacoes' && activeSubTab === 'banco';
                        } else if (sub.id === 'exames') {
                          isSelected = activeTab === 'avaliacoes' && activeSubTab === 'exames';
                        } else if (sub.id === 'correcoes') {
                          isSelected = activeTab === 'avaliacoes' && activeSubTab === 'correcoes';
                        } else if (sub.id === 'ia-assistente') {
                          isSelected = activeTab === 'avaliacoes' && activeSubTab === 'studio';
                        } else {
                          isSelected = activeTab === 'assessment-studio' && activeSubTab === sub.id;
                        }

                        const SubIcon = sub.icon;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              if (sub.id === 'banco') {
                                setActiveTab('avaliacoes');
                                setActiveSubTab('banco');
                              } else if (sub.id === 'exames') {
                                setActiveTab('avaliacoes');
                                setActiveSubTab('exames');
                              } else if (sub.id === 'correcoes') {
                                setActiveTab('avaliacoes');
                                setActiveSubTab('correcoes');
                              } else if (sub.id === 'ia-assistente') {
                                setActiveTab('avaliacoes');
                                setActiveSubTab('studio');
                              } else {
                                setActiveTab('assessment-studio');
                                setActiveSubTab(sub.id);
                              }
                              triggerToast(`🎯 Assessment Studio: ${sub.label}`);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-indigo-500/10 text-indigo-400 font-extrabold'
                                : 'text-slate-450 hover:text-slate-250 hover:bg-slate-900/30'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 text-indigo-500/75 shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 8. Relatórios */}
                <button
                  onClick={() => setActiveTab('relatorios-gerais')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'relatorios-gerais'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Relatórios</span>
                </button>

                {/* 9. Certificações */}
                <button
                  onClick={() => setActiveTab('certificacoes')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'certificacoes'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Certificações</span>
                </button>

                {/* 10. Embaixadores */}
                <button
                  onClick={() => setActiveTab('embaixadores')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'embaixadores'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Embaixadores</span>
                </button>

                {/* 11. Configurações */}
                <button
                  onClick={() => setActiveTab('configuracoes')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'configuracoes'
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Configurações</span>
                </button>
              </>
            ) : (
              <>
                {/* LINGOLIVE CREATOR PLATFORM NAVIGATION TREE */}
                {/* 1. Assessment Studio (Creator) */}
                <div className="space-y-1">
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, creatorAssessment: !prev.creatorAssessment }))}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpenCheck className="w-4 h-4 shrink-0 text-violet-400" />
                      <span>Assessment Studio</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expandedMenus.creatorAssessment ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedMenus.creatorAssessment && (
                    <div className="pl-6 border-l border-slate-850 ml-6 flex flex-col gap-1 py-1">
                      {[
                        { id: 'creator-exercicios', label: 'Exercícios', icon: FileSignature },
                        { id: 'creator-testes', label: 'Testes', icon: Target },
                        { id: 'creator-exames', label: 'Exames', icon: CheckSquare },
                        { id: 'creator-rubricas', label: 'Rubricas', icon: ClipboardList },
                        { id: 'creator-correcoes', label: 'Correções', icon: Sliders }
                      ].map((sub) => {
                        const isSelected = activeTab === 'creator-assessment' && activeSubTab === sub.id;
                        const SubIcon = sub.icon;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveTab('creator-assessment');
                              setActiveSubTab(sub.id);
                              triggerToast(`🎨 Creator Assessment: ${sub.label}`);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-violet-500/10 text-violet-400 font-extrabold'
                                : 'text-slate-450 hover:text-slate-250 hover:bg-slate-900/30'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 text-violet-500/75 shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Course Builder */}
                <button
                  onClick={() => setActiveTab('course-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'course-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Course Builder</span>
                </button>

                {/* 3. Lesson Builder */}
                <button
                  onClick={() => setActiveTab('lesson-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'lesson-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Lesson Builder</span>
                </button>

                {/* 4. Activity Builder */}
                <button
                  onClick={() => setActiveTab('activity-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'activity-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <ListTodo className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Activity Builder</span>
                </button>

                {/* 5. Flashcard Builder */}
                <button
                  onClick={() => setActiveTab('flashcard-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'flashcard-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Bookmark className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Flashcard Builder</span>
                </button>

                {/* 6. Story Builder */}
                <button
                  onClick={() => setActiveTab('story-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'story-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Newspaper className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Story Builder</span>
                </button>

                {/* 7. Pronunciation Builder */}
                <button
                  onClick={() => setActiveTab('pronunciation-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'pronunciation-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Volume2 className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Pronunciation Builder</span>
                </button>

                {/* 8. Conversation Builder */}
                <button
                  onClick={() => setActiveTab('conversation-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'conversation-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Conversation Builder</span>
                </button>

                {/* 9. Assignment Builder */}
                <button
                  onClick={() => setActiveTab('assignment-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'assignment-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Assignment Builder</span>
                </button>

                {/* 10. Homework Builder */}
                <button
                  onClick={() => setActiveTab('homework-builder')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'homework-builder'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <FileSignature className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Homework Builder</span>
                </button>

                {/* 11. AI Content Generator */}
                <button
                  onClick={() => setActiveTab('ai-generator')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'ai-generator'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-violet-400 animate-pulse" />
                  <span>AI Content Generator</span>
                </button>

                {/* 12. Media Library */}
                <button
                  onClick={() => setActiveTab('media-library')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'media-library'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Image className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Media Library</span>
                </button>

                {/* 13. Question Bank */}
                <button
                  onClick={() => setActiveTab('question-bank')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'question-bank'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Question Bank</span>
                </button>

                {/* 14. Resource Marketplace */}
                <button
                  onClick={() => setActiveTab('resource-marketplace')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'resource-marketplace'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Resource Marketplace</span>
                </button>

                {/* 15. Publishing Center */}
                <button
                  onClick={() => setActiveTab('publishing-center')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'publishing-center'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>Publishing Center</span>
                </button>

                {/* 16. LingoLIVE AI Review System (LARS) */}
                <button
                  onClick={() => setActiveTab('lars')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'lars'
                      ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/40'
                  }`}
                >
                  <Cpu className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>AI Review (LARS)</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Dynamic Display Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: GENERAL DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-display">Dashboard de Controle</h2>
                    <p className="text-xs text-slate-400">Dados consolidados de progresso, proficiência e engajamento das tuas turmas.</p>
                  </div>
                  <div className="text-xs bg-slate-900 border border-slate-800 text-slate-300 font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Último Sync: Há instantes</span>
                  </div>
                </div>

                {/* AI Tip Panel */}
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shrink-0">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
                        Dica de Pedagogia por IA
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Altamente Relevante</span>
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                        Identificamos que 8 alunos da <span className="text-indigo-400 font-bold">Turma Alfa</span> demonstraram dificuldades na pronúncia do fonema <span className="text-emerald-400 font-mono font-bold">/θ/ (th)</span> em gravações de áudio recentes. Use o <span className="text-indigo-300 font-bold underline cursor-pointer" onClick={() => { setActiveTab('avaliacoes'); setActiveSubTab('studio'); }}>Assessment Studio</span> para disparar um minicase focado em "Job Pitch" cobrindo esse fonema hoje!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid 4 Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between h-28">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Estudantes</span>
                      <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">88</div>
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" /> +12% este mês
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between h-28">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Média de Fluência</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">78.5%</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        Proficiência Alvo: B2/C1
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between h-28">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sessões Concluídas</span>
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">412</div>
                      <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" /> +18% esta semana
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between h-28 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => { setActiveTab('avaliacoes'); setActiveSubTab('correcoes'); }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aguardando IA</span>
                      <CheckSquare className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-rose-400">{submissions.filter(s => s.status === 'Pending').length}</div>
                      <div className="text-[10px] text-rose-300 font-semibold mt-1">
                        Clique para corrigir agora
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Frame */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1 */}
                  <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Progresso de Fluência por Turma</h4>
                      <span className="text-[10px] font-mono text-slate-500">Métrica de 4 semanas</span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataWeeklyFluency}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Line type="monotone" dataKey="Média Alfa" stroke="#6366f1" strokeWidth={3} />
                          <Line type="monotone" dataKey="Média Beta" stroke="#10b981" strokeWidth={3} />
                          <Line type="monotone" dataKey="Média Gama" stroke="#f43f5e" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2 */}
                  <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Distribuição de Esforço Pedagógico</h4>
                      <span className="text-[10px] font-mono text-slate-500">Volumetria total</span>
                    </div>
                    <div className="h-64 flex flex-col justify-between">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataSkillsRadar}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                            <PolarRadiusAxis stroke="#475569" fontSize={9} />
                            <Radar name="Meta do Curso" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                            <Radar name="Desempenho Atual" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Meta Recomendada</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Média de Alunos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Events and Class Streaks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left columns */}
                  <div className="md:col-span-2 bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Atividades e Submissões Recentes</h4>
                    <div className="space-y-3.5">
                      {submissions.map((sub, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors">
                          <span className="text-2xl mt-0.5">{sub.studentAvatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-100 truncate">{sub.studentName}</span>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">{sub.submittedAt}</span>
                            </div>
                            <p className="text-[11px] text-indigo-300 font-semibold truncate">{sub.activityTitle}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 italic">"{sub.rawText}"</p>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('avaliacoes');
                              setActiveSubTab('correcoes');
                              handleAnalyzeSubmission(sub);
                            }}
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all shrink-0"
                          >
                            Corrigir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3">Ofensivas de Estudo (Streaks)</h4>
                      <div className="space-y-3">
                        {classes.map((cls, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/30 border border-slate-850 rounded-xl">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-200">{cls.name.split(' ')[1]}</span>
                              <span className="text-[10px] text-slate-500 block">{cls.studentsCount} Alunos ativos</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2 py-1 rounded-lg">
                              <Trophy className="w-3.5 h-3.5" />
                              <span className="text-xs font-black font-mono">{cls.activeStreak} Dias</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-2xl text-[11px] text-slate-400 leading-relaxed mt-4">
                      <strong className="text-indigo-300 block mb-0.5">Fórmula de Streak B2B:</strong>
                      As ofensivas refletem turmas onde pelo menos 70% dos alunos praticaram com áudio hoje.
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: MEUS CURSOS */}
            {activeTab === 'cursos' && (
              <motion.div
                key="cursos-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-display">Grade de Cursos Ativos</h2>
                  <p className="text-xs text-slate-400">Desenvolvimento de conteúdo programático, syllabus acadêmico e ementas dinâmicas.</p>
                </div>

                {/* Grid of Courses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{course.image}</span>
                          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono">
                            {course.level}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-extrabold text-slate-100">{course.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{course.description}</p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800 space-y-3.5">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span>{course.studentsCount} Alunos Matriculados</span>
                          <span>{course.lessonsCount} Módulos/Aulas</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Conclusão Média</span>
                            <span className="font-bold text-slate-200">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                            <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Syllabus Builder with AI */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute right-[-40px] bottom-[-45px] w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="border-b border-slate-850 pb-4">
                      <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-black uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>AI Syllabus Engine</span>
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-black text-white">Criador Automático de Ementa com IA</h3>
                      <p className="text-xs text-slate-400">Gere planos de aula completos em 4 semanas estruturados para qualquer idioma e nicho de negócios.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Idioma Target</label>
                        <select 
                          value={syllLang} 
                          onChange={(e) => setSyllLang(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option>Inglês</option>
                          <option>Espanhol</option>
                          <option>Francês</option>
                          <option>Alemão</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nível Linguístico (CEFR)</label>
                        <select 
                          value={syllLevel} 
                          onChange={(e) => setSyllLevel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option>A2 (Iniciante)</option>
                          <option>B1 (Intermediário)</option>
                          <option>B2 (Intermediário Superior)</option>
                          <option>C1 (Avançado)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Foco ou Tópico de Negócios</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Ex: Gestão de Projetos Ágeis, Entrevistas..."
                            value={syllTopic}
                            onChange={(e) => setSyllTopic(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                          <button
                            onClick={handleGenerateSyllabus}
                            disabled={generatingSyllabus}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-slate-950 font-black text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            {generatingSyllabus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span>Gerar Ementa</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Result placeholder */}
                    <AnimatePresence>
                      {aiSyllabusResult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                            <div>
                              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Syllabus Gerado</h4>
                              <p className="text-sm font-extrabold text-slate-200">{aiSyllabusResult.topic} ({aiSyllabusResult.level})</p>
                            </div>
                            <button 
                              onClick={() => {
                                setCourses(prev => [
                                  {
                                    id: `c-${Date.now()}`,
                                    title: aiSyllabusResult.topic,
                                    level: aiSyllabusResult.level,
                                    studentsCount: 0,
                                    progress: 0,
                                    lessonsCount: 4,
                                    image: '✨',
                                    description: `Curso focado no aprendizado e roleplay do tema ${aiSyllabusResult.topic}.`
                                  },
                                  ...prev
                                ]);
                                setAiSyllabusResult(null);
                                setSyllTopic('');
                                triggerToast('✨ Novo curso ativado baseado no Syllabus IA!');
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-lg transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Ativar este Curso
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {aiSyllabusResult.weeks.map((week: any) => (
                              <div key={week.week} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-2.5">
                                <span className="text-[9px] bg-slate-950 text-indigo-300 border border-slate-850 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Semana {week.week}</span>
                                <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{week.title}</h5>
                                <p className="text-[10px] text-slate-400 line-clamp-3">{week.objectives}</p>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-500 block uppercase">Cenário Vocabular</span>
                                  <div className="flex flex-wrap gap-1">
                                    {week.vocab.map((v: string, i: number) => (
                                      <span key={i} className="text-[8px] bg-slate-950 border border-slate-850 px-1 rounded text-emerald-400 font-mono">{v}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: MINHAS TURMAS */}
            {activeTab === 'turmas' && (
              <motion.div
                key="turmas-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-display">Controle de Turmas</h2>
                    <p className="text-xs text-slate-400">Acompanhe a frequência, notas gerais e o progresso individual dos seus estudantes.</p>
                  </div>
                  <button 
                    onClick={() => setView('criar-turma')}
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Criar Nova Turma
                  </button>
                </div>

                {/* Tabs to select active Class */}
                <div className="flex border-b border-slate-900 gap-2 overflow-x-auto pb-1">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer whitespace-nowrap ${
                        selectedClassId === cls.id
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>

                {/* Stats summary of selected class */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Média de Fluência da Turma</span>
                      <strong className="text-lg text-slate-100 font-extrabold font-mono">{selectedClassDetails.avgFluency}%</strong>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Frequência Semanal Média</span>
                      <strong className="text-lg text-slate-100 font-extrabold font-mono">{selectedClassDetails.attendance}%</strong>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Ofensiva de Atividade (Streak)</span>
                      <strong className="text-lg text-slate-100 font-extrabold font-mono">{selectedClassDetails.activeStreak} dias seguidos</strong>
                    </div>
                  </div>
                </div>

                {/* Student roster list */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-200">Lista de Alunos Registrados ({filteredStudents.length})</h3>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                      <Search className="w-4 h-4 text-slate-500 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-0 font-medium"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Nenhum aluno encontrado correspondente à pesquisa.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-850">
                            <th className="pb-3 font-black uppercase tracking-wider">Nome do Aluno</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Frequência</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Fluência Geral</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Ofensiva (Streak)</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Confiança Estimada (IA)</th>
                            <th className="pb-3 font-black uppercase tracking-wider text-right">Última Atividade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60">
                          {filteredStudents.map((std) => (
                            <tr key={std.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-3.5 flex items-center gap-2.5">
                                <span className="text-xl">{std.avatar}</span>
                                <span className="font-bold text-slate-200 text-xs sm:text-sm">{std.name}</span>
                              </td>
                              <td className="py-3.5 font-mono text-slate-300">{std.attendance}%</td>
                              <td className="py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-black font-mono text-xs ${
                                    std.fluencyScore >= 80 ? 'text-emerald-400' : std.fluencyScore >= 60 ? 'text-indigo-400' : 'text-amber-400'
                                  }`}>
                                    {std.fluencyScore}%
                                  </span>
                                  <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                    <div className={`h-full ${
                                      std.fluencyScore >= 80 ? 'bg-emerald-500' : std.fluencyScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                                    }`} style={{ width: `${std.fluencyScore}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5">
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded font-black font-mono text-[11px] flex items-center gap-1 w-max">
                                  ⚡ {std.streak} dias
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  std.confidence === 'High' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : std.confidence === 'Medium'
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {std.confidence === 'High' ? 'Alta' : std.confidence === 'Medium' ? 'Média' : 'Baixa'}
                                </span>
                              </td>
                              <td className="py-3.5 text-right font-medium text-slate-450">{std.lastActive}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-850">
                    <button
                      onClick={() => {
                        triggerToast('📥 Gerando Relatório Detalhado da Turma em PDF...');
                        setTimeout(() => {
                          triggerToast('✓ PDF do relatório da turma exportado com sucesso!');
                        }, 1500);
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" /> Exportar Dados (PDF)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: AVALIAÇÕES & IA INTEGRADA */}
            {activeTab === 'avaliacoes' && (
              <motion.div
                key="avaliacoes-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-display">Estúdio de Avaliações</h2>
                    <p className="text-xs text-slate-400">Geração de questões por IA, exames orais, correções automáticas de áudio e inteligência preditiva.</p>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-bold self-start sm:self-auto flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>IA Core Assistida</span>
                  </div>
                </div>

                {/* Sub-tabs Nav */}
                <div className="flex border-b border-slate-900 gap-4 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveSubTab('studio')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSubTab === 'studio' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Assessment Studio
                  </button>

                  <button
                    onClick={() => setActiveSubTab('banco')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSubTab === 'banco' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Banco de Questões
                  </button>

                  <button
                    onClick={() => setActiveSubTab('exames')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSubTab === 'exames' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Exames Ativos
                  </button>

                  <button
                    onClick={() => setActiveSubTab('correcoes')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSubTab === 'correcoes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Correções ({submissions.filter(s => s.status === 'Pending').length})
                  </button>

                  <button
                    onClick={() => setActiveSubTab('relatorios')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      activeSubTab === 'relatorios' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Relatórios
                  </button>
                </div>

                {/* Sub-tab 1: Assessment Studio */}
                {activeSubTab === 'studio' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-white">Criador Avançado de Exames Orais</h3>
                      <p className="text-xs text-slate-400">Monte cenários de conversação complexos e critérios de avaliação sob medida com ajuda da Inteligência Artificial.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Idioma</label>
                        <select 
                          value={assessLang} 
                          onChange={(e) => setAssessLang(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option>Inglês</option>
                          <option>Espanhol</option>
                          <option>Francês</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nível Linguístico (CEFR)</label>
                        <select 
                          value={assessLevel} 
                          onChange={(e) => setAssessLevel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option>B1 (Intermediário)</option>
                          <option>B2 (Intermediário Superior)</option>
                          <option>C1 (Avançado)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Foco de Avaliação</label>
                        <select 
                          value={assessFocus} 
                          onChange={(e) => setAssessFocus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option>Speaking & Pronúncia</option>
                          <option>Redação & Coerência</option>
                          <option>Vocabulário Técnico & Jargão</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Cenário de Roleplay / Tema</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ex: Entrevista de emprego na área de tecnologia, Negociação de contratos..."
                          value={assessTopic}
                          onChange={(e) => setAssessTopic(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                        <button
                          onClick={handleGenerateAssessment}
                          disabled={generatingAssessment}
                          className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-slate-950 font-black text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                          {generatingAssessment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>Gerar Parâmetros</span>
                        </button>
                      </div>
                    </div>

                    {/* Result parameters */}
                    <AnimatePresence>
                      {aiAssessmentResult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                            <div>
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">Configuração IA Concluída</span>
                              <h4 className="text-base font-extrabold text-slate-100">{aiAssessmentResult.title}</h4>
                            </div>
                            <button
                              onClick={() => {
                                setExams(prev => [
                                  {
                                    id: `e-${Date.now()}`,
                                    title: aiAssessmentResult.title,
                                    targetClass: 'Turma Alfa (Inglês Executive)',
                                    status: 'Active',
                                    submissionsCount: 0,
                                    totalStudents: 18,
                                    dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
                                  },
                                  ...prev
                                ]);
                                setAiAssessmentResult(null);
                                triggerToast('🚀 Nova prova agendada para Turma Alfa com IA!');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                            >
                              Agendar e Publicar Exame
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Scenario */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Configuração de Roleplay Livre</span>
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400">Personagem Virtual: <strong className="text-slate-200">{aiAssessmentResult.scenarioConfig.tutorName} ({aiAssessmentResult.scenarioConfig.role})</strong></span>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs italic text-slate-300 leading-relaxed font-sans relative">
                                  "{aiAssessmentResult.scenarioConfig.initialPrompt}"
                                  <button onClick={() => speakTarget(aiAssessmentResult.scenarioConfig.initialPrompt)} className="absolute bottom-2 right-2 p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-500/20 transition-colors">
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Rubrics */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Rubricas de Pontuação IA</span>
                              <div className="space-y-2">
                                {aiAssessmentResult.rubrics.map((r: any, i: number) => (
                                  <div key={i} className="text-xs leading-relaxed">
                                    <strong className="text-slate-200 block">{r.name}</strong>
                                    <span className="text-[10px] text-slate-450 block">{r.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                )}

                {/* Sub-tab 2: Question Bank */}
                {activeSubTab === 'banco' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Visual Taxonomy Pipeline (4 cols) */}
                    <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 relative">
                      <div className="absolute right-3 top-3 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-400 tracking-wider">
                          <Filter className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Funil de Taxonomia Opcional</span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1">Navegação Hierárquica</h4>
                        <p className="text-[10px] text-slate-400">Drill-down sequencial de 11 níveis para encontrar ou catalogar questões.</p>
                      </div>

                      {/* Reset Button */}
                      <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-bold text-slate-400">Filtro Ativo:</span>
                        <button
                          onClick={() => {
                            setSelectedBanco('Todos');
                            setSelectedIdioma('Todos');
                            setSelectedPais('Todos');
                            setSelectedDialeto('Todos');
                            setSelectedCefr('Todos');
                            setSelectedTema('Todos');
                            setSelectedProfissao('Todos');
                            setSelectedTipo('Todos');
                            setSelectedDificuldade('Todos');
                            setSelectedAutor('Todos');
                            setSelectedVersao('Todos');
                            triggerToast('🧹 Todos os filtros taxonômicos foram redefinidos!');
                          }}
                          className="text-[9px] font-black uppercase bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Limpar Filtros
                        </button>
                      </div>

                      {/* Vertical Pipeline Stepper */}
                      <div className="space-y-4 relative pl-2">
                        
                        {/* Level 1: Banco Mundial */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">1</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Banco Mundial</label>
                            <select
                              value={selectedBanco}
                              onChange={(e) => {
                                setSelectedBanco(e.target.value);
                                triggerToast(`🔍 Filtrado por Banco Mundial: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'LingoLIVE Global Standard', 'TOEFL Practice Base', 'IELTS Academic Prep', 'Cambridge Assessment'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 2: Idioma */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">2</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Idioma</label>
                            <select
                              value={selectedIdioma}
                              onChange={(e) => {
                                setSelectedIdioma(e.target.value);
                                triggerToast(`🔍 Filtrado por Idioma: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Inglês', 'Espanhol', 'Francês', 'Alemão'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 3: País */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">3</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">País</label>
                            <select
                              value={selectedPais}
                              onChange={(e) => {
                                setSelectedPais(e.target.value);
                                triggerToast(`🔍 Filtrado por País: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Estados Unidos', 'Reino Unido', 'Espanha', 'Canadá', 'Austrália', 'México'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 4: Dialeto */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">4</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Dialeto</label>
                            <select
                              value={selectedDialeto}
                              onChange={(e) => {
                                setSelectedDialeto(e.target.value);
                                triggerToast(`🔍 Filtrado por Dialeto: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'General American', 'Received Pronunciation', 'Castelhano (Madrid)', 'Canadian English', 'Australian Accent', 'Latinoamericano'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 5: Nível CEFR */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">5</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Nível CEFR</label>
                            <select
                              value={selectedCefr}
                              onChange={(e) => {
                                setSelectedCefr(e.target.value);
                                triggerToast(`🔍 Filtrado por Nível CEFR: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 6: Tema */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">6</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Tema</label>
                            <select
                              value={selectedTema}
                              onChange={(e) => {
                                setSelectedTema(e.target.value);
                                triggerToast(`🔍 Filtrado por Tema: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Vendas & Negociações', 'Apresentações de Resultados', 'Discussões Financeiras', 'Reuniões e Negociações', 'Atendimento ao Cliente', 'Entrevistas de Emprego'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 7: Profissão */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">7</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Profissão</label>
                            <select
                              value={selectedProfissao}
                              onChange={(e) => {
                                setSelectedProfissao(e.target.value);
                                triggerToast(`🔍 Filtrado por Profissão: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Executivo de Contas', 'Gerente de Produtos', 'Gerente Financeiro', 'Executivo de Vendas', 'Engenheiro de Software', 'Geral'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 8: Tipo */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">8</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Tipo de Questão</label>
                            <select
                              value={selectedTipo}
                              onChange={(e) => {
                                setSelectedTipo(e.target.value);
                                triggerToast(`🔍 Filtrado por Tipo: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              <option value="Todos">Todos</option>
                              <option value="multiple">Múltipla Escolha</option>
                              <option value="speaking">Expressão Oral</option>
                              <option value="gap-fill">Preenchimento de Lacunas</option>
                            </select>
                          </div>
                        </div>

                        {/* Level 9: Dificuldade */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">9</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Dificuldade</label>
                            <select
                              value={selectedDificuldade}
                              onChange={(e) => {
                                setSelectedDificuldade(e.target.value);
                                triggerToast(`🔍 Filtrado por Dificuldade: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Fácil', 'Médio', 'Difícil'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 10: Autor */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">10</div>
                          <div className="absolute left-2 top-5 bottom-0 w-0.5 border-l border-dashed border-slate-800" style={{ height: 'calc(100% + 8px)' }} />
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Autor</label>
                            <select
                              value={selectedAutor}
                              onChange={(e) => {
                                setSelectedAutor(e.target.value);
                                triggerToast(`🔍 Filtrado por Autor: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'Prof. Marta Rebelo', 'Dr. Michael Johnson', 'Prof. Sarah Jenkins', 'Prof. Javier Gómez', 'LingoLIVE IA'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Level 11: Versão */}
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-300">11</div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Versão</label>
                            <select
                              value={selectedVersao}
                              onChange={(e) => {
                                setSelectedVersao(e.target.value);
                                triggerToast(`🔍 Filtrado por Versão: ${e.target.value}`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            >
                              {['Todos', 'v1.0', 'v1.2', 'v1.5', 'v2.0', 'v2.1'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* RIGHT COLUMN: Question List & IA generator (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Active Pipeline Path Breadcrumb */}
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Caminho da Taxonomia Ativa</span>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-mono text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                          <span className={`px-1.5 py-0.5 rounded ${selectedBanco !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedBanco}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedIdioma !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedIdioma}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedPais !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedPais}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedDialeto !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedDialeto}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedCefr !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedCefr}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedTema !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedTema}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedProfissao !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedProfissao}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedTipo !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedTipo === 'multiple' ? 'Múltipla' : selectedTipo === 'speaking' ? 'Oral' : selectedTipo === 'gap-fill' ? 'Lacunas' : 'Todos'}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedDificuldade !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedDificuldade}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedAutor !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedAutor}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className={`px-1.5 py-0.5 rounded ${selectedVersao !== 'Todos' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-500'}`}>{selectedVersao}</span>
                        </div>
                      </div>

                      {/* IA Generator Context-Aware */}
                      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Gerador Sincronizado por Taxonomia</h4>
                        </div>
                        <p className="text-[11px] text-slate-455 leading-relaxed">
                          A IA herdará as opções selecionadas no painel lateral esquerdo (<span className="text-indigo-400 font-bold">Banco Mundial</span>, <span className="text-indigo-400 font-bold">Idioma</span>, <span className="text-indigo-400 font-bold">País</span>, <span className="text-indigo-400 font-bold">Dialeto</span>, <span className="text-indigo-400 font-bold">Nível CEFR</span>, <span className="text-indigo-400 font-bold">Tema</span>, <span className="text-indigo-400 font-bold">Profissão</span>, <span className="text-indigo-400 font-bold">Tipo</span>, <span className="text-indigo-400 font-bold">Dificuldade</span>, <span className="text-indigo-400 font-bold">Autor</span> e <span className="text-indigo-400 font-bold">Versão</span>) para formular um item de prova com precisão absoluta.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                          <input 
                            type="text" 
                            placeholder="Tópico específico (ex: Condicional Irreal, Vocabulário de IA)..."
                            value={newQuestionTopic}
                            onChange={(e) => setNewQuestionTopic(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                          <button
                            onClick={handleGenerateQuestion}
                            disabled={generatingQuestion}
                            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:from-indigo-500/50 text-slate-950 font-black text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shrink-0"
                          >
                            {generatingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span>Gerar com IA</span>
                          </button>
                        </div>
                      </div>

                      {/* Header and Results */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-base font-extrabold text-white">Questões Cadastradas</h3>
                          <p className="text-[10px] text-slate-450">Exibindo {
                            questionBank.filter(q => {
                              if (selectedBanco !== 'Todos' && q.bancoMundial !== selectedBanco) return false;
                              if (selectedIdioma !== 'Todos' && q.idioma !== selectedIdioma) return false;
                              if (selectedPais !== 'Todos' && q.pais !== selectedPais) return false;
                              if (selectedDialeto !== 'Todos' && q.dialeto !== selectedDialeto) return false;
                              if (selectedCefr !== 'Todos' && q.nivelCefr !== selectedCefr) return false;
                              if (selectedTema !== 'Todos' && q.tema !== selectedTema) return false;
                              if (selectedProfissao !== 'Todos' && q.profissao !== selectedProfissao) return false;
                              if (selectedTipo !== 'Todos' && q.type !== selectedTipo) return false;
                              if (selectedDificuldade !== 'Todos' && q.dificuldade !== selectedDificuldade) return false;
                              if (selectedAutor !== 'Todos' && q.autor !== selectedAutor) return false;
                              if (selectedVersao !== 'Todos' && q.versao !== selectedVersao) return false;
                              return true;
                            }).length
                          } de {questionBank.length} questões do banco.</p>
                        </div>
                      </div>

                      {/* Filtered questions list */}
                      <div className="space-y-4">
                        {questionBank.filter(q => {
                          if (selectedBanco !== 'Todos' && q.bancoMundial !== selectedBanco) return false;
                          if (selectedIdioma !== 'Todos' && q.idioma !== selectedIdioma) return false;
                          if (selectedPais !== 'Todos' && q.pais !== selectedPais) return false;
                          if (selectedDialeto !== 'Todos' && q.dialeto !== selectedDialeto) return false;
                          if (selectedCefr !== 'Todos' && q.nivelCefr !== selectedCefr) return false;
                          if (selectedTema !== 'Todos' && q.tema !== selectedTema) return false;
                          if (selectedProfissao !== 'Todos' && q.profissao !== selectedProfissao) return false;
                          if (selectedTipo !== 'Todos' && q.type !== selectedTipo) return false;
                          if (selectedDificuldade !== 'Todos' && q.dificuldade !== selectedDificuldade) return false;
                          if (selectedAutor !== 'Todos' && q.autor !== selectedAutor) return false;
                          if (selectedVersao !== 'Todos' && q.versao !== selectedVersao) return false;
                          return true;
                        }).length === 0 ? (
                          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-3">
                            <HelpCircle className="w-10 h-10 mx-auto text-slate-700 opacity-40" />
                            <p className="font-bold text-slate-400">Nenhuma questão corresponde a este funil taxonômico.</p>
                            <p className="max-w-md mx-auto">Tente redefinir alguns filtros no painel esquerdo ou clique em "Gerar com IA" para conceber uma nova questão seguindo este caminho exato!</p>
                          </div>
                        ) : (
                          questionBank.filter(q => {
                            if (selectedBanco !== 'Todos' && q.bancoMundial !== selectedBanco) return false;
                            if (selectedIdioma !== 'Todos' && q.idioma !== selectedIdioma) return false;
                            if (selectedPais !== 'Todos' && q.pais !== selectedPais) return false;
                            if (selectedDialeto !== 'Todos' && q.dialeto !== selectedDialeto) return false;
                            if (selectedCefr !== 'Todos' && q.nivelCefr !== selectedCefr) return false;
                            if (selectedTema !== 'Todos' && q.tema !== selectedTema) return false;
                            if (selectedProfissao !== 'Todos' && q.profissao !== selectedProfissao) return false;
                            if (selectedTipo !== 'Todos' && q.type !== selectedTipo) return false;
                            if (selectedDificuldade !== 'Todos' && q.dificuldade !== selectedDificuldade) return false;
                            if (selectedAutor !== 'Todos' && q.autor !== selectedAutor) return false;
                            if (selectedVersao !== 'Todos' && q.versao !== selectedVersao) return false;
                            return true;
                          }).map((q) => (
                            <div key={q.id} className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                                    q.type === 'speaking' 
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}>
                                    {q.type === 'speaking' ? 'Expressão Oral' : q.type === 'gap-fill' ? 'Preenchimento' : 'Múltipla Escolha'}
                                  </span>
                                  {q.dificuldade && (
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                                      q.dificuldade === 'Fácil' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      q.dificuldade === 'Médio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                      {q.dificuldade}
                                    </span>
                                  )}
                                  {q.nivelCefr && (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      {q.nivelCefr}
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => {
                                    setQuestionBank(prev => prev.filter(item => item.id !== q.id));
                                    triggerToast('🗑️ Questão removida do banco.');
                                  }}
                                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <p className="text-xs sm:text-sm font-bold text-slate-100 font-sans leading-relaxed">{q.text}</p>

                              {q.options && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt, i) => (
                                    <div 
                                      key={i} 
                                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                                        opt === q.correctAnswer 
                                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                                          : 'bg-slate-900 border-slate-850 text-slate-400'
                                      }`}
                                    >
                                      <span className="w-5 h-5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-center justify-center">
                                        {String.fromCharCode(65 + i)}
                                      </span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Complete Metadata Tags visualizer */}
                              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900">
                                {q.bancoMundial && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Banco: {q.bancoMundial}</span>}
                                {q.idioma && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Idioma: {q.idioma}</span>}
                                {q.pais && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">País: {q.pais}</span>}
                                {q.dialeto && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Dialeto: {q.dialeto}</span>}
                                {q.tema && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Tema: {q.tema}</span>}
                                {q.profissao && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Profissão: {q.profissao}</span>}
                                {q.autor && <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono font-medium">Autor: {q.autor}</span>}
                                {q.versao && <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-black">Versão: {q.versao}</span>}
                              </div>

                              <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl text-xs text-slate-400 leading-relaxed font-medium">
                                <strong className="text-indigo-300 block mb-0.5">Explicação Gramatical:</strong>
                                {q.explanation}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>

                  </div>
                )}

                {/* Sub-tab 3: Scheduled / Active Exams */}
                {activeSubTab === 'exames' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-white">Cronograma de Provas Ativas</h3>
                      <p className="text-xs text-slate-400">Controle o status de submissão, agende exames ou suspenda avaliações instantaneamente.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Grid of active exams */}
                      <div className="lg:col-span-2 space-y-4">
                        {exams.map((exam) => (
                          <div key={exam.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  exam.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-200">{exam.title}</h4>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
                                <span>Destino: <strong className="text-slate-400">{exam.targetClass}</strong></span>
                                <span>•</span>
                                <span>Data Limite: {exam.dueDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 self-end sm:self-auto">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Submissões</span>
                                <span className="font-mono text-xs font-black text-slate-200">
                                  {exam.submissionsCount}/{exam.totalStudents} ({Math.round((exam.submissionsCount / exam.totalStudents) * 100 || 0)}%)
                                </span>
                              </div>
                              <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                <div className="bg-indigo-500 h-full" style={{ width: `${(exam.submissionsCount / exam.totalStudents) * 100 || 0}%` }} />
                              </div>
                              <button 
                                onClick={() => {
                                  setExams(prev => prev.filter(item => item.id !== exam.id));
                                  triggerToast('🗑️ Exame suspenso e removido.');
                                }}
                                className="p-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Suspender Exame"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Schedule Exam Card Form */}
                      <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Publicar Novo Exame</h4>
                        <form onSubmit={handleCreateExam} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nome do Exame</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Simulado B2: Speaking Challenge" 
                              value={newExamTitle}
                              onChange={(e) => setNewExamTitle(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Turma Alvo</label>
                            <select 
                              value={newExamClass}
                              onChange={(e) => setNewExamClass(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                              {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Prazo de Entrega</label>
                            <input 
                              type="date" 
                              value={newExamDueDate}
                              onChange={(e) => setNewExamDueDate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Agendar Exame
                          </button>
                        </form>
                      </div>

                    </div>
                  </div>
                )}

                {/* Sub-tab 4: AI Corrections grading helper */}
                {activeSubTab === 'correcoes' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-1 border-b border-slate-850 pb-4">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-white">Assistente de Correção com IA</h3>
                      <p className="text-xs text-slate-400">Analise redações e gravações com inteligência gramatical instantânea e sugestões de reescrita.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left side: Submissions list */}
                      <div className="lg:col-span-1 space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Aguardando Avaliação</span>
                        {submissions.filter(s => s.status === 'Pending').length === 0 ? (
                          <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl text-center text-xs text-slate-500">
                            Todas as submissões corrigidas!
                          </div>
                        ) : (
                          submissions.filter(s => s.status === 'Pending').map((sub) => (
                            <div 
                              key={sub.id} 
                              onClick={() => handleAnalyzeSubmission(sub)}
                              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                                selectedSub?.id === sub.id 
                                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-200' 
                                  : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{sub.studentAvatar}</span>
                                <div>
                                  <strong className="text-xs text-slate-100 block">{sub.studentName}</strong>
                                  <span className="text-[10px] text-slate-500 font-mono block">{sub.className.split(' ')[1]}</span>
                                </div>
                              </div>
                              <h5 className="text-[11px] font-extrabold text-indigo-400 line-clamp-1">{sub.activityTitle}</h5>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic">"{sub.rawText}"</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Right side: IA analytical correction card */}
                      <div className="lg:col-span-2">
                        {analyzingSub ? (
                          <div className="bg-slate-950 border border-slate-850 p-12 rounded-2xl text-center space-y-4 flex flex-col items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <span className="text-xs text-slate-400 font-mono animate-pulse">Sintonizando áudio, analisando gramática e sotaque linguístico...</span>
                          </div>
                        ) : selectedSub && subAnalysisResult ? (
                          <div className="bg-slate-950 border border-slate-850 p-5 sm:p-6 rounded-2xl space-y-6">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{selectedSub.studentAvatar}</span>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-100">{selectedSub.studentName}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono">{selectedSub.activityTitle}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-extrabold font-mono shrink-0">
                                Pontuação IA: {subAnalysisResult.grade}/100
                              </div>
                            </div>

                            {/* Raw submission */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Resposta Bruta do Aluno</span>
                              <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-xs leading-relaxed font-sans text-slate-200 whitespace-pre-wrap select-all">
                                {selectedSub.rawText}
                              </div>
                            </div>

                            {/* Grammar Analysis */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider block">Correções Gramaticais Recomendadas</span>
                              <div className="grid grid-cols-1 gap-2.5">
                                {subAnalysisResult.grammarMistakes.map((err: any, i: number) => (
                                  <div key={i} className="bg-rose-950/15 border border-rose-950/35 p-3 rounded-xl space-y-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="line-through text-rose-400 font-mono font-semibold">{err.error}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                      <span className="text-emerald-400 font-mono font-black">{err.correction}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{err.reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pronunciation Tuning Comparative */}
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                <span>Ajustador Fonético de Pronúncia</span>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {subAnalysisResult.pronunciationAnalysis.map((item: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-slate-100 font-mono">{item.word}</span>
                                      <button 
                                        onClick={() => speakTarget(item.word)} 
                                        className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" /> Ouvir Nativo
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                                      <div className="bg-rose-950/20 border border-rose-950/30 p-2 rounded">
                                        <span className="text-[9px] text-rose-400 font-sans block uppercase font-bold">Fonação Aluno</span>
                                        {item.userPhonetic}
                                      </div>
                                      <div className="bg-emerald-950/20 border border-emerald-950/30 p-2 rounded">
                                        <span className="text-[9px] text-emerald-400 font-sans block uppercase font-bold">Fonética Nativa</span>
                                        {item.nativePhonetic}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">💡 <strong className="text-slate-350 font-bold">Dica Vocal:</strong> {item.tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Vocabulary improvement suggestions */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Elevação de Vocabulário & Impacto</span>
                              <div className="grid grid-cols-1 gap-2.5">
                                {subAnalysisResult.vocabularySuggestions.map((voc: any, i: number) => (
                                  <div key={i} className="bg-emerald-950/15 border border-emerald-950/30 p-3 rounded-xl space-y-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="text-slate-450 font-mono">Original: "{voc.original}"</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                      <span className="text-emerald-400 font-black font-mono">" {voc.recommendation} "</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{voc.reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Motivational Text */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Feedback Pedagógico Gerado</span>
                              <p className="text-xs text-slate-300 bg-slate-900 border border-slate-850 p-3 rounded-xl leading-relaxed italic font-sans">
                                "{subAnalysisResult.motivationalSummary}"
                              </p>
                            </div>

                            {/* Custom override grading panel */}
                            <div className="border-t border-slate-850 pt-5 space-y-4">
                              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Publicar Nota e Comentários</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nota Override (0-100)</label>
                                  <input 
                                    type="number" 
                                    value={customTeacherScore}
                                    onChange={(e) => setCustomTeacherScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-medium focus:outline-none"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nota Adicional do Professor (Opcional)</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ex: Excelente engajamento oral Marta, parabéns!" 
                                    value={customTeacherNote}
                                    onChange={(e) => setCustomTeacherNote(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none font-medium"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 justify-end pt-2">
                                <button
                                  onClick={() => { setSelectedSub(null); setSubAnalysisResult(null); }}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-400 font-bold rounded-xl transition-all cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={handlePublishGrade}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5 font-black" /> Publicar Correção
                                </button>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
                            <FileSignature className="w-10 h-10 mx-auto text-slate-750 opacity-40" />
                            <p className="font-bold text-slate-400">Selecione uma submissão de aluno ao lado</p>
                            <p className="max-w-xs mx-auto">Nossos algoritmos AI processarão erros de gramática, lacunas lexicais e pronúncia para você revisar.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Sub-tab 5: Performance reports */}
                {activeSubTab === 'relatorios' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-white">Análise Pedagógica Preditiva</h3>
                      <p className="text-xs text-slate-400">Compreenda pontos críticos de retenção gramatical e a velocidade de evolução da conversação de cada turma.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Graph 1 */}
                      <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Distribuição de Modos de Prática</span>
                        <div className="h-60 flex flex-col justify-between">
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie 
                                  data={dataEngagementPie} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={60} 
                                  outerRadius={80} 
                                  paddingAngle={5} 
                                  dataKey="value"
                                >
                                  {dataEngagementPie.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-bold text-slate-400">
                            {dataEngagementPie.map((item, idx) => (
                              <span key={idx} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /> {item.name} ({item.value})</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* AI Pedagogic insights */}
                      <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">Métricas de Retenção Gramatical</span>
                          <h4 className="text-xs font-extrabold text-slate-200">Principais Causa de Erros nas Redações</h4>
                          
                          <div className="space-y-3.5 mt-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Preposições incorretas (in/on/at/of)</span>
                                <span className="font-bold text-rose-400 font-mono">42% de incidência</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full" style={{ width: '42%' }} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Esquecimento de plural em "one of the..."</span>
                                <span className="font-bold text-rose-400 font-mono">28% de incidência</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full" style={{ width: '28%' }} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Uso incorreto do Gerúndio após preposições</span>
                                <span className="font-bold text-amber-400 font-mono">18% de incidência</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: '18%' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-450 leading-relaxed font-sans mt-4">
                          💡 <strong className="text-slate-300 font-bold">Recomendação Curricular:</strong> Dedique 10 minutos da próxima aula para revisar a regra de preposições que acompanham os verbos <span className="text-indigo-400 font-mono">agree</span>, <span className="text-indigo-400 font-mono">interest</span>, e <span className="text-indigo-400 font-mono">depend</span>.
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* NEW TABS DYNAMICALLY RENDERED */}
            {activeTab === 'alunos' && (
              <motion.div
                key="alunos-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AlunosView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'aulas' && (
              <motion.div
                key="aulas-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AulasView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'calendario' && (
              <motion.div
                key="calendario-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CalendarioView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ChatView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'relatorios-gerais' && (
              <motion.div
                key="relatorios-gerais-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <RelatoriosGeraisView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'certificacoes' && (
              <motion.div
                key="certificacoes-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CertificacoesView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'embaixadores' && (
              <motion.div
                key="embaixadores-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <EmbaixadoresView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'configuracoes' && (
              <motion.div
                key="configuracoes-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ConfiguracoesView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'assessment-studio' && (
              <motion.div
                key="assessment-studio-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AssessmentStudioExtendedView triggerToast={triggerToast} activeSubTab={activeSubTab} />
              </motion.div>
            )}

            {activeTab === 'creator-assessment' && (
              <motion.div
                key="creator-assessment-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CreatorAssessmentView triggerToast={triggerToast} activeSubTab={activeSubTab} />
              </motion.div>
            )}

            {activeTab === 'course-builder' && (
              <motion.div
                key="course-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CourseBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'lesson-builder' && (
              <motion.div
                key="lesson-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <LessonBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'activity-builder' && (
              <motion.div
                key="activity-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ActivityBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'flashcard-builder' && (
              <motion.div
                key="flashcard-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <FlashcardBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'story-builder' && (
              <motion.div
                key="story-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <StoryBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'pronunciation-builder' && (
              <motion.div
                key="pronunciation-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <PronunciationBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'conversation-builder' && (
              <motion.div
                key="conversation-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ConversationBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'assignment-builder' && (
              <motion.div
                key="assignment-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AssignmentBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'homework-builder' && (
              <motion.div
                key="homework-builder-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <HomeworkBuilderView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'ai-generator' && (
              <motion.div
                key="ai-generator-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AIContentGeneratorView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'media-library' && (
              <motion.div
                key="media-library-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <MediaLibraryView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'question-bank' && (
              <motion.div
                key="question-bank-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <QuestionBankView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'resource-marketplace' && (
              <motion.div
                key="resource-marketplace-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ResourceMarketplaceView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'publishing-center' && (
              <motion.div
                key="publishing-center-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <PublishingCenterView triggerToast={triggerToast} />
              </motion.div>
            )}

            {activeTab === 'lars' && (
              <motion.div
                key="lars-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <LarsView triggerToast={triggerToast} />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 bg-slate-950/40 p-6 text-center text-xs text-slate-500 relative z-10">
        © 2026 LingoLIVE IA. Todos os direitos reservados. Monorepo B2B School & Enterprise.
      </footer>
    </div>
  );
};
