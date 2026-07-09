import React from 'react';
import { LANGUAGES } from '../../../data';
import { Language } from '../../../types';

interface LanguagesViewProps {
  selectedLanguage: Language;
  setSelectedLanguage: (l: Language) => void;
}

export const LanguagesView: React.FC<LanguagesViewProps> = ({ selectedLanguage, setSelectedLanguage }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">1. SELECIONAR IDIOMA</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelectedLanguage(lang)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              selectedLanguage.code === lang.code
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-200 bg-white'
            }`}
          >
            <span className="text-3xl">{lang.flag}</span>
            <span className="font-semibold text-slate-800">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
