import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, ShoppingBag, ShoppingCart, TrendingUp, DollarSign, 
  Settings, Sparkles, BookOpen, Star, 
  BarChart3, Shield, Globe, Award, Briefcase, FileText,
  MessageCircle, LayoutDashboard, Search, Zap, CheckCircle, Users
} from 'lucide-react';

type LGMPSection = 'dashboard' | 'catalog' | 'services' | 'subscriptions' | 'analytics' | 'lars';

export const MarketplacePlatform: React.FC<{ activeView?: string; setView?: (v: any) => void }> = ({ activeView = "marketplace", setView }) => {
  const [activeSection, setActiveSection] = useState<LGMPSection>('dashboard');

  useEffect(() => {
    if (activeView === 'marketplace' || activeView === 'marketplace-dashboard') setActiveSection('dashboard');
    else if (activeView === 'marketplace-catalog') setActiveSection('catalog');
    else if (activeView === 'marketplace-services') setActiveSection('services');
    else if (activeView === 'marketplace-subscriptions') setActiveSection('subscriptions');
    else if (activeView === 'marketplace-analytics') setActiveSection('analytics');
    else if (activeView === 'marketplace-lars') setActiveSection('lars');
  }, [activeView]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">Global Marketplace Platform</h1>
                <p className="text-slate-500 font-medium">LingoLIVE IA - LGMP v1.0 (Enterprise)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-indigo-700">KCE Ativo</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-700">Criador Verificado</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Painel Central', icon: LayoutDashboard },
            { id: 'catalog', label: 'Catálogo de Produtos', icon: ShoppingBag },
            { id: 'services', label: 'Serviços Linguísticos', icon: Briefcase },
            { id: 'subscriptions', label: 'Assinaturas', icon: DollarSign },
            { id: 'analytics', label: 'Marketing & Analytics', icon: BarChart3 },
            { id: 'lars', label: 'Validação LARS', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as LGMPSection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
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
            {activeSection === 'dashboard' && <LGMPDashboard />}
            {activeSection === 'catalog' && <LGMPCatalog />}
            {activeSection === 'services' && <LGMPServices />}
            {activeSection === 'subscriptions' && <LGMPSubscriptions />}
            {activeSection === 'analytics' && <LGMPAnalytics />}
            {activeSection === 'lars' && <LGMPLars />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const LGMPDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: 'Receita Total', value: '€ 12,450', trend: '+18% vs Mês Anterior', icon: DollarSign, color: 'emerald' },
        { title: 'Vendas (Produtos)', value: '342', trend: 'Alta Conversão', icon: ShoppingCart, color: 'blue' },
        { title: 'Assinantes Ativos', value: '128', trend: 'Receita Recorrente', icon: Users, color: 'indigo' },
        { title: 'Avaliação Média', value: '4.9', trend: 'Selo Qualidade LARS', icon: Star, color: 'amber' }
      ].map((kpi, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-${kpi.color}-500`}>
            <kpi.icon className="w-24 h-24" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 mb-2">{kpi.title}</h3>
          <span className="text-3xl font-black text-slate-800 mb-2 block">{kpi.value}</span>
          <span className={`text-xs font-bold text-${kpi.color}-600 bg-${kpi.color}-50 px-2 py-1 rounded-md inline-block`}>{kpi.trend}</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 py-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Knowledge Commerce Engine (KCE)</h3>
              <p className="text-indigo-400 text-sm font-bold">Otimização Económica Orientada por IA</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-3" />
              <h4 className="text-white font-bold mb-2">Preços Dinâmicos & LTV</h4>
              <p className="text-slate-300 text-sm">A IA analisa tendências globais de mercado e sugere ajustes de preço para maximizar o Lifetime Value dos clientes.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <Globe className="w-5 h-5 text-amber-400 mb-3" />
              <h4 className="text-white font-bold mb-2">Previsão de Procura</h4>
              <p className="text-slate-300 text-sm">Identificação de nichos em ascensão (Ex: "Inglês para Profissionais de IA"). Sugestão de novos infoprodutos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Status de Publicação
        </h3>
        <div className="flex-1 space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Aprovado pelo LARS</span>
              <span className="text-xs font-bold bg-white text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">Ativo</span>
            </div>
            <h4 className="font-bold text-slate-800 text-md">Pack: Advanced Business Vocabulary</h4>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-slate-600">€ 24.99</span>
              <span className="text-xs text-slate-500">145 Vendas</span>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Em Revisão (IA)</span>
              <span className="text-xs font-bold bg-white text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">Pendente</span>
            </div>
            <h4 className="font-bold text-slate-800 text-md">Bootcamp: Tech Interviews in English</h4>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-slate-600">€ 149.00</span>
              <span className="text-xs text-slate-500">Avaliação LARS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LGMPCatalog = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <ShoppingBag className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Catálogo de Conteúdos</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Publique e comercialize flashcards, e-books, exercícios interativos, testes de avaliação e academias completas. Utilize a IA para gerar metadados e traduções automáticas para alcance global.
    </p>
  </div>
);

const LGMPServices = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Briefcase className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Serviços Linguísticos B2B / B2C</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Disponibilize serviços especializados de tradução, revisão técnica, consultoria educacional, interpretação simultânea ou coaching linguístico intensivo para executivos.
    </p>
  </div>
);

const LGMPSubscriptions = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <DollarSign className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Gestão de Assinaturas & Licenças</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Crie pacotes de receitas recorrentes. Venda licenças individuais ou corporativas (B2B), definindo políticas flexíveis de acesso a bibliotecas e cursos exclusivos.
    </p>
  </div>
);

const LGMPAnalytics = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BarChart3 className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Analytics Financeiro & Promocional</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Gira campanhas promocionais, emissão de cupões e descontos sazonais. Acompanhe a receita, taxas de conversão, devoluções e Lifetime Value projetado de cada segmento.
    </p>
  </div>
);

const LGMPLars = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Shield className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">LARS - Conformidade e Qualidade</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Monitorize o status de aprovação de todos os seus conteúdos. O LARS utiliza IA para detetar plágio, validar precisão linguística e garantir conformidade com o CEFR antes da publicação.
    </p>
  </div>
);
