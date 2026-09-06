import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  Globe, 
  Target, 
  Award, 
  CheckCircle2, 
  Info, 
  Save, 
  BookOpen, 
  ShieldCheck,
  Brain
} from 'lucide-react';
import { AgeGroup, Language, Proficiency } from '../../types';
import { LANGUAGES } from '../../data';
import { useToast } from '../../context/ToastContext';
import { smartProfileEngine } from '../../services/SmartProfileEngine';
import { ProfileCard, getProfileVisualState } from './ProfileCard';

interface LearningProfileScreenProps {
  userProfile?: any;
  selectedAgeGroup: AgeGroup;
  setSelectedAgeGroup: (ageGroup: AgeGroup) => void;
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  selectedProficiency: Proficiency;
  setSelectedProficiency: (prof: Proficiency) => void;
  setView: (view: string) => void;
}

export const LearningProfileScreen = ({
  userProfile,
  selectedAgeGroup,
  setSelectedAgeGroup,
  selectedLanguage,
  setSelectedLanguage,
  selectedProficiency,
  setSelectedProficiency,
  setView
}: LearningProfileScreenProps) => {
  const { showToast } = useToast();

  const [activeGoal, setActiveGoal] = useState<string>(
    userProfile?.learningGoal || 'conversacao'
  );

  const [languageToAdd, setLanguageToAdd] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Map age group to standardized label & range
  const normalizeAgeGroup = (group: AgeGroup) => {
    if (group === 'Kids' || group === 'CHILD' || group === 'Infancy') return 'CHILD';
    if (group === 'Teens' || group === 'TEEN' || group === 'PreTeens') return 'TEEN';
    return 'ADULT';
  };

  const currentNormalized = normalizeAgeGroup(selectedAgeGroup);

  const profileInfo = {
    CHILD: {
      id: 'CHILD' as AgeGroup,
      title: 'Criança',
      range: '4 a 11 anos',
      tag: 'Lúdico & Interativo',
      color: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
      description: 'Metodologia adaptada com vocabulário simples, histórias visuais, jogos pedagógicos e tutoria IA com tom caloroso e encorajador.',
      features: ['Histórias interativas e personagens', 'Jogos de associação visual', 'Reforço positivo constante', 'Filtro de conteúdo estrito e seguro']
    },
    TEEN: {
      id: 'TEEN' as AgeGroup,
      title: 'Adolescente',
      range: '12 a 17 anos',
      tag: 'Dinâmico & Desafiante',
      color: 'from-indigo-500 to-purple-600',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
      description: 'Abordagem focada em cultura pop, tecnologia, preparação escolar e conversação dinâmica com tutoria motivadora.',
      features: ['Temas de atualidade e cultura digital', 'Desafios de gamificação e ranking', 'Apoio a exames e trabalhos escolares', 'Conversação em ritmo acelerado']
    },
    ADULT: {
      id: 'ADULT' as AgeGroup,
      title: 'Adulto',
      range: '18 anos ou mais',
      tag: 'Profissional & Prático',
      color: 'from-blue-600 to-cyan-600',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
      description: 'Foco direto em fluência prática, contexto corporativo, viagens, negócios e simulações do mundo real.',
      features: ['Inglês de negócios e entrevistas', 'Simulações de viagens e imigração', 'Correções gramaticais detalhadas', 'Flexibilidade total de tópicos']
    }
  };

  const goals = [
    { id: 'conversacao', title: 'Conversação Fluente', desc: 'Falar com confiança e naturalidade no dia a dia.', icon: Sparkles },
    { id: 'viagens', title: 'Viagens e Imigração', desc: 'Vocabulário útil para aeroportos, hotéis e restaurantes.', icon: Globe },
    { id: 'carreira', title: 'Carreira e Negócios', desc: 'Entrevistas de emprego, apresentações e reuniões.', icon: Target },
    { id: 'exames', title: 'Exames e Certificações', desc: 'Preparação para testes formais e exames escolares.', icon: Award },
    { id: 'reforco', title: 'Reforço Escolar', desc: 'Acompanhamento de gramática e tarefas da escola.', icon: BookOpen }
  ];

  const proficiencies: { id: Proficiency; label: string; cefr: string; desc: string }[] = [
    { id: 'Beginner', label: 'Iniciante', cefr: 'A1–A2', desc: 'Compreendo frases simples e vocabulário básico do dia a dia.' },
    { id: 'Intermediate', label: 'Intermédio', cefr: 'B1–B2', desc: 'Consigo manter conversas e expressar opiniões com clareza.' },
    { id: 'Advanced', label: 'Avançado', cefr: 'C1–C2', desc: 'Compreendo discursos complexos e falo com fluência articulada.' }
  ];

  const handleSelectAgeGroup = (targetGroup: 'CHILD' | 'TEEN' | 'ADULT') => {
    let newGroup: AgeGroup = 'ADULT';
    if (targetGroup === 'CHILD') newGroup = 'CHILD';
    if (targetGroup === 'TEEN') newGroup = 'TEEN';
    setSelectedAgeGroup(newGroup);
    setIsSaved(true);
    showToast(`Perfil de ${profileInfo[targetGroup].title} ativado! A adaptar interface e dashboard...`, 'success');
    setTimeout(() => {
      setView('dashboard');
    }, 400);
  };

  const handleSave = () => {
    setIsSaved(true);
    showToast('Preferências e Perfil de Aprendizagem guardados com sucesso!', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddLanguage = async () => {
    if (!languageToAdd) return;
    const currentLanguages = userProfile?.learning?.targetLanguages?.value || [];
    if (currentLanguages.includes(languageToAdd)) {
      showToast('Idioma já existe.', 'error');
      return;
    }
    try {
      await smartProfileEngine.addTargetLanguage(userProfile.id || userProfile.uid, languageToAdd);
      showToast('Idioma adicionado com sucesso!', 'success');
      setLanguageToAdd('');
    } catch (error) {
      console.error("Erro ao adicionar idioma:", error);
      showToast('Erro ao adicionar idioma.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300" id="learning-profile-container">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-indigo-900/40">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Gestão Pedagógica de Conta</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Perfil de Aprendizagem
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Consulte e personalize os parâmetros pedagógicos, a faixa etária associada e as preferências de ensino que moldam a resposta do seu Tutor IA e o Motor Adaptativo LingoLIVE.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setView('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-sm font-medium border border-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Voltar ao Início</span>
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Guardado!' : 'Guardar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Info Banner on Registration Origin */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            O seu perfil de aprendizagem inicial foi estabelecido durante o processo de adesão. Pode atualizar os modos de estudo e preferências a qualquer momento nesta página para reorientar o seu tutor.
          </p>
        </div>
      </div>

      {/* Section 1: Active Age Group Profile Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              <span>1. Perfil e Faixa Etária Associada</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determina o tom de voz do tutor, o nível de linguagem e a abordagem pedagógica.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            Perfil Atual: {getProfileVisualState(currentNormalized, true).title}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['CHILD', 'TEEN', 'ADULT'] as const).map((key) => (
            <ProfileCard
              key={key}
              groupKey={key}
              isSelected={currentNormalized === key}
              onSelect={handleSelectAgeGroup}
            />
          ))}
        </div>
      </div>

      {/* Section 2: Languages & Proficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2. Idioma Principal & Idiomas em Aprendizagem
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Língua materna e idiomas em estudo no LingoLIVE.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Idioma Principal
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200">
                <span className="text-lg">🇵🇹</span>
                <span>Português</span>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold">
                  Nativo
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Idiomas em Aprendizagem (Outros)
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {userProfile?.learning?.targetLanguages?.value?.length > 1 ? (
                  userProfile.learning.targetLanguages.value
                    .filter((lang: string) => lang !== (selectedLanguage?.name || selectedLanguage))
                    .map((lang: string, index: number) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-600"
                      >
                        {lang}
                      </span>
                    ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum outro idioma em aprendizagem.</span>
                )}
              </div>
              <div className="flex gap-2 mb-4">
                <select
                  value={languageToAdd}
                  onChange={(e) => setLanguageToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="">Selecione um idioma</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddLanguage}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alterar Idioma Principal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => {
                  const isCurrent = selectedLanguage?.code === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setIsSaved(false);
                      }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Proficiency Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Nível Atual de Fluência
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Definição da complexidade gramatical e vocabulário.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {proficiencies.map((p) => {
              const isSelected = selectedProficiency === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProficiency(p.id);
                    setIsSaved(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{p.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {p.cefr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Learning Goals */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>4. Objetivos de Aprendizagem</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selecione os focos principais da sua jornada para personalizar os tópicos sugeridos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const Icon = g.icon;
            const isSelected = activeGoal === g.id;

            return (
              <div
                key={g.id}
                onClick={() => {
                  setActiveGoal(g.id);
                  setIsSaved(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{g.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{g.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Garantia Pedagógica LingoLIVE AI</p>
            <p className="text-xs text-slate-400">As preferências são aplicadas instantaneamente a todas as turmas, lições adaptativas e robôs de conversação.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'Preferências Guardadas!' : 'Guardar Preferências'}</span>
        </button>
      </div>
    </div>
  );
};
