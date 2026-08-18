import React from 'react';
import { motion } from 'motion/react';
import { Award, Lock, Trophy, Star } from 'lucide-react';
import { Achievement } from './types';

const iconMap: Record<string, React.ElementType> = {
  Award,
  Trophy,
  Star,
};

interface AchievementGalleryProps {
  achievements: Achievement[];
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ achievements }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {achievements.map((achievement) => {
        const Icon = iconMap[achievement.icon] || Award;
        const isUnlocked = !!achievement.unlockedAt;

        return (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border ${isUnlocked ? 'bg-white border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
          >
            <div className={`flex flex-col items-center ${isUnlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
              {isUnlocked ? <Icon size={48} /> : <Lock size={48} />}
              <h3 className="font-semibold mt-2 text-center">{achievement.title}</h3>
              <p className="text-xs text-center mt-1">{achievement.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
