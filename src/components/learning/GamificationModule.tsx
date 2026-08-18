import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Target, Zap, Crown, Flame, 
  Gift, ShoppingBag, Users, Activity, Compass, Sparkles,
  Award, Heart, Cpu, Map as MapIcon, Calendar, ArrowRight,
  TrendingUp, CheckCircle, ShieldCheck
} from 'lucide-react';

type IGESection = 'dashboard' | 'quests' | 'leagues' | 'store' | 'pets' | 'bme';

export const GamificationModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState<IGESection>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* IGE Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">Motor Inteligente de Gamificação</h1>
                <p className="text-slate-500 font-medium">Intelligent Gamification Engine (IGE) - Enterprise Edition</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-black text-amber-700">12,450 XP</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
              <span className="font-black text-indigo-700">450 LC</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="font-black text-rose-700">14 Dias</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'quests', label: 'Missões & Metas', icon: Target },
            { id: 'leagues', label: 'Ligas & Temporadas', icon: Crown },
            { id: 'store', label: 'Loja Virtual', icon: ShoppingBag },
            { id: 'pets', label: 'Companheiros (Pets)', icon: Heart },
            { id: 'bme', label: 'Behavioral Engine', icon: Cpu },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as IGESection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'dashboard' && <IGEDashboard />}
            {activeSection === 'quests' && <IGEQuests />}
            {activeSection === 'leagues' && <IGELeagues />}
            {activeSection === 'store' && <IGEStore />}
            {activeSection === 'pets' && <IGEPets />}
            {activeSection === 'bme' && <IGEBME />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const IGEDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Nível Atual */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <TrendingUp className="w-32 h-32" />
        </div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Progresso de Nível</h3>
        <div className="flex items-end gap-3 mb-2">
          <span className="text-5xl font-black text-slate-800">42</span>
          <span className="text-lg font-bold text-slate-400 mb-1">Mestre Linguístico</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-3/4 rounded-full"></div>
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Faltam 2,550 XP para o Nível 43</p>
      </div>

      {/* Liga Atual */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="w-32 h-32" />
        </div>
        <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-4">Liga Atual</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black block">Liga Diamante</span>
            <span className="text-sm text-indigo-200 font-medium">Top 5% Global</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm bg-black/20 p-3 rounded-xl backdrop-blur-sm">
          <span>Posição: <strong>#12</strong></span>
          <span>Sobe para Mestre em 3 dias</span>
        </div>
      </div>

      {/* Streak (BME integrado) */}
      <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Flame className="w-32 h-32" />
        </div>
        <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4" /> Consistência
        </h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-black text-slate-800">14</span>
          <span className="text-lg font-bold text-slate-400 mb-1">Dias Seguidos</span>
        </div>
        <div className="flex gap-2">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">{d}</span>
              <div className={`w-full h-8 rounded-lg flex items-center justify-center ${i < 5 ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-300'}`}>
                {i < 5 && <CheckCircle className="w-4 h-4" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Missões Rápidas */}
    <div className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500" />
          Missões Diárias
        </h3>
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Ver Todas</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Domínio do Present Perfect", desc: "Concluir 3 conversações usando Present Perfect sem erros.", xp: 150, lc: 10, progress: 66 },
          { title: "Ouvinte Atento", desc: "Completar 2 exercícios de compreensão oral.", xp: 100, lc: 5, progress: 0 },
          { title: "Mestre da Pronúncia", desc: "Alcançar 90%+ em 5 desafios de pronúncia.", xp: 200, lc: 15, progress: 100 },
          { title: "Colaborador", desc: "Ajudar 1 colega na comunidade.", xp: 50, lc: 5, progress: 0 },
        ].map((q, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${q.progress === 100 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} flex items-start gap-4`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${q.progress === 100 ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
              {q.progress === 100 ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{q.title}</h4>
              <p className="text-xs text-slate-500 mb-3">{q.desc}</p>
              <div className="flex items-center gap-3">
                <div className="flex-grow h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${q.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${q.progress}%` }}></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">+{q.xp} XP</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">+{q.lc} LC</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const IGEQuests = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Target className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Motor de Missões Inteligentes</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      A IA (BME) analisa as suas maiores dificuldades no Smart Profile Engine (SPE) e gera missões personalizadas em tempo real para focar no que realmente precisa de aprender.
    </p>
    <div className="inline-flex gap-4">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-48 text-left">
        <span className="text-xs font-bold text-indigo-600 block mb-1">Missão Pedagógica</span>
        <h4 className="font-bold text-slate-800 text-sm mb-2">Reforço de Sintaxe</h4>
        <div className="h-1.5 w-full bg-slate-200 rounded-full mb-2"><div className="w-1/3 h-full bg-indigo-500 rounded-full"></div></div>
        <span className="text-[10px] text-slate-500">Gerada pela IA com base nos seus erros.</span>
      </div>
    </div>
  </div>
);

