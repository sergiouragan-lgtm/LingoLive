import React, { useState, useEffect } from "react";
import { SavedWord } from "../../../types";
import { 
  ArrowLeft, 
  Trash2, 
  Volume2, 
  Bookmark, 
  Sparkles, 
  BookOpen, 
  Calendar,
  HelpCircle,
  Eye,
  EyeOff,
  Download,
  PlusCircle,
  ShieldAlert,
  Search
} from "lucide-react";
import { COMMON_PHRASES } from "./commonPhrases";

interface SavedVocabDeckProps {
  savedWords: SavedWord[];
  onDeleteWord: (id: string) => void;
  onBack: () => void;
  languageName: string;
  languageCode: string;
  onAddWords?: (words: SavedWord[]) => void;
  userAge?: number;
  selectedAgeGroup?: string;
}

export type TargetAgeGroup = 'CHILD' | 'TEEN' | 'ADULT';

export interface LibraryProfileExperience {
  readonly heading: string;
  readonly description: string;
  readonly badge: string;
  readonly sectionLabel: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string;
  readonly pageClassName: string;
  readonly accentClassName: string;
  readonly categoryPriority: readonly string[];
}

export function normalizeProfile(selectedAgeGroup?: string, userAge?: number): TargetAgeGroup | null {
  let profileStr = selectedAgeGroup;
  if (!profileStr && typeof window !== 'undefined' && window.localStorage) {
    profileStr = window.localStorage.getItem('lingolive_age_group') || window.localStorage.getItem('user_age_group') || undefined;
  }
  if (profileStr) {
    const upper = profileStr.trim().toUpperCase();
    if (upper === 'CHILD' || upper === 'KIDS' || upper === 'INFANCY') return 'CHILD';
    if (upper === 'TEEN' || upper === 'TEENS' || upper === 'PRETEENS') return 'TEEN';
    if (upper === 'ADULT' || upper === 'ADULTS') return 'ADULT';
  }
  if (userAge !== undefined && userAge !== null && !isNaN(Number(userAge))) {
    const age = Number(userAge);
    if (age < 12) return 'CHILD';
    if (age < 18) return 'TEEN';
    return 'ADULT';
  }
  return null;
}

const NEUTRAL_EXPERIENCE: LibraryProfileExperience = Object.freeze({
  heading: "Saved Vocabulary Deck",
  description: "Review and practice terms saved in your sessions",
  badge: "Biblioteca",
  sectionLabel: "Expressões",
  primaryActionLabel: "Explorar Expressões",
  secondaryActionLabel: "Tap to Reveal Translation",
  pageClassName: "from-slate-50 to-white",
  accentClassName: "text-amber-500 fill-amber-500",
  categoryPriority: Object.freeze([])
});

const CHILD_EXPERIENCE: LibraryProfileExperience = Object.freeze({
  heading: "Escolhe a próxima aventura",
  description: "Explora histórias, palavras e actividades preparadas para aprender enquanto te divertes.",
  badge: "Biblioteca divertida",
  sectionLabel: "Aventuras",
  primaryActionLabel: "Começar aventura",
  secondaryActionLabel: "Explorar actividades",
  pageClassName: "from-amber-50/60 to-orange-50/40",
  accentClassName: "text-amber-500 fill-amber-500",
  categoryPriority: Object.freeze(["vocabulário", "histórias", "jogos", "pronúncia", "actividades curtas", "Geral", "Formal"])
});

const TEEN_EXPERIENCE: LibraryProfileExperience = Object.freeze({
  heading: "Escolhe o teu próximo desafio",
  description: "Descobre conteúdos actuais, pratica conversação e mantém o teu progresso em movimento.",
  badge: "Biblioteca dinâmica",
  sectionLabel: "Desafios",
  primaryActionLabel: "Aceitar desafio",
  secondaryActionLabel: "Praticar agora",
  pageClassName: "from-indigo-50/60 to-purple-50/40",
  accentClassName: "text-indigo-600 fill-indigo-600",
  categoryPriority: Object.freeze(["conversação", "cultura digital", "desafios", "pronúncia", "vocabulário actual", "Gíria", "Formal"])
});

