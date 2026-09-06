import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Map, 
  BookMarked, 
  CheckCircle2, 
  Play, 
  Compass, 
  HelpCircle, 
  ChevronRight, 
  Award, 
  Volume2, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ThumbsUp,
  BrainCircuit,
  MessageSquare,
  BookOpen,
  Lock,
  Unlock,
  ShieldAlert
} from "lucide-react";
import { Language, Proficiency, Scenario, SavedWord, FeedbackReport } from "../../types";
import { SCENARIOS } from "../../data";
import { auth } from "../../firebase";

interface LearningPathProps {
  selectedLanguage: Language;
  selectedProficiency: Proficiency;
  savedWords: SavedWord[];
  onStartPractice: () => void;
  setSelectedScenario: (s: Scenario) => void;
  setView: (view: string) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({
  selectedLanguage,
  selectedProficiency,
  savedWords,
  onStartPractice,
  setSelectedScenario,
  setView
}) => {
  // Try to load the latest real feedback report from localStorage
  const [latestFeedback, setLatestFeedback] = useState<FeedbackReport | null>(null);
  const [activeQuest, setActiveQuest] = useState<string | null>(null);
  
  // Regional slang unlocking system states
  const [profile, setProfile] = useState<any>(null);
  const [currentXp, setCurrentXp] = useState<number>(500);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const stored = localStorage.getItem(`lingolive_user_sub_${currentUser.uid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
        } catch (e) {}
      }

      const storedAch = localStorage.getItem(`lingolive_achievements_${currentUser.uid}`);
      let quizzesCount = 0;
      let languagesCount = 0;
      let streakCount = 0;
      if (storedAch) {
        try {
          const parsedAch = JSON.parse(storedAch);
          quizzesCount = parsedAch.quizzesCompleted || 0;
          languagesCount = parsedAch.languagesExplored?.length || 0;
        } catch (e) {}
      }
      
      const wordsCount = savedWords?.length || 0;
      const streakStored = localStorage.getItem("lingolive_streak");
      if (streakStored) {
        try {
          const parsedStreak = JSON.parse(streakStored);
          streakCount = parsedStreak.count || 0;
        } catch (e) {}
      }

      const calculatedXp = 500 + (quizzesCount * 150) + (languagesCount * 250) + (wordsCount * 45) + (streakCount * 120);
      setCurrentXp(calculatedXp);
    }
  }, [savedWords]);

  // Game 1: Sentence Builder State
  const [game1Active, setGame1Active] = useState(false);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [assembledSentence, setAssembledSentence] = useState<string[]>([]);
  const [game1Target, setGame1Target] = useState({ original: "", corrected: "", explanation: "" });
  const [game1Success, setGame1Success] = useState<boolean | null>(null);

  // Game 2: Flashcard State
  const [game2Active, setGame2Active] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [flashcards, setFlashcards] = useState<{ word: string; meaning: string; pronunciation: string }[]>([]);
  const [showFlashcardMeaning, setShowFlashcardMeaning] = useState(false);
  const [flashcardScores, setFlashcardScores] = useState<Record<string, 'known' | 'learning'>>({});

  useEffect(() => {
    // Attempt to load from storage
    const stored = localStorage.getItem("lingolive_latest_feedback");
    if (stored) {
      try {
        setLatestFeedback(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading cached feedback:", e);
      }
    }
  }, []);

  // Set up the Sentence Builder Game using a grammar mistake (real or simulated)
  const initSentenceBuilder = () => {
    let targetOriginal = "";
    let targetCorrected = "";
    let explanation = "";

    // If there are real grammar mistakes in the latest session feedback, use the first one
    if (latestFeedback && latestFeedback.grammarMistakes && latestFeedback.grammarMistakes.length > 0) {
      const mistake = latestFeedback.grammarMistakes[0];
      targetOriginal = mistake.original;
      targetCorrected = mistake.corrected;
      explanation = mistake.explanation;
    } else {
      // Fallback/Simulated mistakes depending on language
      if (selectedLanguage.code === "en") {
        targetOriginal = "I has a big interest in language learning.";
        targetCorrected = "I have a great interest in language learning.";
        explanation = "The verb 'have' must agree with the first-person singular subject 'I'.";
      } else if (selectedLanguage.code === "fr") {
        targetOriginal = "Je suis beaucoup faim ce soir.";
        targetCorrected = "J'ai très faim ce soir.";
        explanation = "In French, we use 'avoir' (to have) instead of 'être' (to be) to express hunger.";
      } else if (selectedLanguage.code === "zh") {
        targetOriginal = "我喜欢非常学习语言";
        targetCorrected = "我非常喜欢学习语言";
        explanation = "Adverbs like '非常' (very much) are usually placed before the verb '喜欢' (to like).";
      } else {
        targetOriginal = "Eu quer aprender mais vocabulário.";
        targetCorrected = "Eu quero aprender mais vocabulário.";
        explanation = "O verbo 'querer' deve concordar com a primeira pessoa do singular 'Eu'.";
      }
    }

    setGame1Target({ original: targetOriginal, corrected: targetCorrected, explanation });
    
    // Scramble the words of the corrected sentence
    const cleanSentence = targetCorrected.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    const words = cleanSentence.split(/\s+/).filter(w => w.length > 0);
    
    // Shuffle words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setScrambledWords(shuffled);
    setAssembledSentence([]);
    setGame1Success(null);
    setGame1Active(true);
  };

  // Set up Flashcards using real saved words or preset high-frequency vocabulary
  const initFlashcards = () => {
    let list: { word: string; meaning: string; pronunciation: string }[] = [];

    if (savedWords && savedWords.length > 0) {
      list = savedWords.map(w => ({
        word: w.word,
        meaning: w.meaning,
        pronunciation: w.pronunciation || ""
      }));
    } else {
      // High-frequency presets based on language
      if (selectedLanguage.code === "en") {
        list = [
          { word: "Aesthetic", meaning: "Relativo à beleza ou gosto artístico", pronunciation: "/es-te-tik/" },
          { word: "Overwhelming", meaning: "Esmagador, muito intenso", pronunciation: "/oh-ver-wel-ming/" },
          { word: "Serendipity", meaning: "Descoberta afortunada ao acaso", pronunciation: "/se-ren-di-pi-tee/" }
        ];
      } else if (selectedLanguage.code === "fr") {
        list = [
          { word: "Éphémère", meaning: "Que dura pouco tempo; efêmero", pronunciation: "/ay-fay-mair/" },
          { word: "Bienveillance", meaning: "Benevolência, gentileza", pronunciation: "/byan-vay-lahns/" },
          { word: "Dépaysement", meaning: "A sensação de desorientação positiva ao estar em outro país", pronunciation: "/day-pay-eez-mah/" }
        ];
      } else {
        list = [
          { word: "Saudade", meaning: "Sentimento nostálgico de ausência", pronunciation: "/saw-dah-dee/" },
          { word: "Desafiar", meaning: "Incentivar alguém a superar um limite", pronunciation: "/deh-zah-fee-ahr/" },
          { word: "Partilhar", meaning: "Dividir algo com os outros; compartilhar", pronunciation: "/pahr-teel-yahr/" }
        ];
      }
    }

    setFlashcards(list);
    setCurrentFlashcardIndex(0);
    setShowFlashcardMeaning(false);
    setFlashcardScores({});
    setGame2Active(true);
  };

  const handleWordClick = (word: string, index: number) => {
    setAssembledSentence(prev => [...prev, word]);
    setScrambledWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (word: string, index: number) => {
    setScrambledWords(prev => [...prev, word]);
    setAssembledSentence(prev => prev.filter((_, i) => i !== index));
  };

  const verifySentence = () => {
    const finalStr = assembledSentence.join(" ").trim().toLowerCase();
    const targetStr = game1Target.corrected.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim().toLowerCase();
    
    if (finalStr === targetStr) {
      setGame1Success(true);
    } else {
      setGame1Success(false);
    }
  };

  const handleFlashcardRating = (rating: 'known' | 'learning') => {
    const card = flashcards[currentFlashcardIndex];
    setFlashcardScores(prev => ({ ...prev, [card.word]: rating }));
    
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(prev => prev + 1);
      setShowFlashcardMeaning(false);
    } else {
      // All flashcards finished
      setShowFlashcardMeaning(true);
    }
  };

  // Dynamically map scenarios and select the best one based on vocabulary or past errors
  const getDynamicScenarioRecommendation = (): { scenario: Scenario; reason: string } => {
    // If we have saved vocabulary matching certain contexts
    const hasCafeWords = savedWords.some(w => {
      const txt = (w.word + " " + w.meaning).toLowerCase();
      return txt.includes("café") || txt.includes("coffee") || txt.includes("pão") || txt.includes("bebida") || txt.includes("order") || txt.includes("cup");
    });
    const hasHotelWords = savedWords.some(w => {
      const txt = (w.word + " " + w.meaning).toLowerCase();
      return txt.includes("hotel") || txt.includes("quarto") || txt.includes("room") || txt.includes("check") || txt.includes("reserva");
    });
    const hasJobWords = savedWords.some(w => {
      const txt = (w.word + " " + w.meaning).toLowerCase();
      return txt.includes("trabalho") || txt.includes("job") || txt.includes("entrevista") || txt.includes("interview") || txt.includes("cargo");
    });

    if (hasCafeWords) {
      const sc = SCENARIOS.find(s => s.id === "cafe_order") || SCENARIOS[0];
      return { scenario: sc, reason: "Recomendado baseado no seu vocabulário salvo relacionado a refeições e cafés!" };
    }
    if (hasHotelWords) {
      const sc = SCENARIOS.find(s => s.id === "hotel_checkin") || SCENARIOS[0];
      return { scenario: sc, reason: "Recomendado baseado no seu vocabulário de viagens e reservas de hotel!" };
    }
    if (hasJobWords) {
      const sc = SCENARIOS.find(s => s.id === "job_interview") || SCENARIOS[0];
      return { scenario: sc, reason: "Recomendado para praticar suas habilidades de conversação profissional!" };
    }

    // Default by proficiency
    if (selectedProficiency === "Beginner") {
      const sc = SCENARIOS.find(s => s.id === "casual_chat") || SCENARIOS[0];
      return { scenario: sc, reason: "Cenário ideal para iniciantes desenvolverem confiança básica de conversação." };
    } else if (selectedProficiency === "Intermediate") {
      const sc = SCENARIOS.find(s => s.id === "asking_directions") || SCENARIOS[4] || SCENARIOS[0];
      return { scenario: sc, reason: "Excelente para praticar conversação espacial e dar instruções de rotas!" };
    } else {
      const sc = SCENARIOS.find(s => s.id === "job_interview") || SCENARIOS[3] || SCENARIOS[0];
      return { scenario: sc, reason: "Cenário avançado para testar refinamento gramatical e vocabulário corporativo." };
    }
  };

  const recommendation = getDynamicScenarioRecommendation();

  const handleLaunchScenario = () => {
    setSelectedScenario(recommendation.scenario);
    onStartPractice();
  };

  // Count known flashcards
  const knownCount = Object.values(flashcardScores).filter(v => v === 'known').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in" id="learning-path-container">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-8 h-8 text-indigo-600" />
            Trilha de Aprendizado Adaptativa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Recomendações e desafios gerados dinamicamente com base nas suas sessões e termos salvos.
          </p>
        </div>
        
        {/* Statistics Pill */}
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100/60 px-4 py-2 rounded-2xl">
          <BrainCircuit className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-indigo-500">Motor de Sugestões</div>
            <div className="text-xs font-bold text-indigo-900">
              {latestFeedback ? "Personalizado com IA" : "Modo Inteligente Ativo"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Adaptive Path Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Dynamic Modules */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section Heading */}
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Suas Próximas Etapas Recomendadas</h2>
          </div>

          {/* Module 1: Grammar Core Recovery */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-violet-500" />
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Eixo Gramatical
                  </span>
                  {latestFeedback && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      Baseado na última sessão
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">Correção e Sintaxe Ativa</h3>
                
                <p className="text-sm text-slate-500 max-w-xl">
                  {latestFeedback && latestFeedback.grammarMistakes && latestFeedback.grammarMistakes.length > 0 ? (
                    <>
                      Corrija o erro gramatical detectado na última conversa para consolidar sua fluência:
                      <span className="block mt-2 italic text-slate-400 font-mono text-xs">
                        &quot;{latestFeedback.grammarMistakes[0].original}&quot;
                      </span>
                    </>
                  ) : (
                    "Domine construções sintáticas avançadas, regras de concordância e o uso de advérbios com este drill prático interativo."
                  )}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                <span>Tempo estimado: 3 minutos</span>
              </div>
              <button 
                onClick={initSentenceBuilder}
                className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-violet-600/10 cursor-pointer"
              >
                Iniciar Desafio de Frase <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Module 2: Vocabulary Deep Dive */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Eixo Lexical
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                    {savedWords.length} termos salvos
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">Treinamento de Flashcards Inteligente</h3>
                
                <p className="text-sm text-slate-500 max-w-xl">
                  {savedWords.length > 0 ? (
                    "Revise suas palavras salvas recentemente com flashcards adaptativos. Nosso sistema prioriza termos que você ainda está consolidando."
                  ) : (
                    "Ainda não salvou vocabulário? Use nossa lista de termos de alto impacto gerados especificamente para seu nível atual."
                  )}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Tempo estimado: 2 minutos</span>
              </div>
              <button 
                onClick={initFlashcards}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-amber-500/10 cursor-pointer"
              >
                Estudar Vocabulário <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Module 3: Scenario Quest Match */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Quest Recomendada
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">{recommendation.scenario.title}</h3>
                
                <p className="text-sm text-slate-500 max-w-xl">
                  {recommendation.scenario.description}
                </p>

                <div className="flex items-start gap-1.5 bg-slate-50 border border-slate-100/60 p-2.5 rounded-xl text-[11px] text-slate-500 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{recommendation.reason}</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Prática Livre por Voz</span>
              </div>
              <button 
                onClick={handleLaunchScenario}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-emerald-600/10 cursor-pointer animate-pulse"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar Cenário de Fala
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Interactive Widgets Frame */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Sandbox de Atividades</h2>
          </div>

          {/* GAME 1 MODAL WINDOW */}
          {game1Active ? (
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-violet-400" />
                  <span className="font-bold text-sm">Sentence Builder</span>
                </div>
                <button 
                  onClick={() => setGame1Active(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] text-slate-400 font-medium">CONCEITO / ERRO DETECTADO:</div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs italic">
                  &quot;{game1Target.original}&quot;
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-3">CONSTRUA A FRASE CORRETA:</div>
              </div>

              {/* Display generated words container */}
              <div className="min-h-16 p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap gap-2 items-center justify-center">
                {assembledSentence.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Clique nas palavras abaixo na ordem correta</span>
                ) : (
                  assembledSentence.map((word, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleRemoveWord(word, idx)}
                      className="bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/30 transition cursor-pointer"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>

              {/* Scrambled source words selection */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {scrambledWords.map((word, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleWordClick(word, idx)}
                    className="bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-slate-700/80 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Response Feedbacks */}
              {game1Success === true && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Espetacular! Frase perfeita.
                  </div>
                  <p className="text-[11px] text-slate-300">{game1Target.explanation}</p>
                </div>
              )}

              {game1Success === false && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Quase lá! Tente reorganizar a frase.
                  </div>
                  <button 
                    onClick={initSentenceBuilder}
                    className="text-[10px] text-indigo-400 hover:underline mt-2 block font-medium"
                  >
                    Resetar e tentar de novo
                  </button>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex gap-2">
                <button 
                  onClick={initSentenceBuilder}
                  className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar
                </button>
                
                <button 
                  onClick={verifySentence}
                  disabled={assembledSentence.length === 0}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Verificar Resposta
                </button>
              </div>

            </div>
          ) : game2Active ? (
            /* GAME 2 MODAL WINDOW */
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm">Vocab Trainer ({currentFlashcardIndex + 1}/{flashcards.length})</span>
                </div>
                <button 
                  onClick={() => setGame2Active(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              {flashcards.length > 0 && currentFlashcardIndex < flashcards.length ? (
                <div className="space-y-4">
                  {/* Flip Card Stage */}
                  <div 
                    onClick={() => setShowFlashcardMeaning(!showFlashcardMeaning)}
                    className="min-h-40 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-700 transition relative group overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 text-[9px] text-slate-500 font-mono tracking-wider">
                      CLIQUE PARA REVELAR
                    </div>

                    {!showFlashcardMeaning ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-indigo-400 tracking-tight">
                          {flashcards[currentFlashcardIndex].word}
                        </div>
                        {flashcards[currentFlashcardIndex].pronunciation && (
                          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{flashcards[currentFlashcardIndex].pronunciation}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-xs">
                        <div className="text-2xl font-bold text-emerald-400">
                          {flashcards[currentFlashcardIndex].word}
                        </div>
                        <p className="text-sm text-slate-200">
                          {flashcards[currentFlashcardIndex].meaning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rating Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleFlashcardRating('learning')}
                      className="flex-1 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      Ainda Aprendendo
                    </button>
                    <button 
                      onClick={() => handleFlashcardRating('known')}
                      className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition cursor-pointer"
                    >
                      Já Sei!
                    </button>
                  </div>
                </div>
              ) : (
                /* FLASHCARD SCORE REPORT */
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-1">
                    <Award className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                    <h4 className="font-bold text-slate-200">Revisão Concluída!</h4>
                    <p className="text-xs text-slate-400">Excelente progresso de memorização.</p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Termos Dominados:</span>
                      <span className="font-bold text-emerald-400">{knownCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Termos em Aprendizado:</span>
                      <span className="font-bold text-amber-400">{flashcards.length - knownCount}</span>
                    </div>
                  </div>

                  <button 
                    onClick={initFlashcards}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Estudar Novamente
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT IDLE WIDGET (CHALLENGES DIRECTORY) */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <BrainCircuit className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span className="font-bold text-sm">Escolha uma Atividade Ativa</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clique nos botões dos módulos ao lado para carregar e jogar os desafios de aprendizagem baseados no seu vocabulário e histórico de conversação.
              </p>
              
              <div className="space-y-2.5 pt-2 border-t border-slate-50">
                <button 
                  onClick={initSentenceBuilder}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-100 hover:bg-violet-50/20 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <div className="text-xs font-semibold text-slate-700 group-hover:text-violet-800">Desafio Sentence Builder</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button 
                  onClick={initFlashcards}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-100 hover:bg-amber-50/20 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="text-xs font-semibold text-slate-700 group-hover:text-amber-800">Vocab Flashcard Trainer</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          )}

          {/* Progressive Slang & Regionalism Unlocking System */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Compass className="w-5 h-5 text-indigo-600 animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-sm block">Progressão de Sotaques & Gírias</span>
                <span className="text-[10px] text-slate-400 font-medium">Liberação por Idade e XP</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Expanda sua naturalidade integrando expressões e sotaques regionais conforme evolui seus pontos.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  level: 1,
                  name: "Standard",
                  title: "Nível 1: Idioma Padrão",
                  desc: "Linguagem formal e gramática acadêmica estruturada.",
                  xpRequired: 0,
                  badge: "🌐"
                },
                {
                  level: 2,
                  name: "Common",
                  title: "Nível 2: Expressões Comuns",
                  desc: "Termos populares polidos cotidianos (ex: 'Cool', 'Awesome').",
                  xpRequired: 100,
                  badge: "💬",
                  minAge: 9
                },
                {
                  level: 3,
                  name: "Daily",
                  title: "Nível 3: Diálogos de Rua",
                  desc: "Contrações idiomáticas e fala informal (ex: 'What's up?', 'My bad').",
                  xpRequired: 250,
                  badge: "🔥",
                  minAge: 13
                },
                {
                  level: 4,
                  name: "Regional",
                  title: "Nível 4: Sotaques Locais",
                  desc: "Variações regionais do país de destino (ex: US, UK, BR, PT).",
                  xpRequired: 500,
                  badge: "🗺️",
                  minAge: 13
                },
                {
                  level: 5,
                  name: "Modern slang",
                  title: "Nível 5: Gírias Modernas",
                  desc: "Gírias coloquiais contemporâneas das redes e rua (ex: 'Hit me up').",
                  xpRequired: 800,
                  badge: "⚡",
                  minAge: 17
                }
              ].map((item) => {
                const isAgeLocked = profile?.age !== undefined && item.minAge !== undefined && Number(profile.age) < item.minAge;
                const isXpUnlocked = currentXp >= item.xpRequired;
                const isUnlocked = isXpUnlocked && !isAgeLocked;

                return (
                  <div 
                    key={item.level}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? "bg-emerald-50/20 border-emerald-100/80 text-slate-700"
                        : isAgeLocked
                          ? "bg-rose-50/10 border-rose-100/40 text-slate-400 opacity-75"
                          : "bg-slate-50/50 border-slate-100 text-slate-400"
                    }`}
                  >
                    <div className="text-xl shrink-0 mt-0.5">{item.badge}</div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-xs ${isUnlocked ? "text-slate-800" : "text-slate-500"}`}>
                          {item.title}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold uppercase">
                            Ativo
                          </span>
                        ) : isAgeLocked ? (
                          <span className="text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                            <ShieldAlert size={8} /> Restrito
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                      
                      {!isUnlocked && !isAgeLocked && (
                        <div className="text-[9px] text-indigo-500 font-bold font-mono mt-1 flex items-center gap-1">
                          <Lock size={8} /> Requer {item.xpRequired} XP (Falta {item.xpRequired - currentXp} XP)
                        </div>
                      )}

                      {isAgeLocked && (
                        <div className="text-[9px] text-rose-500 font-semibold mt-1">
                          🔒 Exige idade mínima de {item.minAge} anos (Usuário tem {profile.age} anos)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gamified Milestone Cards */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Selo de Competência LingoLive
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                  <span>Vocabulário Memorizado</span>
                  <span>{savedWords.length} / 25 palavras</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (savedWords.length / 25) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                  <span>Domínio do Idioma</span>
                  <span>{selectedProficiency}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: selectedProficiency === 'Beginner' ? '33%' : selectedProficiency === 'Intermediate' ? '66%' : '100%' }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl">
              💡 Dica do Instrutor: Pratique falar por pelo menos 10 minutos seguidos para permitir que a IA analise novos eixos de sintaxe!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
