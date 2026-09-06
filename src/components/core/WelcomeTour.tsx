import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  HelpCircle, 
  Mic, 
  Bookmark, 
  Gamepad2, 
  Compass, 
  Award,
  BookOpen,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  setView: (view: string) => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  targetId?: string;
  viewTarget?: string;
  badge: string;
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({
  isOpen,
  onClose,
  userId,
  setView
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      title: "Bem-vindo ao LingoLive AI! 🎓",
      description: "Olá! Preparamos este tour interativo passo a passo para apresentar as principais ferramentas de aprendizado. Vamos acelerar sua fluência juntos!",
      icon: Sparkles,
      iconColor: "text-indigo-500",
      badge: "Boas-vindas",
      viewTarget: "dashboard"
    },
    {
      title: "Prática Real por Voz com IA 🎙️",
      description: "Converse por voz com tutores inteligentes em cenários da vida real (como pedir um café ou fazer uma entrevista de emprego). Receba correções de gramática e pronúncia instantâneas!",
      icon: Mic,
      iconColor: "text-cyan-500",
      targetId: "tour-practice-btn",
      viewTarget: "dashboard",
      badge: "Conversação Ativa"
    },
    {
      title: "Baralho de Vocabulário Salvo 🔖",
      description: "Salve termos e expressões durante suas práticas por voz para criar seu próprio deck de revisão. Estude a tradução, pronúncia e significado quando quiser.",
      icon: Bookmark,
      iconColor: "text-amber-500",
      targetId: "tour-vocab-tab",
      viewTarget: "vocab",
      badge: "Consolidação de Termos"
    },
    {
      title: "Quiz Escolar e Gamificação 🏆",
      description: "Teste seus conhecimentos gramaticais e de vocabulário através de quizzes interativos com ranking de classificação, sequências diárias e conquistas exclusivas!",
      icon: Gamepad2,
      iconColor: "text-emerald-500",
      targetId: "tour-quiz-tab",
      viewTarget: "quiz",
      badge: "Desafios Rápidos"
    },
    {
      title: "Trilha de Aprendizado Adaptativa 🧭",
      description: "Acesse sua nova trilha de aprendizado! Com base em seus erros gramaticais e vocabulário salvo, o sistema gera jogos dinâmicos como o 'Sentence Builder'.",
      icon: Compass,
      iconColor: "text-violet-500",
      targetId: "tour-learning-path-tab",
      viewTarget: "learning-path",
      badge: "Estratégia Inteligente"
    }
  ];

  // Effect to handle view transitions and calculate target element bounds
  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    
    // Switch view if the step recommends a target view
    if (step.viewTarget) {
      setView(step.viewTarget);
    }

    // Give some time for DOM rendering before calculating bounds
    const timer = setTimeout(() => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTargetRect(el.getBoundingClientRect());
          el.classList.add("ring-4", "ring-indigo-500", "ring-offset-2", "transition-all", "duration-500");
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      // Cleanup rings
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.classList.remove("ring-4", "ring-indigo-500", "ring-offset-2");
        }
      }
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (userId) {
      localStorage.setItem(`lingolive_tour_completed_${userId}`, "true");
    } else {
      localStorage.setItem("lingolive_tour_completed_anonymous", "true");
    }
    onClose();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Dark backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleComplete}
      />

      {/* Highlighter effect on element */}
      {targetRect && (
        <div 
          className="absolute border-2 border-indigo-500 rounded-2xl bg-indigo-500/10 pointer-events-none transition-all duration-300 animate-pulse hidden md:block"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Animated Card Dialog */}
      <div 
        className="relative bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-6 z-10 overflow-hidden"
        id="welcome-tour-modal"
      >
        {/* Dynamic top gradient bar based on step */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

        {/* Header bar */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {step.badge}
          </span>
          <button 
            onClick={handleComplete}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition cursor-pointer"
            title="Pular Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Illustration */}
        <div className="space-y-4 text-center sm:text-left flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className={`w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 ${step.iconColor}`}>
            <StepIcon className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {step.description}
            </p>
          </div>
        </div>

        {/* Interactive Beacon Pointer for Mobile */}
        {step.targetId && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100/60 rounded-2xl text-xs text-indigo-700 font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span>Observe a seção destacada na tela de fundo!</span>
          </div>
        )}

        {/* Progress dots & Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
          
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? "w-6 bg-indigo-600" 
                    : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Buttons controls */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Entendido! <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Próximo <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