const IGELeagues = () => (
  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center py-20 relative overflow-hidden">
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
    <div className="w-20 h-20 bg-white/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
      <Crown className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-white mb-4">Sistema de Ligas e Temporadas</h2>
    <p className="text-slate-400 max-w-lg mx-auto mb-8">
      Competição saudável. Progrida de Bronze a Lenda Suprema. As temporadas incluem eventos especiais, rankings globais/empresariais e recompensas exclusivas de prestígio.
    </p>
    <div className="flex justify-center gap-2 flex-wrap">
      {['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Mestre', 'Lenda'].map((league, i) => (
        <span key={league} className={`px-4 py-2 rounded-xl text-xs font-bold ${i === 4 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
          {league}
        </span>
      ))}
    </div>
  </div>
);

const IGEStore = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <ShoppingBag className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Economia Virtual Educativa</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Utilize as suas LingoCoins (ganhas exclusivamente através de esforço e estudo) para personalizar o seu avatar, comprar temas visuais, mascotes e aceder a eventos culturais.
    </p>
    <div className="flex justify-center items-center gap-2">
      <span className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> 450 LingoCoins Disponíveis
      </span>
    </div>
  </div>
);

const IGEPets = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Heart className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Companheiros Educativos (Pets)</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Os seus companheiros virtuais evoluem à medida que aprende. Eles incentivam revisões, lembram objetivos diários e fornecem suporte motivacional dinâmico.
    </p>
    <div className="flex justify-center gap-4">
      <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
        <span className="text-3xl mb-1">🦉</span>
        <span className="text-[10px] font-bold text-slate-400">Nível 5</span>
      </div>
      <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-50">
        <Lock className="w-6 h-6 text-slate-400 mb-1" />
        <span className="text-[10px] font-bold text-slate-400">Nv. 20 Req.</span>
      </div>
    </div>
  </div>
);

const IGEBME = () => (
  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 py-12 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5">
      <Cpu className="w-64 h-64 text-emerald-500" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
          <Activity className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Behavioral Motivation Engine (BME)</h2>
          <p className="text-emerald-400 font-medium text-sm">Extensão Enterprise de Adaptação Psicológica</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400"/> Perfil Motivacional Detetado</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Conquistador (Foco em Metas)</span>
                <span className="text-emerald-400 font-bold">85%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="w-[85%] h-full bg-emerald-400 rounded-full"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Explorador (Foco em Novidades)</span>
                <span className="text-emerald-400 font-bold">40%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="w-[40%] h-full bg-emerald-400 rounded-full"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Colaborador (Foco Social)</span>
                <span className="text-emerald-400 font-bold">60%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="w-[60%] h-full bg-emerald-400 rounded-full"></div></div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
           <h3 className="text-white font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400"/> Intervenções Ativas da IA</h3>
           <ul className="space-y-3">
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">
                 <strong className="text-white">Prevenção de Burnout:</strong> Dificuldade das missões diárias reduzida em 15% após deteção de fadiga cognitiva nas últimas sessões.
               </p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">
                 <strong className="text-white">Reforço Social:</strong> Recomendação ao Tutor IA para sugerir participação em desafios colaborativos, alinhado com o perfil motivacional.
               </p>
             </li>
           </ul>
        </div>
      </div>
    </div>
  </div>
);
