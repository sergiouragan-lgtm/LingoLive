import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Sparkles, Search, Menu, Globe, ChevronDown } from 'lucide-react';
import { Localization } from '../../types';
import { COUNTRY_DETAILS } from '../../data/localizationData';
import { useLocalization } from '../../context/LocalizationContext';

interface TopbarProps {
  setView: (view: string) => void;
  user: any;
  toggleSidebar: () => void;
  GlobalSearchComponent: React.ReactNode;
  localization: Localization;
  setLocalization: (loc: Localization) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setView, user, toggleSidebar, GlobalSearchComponent, localization, setLocalization }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLocalization();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCountry = COUNTRY_DETAILS[localization.country] || COUNTRY_DETAILS.US;

  const selectCountry = (code: string) => {
    const detail = COUNTRY_DETAILS[code];
    if (detail) {
      setLocalization({
        country: detail.code,
        language: detail.code === 'US' || detail.code === 'ZA' ? 'en' : 'pt',
        currency: detail.code === 'BR' ? 'BRL' : detail.code === 'PT' ? 'EUR' : detail.code === 'AO' ? 'AOA' : detail.code === 'MZ' ? 'MZN' : detail.code === 'ZA' ? 'ZAR' : 'USD'
      });
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="md:hidden p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          </div>
          <span className="font-bold text-lg text-slate-900 font-heading">LingoLive AI</span>
        </div>
      </div>
      
      <div className="flex-1 px-6">
        {GlobalSearchComponent}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Country & Flag Selector Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold cursor-pointer shadow-xs"
          >
            <span className="text-lg leading-none" role="img" aria-label={activeCountry.name}>
              {activeCountry.flag}
            </span>
            <span className="hidden sm:inline-block">{activeCountry.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-1">
                {t('changeActiveCountry', 'Alterar País Ativo')}
              </div>
              {Object.values(COUNTRY_DETAILS).map((c) => {
                const isSelected = c.code === activeCountry.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => selectCountry(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 text-indigo-900 font-bold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {c.symbol} ({c.code})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setView('live-chat')} className="flex items-center gap-2 text-primary font-medium text-sm hover:bg-indigo-50 px-3 py-1.5 rounded-full transition font-heading">
          <Sparkles className="w-4 h-4" />
          {t('iaAssistant', 'IA Assistente')}
        </button>
        <button className="text-slate-500 hover:text-primary transition">
          <Bell className="w-5 h-5" />
        </button>
        <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
