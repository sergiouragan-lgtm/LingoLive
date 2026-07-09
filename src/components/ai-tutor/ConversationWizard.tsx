import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Play, 
  Volume2, 
  Briefcase, 
  Coffee, 
  Map, 
  MessageCircle, 
  Activity, 
  Hotel,
  User, 
  Check, 
  Loader2,
  Mic
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { useToast } from "../../context/ToastContext";
import { Language, Proficiency, AgeGroup, Scenario, Voice } from "../../types";
import { LANGUAGES, SCENARIOS, VOICES } from "../../data";

interface ConversationWizardProps {
  userId: string;
  userEmail?: string;
  onStartSession: (config: {
    language: Language;
    proficiency: Proficiency;
    ageGroup: AgeGroup;
    scenario: Scenario;
    voice: Voice;
  }) => void;
}

export const ConversationWizard: React.FC<ConversationWizardProps> = ({
  userId,
  userEmail,
  onStartSession
}) => {
  const { addToast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [studentAge, setStudentAge] = useState<number | null>(null);

  // Wizard state configuration
  const [language, setLanguage] = useState<Language>(LANGUAGES[2]); // English default
  const [proficiency, setProficiency] = useState<Proficiency>("Intermediate");
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

  // Load profile from Firestore: /students/{studentId}
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!userId) return;
      try {
        setLoadingProfile(true);
        const docRef = doc(db, "students", userId);
        
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.GET, `students/${userId}`);
          return;
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          const ageVal = data.age ? Number(data.age) : 20;
          setStudentAge(ageVal);

          // Find target language based on targetLanguage string (e.g. 'English', 'en', 'Francês', 'fr')
          const targetLangStr = (data.targetLanguage || "").toLowerCase();
          const matchedLang = LANGUAGES.find(
            l => 
              l.name.toLowerCase().includes(targetLangStr) || 
              l.code.toLowerCase() === targetLangStr ||
              targetLangStr.includes(l.code.toLowerCase())
          );
          if (matchedLang) {
            setLanguage(matchedLang);
          }
        } else {
          // Document does not exist, let's provision a default to have real persistence
          const fallbackAge = 18;
          const fallbackLang = "en"; // English default
          setStudentAge(fallbackAge);

          try {
            await setDoc(docRef, {
              name: userEmail ? userEmail.split("@")[0] : "Estudante",
              age: fallbackAge,
              targetLanguage: fallbackLang,
              createdAt: new Date().toISOString()
            });
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.CREATE, `students/${userId}`);
            return;
          }

          const matchedLang = LANGUAGES.find(l => l.code === fallbackLang);
          if (matchedLang) setLanguage(matchedLang);
        }
      } catch (error) {
        console.error("Erro ao obter perfil do estudante no Firestore:", error);
        // Fallback to local defaults gracefully
        setStudentAge(22);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchStudentProfile();
  }, [userId, userEmail]);

  // Determine ageGroup implicitly based on Firestore loaded age (omit visual selection)
  const getImplicitAgeGroup = (): AgeGroup => {
    if (!studentAge) return "Teens";
    if (studentAge < 10) return "Infancy";
    if (studentAge < 13) return "Kids";
    if (studentAge < 18) return "PreTeens";
    return "Teens"; // Standard adult-friendly prompt model
  };

  // Scenarios filter: Return maximum of 4 thematic cards based on chosen proficiency
  const getThematicScenarios = (): { scenario: Scenario; icon: any }[] => {
    // Map scenario ID or title to dynamic icons
    const iconMap: Record<string, any> = {
      casual_chat: MessageCircle,
      cafe_order: Coffee,
      hotel_checkin: Hotel,
      job_interview: Briefcase,
      asking_directions: Map,
      doctors_visit: Activity
    };

    // Return different scenario combinations depending on proficiency to feel tailored
    let filtered: Scenario[] = [];
    if (proficiency === "Beginner") {
      filtered = SCENARIOS.filter(s => ["cafe_order", "asking_directions", "casual_chat", "doctors_visit"].includes(s.id));
    } else if (proficiency === "Intermediate") {
      filtered = SCENARIOS.filter(s => ["casual_chat", "cafe_order", "hotel_checkin", "asking_directions"].includes(s.id));
    } else {
      // Advanced
      filtered = SCENARIOS.filter(s => ["job_interview", "hotel_checkin", "casual_chat", "doctors_visit"].includes(s.id));
    }

    // Limit to maximum 4 as requested
    return filtered.slice(0, 4).map(scen => ({
      scenario: scen,
      icon: iconMap[scen.id] || MessageCircle
    }));
  };

  // Voice handler preview (TTS micro preview)
  const playVoicePreview = (voiceToPlay: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Stop any current utterance
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (isPlayingPreview === voiceToPlay.name) {
      setIsPlayingPreview(null);
      return;
    }

    // Generate preview speech
    const utteranceText = voiceToPlay.gender === "Female" 
      ? `Hi there! I am ${voiceToPlay.name}, your online assistant. Let's practice speaking today!`
      : `Hello! My name is ${voiceToPlay.name}. Ready to improve your conversation skills? Let's begin!`;

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    
    // Choose appropriate speech synth voice language
    if (language.code === "fr") utterance.lang = "fr-FR";
    else if (language.code === "zh") utterance.lang = "zh-CN";
    else if (language.code === "pt") utterance.lang = "pt-PT";
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

    window.speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    const ageGroup = getImplicitAgeGroup();
    addToast("Iniciando sua sessão interativa com IA...", "success");
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

          {/* Elegant Horizontal Flags Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => {
              const isSelected = language.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${
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
            className="w-full py-4 px-6 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 cursor-pointer flex items-center justify-center gap-2 group mt-auto"
          >
            <Mic className="w-4 h-4 text-slate-950 group-hover:scale-125 transition-transform" />
            Começar a Falar
          </button>
        </div>

      </div>
    </div>
  );
};