const ADULT_EXPERIENCE: LibraryProfileExperience = Object.freeze({
  heading: "Conteúdos para os teus objectivos",
  description: "Escolhe actividades práticas para trabalho, viagens, certificação e comunicação real.",
  badge: "Biblioteca profissional",
  sectionLabel: "Objectivos",
  primaryActionLabel: "Iniciar prática",
  secondaryActionLabel: "Ver conteúdo",
  pageClassName: "from-slate-50 to-indigo-50/30",
  accentClassName: "text-blue-600 fill-blue-600",
  categoryPriority: Object.freeze(["negócios", "conversação prática", "viagens", "certificação", "pronúncia", "Formal", "Acadêmica", "Geral"])
});

export function getLibraryProfileExperience(
  profile: TargetAgeGroup | null
): LibraryProfileExperience {
  if (profile === 'CHILD') return CHILD_EXPERIENCE;
  if (profile === 'TEEN') return TEEN_EXPERIENCE;
  if (profile === 'ADULT') return ADULT_EXPERIENCE;
  return NEUTRAL_EXPERIENCE;
}

export function sortItemsByPriority<T extends { category?: string; maturityLevel?: string }>(
  items: T[],
  priorityList: readonly string[]
): T[] {
  if (!priorityList || priorityList.length === 0) return items;

  return [...items].sort((a, b) => {
    const catA = (a.category || "Geral").toLowerCase();
    const catB = (b.category || "Geral").toLowerCase();

    const idxA = priorityList.findIndex((p) => p.toLowerCase() === catA);
    const idxB = priorityList.findIndex((p) => p.toLowerCase() === catB);

    const posA = idxA >= 0 ? idxA : 999;
    const posB = idxB >= 0 ? idxB : 999;

    return posA - posB;
  });
}

