import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  BookOpen, 
  Mic, 
  Compass, 
  User, 
  Settings, 
  GraduationCap, 
  Bookmark, 
  ArrowRight, 
  Calendar,
  Sparkles
} from "lucide-react";
import { SavedWord, Language } from "../../types";

interface GlobalSearchProps {
  savedWords?: SavedWord[];
  streakHistory?: string[];
  selectedLanguage?: Language;
  setView: (view: string) => void;
  variant?: "topbar" | "sidebar";
}

interface SearchResult {
  type: "vocabulary" | "session" | "navigation";
  title: string;
  subtitle: string;
  extra?: string;
  action: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  savedWords = [],
  streakHistory = [],
  selectedLanguage = { code: "en", name: "Inglês", flag: "🇺🇸" },
  setView,
  variant = "topbar"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Static list of navigation targets in Portuguese
  const navigations = [
    { title: "Início", subtitle: "Ir para o painel principal e resumo de aprendizagem", view: "dashboard" },
    { title: "Tutor IA", subtitle: "Iniciar ou continuar prática de conversação falada", view: "practice" },
    { title: "Estudo Adaptativo", subtitle: "Trilha de estudo inteligente personalizada", view: "adaptive-learning" },
    { title: "Avaliar Pronúncia", subtitle: "Análise avançada e feedback de pronúncia de fala", view: "pronunciation" },
    { title: "Aulas ao Vivo", subtitle: "Ver e participar em aulas interativas ao vivo (LCP)", view: "live-classes" },
    { title: "Agenda de Aulas", subtitle: "Calendário e agendamentos de aulas e sessões", view: "live-calendar" },
    { title: "Professores", subtitle: "Ver lista e perfil de professores nativos qualificados", view: "live-teachers" },
    { title: "Gravações", subtitle: "Ver gravações passadas e resumos de aulas", view: "live-recordings" },
    { title: "Provas & Avaliações", subtitle: "Testes de nível e avaliações de fluência", view: "assessment-platform" },
    { title: "Certificados", subtitle: "Ver e emitir certificados de conclusão obtidos", view: "certificados" },
    { title: "Jogos Pedagógicos", subtitle: "Jogos interativos de vocabulário e gramática", view: "jogos" },
    { title: "Ranking & Tabela de Líderes", subtitle: "Acompanhar posição global e conquistas", view: "ranking" },
    { title: "Desempenho & Estatísticas", subtitle: "Evolução de aprendizagem e métricas de estudo", view: "analytics" },
    { title: "Biblioteca", subtitle: "Recursos educativos, materiais e documentos de apoio", view: "biblioteca" },
    { title: "Marketplace", subtitle: "Explorar catálogo de cursos, serviços e mentores", view: "marketplace" },
    { title: "Perfil de Utilizador", subtitle: "Ver dados pessoais, biografia e definições", view: "perfil" },
    { title: "Plano & Assinatura", subtitle: "Gerir plano de subscrição e benefícios", view: "subscription" },
    { title: "Pagamentos & Faturação", subtitle: "Histórico de compras e métodos de pagamento", view: "pagamentos" }
  ];

  // Map streak history dates to simulated/realistic practice sessions
  const getPastSessions = () => {
    const sessionScenarios = [
      { title: "Prática: No Café", desc: "Treino de vocabulário de café e pedidos de comida" },
      { title: "Prática: Entrevista de Emprego", desc: "Simulação de entrevista técnica" },
      { title: "Prática: Check-in no Aeroporto", desc: "Despacho de bagagem e passaporte" },
      { title: "Prática: No Hotel", desc: "Check-in com recepcionista nativo" },
      { title: "Prática: Conversa Informal", desc: "Apresentação e hobbies diários" }
    ];

    return streakHistory.map((dateStr, idx) => {
      const scenario = sessionScenarios[idx % sessionScenarios.length];
      
      // Parse YYYY-MM-DD into a more readable PT format
      let formattedDate = dateStr;
      try {
        const [year, month, day] = dateStr.split("-");
        formattedDate = `${day}/${month}/${year}`;
      } catch (e) {
        // ignore fallback
      }

      return {
        title: `${scenario.title} (${selectedLanguage.name})`,
        subtitle: `${scenario.desc} em ${formattedDate}`,
        extra: dateStr,
        action: () => setView("dashboard")
      };
    });
  };

