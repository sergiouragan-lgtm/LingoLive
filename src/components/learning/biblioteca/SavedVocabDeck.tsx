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
  PlusCircle
} from "lucide-react";
import { COMMON_PHRASES } from "./commonPhrases";

interface SavedVocabDeckProps {
  savedWords: SavedWord[];
  onDeleteWord: (id: string) => void;
  onBack: () => void;
  languageName: string;
  languageCode: string;
  onAddWords?: (words: SavedWord[]) => void;
}

export default function SavedVocabDeck({
  savedWords,
  onDeleteWord,
  onBack,
  languageName,
  languageCode,
  onAddWords
}: SavedVocabDeckProps) {
  const [revealAll, setRevealAll] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [importSectionOpen, setImportSectionOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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
        savedAt: new Date().toISOString().split("T")[0]
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" />
              <span>Saved Vocabulary Deck</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and practice {savedWords.length} terms saved in {languageName} sessions
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
                <Sparkles className="w-3 h-3 text-indigo-600" /> Curso Prático
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
            >
              <Download className="w-3.5 h-3.5" />
              <span>{importSectionOpen ? "Fechar Visualização" : "Explorar Expressões"}</span>
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
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 text-sm leading-tight">
                          {phrase.word}
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

      {savedWords.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedWords.map((item) => {
            const isRevealed = revealAll || revealedIds[item.id];

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Visual decoration */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

                <div className="space-y-4">
                  {/* Top line with word and speaker icon */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                        {item.word}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        Phonetic: <span className="text-slate-600">{item.pronunciation}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 z-10">
                      {/* Audio listen helper */}
                      <button
                        onClick={() => speakLocal(item.word)}
                        className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all cursor-pointer"
                        title="Listen Native Pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

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
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 min-h-[50px] flex flex-col justify-center relative">
                    {isRevealed ? (
                      <div className="space-y-1.5 animate-in fade-in duration-300">
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
                  <div className="space-y-1 border-t border-slate-50 pt-3">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">In-Context Usage</span>
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
                      className="text-slate-500 max-w-[70%] line-clamp-1 italic cursor-help"
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
}
