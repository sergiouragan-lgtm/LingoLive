import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award } from 'lucide-react';
import { ConfettiRain } from '../core/ConfettiRain';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface AchievementUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievementTitle: string;
  achievementDescription: string;
}

export const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({
  isOpen,
  onClose,
  achievementTitle,
  achievementDescription
}) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId && isOpen) {
      trackEvent('achievement_unlocked_modal_opened', {
        achievementTitle: achievementTitle,
        modalType: 'achievement_unlock'
      });
    }
  }, [userId, isOpen, achievementTitle, trackEvent]);

  const handleClose = () => {
    if (userId) {
      trackEvent('achievement_unlocked_modal_closed', {
        achievementTitle: achievementTitle,
        modalType: 'achievement_unlock'
      });
    }
    onClose();
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ConfettiRain active={isOpen} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                  <Award size={40} className="text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievement Unlocked!</h2>
                <h3 className="text-xl font-semibold text-indigo-600 mb-4">{achievementTitle}</h3>
                <p className="text-gray-600 mb-8">{achievementDescription}</p>
                <button
                  onClick={handleClose}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
