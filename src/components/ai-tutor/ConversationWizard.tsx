import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Play, 
  Volume2, 
  Briefcase, 
  Coffee, 
  Map as MapIcon, 
  MessageCircle, 
  Activity, 
  Hotel,
  Check, 
  Loader2,
  Mic,
  AlertTriangle
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { useToast } from "../../context/ToastContext";
import { Language, Proficiency, AgeGroup, Scenario, Voice } from "../../types";
import { SCENARIOS, VOICES } from "../../data";
import { SmartProfile } from "../../profile/types";

export interface ConversationWizardProps {
  userId: string;
  userEmail?: string;
  smartProfile?: SmartProfile | Partial<SmartProfile> | null;
  onStartSession: (config: {
    language: Language;
    proficiency: Proficiency;
    ageGroup: AgeGroup;
    scenario: Scenario;
    voice: Voice;
  }) => void;
}

/**
 * Helper to extract target languages strictly from SmartProfile.learning.targetLanguages.
 * No fallback sources (like targetLanguage, languageProfile, learningLanguage, nativeLanguage, etc.)
 * are permitted to add new target language options.
 */
export function extractTargetLanguagesFromSmartProfile(
  smartProfile?: SmartProfile | Partial<SmartProfile> | null
): string[] {
  if (!smartProfile || !smartProfile.learning) return [];

  const rawTargetLangs = smartProfile.learning.targetLanguages;
  if (!rawTargetLangs) return [];

  let list: string[] = [];
  if (Array.isArray(rawTargetLangs)) {
    list = rawTargetLangs;
  } else if (
    typeof rawTargetLangs === "object" &&
    rawTargetLangs !== null &&
    "value" in rawTargetLangs &&
    Array.isArray((rawTargetLangs as { value: unknown }).value)
  ) {
    list = (rawTargetLangs as { value: string[] }).value;
  }

  return list.filter((l): l is string => typeof l === "string" && l.trim().length > 0);
}

