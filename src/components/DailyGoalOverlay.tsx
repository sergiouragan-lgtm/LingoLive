import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Award } from 'lucide-react';

interface DailyGoalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgress: number;
  goal: number;
}

export const DailyGoalOverlay: React.FC<DailyGoalOverlayProps> = ({ 
  isOpen, 
  onClose, 
  currentProgress, 
  goal 
}) => {
  const percentage = Math.min(100, Math.round((currentProgress / goal) * 100));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="text-indigo-500" /> Daily Goal
              </h2>

              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
                  <span className="text-sm text-gray-500">of goal</span>
                </div>
              </div>

              <p className="text-lg font-medium text-gray-700 mb-2">
                {currentProgress} / {goal} points
              </p>
              <p className="text-gray-500 mb-8">
                {percentage >= 100 
                  ? "Incredible! You've crushed your daily goal! 🌟" 
                  : percentage >= 75 
                  ? "Almost there! Keep going! 🚀" 
                  : "Keep practicing! You're making progress! 💪"}
              </p>

              <button
                onClick={onClose}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
              >
                Continue Learning
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
