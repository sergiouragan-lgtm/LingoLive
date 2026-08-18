import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, X, Sparkles, RefreshCw, GraduationCap, Briefcase, Smile, Heart } from "lucide-react";
import { EDUCATIONAL_CURIOSITIES, CuriosityTip } from "../../data";
import { Language } from "../../types";
import { useAppTheme } from "../../context/ThemeContext";

interface DailyTipProps {
  selectedLanguage: Language;
}

const getLocalDayOfYear = (date: Date): number => {
  const startOfYear = new Date(
    date.getFullYear(),
    0,
    1,
    12,
    0,
    0,
    0
  );

  const currentDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0
  );

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return (
    Math.floor(
      (currentDay.getTime() - startOfYear.getTime()) /
      millisecondsPerDay
    ) + 1
  );
};

export const DailyTip: React.FC<DailyTipProps> = ({ selectedLanguage }) => {
  const { theme } = useAppTheme();
  
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const languageCode = selectedLanguage?.code?.toLowerCase() || "en";
  const list = EDUCATIONAL_CURIOSITIES[languageCode] || EDUCATIONAL_CURIOSITIES.en || [];
  
  // Calculate a stable index for the day
  const dayOfYear = getLocalDayOfYear(new Date());
  const defaultIndex = list.length > 0 ? dayOfYear % list.length : 0;
  
  const [currentIndex, setCurrentIndex] = useState<number>(defaultIndex);

  // Sync index when language changes
  useEffect(() => {
    const currentList = EDUCATIONAL_CURIOSITIES[languageCode] || EDUCATIONAL_CURIOSITIES.en || [];
    if (currentList.length > 0) {
      setCurrentIndex(getLocalDayOfYear(new Date()) % currentList.length);
    }
  }, [languageCode]);

  if (list.length === 0) return null;

  const tip = list[currentIndex];
  if (!tip) return null;
  const isKid = theme === "kiditorial";

  // Select titles and texts based on theme
  const displayTitle = isKid && tip.kidTitle ? tip.kidTitle : tip.title;
  const displayText = isKid && tip.kidText ? tip.kidText : tip.text;

  const handleNextTip = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="w-full overflow-hidden"
          id="daily-tip-alert-wrapper"
        >
          {isKid ? (
            /* Kiditorial Playful Theme */
            <div 
              className="relative mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-100 via-pink-100 to-emerald-100 dark:from-slate-900 dark:via-pink-950/20 dark:to-emerald-950/20 border-4 border-amber-300 dark:border-amber-900/50 shadow-md flex flex-col md:flex-row items-center md:items-start gap-4"
              id="daily-tip-kiditorial"
            >
              {/* Decorative background balloons or confetti shapes */}
              <div className="absolute right-10 top-2 text-3xl opacity-20 animate-bounce pointer-events-none select-none">🎈</div>
              <div className="absolute left-1/3 bottom-1 text-2xl opacity-10 pointer-events-none select-none">✨</div>
              
              {/* Bouncy playful icon */}
              <motion.div 
                whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                className="shrink-0 p-4 rounded-2xl bg-amber-400 text-white shadow-lg flex items-center justify-center cursor-pointer"
                onClick={handleNextTip}
              >
                <Smile size={28} className="animate-pulse" />
              </motion.div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles size={10} /> SUPER DICA KIDS!
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Aventura de {selectedLanguage.name} {selectedLanguage.flag}
                  </span>
                </div>

                <h4 className="text-xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
                  {displayTitle}
                </h4>

                <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                  {displayText}
                </p>

                <div className="pt-2 flex justify-center md:justify-start">
                  <button
                    onClick={handleNextTip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 text-xs font-black rounded-2xl transition-all cursor-pointer border-2 border-amber-300 shadow-sm"
                  >
                    <RefreshCw size={12} className="text-amber-500" />
                    Quero ver outro segredo!
                  </button>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-amber-900/60 hover:text-amber-950 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                aria-label="Dispensar dica"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            /* Corporate Elegant Theme */
            <div 
              className="relative mb-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start gap-4"
              id="daily-tip-corporate"
            >
              {/* Professional icon container */}
              <div className="shrink-0">
                <div 
                  className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center cursor-pointer transition hover:bg-indigo-100 dark:hover:bg-indigo-950/70"
                  onClick={handleNextTip}
                  title="Próxima curiosidade"
                >
                  <GraduationCap size={24} />
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Briefcase size={10} /> Daily Insights
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedLanguage.name} Insights
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {displayTitle}
                </h4>

                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-4xl">
                  {displayText}
                </p>

                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={handleNextTip}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all cursor-pointer"
                  >
                    <RefreshCw size={11} className="mr-1 inline animate-spin-slow" />
                    Próximo Insight
                  </button>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Dispensar dica"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
