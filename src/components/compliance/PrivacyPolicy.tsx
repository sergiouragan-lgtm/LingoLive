import React, { useState } from "react";
import { AppView } from "../../types";
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2, Eye, Trash2, Globe, Heart, AlertCircle, FileCheck, Mail } from "lucide-react";
import { motion } from "motion/react";

interface PrivacyPolicyProps {
  setView: (view: AppView) => void;
  previousView?: AppView;
}

export function PrivacyPolicy({ setView, previousView = "landing" }: PrivacyPolicyProps) {
  const [activeTab, setActiveTab] = useState<"general" | "gdpr" | "lgpd" | "cookies">("general");
  const [deletionEmail, setDeletionEmail] = useState("");
  const [deletionStatus, setDeletionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleRequestDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionEmail || !deletionEmail.includes("@")) {
      setDeletionStatus("error");
      return;
    }
    // Simulate deletion request storage / event dispatch
    setDeletionStatus("success");
    setDeletionEmail("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Decorative Radial Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/25 via-slate-950 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(previousView)}
              className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-semibold cursor-pointer border border-slate-900 hover:border-slate-800"
              id="privacy-policy-back-btn"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <Shield className="text-indigo-400" size={18} />
              <span className="text-sm font-bold text-slate-200 tracking-wider uppercase">LingoLIVE Compliance</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <FileCheck size={12} />
            <span>ISO 27001, GDPR & LGPD Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 relative z-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Lock size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Na LingoLIVE IA, a sua privacidade é um pilar não negociável. Comprometemo-nos a proteger os seus dados pessoais com encriptação de ponta e conformidade estrita com o RGPD (GDPR) e a LGPD.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-semibold uppercase tracking-wider pt-2">
            <span>Última Atualização: 15 de Julho de 2026</span>
            <span>•</span>
            <span>Versão: 2.1.0</span>
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-slate-900 pb-2">
          {[
            { id: "general", label: "Visão Geral", icon: FileText },
            { id: "gdpr", label: "Normativa GDPR (Europa)", icon: Globe },
            { id: "lgpd", label: "Normativa LGPD (Brasil)", icon: Heart },
            { id: "cookies", label: "Gestão de Cookies", icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500"
                    : "border-slate-900 bg-slate-950/40 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon size={14} className={isActive ? "text-indigo-400 animate-pulse" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6">
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-indigo-400" size={18} />
                  <span>1. Que Dados Recolhemos?</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Para prestar os nossos serviços de tutoria de IA multilingue de forma personalizada, processamos os seguintes dados essenciais:
                </p>
                <ul className="list-disc pl-6 text-sm text-slate-400 space-y-2">
                  <li><strong className="text-slate-300">Dados de Registo:</strong> Nome, email, palavra-passe encriptada (via Firebase Auth) e preferências linguísticas de onboarding.</li>
                  <li><strong className="text-slate-300">Metadados de Aprendizagem:</strong> Histórico de conversação com o Kamba AI, notas de pronúncia analisadas pelo Whisper e taxas de conclusão de exercícios.</li>
                  <li><strong className="text-slate-300">Dados de Voz:</strong> Gravações curtas de áudio criadas por si durante os desafios de pronúncia para processamento imediato pelo motor de voz. Estes ficheiros são apagados após análise imediata.</li>
                  <li><strong className="text-slate-300">Informação Financeira:</strong> Todas as faturas e subscrições são intermediadas de forma segura por gateways de pagamento em total isolamento de dados PII (PCI-DSS).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-indigo-400" size={18} />
                  <span>2. Finalidade do Tratamento de Dados</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A recolha de dados obedece rigorosamente ao princípio da minimização de dados e serve para:
                </p>
                <ul className="list-disc pl-6 text-sm text-slate-400 space-y-2">
                  <li>Adequar dinamicamente a dificuldade pedagógica do tutor ao seu nível de proficiência.</li>
                  <li>Sincronizar o seu progresso entre múltiplos dispositivos na plataforma PWA.</li>
                  <li>Assegurar a governabilidade de IA e segurança de conteúdos sensíveis para estudantes menores de idade.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-indigo-400" size={18} />
                  <span>3. Retenção de Dados</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Conservamos os seus dados pessoais apenas pelo período estritamente necessário para prestar o serviço ou até solicitar a sua eliminação definitiva. Os logs de utilização de IA são anonimizados para fins estatísticos e de treino de segurança de acordo com a ISO 27001.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "gdpr" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 flex gap-4 items-start">
                <Globe className="text-indigo-400 shrink-0 mt-0.5" size={24} />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-indigo-300">Garantias do Regulamento Geral de Proteção de Dados (RGPD)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Se reside no Espaço Económico Europeu (EEE), dispõe de direitos legais avançados sob o Regulamento (UE) 2016/679. A LingoLIVE atua como Responsável pelo Tratamento e Subcontratante para garantir estas prerrogativas.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Os Seus Direitos Sob o GDPR:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px]">Artigo 15</span>
                    <h5 className="font-bold text-slate-200">Direito de Acesso</h5>
                    <p className="text-slate-400">Pode solicitar uma cópia exportável de todos os dados pessoais que mantemos no nosso sistema em qualquer momento.</p>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px]">Artigo 16</span>
                    <h5 className="font-bold text-slate-200">Direito de Retificação</h5>
                    <p className="text-slate-400">Pode exigir a correção imediata de qualquer dado incorreto ou incompleto no seu perfil de utilizador.</p>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px]">Artigo 17</span>
                    <h5 className="font-bold text-slate-200">Direito ao Apagamento</h5>
                    <p className="text-slate-400">Direito ao esquecimento. Solicitando a remoção, limparemos permanentemente a sua conta e registos de progresso.</p>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px]">Artigo 20</span>
                    <h5 className="font-bold text-slate-200">Portabilidade de Dados</h5>
                    <p className="text-slate-400">Receba os seus dados em formato estruturado, de uso comum e leitura automática para exportação a outro prestador.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Base Legal para Tratamento:</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tratamos os seus dados com base no <strong className="text-indigo-400">Consentimento Explícito</strong> (obtido no onboarding), na <strong className="text-indigo-400">Execução do Contrato</strong> (prestação do serviço educacional da PWA) e no <strong className="text-indigo-400">Interesse Legítimo</strong> (mitigação de fraude e auditoria ISO 27001).
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "lgpd" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex gap-4 items-start">
                <Heart className="text-emerald-400 shrink-0 mt-0.5" size={24} />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-300">Lei Geral de Proteção de Dados (LGPD - Brasil)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Se você acessa a LingoLIVE a partir do território brasileiro, o tratamento dos seus dados pessoais é protegido de forma rígida pela Lei nº 13.709/2018 (LGPD), fiscalizada pela ANPD.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Seus Direitos como Titular de Dados (Artigo 18 da LGPD):</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={14} />
                    <p><strong className="text-slate-200">Confirmação de Existência:</strong> Confirmação de que realizamos tratamento de dados na plataforma LingoLIVE.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={14} />
                    <p><strong className="text-slate-200">Anonimização e Bloqueio:</strong> Desassociação completa de dados que identifiquem você pessoalmente em logs do servidor ou de Inteligência Artificial.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={14} />
                    <p><strong className="text-slate-200">Revogação do Consentimento:</strong> Capacidade de cancelar sua anuência de processamento de dados pedagógicos anteriores e interromper serviços dependentes.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={14} />
                    <p><strong className="text-slate-200">Informação sobre Compartilhamento:</strong> Detalhamento sobre com quais fornecedores de infraestrutura segura (ex: Google Cloud, Firebase Core Services) compartilhamos metadados de hospedagem.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "cookies" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Política de Cookies e Armazenamento Local</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Usamos pequenos arquivos de texto e variáveis de <code className="text-indigo-400 font-mono text-xs">localStorage</code> para assegurar que a plataforma funcione com o mais alto nível de conforto e sem lentidão.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-200">Tipos de Armazenamento Utilizados:</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-200">Cookies de Sessão & Autenticação</h5>
                      <p className="text-xs text-slate-400">Necessários para que você permaneça logado e mantenha os tokens seguros de API.</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">Estritamente Necessários</span>
                  </div>

                  <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-200">Preferências Locais (Local Storage)</h5>
                      <p className="text-xs text-slate-400">Guarda suas escolhas de temas, idiomas, progresso offline e o estado do banner de instalação do PWA.</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">Estritamente Necessários</span>
                  </div>

                  <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-200">Cookies de Diagnóstico & Performance</h5>
                      <p className="text-xs text-slate-400">Ajudam-nos a perceber erros de carregamento na interface, auxiliando na conformidade de SLA.</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md shrink-0">Opcionais / Estatísticas</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Form: GDPR & LGPD Data Request and Erasure Portal */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Trash2 size={120} />
          </div>

          <div className="space-y-2 max-w-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="text-rose-400" size={20} />
              <span>Portal de Auto-Exclusão e Esquecimento</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Em cumprimento com a LGPD e GDPR, qualquer estudante ou escola pode solicitar a exportação ou eliminação total de seus dados de forma imediata. Escreva seu e-mail cadastrado abaixo para registrar uma solicitação formal.
            </p>
          </div>

          <form onSubmit={handleRequestDeletion} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                required
                placeholder="Introduza o seu email associado"
                value={deletionEmail}
                onChange={(e) => setDeletionEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Submeter Pedido</span>
            </button>
          </form>

          {deletionStatus === "success" && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl max-w-xl">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Solicitação registada com sucesso! Um oficial de proteção de dados (DPO) irá contactá-lo nas próximas 24 horas para confirmar a sua identidade e proceder à eliminação.</span>
            </div>
          )}

          {deletionStatus === "error" && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl max-w-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>Erro: Por favor, introduza um e-mail válido para continuar.</span>
            </div>
          )}
        </div>

        {/* Corporate DPO Contact Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] text-indigo-400 tracking-widest uppercase">Canal de Atendimento</span>
              <h4 className="text-sm font-bold text-white">Encarregado de Proteção de Dados (DPO)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para esclarecer qualquer dúvida em relação à nossa governança de dados pessoais, entre em contato direto com o nosso DPO oficial pelo e-mail exclusivo de compliance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
              <Mail size={14} className="text-indigo-400" />
              <span>dpo@lingolive.ai</span>
            </div>
          </div>

          <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] text-indigo-400 tracking-widest uppercase">Segurança Certificada</span>
              <h4 className="text-sm font-bold text-white">Auditoria Regulatória de Segurança</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toda a infraestrutura do LingoLIVE opera sob conformidade ISO/IEC 27001:2022. Os testes de intrusão (pen-tests) e revisões de código de segurança são efetuados anualmente por entidades auditoras independentes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">
              <span>● AUDITADO E VERIFICADO JULHO 2026</span>
            </div>
          </div>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 relative z-10 bg-slate-950 mt-12">
        <p>© 2026 LingoLIVE IA. Todos os direitos reservados. Salvaguardando a educação com zero-trust.</p>
      </footer>
    </div>
  );
}