const KNOWN_LANGUAGE_MAP: Record<string, Language> = {
  en: { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },
  english: { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },
  inglês: { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },
  ingles: { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },

  fr: { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  french: { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  francês: { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  frances: { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  français: { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },

  pt: { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  "pt-ao": { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  "pt-pt": { code: "pt", name: "Portuguese", flag: "🇵🇹", defaultVoice: "Zephyr" },
  "pt-br": { code: "pt", name: "Portuguese (Brasil)", flag: "🇧🇷", defaultVoice: "Zephyr" },
  portuguese: { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  português: { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  portugues: { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },

  de: { code: "de", name: "German", flag: "🇩🇪", defaultVoice: "Kore" },
  german: { code: "de", name: "German", flag: "🇩🇪", defaultVoice: "Kore" },
  alemão: { code: "de", name: "German", flag: "🇩🇪", defaultVoice: "Kore" },
  alemao: { code: "de", name: "German", flag: "🇩🇪", defaultVoice: "Kore" },
  deutsch: { code: "de", name: "German", flag: "🇩🇪", defaultVoice: "Kore" },

  es: { code: "es", name: "Spanish", flag: "🇪🇸", defaultVoice: "Charon" },
  spanish: { code: "es", name: "Spanish", flag: "🇪🇸", defaultVoice: "Charon" },
  espanhol: { code: "es", name: "Spanish", flag: "🇪🇸", defaultVoice: "Charon" },
  espanol: { code: "es", name: "Spanish", flag: "🇪🇸", defaultVoice: "Charon" },
  español: { code: "es", name: "Spanish", flag: "🇪🇸", defaultVoice: "Charon" },

  it: { code: "it", name: "Italian", flag: "🇮🇹", defaultVoice: "Kore" },
  italian: { code: "it", name: "Italian", flag: "🇮🇹", defaultVoice: "Kore" },
  italiano: { code: "it", name: "Italian", flag: "🇮🇹", defaultVoice: "Kore" },

  zh: { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" },
  chinese: { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" },
  chinês: { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" },
  chines: { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" },
  mandarin: { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" },

  ja: { code: "ja", name: "Japanese", flag: "🇯🇵", defaultVoice: "Aoede" },
  japanese: { code: "ja", name: "Japanese", flag: "🇯🇵", defaultVoice: "Aoede" },
  japonês: { code: "ja", name: "Japanese", flag: "🇯🇵", defaultVoice: "Aoede" },
  japones: { code: "ja", name: "Japanese", flag: "🇯🇵", defaultVoice: "Aoede" },

  ru: { code: "ru", name: "Russian", flag: "🇷🇺", defaultVoice: "Zephyr" },
  russian: { code: "ru", name: "Russian", flag: "🇷🇺", defaultVoice: "Zephyr" },
  russo: { code: "ru", name: "Russian", flag: "🇷🇺", defaultVoice: "Zephyr" },

  ar: { code: "ar", name: "Arabic", flag: "🇸🇦", defaultVoice: "Charon" },
  arabic: { code: "ar", name: "Arabic", flag: "🇸🇦", defaultVoice: "Charon" },
  árabe: { code: "ar", name: "Arabic", flag: "🇸🇦", defaultVoice: "Charon" },
  arabe: { code: "ar", name: "Arabic", flag: "🇸🇦", defaultVoice: "Charon" },
};

/**
 * Resolves a language string into a canonical Language object.
 * If the language is unknown, returns null (Option A: Ignore unknown value)
 * rather than inventing default English or Portuguese options.
 */
export function resolveLanguageObject(langStr: string): Language | null {
  if (typeof langStr !== "string") return null;
  const trimmed = langStr.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (KNOWN_LANGUAGE_MAP[normalized]) {
    return KNOWN_LANGUAGE_MAP[normalized];
  }

  for (const langKey of Object.keys(KNOWN_LANGUAGE_MAP)) {
    const lang = KNOWN_LANGUAGE_MAP[langKey];
    if (lang.code.toLowerCase() === normalized || lang.name.toLowerCase() === normalized) {
      return lang;
    }
  }

  return null;
}

export const ConversationWizard: React.FC<ConversationWizardProps> = ({
  userId,
  userEmail,
  smartProfile: propSmartProfile,
  onStartSession
}) => {
  const { addToast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!propSmartProfile && Boolean(userId));
  const [studentAge, setStudentAge] = useState<number | null>(null);
  const [fetchedProfile, setFetchedProfile] = useState<SmartProfile | Partial<SmartProfile> | null>(null);

  // Active SmartProfile context
  const activeProfile = propSmartProfile || fetchedProfile;

  // Derive authorized target languages strictly from SmartProfile
  const availableLanguages: Language[] = useMemo(() => {
    const rawTargetLangs = extractTargetLanguagesFromSmartProfile(activeProfile);
    const uniqueLangsMap = new Map<string, Language>();

    for (const str of rawTargetLangs) {
      const resolved = resolveLanguageObject(str);
      if (resolved && !uniqueLangsMap.has(resolved.code)) {
        uniqueLangsMap.set(resolved.code, resolved);
      }
    }

    return Array.from(uniqueLangsMap.values());
  }, [activeProfile]);

  // Wizard state configuration
  const [language, setLanguage] = useState<Language | null>(null);
  const [proficiency, setProficiency] = useState<Proficiency>("Intermediate");
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

  // Load profile from Firestore if not supplied or missing fields
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!userId || propSmartProfile) {
        setLoadingProfile(false);
        return;
      }
      try {
        setLoadingProfile(true);
        const docRef = doc(db, "students", userId);
        
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (dbErr: unknown) {
          handleFirestoreError(dbErr, OperationType.GET, `students/${userId}`);
          return;
        }

        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SmartProfile> & { age?: number };
          setFetchedProfile(data);
          const ageVal = data.age ? Number(data.age) : 20;
          setStudentAge(ageVal);
        } else {
          setStudentAge(18);
        }
      } catch (error) {
        console.error("Erro ao obter perfil do estudante no Firestore:", error);
        setStudentAge(22);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchStudentProfile();
  }, [userId, propSmartProfile]);

  // Determine language initially according to priority rules:
  // 1. Last used language in session (localStorage) if available in authorized list
  // 2. Primary targetLanguage of SmartProfile, if available in authorized list
  // 3. First available language in targetLanguages
  // 4. Fallback safe null if targetLanguages is empty
  useEffect(() => {
    if (availableLanguages.length === 0) {
      setLanguage(null);
      return;
    }

    // If currently selected language is valid and present in availableLanguages, keep it
    if (language && availableLanguages.some(l => l.code === language.code)) {
      return;
    }

    // Priority 1: Last used language in session (from localStorage) IF authorized in availableLanguages
    const lastUsedCode = typeof window !== "undefined" ? localStorage.getItem("lingolive_last_tutor_language") : null;
    if (lastUsedCode) {
      const matchedLast = availableLanguages.find(
        l => l.code.toLowerCase() === lastUsedCode.toLowerCase() || l.name.toLowerCase() === lastUsedCode.toLowerCase()
      );
      if (matchedLast) {
        setLanguage(matchedLast);
        return;
      }
    }

    // Priority 2: Singular targetLanguage from SmartProfile ONLY IF authorized in availableLanguages
    let targetLangVal: string | null = null;
    const rawTargetLang = activeProfile?.learning?.targetLanguage;
    if (typeof rawTargetLang === "string") {
      targetLangVal = rawTargetLang;
    } else if (
      rawTargetLang &&
      typeof rawTargetLang === "object" &&
      "value" in rawTargetLang &&
      typeof (rawTargetLang as { value: unknown }).value === "string"
    ) {
      targetLangVal = (rawTargetLang as { value: string }).value;
    }

    if (targetLangVal && targetLangVal.trim()) {
      const resolvedTarget = resolveLanguageObject(targetLangVal.trim());
      if (resolvedTarget) {
        const matchedTarget = availableLanguages.find(l => l.code === resolvedTarget.code);
        if (matchedTarget) {
          setLanguage(matchedTarget);
          return;
        }
      }
    }

    // Priority 3: First available language in availableLanguages
    setLanguage(availableLanguages[0]);
  }, [availableLanguages, activeProfile]);

  const handleSelectLanguage = (selectedLang: Language) => {
    setLanguage(selectedLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lingolive_last_tutor_language", selectedLang.code);
    }
  };

  // Determine ageGroup implicitly based on Firestore loaded age
  const getImplicitAgeGroup = (): AgeGroup => {
    if (!studentAge) return "Teens";
    if (studentAge < 10) return "Infancy";
    if (studentAge < 13) return "Kids";
    if (studentAge < 18) return "PreTeens";
    return "Teens";
  };

  // Scenarios filter: Return maximum of 4 thematic cards based on chosen proficiency
  const getThematicScenarios = (): { scenario: Scenario; icon: React.ComponentType<{ className?: string }> }[] => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      casual_chat: MessageCircle,
      cafe_order: Coffee,
      hotel_checkin: Hotel,
      job_interview: Briefcase,
      asking_directions: MapIcon,
      doctors_visit: Activity
    };

    let filtered: Scenario[] = [];
    if (proficiency === "Beginner") {
      filtered = SCENARIOS.filter(s => ["cafe_order", "asking_directions", "casual_chat", "doctors_visit"].includes(s.id));
    } else if (proficiency === "Intermediate") {
      filtered = SCENARIOS.filter(s => ["casual_chat", "cafe_order", "hotel_checkin", "asking_directions"].includes(s.id));
    } else {
      filtered = SCENARIOS.filter(s => ["job_interview", "hotel_checkin", "casual_chat", "doctors_visit"].includes(s.id));
    }

    return filtered.slice(0, 4).map(scen => ({
      scenario: scen,
      icon: iconMap[scen.id] || MessageCircle
    }));
  };

  // Voice handler preview (TTS micro preview)
  const playVoicePreview = (voiceToPlay: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (isPlayingPreview === voiceToPlay.name) {
      setIsPlayingPreview(null);
      return;
    }

    const utteranceText = voiceToPlay.gender === "Female" 
      ? `Hi there! I am ${voiceToPlay.name}, your online assistant. Let's practice speaking today!`
      : `Hello! My name is ${voiceToPlay.name}. Ready to improve your conversation skills? Let's begin!`;

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    
    if (language?.code === "fr") utterance.lang = "fr-FR";
    else if (language?.code === "zh") utterance.lang = "zh-CN";
    else if (language?.code === "pt") utterance.lang = "pt-PT";
    else utterance.lang = "en-US";

    utterance.rate = 0.95;

    utterance.onstart = () => {
      setIsPlayingPreview(voiceToPlay.name);
    };
    utterance.onend = () => {
      setIsPlayingPreview(null);
    };
    utterance.onerror = () => {
      setIsPlayingPreview(null);
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStart = () => {
    if (loadingProfile || !language || availableLanguages.length === 0) return;

    const isAuthorized = availableLanguages.some(l => l.code === language.code);
    if (!isAuthorized) return;

    const ageGroup = getImplicitAgeGroup();
    addToast("Iniciando sua sessão interativa com IA...", "success");

    if (typeof window !== "undefined") {
      localStorage.setItem("lingolive_last_tutor_language", language.code);
    }

    onStartSession({
      language,
      proficiency,
      ageGroup,
      scenario,
      voice
    });
  };

  if (loadingProfile) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 flex flex-col items-center justify-center min-h-[350px]">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
        <p className="text-slate-400 font-medium">Carregando preferências e dados do Firestore...</p>
      </div>
    );
  }

  const themes = getThematicScenarios();

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-8" id="conversation-wizard">
      {/* Background visual glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Assistente de Conversação
            </span>
            {studentAge && (
              <span className="text-xs text-slate-400 font-semibold bg-slate-800/60 px-2 py-1 rounded-md">
                Idade: {studentAge} anos (Filtro Automático)
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-2 text-slate-100">
            Configure seu Treino por Voz
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Escolha suas opções rápidas abaixo para iniciar o simulador conversacional inteligente.
          </p>
        </div>
      </div>

      {/* Content Columns/Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Step 1: Language and Level Selector */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h3 className="font-bold text-base text-slate-200">Idioma e Nível</h3>
          </div>

          {/* Authorized Language Selection or Empty Fallback */}
          {availableLanguages.length === 0 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Nenhum idioma configurado no Perfil Inteligente.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {availableLanguages.map((lang) => {
                const isSelected = language?.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/5 text-white"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <div className="truncate">
                      <p className="font-bold text-xs truncate leading-none mb-1 text-slate-100">{lang.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">{lang.code}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Level Switcher (SegmentedButton) */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Proficiência do Áudio</label>
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {(["Beginner", "Intermediate", "Advanced"] as Proficiency[]).map((p) => {
                const labelMap = { Beginner: "Básico", Intermediate: "Intermediário", Advanced: "Avançado" };
                const isSelected = proficiency === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProficiency(p)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Theme Grid (Thematics) */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h3 className="font-bold text-base text-slate-200">Temática do Cenário</h3>
          </div>

          {/* Grid of maximum 4 visual cards */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-[180px]">
            {themes.map(({ scenario: s, icon: IconComponent }) => {
              const isSelected = scenario.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenario(s)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group relative overflow-hidden h-[95px] ${
                    isSelected
                      ? "border-cyan-500/60 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/5"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-1.5 rounded-xl ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"} transition`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  
                  <div className="truncate w-full mt-2">
                    <p className={`font-black text-[11px] truncate leading-tight ${isSelected ? "text-cyan-200" : "text-slate-300 group-hover:text-slate-100"}`}>
                      {s.title}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate leading-none mt-1">
                      {s.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Tutor voice and Trigger */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h3 className="font-bold text-base text-slate-200">Seletor de Tutor (Voz)</h3>
          </div>

          {/* Voice selector - horizontal alignment with 2 avatars and mini play */}
          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {VOICES.slice(0, 2).map((v) => {
              const isSelected = voice.name === v.name;
              const isPlaying = isPlayingPreview === v.name;
              return (
                <div
                  key={v.name}
                  onClick={() => setVoice(v)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? "border-violet-500 bg-violet-600/15 text-white"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected 
                        ? "bg-violet-600 text-white" 
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {v.gender === "Female" ? "👧" : "👦"}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-xs leading-none mb-1 ${isSelected ? "text-violet-200" : "text-slate-200"}`}>{v.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{v.gender === "Female" ? "Voz Feminina" : "Voz Masculina"}</p>
                    </div>
                  </div>

                  {/* Micro Play Preview button */}
                  <button
                    onClick={(e) => playVoicePreview(v, e)}
                    className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer ${
                      isPlaying
                        ? "bg-cyan-500 border-cyan-400 text-slate-950 animate-pulse"
                        : isSelected
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                    title="Ouvir amostra"
                  >
                    {isPlaying ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Primary CTA: Começar a falar */}
          <button
            onClick={handleStart}
            disabled={loadingProfile || availableLanguages.length === 0 || !language}
            className={`w-full py-4 px-6 font-black rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group mt-auto ${
              loadingProfile || availableLanguages.length === 0 || !language
                ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed pointer-events-none opacity-50"
                : "bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 cursor-pointer"
            }`}
          >
            <Mic className="w-4 h-4 text-slate-950 group-hover:scale-125 transition-transform" />
            Começar a Falar
          </button>
        </div>

      </div>
    </div>
  );
};

