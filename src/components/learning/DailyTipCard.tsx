import React from 'react';
import { Lightbulb } from 'lucide-react';
import { TIPS } from '../../tips';
import { Language } from '../../types';

interface DailyTipCardProps {
  selectedLanguage: Language;
}

export const DailyTipCard: React.FC<DailyTipCardProps> = ({ selectedLanguage }) => {
  const languageTips = TIPS[selectedLanguage.code] || [];
  
  // Pick a tip based on the day of the month
  const tipIndex = new Date().getDate() % languageTips.length;
  const tip = languageTips[tipIndex];

  return (
    <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-100 flex gap-4">
      <div className="bg-amber-100 p-3 rounded-xl h-fit">
        <Lightbulb className="text-amber-600" size={24} />
      </div>
      <div>
        <h2 className="font-bold text-lg mb-1 text-amber-900">Dica do Dia</h2>
        <p className="text-amber-800 text-sm">{tip}</p>
      </div>
    </div>
  );
};