  const results: SearchResult[] = [];

  if (query.trim() !== "") {
    const q = query.toLowerCase();

    // 1. Search Navigation areas
    navigations.forEach(nav => {
      if (nav.title.toLowerCase().includes(q) || nav.subtitle.toLowerCase().includes(q)) {
        results.push({
          type: "navigation",
          title: nav.title,
          subtitle: nav.subtitle,
          action: () => {
            setView(nav.view);
            setIsOpen(false);
            setQuery("");
          }
        });
      }
    });

    // 2. Search Vocabulary (Saved Words)
    savedWords.forEach(word => {
      if (
        word.word.toLowerCase().includes(q) || 
        word.meaning.toLowerCase().includes(q) ||
        (word.grammarNote && word.grammarNote.toLowerCase().includes(q))
      ) {
        results.push({
          type: "vocabulary",
          title: word.word,
          subtitle: `Significado: ${word.meaning}`,
          extra: word.pronunciation ? `Pronúncia: ${word.pronunciation}` : undefined,
          action: () => {
            setView("vocab");
            setIsOpen(false);
            setQuery("");
          }
        });
      }
    });

    // 3. Search Past Practice Sessions
    const pastSessions = getPastSessions();
    pastSessions.forEach(session => {
      if (session.title.toLowerCase().includes(q) || session.subtitle.toLowerCase().includes(q)) {
        results.push({
          type: "session",
          title: session.title,
          subtitle: session.subtitle,
          action: () => {
            session.action();
            setIsOpen(false);
            setQuery("");
          }
        });
      }
    });
  }

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const isSidebar = variant === "sidebar";

  return (
    <div className={`relative ${isSidebar ? 'w-full mx-0' : 'flex-1 max-w-sm md:max-w-md mx-4'}`} ref={dropdownRef} id="global-search-container">
      {/* Search Bar Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className={`block w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-all shadow-xs ${
            isSidebar
              ? 'bg-slate-800/90 border border-slate-700/60 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-slate-800'
              : 'border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
          placeholder={isSidebar ? "Pesquisar páginas, aulas, professores..." : "Buscar vocabulário, sessões ou áreas... (Ctrl+K)"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute inset-y-0 right-0 pr-2.5 flex items-center transition ${isSidebar ? 'text-slate-400 hover:text-slate-200' : 'hover:text-slate-600 text-slate-400'}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating Results Panel */}
      {isOpen && query.trim() !== "" && (
        <div className={`absolute left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-96 overflow-y-auto z-50 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isSidebar ? 'w-72 md:w-80 left-0' : 'right-0'}`}>
          
          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 tracking-wider flex items-center justify-between">
            <span>RESULTADOS DA BUSCA</span>
            <span>{results.length} ENCONTRADOS</span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente usar outros termos ou busque por "perfil", "quiz", "café".</p>
            </div>
          ) : (
            results.map((item, index) => {
              // Icon mapping
              let Icon = Compass;
              let bgClass = "bg-indigo-50 text-indigo-600";
              
              if (item.type === "vocabulary") {
                Icon = Bookmark;
                bgClass = "bg-pink-50 text-pink-600";
              } else if (item.type === "session") {
                Icon = Mic;
                bgClass = "bg-emerald-50 text-emerald-600";
              } else if (item.type === "navigation") {
                if (item.title.includes("Perfil")) {
                  Icon = User;
                  bgClass = "bg-violet-50 text-violet-600";
                } else if (item.title.includes("Quiz")) {
                  Icon = GraduationCap;
                  bgClass = "bg-cyan-50 text-cyan-600";
                } else if (item.title.includes("Configurações")) {
                  Icon = Settings;
                  bgClass = "bg-slate-100 text-slate-600";
                }
              }

              return (
                <div
                  key={index}
                  onClick={item.action}
                  className="px-4 py-3 hover:bg-slate-50/80 cursor-pointer transition-all flex items-start gap-3.5 group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${bgClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.title}
                      </p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        item.type === "vocabulary" ? "bg-pink-100 text-pink-700" :
                        item.type === "session" ? "bg-emerald-100 text-emerald-700" :
                        "bg-indigo-100 text-indigo-700"
                      }`}>
                        {item.type === "vocabulary" ? "Vocabulário" :
                         item.type === "session" ? "Sessão" : "Navegação"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    {item.extra && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.extra}</p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all self-center" />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
