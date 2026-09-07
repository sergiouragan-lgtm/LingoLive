import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Sparkles, Menu, ChevronDown, Flame, Settings } from 'lucide-react';
import { Localization, Language, StreakData } from '../../types';
import { COUNTRY_DETAILS } from '../../data/localizationData';
import { useLocalization } from '../../context/LocalizationContext';
import { LANGUAGES } from '../../data';

interface TopbarProps {
  setView: (view: string) => void;
  user: any;
  toggleSidebar: () => void;
  GlobalSearchComponent: React.ReactNode;
  localization: Localization;
  setLocalization: (loc: Localization) => void;
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  streakData?: StreakData;
  onProtectStreakWithPoints?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  setView, 
  user, 
  toggleSidebar, 
  GlobalSearchComponent, 
  localization, 
  setLocalization,
  selectedLanguage,
  setSelectedLanguage,
  streakData,
  onProtectStreakWithPoints
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { ot } = useLocalization();

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getTodayString();
  const isStreakAtRisk = streakData && streakData.count > 0 && streakData.lastDate !== today;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setNotificationsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
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
          aria-label="Abrir navegação"
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
        {/* Practice Language Selector Dropdown */}
        <div className="relative shrink-0" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/80 text-sm font-semibold cursor-pointer shadow-xs"
            id="topbar-language-selector-btn"
          >
            <span className="text-lg leading-none" role="img" aria-label={selectedLanguage.name}>
              {selectedLanguage.flag}
            </span>
            <span className="hidden sm:inline-block text-slate-800">
              Praticando: <span className="text-indigo-600 font-bold">{selectedLanguage.name}</span>
            </span>
            <span className="sm:hidden text-indigo-600 font-bold">{selectedLanguage.code.toUpperCase()}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200" id="topbar-language-selector-dropdown">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-1">
                {ot('changePracticeLanguage', 'Idioma de Estudo')}
              </div>
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLanguage.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 text-indigo-900 font-bold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <span>{lang.name}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
                {ot('changeActiveCountry', 'Alterar País Ativo')}
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

        {streakData && streakData.count > 0 && (
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-xs ${
              isStreakAtRisk
                ? 'bg-amber-500/15 text-amber-700 border border-amber-500/40 animate-pulse hover:bg-amber-500/25'
                : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
            }`}
            title={isStreakAtRisk ? `⚠️ Sequência de ${streakData.count} dias em risco! Clique para congelar ou praticar.` : `Sequência Diária: ${streakData.count} dias`}
            id="topbar-streak-badge"
          >
            <Flame className={`w-4 h-4 ${isStreakAtRisk ? 'text-amber-600 animate-bounce' : 'text-orange-500 fill-orange-500'}`} />
            <span>{streakData.count} d</span>
            {isStreakAtRisk && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        )}

        <button onClick={() => setView('live-chat')} className="flex items-center gap-2 text-primary font-medium text-sm hover:bg-indigo-50 px-3 py-1.5 rounded-full transition font-heading">
          <Sparkles className="w-4 h-4" />
          {ot('iaAssistant', 'IA Assistente')}
        </button>
        <div className="relative" ref={notificationsRef}>
          <button onClick={() => setNotificationsOpen((open) => !open)} className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-indigo-50 hover:text-primary" aria-label="Abrir notificações" aria-expanded={notificationsOpen}>
            <Bell className="w-5 h-5" />
          </button>
          {notificationsOpen && <div className="absolute right-0 mt-2 w-72 rounded-ui-lg border border-ui-border bg-white p-4 shadow-ui-lg" role="dialog" aria-label="Notificações"><p className="font-heading text-sm font-bold text-ui-text">Notificações</p><p className="mt-2 text-sm text-ui-text-muted">Não existem novas notificações.</p></div>}
        </div>
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setUserMenuOpen((open) => !open)} className="grid size-10 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Abrir menu do utilizador" aria-expanded={userMenuOpen}>
            {user?.photoURL ? <img src={user.photoURL} alt="" className="size-full object-cover" /> : <User className="w-5 h-5" />}
          </button>
          {userMenuOpen && <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-ui-lg border border-ui-border bg-white shadow-ui-lg" role="menu" aria-label="Menu do utilizador"><div className="border-b border-ui-border px-4 py-3"><p className="truncate text-sm font-bold text-ui-text">{user?.displayName || "Utilizador"}</p><p className="truncate text-xs text-ui-text-muted">{user?.email}</p></div><button role="menuitem" onClick={() => { setUserMenuOpen(false); setView('profile'); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-ui-surface-muted"><User className="size-4" /> Perfil</button><button role="menuitem" onClick={() => { setUserMenuOpen(false); setView('settings'); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-ui-surface-muted"><Settings className="size-4" /> Configurações</button></div>}
        </div>
      </div>
    </header>
  );
};
