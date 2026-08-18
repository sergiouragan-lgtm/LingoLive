import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Brain, 
  Target, 
  CheckCircle, 
  XCircle, 
  Award,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

// --- TYPES ---
type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: DifficultyLevel;
  topic: string;
  explanation: string;
}

interface AssessmentState {
  currentDifficulty: DifficultyLevel;
  askedQuestionIds: Set<string>;
  answers: { questionId: string; isCorrect: boolean; difficulty: DifficultyLevel }[];
  isFinished: boolean;
}

// --- MOCK DATA ---
const MOCK_QUESTIONS: Question[] = [
  // Nível 1 (A1/A2)
  { id: 'q1-1', text: 'Choose the correct form: "She ___ to the store every day."', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1, difficulty: 1, topic: 'Present Simple', explanation: 'Para a 3ª pessoa do singular (she), usamos "goes".' },
  { id: 'q1-2', text: 'Qual é o plural de "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correctAnswer: 2, difficulty: 1, topic: 'Nouns', explanation: '"Children" é o plural irregular de "Child".' },
  { id: 'q1-3', text: 'I have ___ apple and ___ banana.', options: ['a / an', 'an / a', 'the / an', 'a / the'], correctAnswer: 1, difficulty: 1, topic: 'Articles', explanation: '"An" antes de som vocálico (apple) e "a" antes de som consonantal (banana).' },
  
  // Nível 2 (B1)
  { id: 'q2-1', text: 'If I ___ you, I would study more.', options: ['am', 'was', 'were', 'be'], correctAnswer: 2, difficulty: 2, topic: 'Conditionals', explanation: 'No Second Conditional, usamos "were" para todas as pessoas.' },
  { id: 'q2-2', text: 'He has been working here ___ 2010.', options: ['for', 'since', 'in', 'at'], correctAnswer: 1, difficulty: 2, topic: 'Prepositions', explanation: '"Since" é usado para um ponto específico no passado.' },
  { id: 'q2-3', text: 'Choose the correct sentence:', options: ['I enjoy to read.', 'I enjoy reading.', 'I enjoy read.', 'I enjoying read.'], correctAnswer: 1, difficulty: 2, topic: 'Gerunds', explanation: 'O verbo "enjoy" é sempre seguido por um gerúndio (-ing).' },

  // Nível 3 (B2)
  { id: 'q3-1', text: 'By this time next year, I ___ my degree.', options: ['will finish', 'will have finished', 'am finishing', 'have finished'], correctAnswer: 1, difficulty: 3, topic: 'Future Perfect', explanation: 'O Future Perfect "will have finished" indica uma ação que estará concluída num momento futuro.' },
  { id: 'q3-2', text: 'Hardly ___ the house when it started to rain.', options: ['I had left', 'had I left', 'I left', 'left I'], correctAnswer: 1, difficulty: 3, topic: 'Inversion', explanation: 'Após "Hardly" no início da frase, há inversão do sujeito e verbo auxiliar.' },
  { id: 'q3-3', text: 'She accused him ___ the money.', options: ['to steal', 'of steal', 'of stealing', 'for stealing'], correctAnswer: 2, difficulty: 3, topic: 'Prepositions', explanation: '"Accuse someone of doing something".' },

  // Nível 4 (C1)
  { id: 'q4-1', text: 'It is imperative that he ___ the meeting.', options: ['attends', 'attend', 'will attend', 'attending'], correctAnswer: 1, difficulty: 4, topic: 'Subjunctive', explanation: 'Após expressões de necessidade/importância (imperative that), usa-se o modo subjuntivo (forma base do verbo).' },
  { id: 'q4-2', text: 'Not only ___ the exam, but she also got the highest grade.', options: ['did she pass', 'she passed', 'she did pass', 'passed she'], correctAnswer: 0, difficulty: 4, topic: 'Inversion', explanation: 'Inversão é necessária após "Not only" em posição inicial.' },
  { id: 'q4-3', text: 'I would rather you ___ here.', options: ['not smoke', 'didn\'t smoke', 'don\'t smoke', 'haven\'t smoked'], correctAnswer: 1, difficulty: 4, topic: 'Unreal Past', explanation: 'Após "would rather" referindo-se a outra pessoa no presente/futuro, usamos o Past Simple.' },

  // Nível 5 (C2)
  { id: 'q5-1', text: '___ it not been for your help, I would have failed.', options: ['Had', 'If', 'Should', 'Were'], correctAnswer: 0, difficulty: 5, topic: 'Mixed Conditionals / Inversion', explanation: 'Inversão no Third Conditional, equivalente a "If it had not been for...".' },
  { id: 'q5-2', text: 'The politician tried to ___ the blame onto his opponent.', options: ['shift', 'sway', 'divert', 'transfer'], correctAnswer: 0, difficulty: 5, topic: 'Collocations', explanation: 'A colocação correta é "shift the blame".' },
  { id: 'q5-3', text: 'He is widely regarded as a ___ of the industry.', options: ['stalwart', 'renegade', 'sycophant', 'charlatan'], correctAnswer: 0, difficulty: 5, topic: 'Advanced Vocabulary', explanation: '"Stalwart" significa um membro leal e confiável, comum neste contexto.' },
];

const MAX_QUESTIONS = 10;

export const AssessmentEngine: React.FC = () => {
  const [state, setState] = useState<AssessmentState>({
    currentDifficulty: 3,
    askedQuestionIds: new Set(),
    answers: [],
    isFinished: false,
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cheatAlert, setCheatAlert] = useState<string | null>(null);

  // Initialize first question
  useEffect(() => {
    loadNextQuestion(state.currentDifficulty, state.askedQuestionIds);
  }, []);

  // --- ANTI-CHEAT LISTENERS ---
  useEffect(() => {
    if (state.isFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatAlert("O IACE detetou que mudou de aba. Por favor, mantenha o foco no exame.");
      }
    };

    const handleWindowBlur = () => {
      setCheatAlert("O IACE detetou perda de foco na janela do exame. Evite sair da página.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [state.isFinished]);

  const loadNextQuestion = (targetDifficulty: DifficultyLevel, asked: Set<string>) => {
    // Try to find a question of the exact target difficulty
    let candidates = MOCK_QUESTIONS.filter(q => q.difficulty === targetDifficulty && !asked.has(q.id));
    
    // If no exact match, widen the search (closest difficulty)
    if (candidates.length === 0) {
      candidates = MOCK_QUESTIONS.filter(q => !asked.has(q.id));
      if (candidates.length > 0) {
        candidates.sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty));
      }
    }

    if (candidates.length > 0) {
      // Pick random from the best matches
      const bestCandidates = candidates.filter(q => q.difficulty === candidates[0].difficulty);
      const randomQ = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
      setCurrentQuestion(randomQ);
    } else {
      // No more questions available
      setState(prev => ({ ...prev, isFinished: true }));
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentQuestion || selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    setState(prev => {
      const newAnswers = [...prev.answers, { questionId: currentQuestion.id, isCorrect, difficulty: currentQuestion.difficulty }];
      const newAsked = new Set(prev.askedQuestionIds).add(currentQuestion.id);
      
      return {
        ...prev,
        answers: newAnswers,
        askedQuestionIds: newAsked,
      };
    });

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    // Adapt difficulty
    let nextDifficulty = state.currentDifficulty;
    if (isCorrect) {
      nextDifficulty = Math.min(5, nextDifficulty + 1) as DifficultyLevel;
    } else {
      nextDifficulty = Math.max(1, nextDifficulty - 1) as DifficultyLevel;
    }

    setIsTransitioning(true);
    
    setTimeout(() => {
      setState(prev => {
        const isFinished = prev.answers.length >= MAX_QUESTIONS;
        
        if (!isFinished) {
          loadNextQuestion(nextDifficulty, prev.askedQuestionIds);
        }
        
        return {
          ...prev,
          currentDifficulty: nextDifficulty,
          isFinished: isFinished
        };
      });
      
      setSelectedOption(null);
      setShowExplanation(false);
      setIsTransitioning(false);
    }, 500);
  };

  const restartAssessment = () => {
    setState({
      currentDifficulty: 3,
      askedQuestionIds: new Set(),
      answers: [],
      isFinished: false,
    });
    setSelectedOption(null);
    setShowExplanation(false);
    setCheatAlert(null);
    loadNextQuestion(3, new Set());
  };

  const calculateFinalLevel = () => {
    if (state.answers.length === 0) return 'N/A';
    // Simple logic: average difficulty of correct answers, or weighted by recent answers
    const recentAnswers = state.answers.slice(-3); // look at last 3 questions
    const sumDiff = recentAnswers.reduce((acc, ans) => acc + (ans.isCorrect ? ans.difficulty : Math.max(1, ans.difficulty - 1)), 0);
    const avg = Math.round(sumDiff / recentAnswers.length);
    
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1/C2'];
    return levels[Math.min(4, Math.max(0, avg - 1))];
  };

  if (state.isFinished) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Award className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black mb-4">Avaliação Concluída</h2>
            <p className="text-indigo-200 mb-8 max-w-lg mx-auto text-lg">
              O motor IACE analisou o seu desempenho adaptativo e calibrou o seu nível de proficiência.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl inline-block">
              <span className="text-indigo-200 text-sm font-bold uppercase tracking-wider block mb-2">Nível Estimado (CEFR)</span>
              <span className="text-5xl font-black text-white">{calculateFinalLevel()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Evolução de Dificuldade
          </h3>
          <div className="flex items-end h-32 gap-2 w-full justify-between">
            {state.answers.map((ans, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    ans.isCorrect ? 'bg-emerald-400 group-hover:bg-emerald-500' : 'bg-rose-400 group-hover:bg-rose-500'
                  }`}
                  style={{ height: `${(ans.difficulty / 5) * 100}%` }}
                ></div>
                <span className="text-[10px] font-bold text-slate-400 mt-2">Q{idx + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
             <button 
                onClick={restartAssessment}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
             >
                <RefreshCw className="w-4 h-4" />
                Refazer Avaliação
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* HEADER: Engine Status */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center relative">
             <div className="absolute inset-0 bg-indigo-400/20 rounded-2xl animate-ping"></div>
             <Brain className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">IACE Adaptive Engine</h2>
            <p className="text-[11px] text-slate-500 font-medium">A calibrar dificuldade em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dificuldade</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <div 
                  key={level} 
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    level <= state.currentDifficulty ? 'bg-indigo-600' : 'bg-slate-100'
                  }`}
                >
                  {level === state.currentDifficulty && (
                     <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center border-l border-slate-100 pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Progresso</span>
            <span className="text-sm font-black text-slate-700">{state.answers.length + 1} / {MAX_QUESTIONS}</span>
          </div>
        </div>
      </div>

      {/* ANTI-CHEAT ALERT */}
      <AnimatePresence>
        {cheatAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-red-100 text-red-600 flex items-center justify-center rounded-full shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-grow">
              <h4 className="text-red-800 font-bold text-sm">Alerta de Segurança IACE</h4>
              <p className="text-red-600 text-xs">{cheatAlert}</p>
            </div>
            <button 
              onClick={() => setCheatAlert(null)}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200"
            >
              Compreendi
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUESTION AREA */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {currentQuestion && !isTransitioning && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/20"
            >
              <div className="flex items-start justify-between mb-8">
                 <div>
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">
                     <Target className="w-3 h-3 text-indigo-500" />
                     Tópico: {currentQuestion.topic}
                   </span>
                   <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
                     {currentQuestion.text}
                   </h3>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = currentQuestion.correctAnswer === idx;
                  
                  let btnClass = "p-4 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 flex justify-between items-center group ";
                  
                  if (showExplanation) {
                    if (isCorrect) {
                      btnClass += "border-emerald-500 bg-emerald-50 text-emerald-800";
                    } else if (isSelected) {
                      btnClass += "border-rose-500 bg-rose-50 text-rose-800";
                    } else {
                      btnClass += "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                    }
                  } else {
                    if (isSelected) {
                      btnClass += "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100";
                    } else {
                      btnClass += "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50 text-slate-600";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={showExplanation}
                      onClick={() => setSelectedOption(idx)}
                      className={btnClass}
                    >
                      <span className="font-bold text-sm sm:text-base">{opt}</span>
                      {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                    </button>
                  );
                })}
              </div>

              {/* EXPLANATION & NEXT BUTTON */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedOption === currentQuestion.correctAnswer 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-rose-100 text-rose-600'
                        }`}>
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`font-bold mb-1 ${
                            selectedOption === currentQuestion.correctAnswer ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {selectedOption === currentQuestion.correctAnswer 
                              ? 'Correto! A dificuldade vai aumentar.' 
                              : 'Incorreto. Vamos ajustar a dificuldade.'}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto shrink-0 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
                      >
                        Próxima Questão
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
        
        {/* SUBMIT BUTTON (When not showing explanation) */}
        {!showExplanation && currentQuestion && !isTransitioning && (
          <div className="mt-6 flex justify-end">
            <button
              disabled={selectedOption === null}
              onClick={handleAnswerSubmit}
              className={`px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${
                selectedOption !== null
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 translate-y-0'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70 translate-y-2'
              }`}
            >
              Confirmar Resposta
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
