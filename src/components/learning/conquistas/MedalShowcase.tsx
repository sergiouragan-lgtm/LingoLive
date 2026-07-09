import React from 'react';
import { Award, Star, Trophy, Target } from 'lucide-react';
import { Achievement } from '../../../types';

interface MedalShowcaseProps {
  achievements: Achievement[];
}

export const MedalShowcase: React.FC<MedalShowcaseProps> = ({ achievements }) => {
  // Filter only unlocked achievements
  const unlocked = achievements.filter(a => a.unlockedAt);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        Vitrine de Medalhas
      </h3>
      {unlocked.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Continue praticando para desbloquear sua primeira medalha!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {unlocked.map((achievement) => (
            <div key={achievement.id} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-yellow-200">
                <Award className="w-10 h-10 text-yellow-600" />
              </div>
              <p className="font-semibold text-slate-900 text-center text-sm">{achievement.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