export function SavedVocabDeck({
  savedWords,
  onDeleteWord,
  onBack,
  languageName,
  languageCode,
  onAddWords,
  userAge,
  selectedAgeGroup
}: SavedVocabDeckProps) {
  const [revealAll, setRevealAll] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [importSectionOpen, setImportSectionOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Vocabulary categorization and filtering states
  const [maturityFilter, setMaturityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const resolvedProfile = normalizeProfile(selectedAgeGroup, userAge);
  const experience = getLibraryProfileExperience(resolvedProfile);

  const parsedAge = userAge !== undefined ? Number(userAge) : (resolvedProfile === 'CHILD' ? 8 : resolvedProfile === 'TEEN' ? 15 : 25);
  const maxAllowedMaturity = parsedAge < 12 ? "Infantil" : parsedAge < 18 ? "Adolescente" : "Adulto";

  const isWordAllowedForAge = (wordMaturity?: string) => {
    if (selectedAgeGroup) return true;
    if (!wordMaturity) return true;
    const normalized = wordMaturity.trim().toLowerCase();
    
    if (maxAllowedMaturity === "Infantil") {
      return normalized === "infantil";
    }
    if (maxAllowedMaturity === "Adolescente") {
      return normalized === "infantil" || normalized === "adolescente";
    }
    return true;
  };

  const normalizedCode = (languageCode || "en").toLowerCase().split("-")[0];
  const availablePhrases = COMMON_PHRASES[normalizedCode] || [];

  useEffect(() => {
    if (availablePhrases.length > 0) {
      setSelectedIndices(availablePhrases.map((_, i) => i));
    } else {
      setSelectedIndices([]);
    }
  }, [languageCode]);

  const handleToggleSelectAll = () => {
    if (selectedIndices.length === availablePhrases.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(availablePhrases.map((_, i) => i));
    }
  };

  const handleToggleIndividual = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleImportSelected = () => {
    if (selectedIndices.length === 0 || !onAddWords) return;

    const wordsToSave: SavedWord[] = selectedIndices.map((idx, i) => {
      const template = availablePhrases[idx];
      return {
        id: `${normalizedCode}_bulk_${Date.now()}_${i}`,
        word: template.word,
        meaning: template.meaning,
        pronunciation: template.pronunciation,
        grammarNote: template.grammarNote,
        exampleOriginal: template.exampleOriginal,
        exampleTranslation: template.exampleTranslation,
        savedAt: new Date().toISOString().split("T")[0],
        maturityLevel: parsedAge < 12 ? "Infantil" : parsedAge < 18 ? "Adolescente" : "Adulto",
        category: "Formal"
      };
    });

    onAddWords(wordsToSave);
    setImportSectionOpen(false);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Speaks out the word or phrase utilizing native browser TTS
  const speakLocal = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    
    // Stop any active spoken speech first
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Align language code correctly (e.g. es, fr, de, ja, en)
    utterance.lang = languageCode || "es";
    utterance.rate = 0.85; // slightly slower for better listening practice
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" id="vocab-deck-view">
      {/* Upper Navigation Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5" data-testid="library-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Voltar"
            data-testid="header-back-button"
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className={`w-6 h-6 ${experience.accentClassName}`} />
                <span>{experience.heading}</span>
              </h2>
              <span 
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 uppercase tracking-wider"
                data-testid="library-badge"
              >
                {experience.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5" data-testid="library-description">
              {experience.description}
            </p>
          </div>
        </div>

        {savedWords.length > 0 && (
          <button
            onClick={() => setRevealAll(!revealAll)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            {revealAll ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{revealAll ? "Hide Meanings" : "Reveal All Cards"}</span>
          </button>
        )}
      </div>

      {/* Curated Bulk Import Section */}
      {availablePhrases.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/40 border border-indigo-100 rounded-3xl p-5 shadow-xs relative overflow-hidden" id="bulk-import-card">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/5 rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-indigo-600" /> {experience.sectionLabel}
              </span>
              <h3 className="font-display text-lg font-extrabold text-slate-800">
                Importar Expressões Comuns para {languageName}
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Acelere o seu aprendizado adicionando um pacote de {availablePhrases.length} frases prontas de conversação do dia a dia diretamente ao seu baralho local.
              </p>
            </div>
            
            <button
              onClick={() => setImportSectionOpen(!importSectionOpen)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-center"
              id="btn-toggle-import-panel"
              data-testid="library-primary-action"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{importSectionOpen ? "Fechar Visualização" : experience.primaryActionLabel}</span>
            </button>
          </div>

          {importSectionOpen && (
            <div className="mt-5 pt-5 border-t border-indigo-100 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Selecione as frases que deseja adicionar:</span>
                <button
                  onClick={handleToggleSelectAll}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer text-xs"
                >
                  {selectedIndices.length === availablePhrases.length ? "Desmarcar Todas" : "Marcar Todas"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                {availablePhrases.map((phrase, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleIndividual(idx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start select-none ${
                        isSelected 
                          ? 'bg-white border-indigo-200 shadow-xs' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by div click
                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                      />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="font-bold text-slate-800 text-sm leading-tight">
                            {phrase.word}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakLocal(phrase.word);
                            }}
                            className="p-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Hear Pronunciation"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          "{phrase.meaning}"
                        </p>
                        {phrase.pronunciation && (
                          <span className="inline-block text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {phrase.pronunciation}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-indigo-50/80">
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedIndices.length} de {availablePhrases.length} expressões selecionadas.
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setImportSectionOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportSelected}
                    disabled={selectedIndices.length === 0}
                    className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    id="btn-confirm-bulk-import"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Importar Seleção ({selectedIndices.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Safety Computations */}
      {(() => {
        const hiddenCount = savedWords.filter((item) => {
          const itemMaturity = item.maturityLevel || (parsedAge < 12 ? "Infantil" : parsedAge < 18 ? "Adolescente" : "Adulto");
          return !isWordAllowedForAge(itemMaturity);
        }).length;

        const filteredWords = savedWords.filter((item) => {
          const itemMaturity = item.maturityLevel || (parsedAge < 12 ? "Infantil" : parsedAge < 18 ? "Adolescente" : "Adulto");
          const itemCategory = item.category || "Geral";

          // Age appropriate safety filter
          if (!isWordAllowedForAge(itemMaturity)) {
            return false;
          }

          // Maturity level filter selection
          if (maturityFilter !== "All" && itemMaturity.toLowerCase() !== maturityFilter.toLowerCase()) {
            return false;
          }

          // Category filter selection
          if (categoryFilter !== "All" && itemCategory.toLowerCase() !== categoryFilter.toLowerCase()) {
            return false;
          }

          if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            const wordMatch = item.word.toLowerCase().includes(query);
            const meaningMatch = item.meaning.toLowerCase().includes(query);
            if (!wordMatch && !meaningMatch) {
              return false;
            }
          }

          return true;
        });

        const hasWordsAllowed = (savedWords.length - hiddenCount) > 0;

        return (
          <div className="space-y-6">
            {/* Age Restrictions Safe Notification Card */}
            {hiddenCount > 0 && (
              <div className="bg-rose-50/70 border border-rose-100 rounded-3xl p-4 text-xs text-rose-800 flex items-start gap-3 shadow-xs animate-in fade-in duration-300">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <p className="font-bold">Segurança de Idade Ativada ({parsedAge} anos)</p>
                  <p className="text-rose-600 leading-relaxed font-medium">
                    Ocultamos automaticamente <strong>{hiddenCount}</strong> termo(s) do seu baralho contendo vocabulário avançado ou expressões inadequadas para a sua faixa etária. Sua integridade e segurança de aprendizado são nossa prioridade máxima!
                  </p>
                </div>
              </div>
            )}

            {/* Filter controls panel */}
            {savedWords.length > 0 && hasWordsAllowed && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                {/* Search Input */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por palavra ou significado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Filter by Maturity */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-xs font-bold text-slate-500 block">Nível de Maturidade</span>
                    <div className="inline-flex rounded-xl p-1 bg-slate-100 text-[11px] font-bold">
                      {["All", "Infantil", "Adolescente", "Adulto"].map((lvl) => {
                        const isExceeded = lvl !== "All" && (
                          (maxAllowedMaturity === "Infantil" && lvl !== "Infantil") ||
                          (maxAllowedMaturity === "Adolescente" && lvl === "Adulto")
                        );
                        if (isExceeded) return null;

                        return (
                          <button
                            key={lvl}
                            onClick={() => setMaturityFilter(lvl)}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                              maturityFilter === lvl
                                ? "bg-white text-slate-800 shadow-xs border border-slate-200/40"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            {lvl === "All" ? "Todos" : lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter by Category */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-xs font-bold text-slate-500 block">Categoria da Expressão</span>
                    <div className="inline-flex rounded-xl p-1 bg-slate-100 text-[11px] font-bold">
                      {["All", "Gíria", "Formal", "Acadêmica", "Geral"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            categoryFilter === cat
                              ? "bg-white text-slate-800 shadow-xs border border-slate-200/40"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {cat === "All" ? "Todas" : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl self-stretch md:self-auto flex items-center justify-center whitespace-nowrap mt-1 md:mt-0">
                  Mostrando {filteredWords.length} de {savedWords.length - hiddenCount} expressões
                </div>
                </div>
              </div>
            )}

            {/* Vocab Cards List */}
            {savedWords.length === 0 || (savedWords.length - hiddenCount) === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mx-auto">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-700 text-base">Your Deck is Empty</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    When practicing voice in a live room, tap on any unfamiliar word in the transcript to fetch its English translation, pronunciation guide, and save it here.
                  </p>
                </div>
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-xs cursor-pointer"
                >
                  Go Practice Now
                </button>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-2">
                <p className="font-bold text-slate-700 text-sm">Nenhum termo encontrado</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Não há termos salvos que correspondam à sua busca ou aos filtros selecionados.
                </p>
                <button
                  onClick={() => { setMaturityFilter("All"); setCategoryFilter("All"); setSearchQuery(""); }}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Limpar Filtros e Busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortItemsByPriority(filteredWords, experience.categoryPriority).map((item) => {
                  const isRevealed = revealAll || revealedIds[item.id];
                  const itemMaturity = item.maturityLevel || (parsedAge < 12 ? "Infantil" : parsedAge < 18 ? "Adolescente" : "Adulto");
                  const itemCategory = item.category || "Geral";

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      {/* Visual decoration */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

                      <div className="space-y-4">
                        {/* Top line with word and speaker icon */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1.5 flex-1 pr-4 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                                {item.word}
                              </h4>
                              <button
                                onClick={() => speakLocal(item.word)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-indigo-100"
                                title="Click to hear pronunciation"
                                id={`speak-btn-${item.id}`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Ouvir</span>
                              </button>
                            </div>
                            
                            <p className="text-[11px] font-mono text-slate-400">
                              Phonetic: <span className="text-slate-600">{item.pronunciation}</span>
                            </p>

                            {/* Beautiful Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              {/* Nível de Maturidade */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                itemMaturity === "Infantil" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100/70" 
                                  : itemMaturity === "Adolescente"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100/70"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                {itemMaturity === "Infantil" ? "👶 Infantil" : itemMaturity === "Adolescente" ? "🎒 Adolescente" : "💼 Adulto"}
                              </span>

                              {/* Categoria da Expressão */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                itemCategory === "Gíria" 
                                  ? "bg-amber-50 text-amber-700 border-amber-100/70" 
                                  : itemCategory === "Formal"
                                    ? "bg-blue-50 text-blue-700 border-blue-100/70"
                                    : itemCategory === "Acadêmica"
                                      ? "bg-purple-50 text-purple-700 border-purple-100/70"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>
                                {itemCategory === "Gíria" ? "💬 Gíria" : itemCategory === "Formal" ? "👔 Formal" : itemCategory === "Acadêmica" ? "🎓 Acadêmica" : "🌐 Geral"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 z-10 self-start">
                            {/* Delete item */}
                            <button
                              onClick={() => onDeleteWord(item.id)}
                              className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                              title="Remove Flashcard"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Revealing card translation section */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 min-h-[50px] flex flex-col justify-center relative">
                          {isRevealed ? (
                            <div className="space-y-1.5 animate-in fade-in duration-300 text-left">
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Meaning</span>
                              <p className="text-slate-900 font-semibold text-sm leading-relaxed">
                                {item.meaning}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleReveal(item.id)}
                              className="w-full h-full text-center py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Tap to Reveal Translation</span>
                            </button>
                          )}
                        </div>

                        {/* Context sentence */}
                        <div className="space-y-1 border-t border-slate-50 pt-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">In-Context Usage</span>
                            <button
                              onClick={() => speakLocal(item.exampleOriginal)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 transition-all cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-50"
                              title="Hear Example Sentence"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Ouvir Frase</span>
                            </button>
                          </div>
                          <p className="text-slate-800 font-semibold text-xs leading-relaxed">
                            {item.exampleOriginal}
                          </p>
                          <p className="text-slate-500 text-[11px] italic">
                            {item.exampleTranslation}
                          </p>
                        </div>
                      </div>

                      {/* Footer details */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Saved {item.savedAt}</span>
                        </span>
                        
                        {isRevealed && item.grammarNote && (
                          <span 
                            className="text-slate-500 max-w-[70%] line-clamp-1 italic cursor-help text-right"
                            title={item.grammarNote}
                          >
                            {item.grammarNote}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
