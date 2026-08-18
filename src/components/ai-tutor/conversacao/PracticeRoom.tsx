import React, { useState, useEffect, useRef, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { WhisperService } from "../../../services/audio/whisper";
import { Language, Proficiency, AgeGroup, Scenario, Voice, TranscriptItem, SavedWord } from "../../../types";
import { PronunciationTipModal } from '../PronunciationTipModal';
import { AudioVisualizer } from '../AudioVisualizer';
import { SmartProfile } from "../../../profile/types";
import { buildTutorSessionContext, TutorSessionContext } from "../../../features/tutor/tutorSessionContextBuilder";
import { 
  Mic, 
  MicOff, 
  Send, 
  Clock, 
  X, 
  Plus, 
  Bookmark, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Loader2,
  BookmarkCheck,
  Check,
  Award,
  Flame,
  Trophy,
  Users,
  Smile,
  Compass,
  Gamepad2,
  Star,
  Focus,
  Coffee,
  Wind,
  Sliders
} from "lucide-react";

export interface PracticeRoomProps {
  language: Language;
  proficiency: Proficiency;
  ageGroup: AgeGroup;
  userAge?: number;
  scenario: Scenario;
  voice: Voice;
  onEndSession: (transcript: TranscriptItem[], audioUrl?: string | null) => void;
  onExit: () => void;
  onSaveWord: (word: SavedWord) => void;
  savedWords: SavedWord[];
  smartProfile?: SmartProfile | Partial<SmartProfile> | null;
  sessionContext?: TutorSessionContext;
}

export default function PracticeRoom({
  language,
  proficiency,
  ageGroup,
  userAge,
  scenario,
  voice,
  onEndSession,
  onExit,
  onSaveWord,
  savedWords,
  smartProfile: propSmartProfile,
  sessionContext: propSessionContext
}: PracticeRoomProps) {
  // Profile & Session Context initialization
  const [userProfile] = useState<SmartProfile | Partial<SmartProfile> | null>(() => {
    if (propSmartProfile) return propSmartProfile;
    if (auth.currentUser) {
      const stored = localStorage.getItem(`lingolive_smart_profile_${auth.currentUser.uid}`) || localStorage.getItem(`lingolive_user_sub_${auth.currentUser.uid}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
    }
    return null;
  });

  const effectiveSessionContext = useMemo<TutorSessionContext>(() => {
    if (propSessionContext) return propSessionContext;
    return buildTutorSessionContext({
      smartProfile: propSmartProfile || userProfile,
      targetLanguage: language.name || language.code,
      cefrLevel: proficiency,
    });
  }, [propSessionContext, propSmartProfile, userProfile, language, proficiency]);

  // Session UI states
  const [sessionStatus, setSessionStatus] = useState<"connecting" | "ready" | "closed" | "error">("connecting");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [speakOutMode, setSpeakOutMode] = useState<"tts-only" | "voice-input">("voice-input");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [duration, setDuration] = useState(0);
  const [isBetaExpired, setIsBetaExpired] = useState(() => {
    return localStorage.getItem("lingolive_beta_expired") === "true";
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Whisper Speech-to-Text states
  const [isWhisperRecording, setIsWhisperRecording] = useState(false);
  const [isWhisperTranscribing, setIsWhisperTranscribing] = useState(false);
  const whisperRecorderRef = useRef<MediaRecorder | null>(null);
  const whisperChunksRef = useRef<Blob[]>([]);

  const startWhisperRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microfone não suportado no seu navegador.");
      return;
    }
    
    try {
      // Temporarily mute real-time microphone to prevent feedback/duplicate sound
      const oldIsMuted = isMuted;
      setIsMuted(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      whisperChunksRef.current = [];
      
      let options = { mimeType: "audio/webm" };
      if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
      }
      if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported("audio/ogg") && !MediaRecorder.isTypeSupported("audio/webm")) {
        options = {} as any;
      }
      
      const recorder = new MediaRecorder(stream, options);
      whisperRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          whisperChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
        
        // Restore mute state if desired, or keep muted
        setIsMuted(oldIsMuted);

        const audioBlob = new Blob(whisperChunksRef.current, { type: options.mimeType || "audio/webm" });
        if (audioBlob.size === 0) return;
        
        setIsWhisperTranscribing(true);
        try {
          const transcription = await WhisperService.transcribe(audioBlob, language.name);
          if (transcription.trim()) {
            setTextInput((prev) => (prev ? prev + " " + transcription : transcription));
          }
        } catch (err: any) {
          console.error("Whisper transcription failed:", err);
        } finally {
          setIsWhisperTranscribing(false);
        }
      };
      
      recorder.start();
      setIsWhisperRecording(true);
    } catch (err) {
      console.error("Failed to start Whisper recording:", err);
    }
  };

  const stopWhisperRecording = () => {
    if (whisperRecorderRef.current && whisperRecorderRef.current.state !== "inactive") {
      whisperRecorderRef.current.stop();
    }
    setIsWhisperRecording(false);
  };

  const toggleWhisperRecording = () => {
    if (isWhisperRecording) {
      stopWhisperRecording();
    } else {
      startWhisperRecording();
    }
  };

  // Background Ambient Sound States and Synthesis using Web Audio API
  const [ambientMode, setAmbientMode] = useState<'none' | 'white' | 'cafe'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3);
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientGainNodeRef = useRef<GainNode | null>(null);
  const clinkTimerRef = useRef<any>(null);

  const stopAmbientSound = () => {
    if (clinkTimerRef.current) {
      clearTimeout(clinkTimerRef.current);
      clinkTimerRef.current = null;
    }
    if (ambientSourceRef.current) {
      try {
        ambientSourceRef.current.stop();
      } catch (e) {}
      ambientSourceRef.current = null;
    }
    if (ambientAudioCtxRef.current) {
      try {
        ambientAudioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      ambientAudioCtxRef.current = null;
    }
    ambientGainNodeRef.current = null;
  };

  const startAmbientSound = (mode: 'white' | 'cafe', vol: number) => {
    stopAmbientSound();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      ambientAudioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      // Keep it extremely gentle so speech remains perfectly audible and distinct
      masterGain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      ambientGainNodeRef.current = masterGain;

      if (mode === 'white') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime); // Lowpass to transform white to soothing pink/brown noise

        source.connect(filter);
        filter.connect(masterGain);
        source.start(0);
        ambientSourceRef.current = source;
      } else if (mode === 'cafe') {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate a smooth continuous low-end rumble representing restaurant hum
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11;
          b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime); // Deep warm environment hum

        source.connect(filter);
        filter.connect(masterGain);
        source.start(0);
        ambientSourceRef.current = source;

        // Periodic coffee cup clinks synthesized programmatically
        const playClink = () => {
          if (!ambientAudioCtxRef.current || ambientAudioCtxRef.current.state === 'closed') return;
          try {
            const currentCtx = ambientAudioCtxRef.current;
            const osc = currentCtx.createOscillator();
            const clinkGain = currentCtx.createGain();
            
            const freq = 1800 + Math.random() * 1000;
            osc.frequency.setValueAtTime(freq, currentCtx.currentTime);
            osc.type = Math.random() > 0.45 ? 'sine' : 'triangle';

            // Very subtle bell-like click
            clinkGain.gain.setValueAtTime(0.003 + Math.random() * 0.005, currentCtx.currentTime);
            clinkGain.gain.exponentialRampToValueAtTime(0.0001, currentCtx.currentTime + 0.12);

            const bp = currentCtx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.setValueAtTime(freq, currentCtx.currentTime);
            bp.Q.setValueAtTime(12, currentCtx.currentTime);

            osc.connect(bp);
            bp.connect(clinkGain);
            clinkGain.connect(masterGain);

            osc.start();
            osc.stop(currentCtx.currentTime + 0.35);
          } catch (e) {
            console.warn("Cafe ambient sound synthesis error:", e);
          }

          // Next random cup clink interval
          const nextTime = 3000 + Math.random() * 7000;
          clinkTimerRef.current = setTimeout(playClink, nextTime);
        };

        // Delay the first clink slightly
        clinkTimerRef.current = setTimeout(playClink, 2000);
      }
    } catch (err) {
      console.error("Error setting up ambient audio:", err);
    }
  };

  useEffect(() => {
    if (ambientMode !== 'none') {
      startAmbientSound(ambientMode, ambientVolume);
    } else {
      stopAmbientSound();
    }
  }, [ambientMode]);

  useEffect(() => {
    if (ambientGainNodeRef.current && ambientAudioCtxRef.current) {
      const now = ambientAudioCtxRef.current.currentTime;
      ambientGainNodeRef.current.gain.setTargetAtTime(ambientVolume * 0.15, now, 0.1);
    }
  }, [ambientVolume]);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist beta expiration
  useEffect(() => {
    localStorage.setItem("lingolive_beta_expired", String(isBetaExpired));
  }, [isBetaExpired]);

  const getPronunciationTip = (): string => {
    const tips = [
      "Tente articular melhor os sons das vogais finais.",
      "Cuidado com a entonação em perguntas; ela deve subir no final.",
      "Pratique o som do 'r' inicial, ele é mais forte do que parece.",
      "Tente não correr tanto na fala; respire entre as frases."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  // Real-time conversation captions
  const [lastModelCaption, setLastModelCaption] = useState("");
  const [lastUserCaption, setLastUserCaption] = useState("");

  // Transcript items list
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  // Instant dictionary helper state
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [phraseExplanation, setPhraseExplanation] = useState<{
    meaning: string;
    pronunciation: string;
    grammarNote: string;
    exampleOriginal: string;
    exampleTranslation: string;
  } | null>(null);
  const [explanationSaved, setExplanationSaved] = useState(false);

  // Playful age group enhancements
  const [karaokeWordIdx, setKaraokeWordIdx] = useState<number>(0);
  const [playfulCelebrations, setPlayfulCelebrations] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("gaming");
  const [teenSpeed, setTeenSpeed] = useState<"normal" | "slow">("normal");
  const [kidScore, setKidScore] = useState<number>(1); // 1 to 5 stars for Kids quest!

  // Helper dictionary to get Pinyin for Chinese words in real-time captions
  const getPinyinForChineseWord = (word: string): string => {
    const pinyinMap: Record<string, string> = {
      "你好": "Nǐ hǎo",
      "再见": "Zài jiàn",
      "谢谢": "Xiè xiè",
      "一": "Yī",
      "二": "Èr",
      "三": "Sān",
      "四": "Sì",
      "五": "Wǔ",
      "红色": "Hóng sè",
      "蓝色": "Lán sè",
      "绿色": "Lǜ sè",
      "黄色": "Huáng sè",
      "猫": "Māo",
      "狗": "Gǒu",
      "太阳": "Tàiyáng",
      "苹果": "Píngguǒ",
      "香蕉": "Xiāngjiāo",
      "火箭": "Huǒjiàn",
      "早上好": "Zǎoshang hǎo",
      "我是": "Wǒ shì",
      "对": "Duì",
      "不对": "Bù duì",
      "很好": "Hěn hǎo",
      "太棒了": "Tài bàng le"
    };
    
    // Check direct matching or substrings
    for (const [key, val] of Object.entries(pinyinMap)) {
      if (word.includes(key)) return val;
    }
    
    // Guessing or fallback based on character-like length
    if (word.length === 1) return "Yī / Māo";
    if (word.length === 2) return "Nǐ hǎo";
    return "Píng guǒ";
  };

  const renderChineseKaraoke = (text: string) => {
    // Split by character/word or punctuation
    const words = text.split(/([,.:!?\s]+)/);
    return (
      <div className="flex flex-wrap justify-center gap-y-4 gap-x-2 text-center" id="chinese-pinyin-karaoke">
        {words.map((w, idx) => {
          if (!w.trim() || /[,.:!?\s]/.test(w)) {
            return <span key={idx} className="text-slate-400 text-3xl font-bold self-end">{w}</span>;
          }
          const pinyin = getPinyinForChineseWord(w);
          return (
            <div key={idx} className="flex flex-col items-center">
              {/* Character in giant size */}
              <span className="text-3xl sm:text-4xl font-bold text-indigo-950 dark:text-yellow-300 block">{w}</span>
              {/* Pinyin in extra-large size with tone symbols */}
              <span className="text-base sm:text-lg font-extrabold text-orange-500 dark:text-orange-400 block mt-1 font-sans">{pinyin}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Play synthesized cartoon sound effect
  const playWebAudioSfx = (type: "clap" | "chime" | "giggle") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (type === "chime") {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
        // Add random floating celebration items
        triggerFloatingEmojis("✨");
      } else if (type === "giggle") {
        const baseFreq = 330; // E4
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(baseFreq + i * 40 + Math.random() * 20, now + i * 0.12);
          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.11);
        }
        triggerFloatingEmojis("🥰");
      } else if (type === "clap") {
        // White noise claps
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        for (let i = 0; i < 8; i++) {
          const timeOffset = i * 0.06;
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = buffer;
          
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1000 + Math.random() * 200, now + timeOffset);
          filter.Q.setValueAtTime(4, now + timeOffset);
          
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0, now + timeOffset);
          gainNode.gain.linearRampToValueAtTime(0.15, now + timeOffset + 0.005);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.05);
          
          noiseSource.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          noiseSource.start(now + timeOffset);
          noiseSource.stop(now + timeOffset + 0.06);
        }
        triggerFloatingEmojis("💖");
      }
    } catch (e) {
      console.warn("Failed playing synthesized audio sfx:", e);
    }
  };

  const triggerFloatingEmojis = (emoji: string) => {
    const list: any[] = [];
    for (let i = 0; i < 6; i++) {
      list.push({
        id: Math.random() + i,
        x: 20 + Math.random() * 60, // percentage x-axis
        y: 40 + Math.random() * 30, // percentage y-axis
        emoji: emoji
      });
    }
    setPlayfulCelebrations((prev) => [...prev, ...list]);
    setTimeout(() => {
      setPlayfulCelebrations((prev) => prev.slice(6));
    }, 2000);
  };

  // Simulate karaoke progress during speaking
  useEffect(() => {
    if (!lastModelCaption) {
      setKaraokeWordIdx(0);
      return;
    }
    
    const wordsCount = lastModelCaption.split(" ").length;
    let current = 0;
    
    const interval = setInterval(() => {
      current = (current + 1) % (wordsCount + 1);
      setKaraokeWordIdx(current);
    }, 550);
    
    return () => clearInterval(interval);
  }, [lastModelCaption]);

  // Refs for low-level audio & WS bridging
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  // Session audio recording toggle and references
  const [saveAudioEnabled, setSaveAudioEnabled] = useState(true);
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mixedStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  // Refs for mute/state updates in callbacks (to avoid stale closures)
  const isMutedRef = useRef(false);
  const speakOutModeRef = useRef<"tts-only" | "voice-input">("voice-input");
  const isOnlineRef = useRef(navigator.onLine);
  const offlineAudioBuffer = useRef<string[]>([]);
  const transcriptRef = useRef<TranscriptItem[]>([]);
  const lastModelMsgRef = useRef<TranscriptItem | null>(null);
  const lastUserMsgRef = useRef<TranscriptItem | null>(null);

  // Auto-scroll transcript container
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    speakOutModeRef.current = speakOutMode;
    if (speakOutMode === "tts-only") {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  }, [speakOutMode]);

  useEffect(() => {
    isOnlineRef.current = isOnline;
    if (isOnline && offlineAudioBuffer.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        offlineAudioBuffer.current.forEach(chunk => {
            wsRef.current?.send(JSON.stringify({ type: "audio", data: chunk }));
        });
        offlineAudioBuffer.current = [];
    }
  }, [isOnline]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Session Duration Timer
  useEffect(() => {
    if (sessionStatus !== "ready" || isBetaExpired) return;
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStatus, isBetaExpired]);

  // Monitor beta program duration restriction (2 minutes = 120 seconds)
  useEffect(() => {
    if (duration >= 120 && !isBetaExpired) {
      setIsBetaExpired(true);
      cleanupResources();
    }
  }, [duration, isBetaExpired]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, lastModelCaption, lastUserCaption]);

  // Connect to live WebSocket and configure recording + playback
  useEffect(() => {
    let active = true;
    
    async function initLiveSession() {
      try {
        setSessionStatus("connecting");

        // Ask for Mic Permission first
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          mediaStreamRef.current = stream;
        } catch (e: any) {
          throw new Error("Microphone permission denied. LingoLive requires microphone access to practice speaking.");
        }

        // Determine protocol based on current window location
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        
        let token = "";
        if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch (e) {
            console.warn("Failed to get ID token, continuing with empty", e);
          }
        }

        const wsUrl = `${protocol}//${window.location.host}/live?language=${encodeURIComponent(
          language.name
        )}&proficiency=${encodeURIComponent(proficiency)}&ageGroup=${encodeURIComponent(ageGroup)}&scenario=${encodeURIComponent(
          scenario.promptContext
        )}&voice=${encodeURIComponent(voice.name)}&token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const msg = JSON.parse(event.data);
            
            if (msg.type === "status") {
              if (msg.status === "ready") {
                setSessionStatus("ready");
                setupMicRecording(stream);
              } else if (msg.status === "closed") {
                setSessionStatus("closed");
              }
            } else if (msg.type === "error") {
              setSessionStatus("error");
              setErrorMessage(msg.message || "An error occurred with the AI session");
            } else if (msg.type === "audio") {
              setIsSpeaking(true);
              setIsListening(false);
              playAudioChunk(msg.data);
            } else if (msg.type === "interrupted") {
              // User spoke over AI, immediately stop all scheduled sounds
              stopAllPlayback();
              setIsSpeaking(false);
            } else if (msg.type === "model-text") {
              // Append to real-time caption
              setLastModelCaption((prev) => {
                const raw = prev + msg.text;
                // Remove complete or partial <analytics> tags/payload from rendering
                let clean = raw;
                const index = clean.indexOf("<analytics>");
                if (index !== -1) {
                  clean = clean.substring(0, index).trim();
                } else {
                  const partialIndex = clean.indexOf("<analytics");
                  if (partialIndex !== -1) {
                    clean = clean.substring(0, partialIndex).trim();
                  }
                }
                updateTranscriptItem("model", clean);
                return clean;
              });
            } else if (msg.type === "user-text") {
              setIsListening(true);
              setIsSpeaking(false);
              setLastUserCaption((prev) => {
                const updated = prev + msg.text;
                updateTranscriptItem("user", updated);
                return updated;
              });
              // Clear model's speaking caption as user has spoken
              setLastModelCaption("");
            }
          } catch (e) {
            console.error("Error parsing WS message:", e);
          }
        };

        ws.onerror = (e) => {
          console.error("WS Error:", e);
          if (active) {
            setSessionStatus("error");
            setErrorMessage("Connection lost. Please try again or refresh the page.");
          }
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
          if (active) {
            setSessionStatus("closed");
          }
        };

      } catch (err: any) {
        console.error("Initialization error:", err);
        if (active) {
          setSessionStatus("error");
          setErrorMessage(err.message || "Failed to initialize active voice session.");
        }
      }
    }

    initLiveSession();

    return () => {
      active = false;
      cleanupResources();
    };
  }, [language, proficiency, scenario, voice]);

  // Clean up mic capture, process loop, WebSocket, and sound outputs
  function cleanupResources() {
    // 1. Close WS
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // 2. Stop mic stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    // 3. Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    // 4. Close Input context
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    setAnalyser(null);
    // 5. Close Output context and stop playback
    stopAllPlayback();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
  }

  // Helper to start session audio recording (mixing user mic and AI response)
  const startSessionRecording = () => {
    if (!mediaStreamRef.current) return;
    
    try {
      // 1. Ensure we have an output AudioContext so we can use its Web Audio node
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
      }
      
      const audioCtx = outputAudioCtxRef.current;
      
      // 2. Create destination node if it doesn't exist
      if (!mixedStreamDestRef.current) {
        mixedStreamDestRef.current = audioCtx.createMediaStreamDestination();
      }
      
      // 3. Route microphone stream to the mixed destination via output context
      try {
        const micSource = audioCtx.createMediaStreamSource(mediaStreamRef.current);
        micSource.connect(mixedStreamDestRef.current);
      } catch (micErr) {
        console.warn("Could not route mic to combined recording destination:", micErr);
      }
      
      // 4. Record the combined mixed stream if available, else fallback to raw mic
      const streamToRecord = mixedStreamDestRef.current ? mixedStreamDestRef.current.stream : mediaStreamRef.current;
      
      recordedChunksRef.current = [];
      let options = { mimeType: "audio/webm" };
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/ogg" };
        }
        if (!MediaRecorder.isTypeSupported("audio/ogg")) {
          options = {} as any; // default fallback
        }
        
        const recorder = new MediaRecorder(streamToRecord, options);
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
            const url = URL.createObjectURL(blob);
            setSessionAudioUrl(url);
          }
        };
        
        recorder.start(1000); // record in chunks of 1 second
        console.log("Session audio recording started.");
      }
    } catch (err) {
      console.error("Failed to initialize session recorder:", err);
    }
  };

  const stopSessionRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        console.log("Session audio recording stopped.");
      } catch (e) {
        console.error("Error stopping media recorder:", e);
      }
    }
  };

  // Reactive audio recording controller based on UI toggle and session status
  useEffect(() => {
    if (sessionStatus === "ready" && saveAudioEnabled) {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        startSessionRecording();
      }
    } else {
      stopSessionRecording();
    }
  }, [saveAudioEnabled, sessionStatus]);

  // Setup mic capturing with ScriptProcessor to extract 16kHz PCM
  function setupMicRecording(stream: MediaStream) {
    try {
      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Create AnalyserNode for real-time visualization
      const visualAnalyser = inputAudioCtx.createAnalyser();
      visualAnalyser.fftSize = 256;
      visualAnalyser.smoothingTimeConstant = 0.8;
      source.connect(visualAnalyser);
      setAnalyser(visualAnalyser);

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        // Skip sending audio if user is muted, or session is not fully ready, or in tts-only mode
        if (isMutedRef.current || speakOutModeRef.current === "tts-only") {
          return;
        }

        const channelData = e.inputBuffer.getChannelData(0);
        // Convert Float32 data to signed 16-bit PCM little-endian
        const pcmBase64 = float32ToPCMBase64(channelData);
        
        if (!pcmBase64) return;

        if (!isOnlineRef.current) {
            offlineAudioBuffer.current.push(pcmBase64);
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              data: pcmBase64,
            })
          );
        }
      };
    } catch (e) {
      console.error("Failed to setup microphone processor:", e);
    }
  }

  // Float32 to 16-bit signed PCM encoder in base64
  function float32ToPCMBase64(float32Array: Float32Array): string {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      // 16-bit signed int bounds
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true for little-endian
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Queue up and play returning 24kHz raw PCM speech chunk
  function playAudioChunk(base64PCM: string) {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
      }

      const audioCtx = outputAudioCtxRef.current;
      
      // Decode base64 to raw bytes
      const binary = atob(base64PCM);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      let startTime = nextStartTimeRef.current;
      const currentTime = audioCtx.currentTime;

      // Avoid cracking/lag, align with immediate play block
      if (startTime < currentTime) {
        startTime = currentTime + 0.05;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      if (mixedStreamDestRef.current) {
        try {
          source.connect(mixedStreamDestRef.current);
        } catch (mixErr) {
          console.warn("Failed to connect audio chunk source to combined recorder destination:", mixErr);
        }
      }
      source.start(startTime);

      // Track active sources
      activeSourcesRef.current.push(source);
      
      // Advance next playback timestamp
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        // Remove from list
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };

    } catch (e) {
      console.error("Failed to decode and play audio chunk:", e);
    }
  }

  // Interruption helper
  function stopAllPlayback() {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
  }

  // Append or modify a typed text transcription item statefully
  function updateTranscriptItem(role: "user" | "model", text: string) {
    if (!text.trim()) return;

    if (role === "model") {
      const activeItem = lastModelMsgRef.current;
      if (activeItem && transcript.some(item => item.id === activeItem.id)) {
        // Update existing live speaking item
        setTranscript((prev) =>
          prev.map((item) =>
            item.id === activeItem.id ? { ...item, text: text } : item
          )
        );
      } else {
        // Create new item
        const newItem: TranscriptItem = {
          id: Math.random().toString(),
          role: "model",
          text: text,
          timestamp: new Date(),
        };
        lastModelMsgRef.current = newItem;
        setTranscript((prev) => [...prev, newItem]);
        // When new AI block starts, clear user transcription buffer
        setLastUserCaption("");
        lastUserMsgRef.current = null;
      }
    } else {
      // User transcription
      const activeItem = lastUserMsgRef.current;
      if (activeItem && transcript.some(item => item.id === activeItem.id)) {
        setTranscript((prev) =>
          prev.map((item) =>
            item.id === activeItem.id ? { ...item, text: text } : item
          )
        );
      } else {
        const newItem: TranscriptItem = {
          id: Math.random().toString(),
          role: "user",
          text: text,
          timestamp: new Date(),
        };
        lastUserMsgRef.current = newItem;
        setTranscript((prev) => [...prev, newItem]);
        // When user speaks, clear last speaking model buffer
        setLastModelCaption("");
        lastModelMsgRef.current = null;
      }
    }
  }

  // Text keyboard fallback sender
  const handleSendText = () => {
    if (!textInput.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;

    // Send the text content to the model
    wsRef.current.send(
      JSON.stringify({
        type: "text",
        data: textInput,
      })
    );

    // Append locally to show instantly
    const newItem: TranscriptItem = {
      id: Math.random().toString(),
      role: "user",
      text: textInput,
      timestamp: new Date(),
    };
    setTranscript((prev) => [...prev, newItem]);
    setLastUserCaption(textInput);
    
    // Clear input
    setTextInput("");
  };

  // Instant dictionary explanation query
  const handleWordClick = async (wordOrPhrase: string) => {
    // Clean string (strip punctuation)
    const cleaned = wordOrPhrase.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "").trim();
    if (!cleaned || cleaned.length < 2) return;

    setSelectedPhrase(cleaned);
    setIsExplaining(true);
    setPhraseExplanation(null);
    setExplanationSaved(false);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/explain-phrase", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ 
          phrase: cleaned, 
          language: language.name,
          age: userAge,
          ageGroup: ageGroup
        }),
      });

      if (!response.ok) throw new Error("Failed to translate phrase");
      const result = await response.json();
      
      setPhraseExplanation(result);
      
      // Check if already in saved vocab
      const exists = savedWords.some(
        (w) => w.word.toLowerCase() === cleaned.toLowerCase()
      );
      setExplanationSaved(exists);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSaveVocabulary = () => {
    if (!selectedPhrase || !phraseExplanation) return;

    const newWord: SavedWord = {
      id: Math.random().toString(),
      word: selectedPhrase,
      meaning: phraseExplanation.meaning,
      pronunciation: phraseExplanation.pronunciation,
      grammarNote: phraseExplanation.grammarNote,
      exampleOriginal: phraseExplanation.exampleOriginal,
      exampleTranslation: phraseExplanation.exampleTranslation,
      savedAt: new Date().toLocaleDateString(),
      maturityLevel: phraseExplanation.maturityLevel || "Adulto",
      category: phraseExplanation.category || "Geral",
    };

    onSaveWord(newWord);
    setExplanationSaved(true);
  };

  // Stop recording asynchronously and forward data once finished
  const handleEndSessionWithAudio = () => {
    // Determine the tip and trigger modal first
    setCurrentTip(getPronunciationTip());
    setShowPronunciationModal(true);
  };

  const proceedToEndSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        let finalUrl: string | null = null;
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          finalUrl = URL.createObjectURL(blob);
        }
        onEndSession(transcript, finalUrl);
      };
      
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Failed to stop media recorder:", err);
        onEndSession(transcript, sessionAudioUrl);
      }
    } else {
      onEndSession(transcript, sessionAudioUrl);
    }
  };

  // Humanize timer
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-100px)] min-h-[550px] gap-4" id="practice-session-room">
      {/* Session Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3" id="session-header">
        <div className="flex items-center gap-3">
          <div className="text-3xl" role="img">{language.flag}</div>
          <div>
            <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
              <span>A praticar {language.name}</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                {proficiency}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
              Cenário: <strong className="text-slate-700">{scenario.title}</strong> — Tutor: {voice.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-mono font-medium" id="session-timer">
            <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
            <span>{formatTimer(duration)}</span>
          </div>

          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-2 rounded-lg transition-all ${isFocusMode ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            title="Alternar Modo Foco"
          >
            <Focus className="w-5 h-5" />
          </button>

          <button
            onClick={onExit}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            title="Sair da Sessão"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card "Adaptado ao teu perfil" */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5" id="profile-adaptation-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Adaptado ao teu perfil</h3>
              <p className="text-[11px] text-slate-500">
                Personalização pedagógica e geolinguística em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Nível de personalização: {effectiveSessionContext.personalizationLevel === "high" ? "Alto" : effectiveSessionContext.personalizationLevel === "medium" ? "Médio" : effectiveSessionContext.personalizationLevel === "basic" ? "Básico" : "Padrão"}
            </span>
          </div>
        </div>

        {/* Highlight Chips / Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Regional Variant or Language */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {effectiveSessionContext.regionalVariant === "pt-AO"
                ? "Português (Angola) / pt-AO"
                : effectiveSessionContext.regionalVariant
                ? `Variante: ${effectiveSessionContext.regionalVariant}`
                : `Idioma: ${effectiveSessionContext.targetLanguage}`}
            </span>
          </span>

          {/* CEFR Level */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Nível {effectiveSessionContext.cefrLevel}</span>
          </span>

          {/* Pedagogical Tone / Correction Style */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
            <Smile className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {effectiveSessionContext.preferences?.preferredCorrectionStyle === "gentle"
                ? "Correcções suaves"
                : effectiveSessionContext.preferences?.preferredCorrectionStyle === "direct"
                ? "Correcções directas"
                : effectiveSessionContext.pedagogicalTone === "warm"
                ? "Tom Acolhedor"
                : `Tom: ${effectiveSessionContext.pedagogicalTone}`}
            </span>
          </span>

          {/* Support Language */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700">
            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            <span>
              Apoio em {effectiveSessionContext.primaryLanguage === "pt" ? "português" : effectiveSessionContext.primaryLanguage}
            </span>
          </span>

          {/* Regional Examples guidance */}
          {effectiveSessionContext.culturalContext?.teachingGuidance?.useRegionalExamples && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exemplos regionais activos</span>
            </span>
          )}
        </div>

        {/* Fallback Warning Notice */}
        {effectiveSessionContext.fallbackApplied && (
          <p className="text-xs text-amber-800 bg-amber-50/90 border border-amber-200 px-3 py-1.5 rounded-xl font-medium" id="fallback-notice">
            Personalização básica baseada nas preferências disponíveis.
          </p>
        )}
      </div>

      {/* Main Panel split in two */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left column: Voice Aura, controls, and dynamic subtitles */}
        <div className={`${isFocusMode ? "lg:col-span-12" : "lg:col-span-5"} flex flex-col justify-between border rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${
          ageGroup === "Infancy" 
            ? "bg-gradient-to-b from-sky-100 via-pink-50 to-amber-100 border-sky-200 shadow-lg text-slate-800"
            : ageGroup === "Kids"
            ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 border-indigo-900 shadow-xl text-white"
            : ageGroup === "PreTeens"
            ? "bg-indigo-950 border-indigo-900 shadow-xl text-slate-100"
            : "bg-slate-900 border-slate-800 shadow-2xl text-slate-100" // Teens or others
        }`}>

          {/* Floating animations for kids */}
          {playfulCelebrations.map((item) => (
            <div 
              key={item.id}
              className="absolute pointer-events-none text-4xl animate-bounce z-50 transition-all duration-1000 ease-out"
              style={{
                left: `${item.x}%`,
                bottom: `${item.y}%`,
                animation: "bounce 1s infinite alternate"
              }}
            >
              {item.emoji}
            </div>
          ))}
          
          {/* Top Status */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                sessionStatus === "ready" 
                  ? isSpeaking 
                    ? "bg-violet-500 animate-ping" 
                    : "bg-emerald-500 animate-pulse" 
                  : sessionStatus === "connecting" 
                  ? "bg-amber-400 animate-bounce" 
                  : "bg-rose-500"
              }`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                ageGroup === "Kids" || ageGroup === "PreTeens" || ageGroup === "Teens" ? "text-slate-300" : "text-slate-500"
              }`} id="voice-tutor-status">
                {sessionStatus === "ready" 
                  ? isSpeaking 
                    ? "A falar..." 
                    : isListening 
                    ? "A ouvir..." 
                    : "Ligação pronta" 
                  : sessionStatus === "connecting" 
                  ? "A conectar..." 
                  : "Fora de linha"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {sessionStatus === "ready" && (
                <button
                  id="main-voice-control-btn"
                  aria-label={isMuted ? "Activar microfone" : "Desactivar microfone"}
                  onClick={() => {
                    if (isMuted && speakOutMode === "tts-only") {
                      setSpeakOutMode("voice-input");
                    } else {
                      setIsMuted(!isMuted);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isMuted 
                      ? "bg-red-100 text-red-700 hover:bg-red-200" 
                      : ageGroup === "Kids" 
                      ? "bg-indigo-900 text-indigo-200 hover:bg-indigo-800" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? "Microfone Desactivado" : "Microfone Activo"}</span>
                </button>
              )}

              {sessionStatus === "ready" && (
                <button
                  onClick={() => setSaveAudioEnabled(!saveAudioEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    saveAudioEnabled 
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {saveAudioEnabled ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0" />
                  )}
                  <span>{saveAudioEnabled ? "REC ON" : "REC OFF"}</span>
                </button>
              )}
            </div>
          </div>

          {sessionStatus === "ready" && (
            <div className="mt-4 mb-2">
              <AudioVisualizer analyser={analyser} isMuted={isMuted} />
              <p className="text-[10px] text-center text-indigo-400 mt-1 font-medium tracking-wide">
                Visualizador de Espectro de Voz em Tempo Real
              </p>
            </div>
          )}

          {/* Ambient Sound Selection Widget */}
          {sessionStatus === "ready" && (
            <div className="mt-3 mb-3 p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-2.5 z-10" id="ambient-noise-settings">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Ambiente de Foco & Concentração
                </span>
                {ambientMode !== 'none' && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                    Ativo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setAmbientMode('none')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    ambientMode === 'none'
                      ? "bg-slate-850 border-slate-750 text-white shadow-md"
                      : "bg-slate-900/50 border-slate-800/30 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Desativar som de fundo"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Nenhum</span>
                </button>

                <button
                  onClick={() => setAmbientMode('white')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    ambientMode === 'white'
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/50 border-slate-800/30 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Ruído Branco Suave (Rumble de Foco)"
                >
                  <Wind className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
                  <span>Ruído Br.</span>
                </button>

                <button
                  onClick={() => setAmbientMode('cafe')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    ambientMode === 'cafe'
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30"
                      : "bg-slate-900/50 border-slate-800/30 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Ambiente de Café (Ruído de Fundo + Cliques de Xícara)"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  <span>Café</span>
                </button>
              </div>

              {ambientMode !== 'none' && (
                <div className="flex items-center gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-900/80">
                  <span className="text-[10px] text-slate-400 font-bold select-none shrink-0 uppercase tracking-wide">
                    Volume:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-300 font-mono font-bold select-none shrink-0 w-8 text-right">
                    {Math.round(ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 1. PRIMEIRA INFÂNCIA: Pip Baby Panda Nursery Layout */}
          {ageGroup === "Infancy" && (
            <div className="flex-1 flex flex-col items-center justify-around py-4 z-10">
              {/* Pip Adorable Character */}
              <div className="text-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className={`absolute w-36 h-36 rounded-full bg-sky-300/30 blur-2xl transition-all duration-700 ${
                    isSpeaking ? "scale-150" : "scale-100"
                  }`} />
                  {/* Outer ears panda */}
                  <div className={`w-32 h-32 rounded-full bg-white border-4 border-sky-400 flex flex-col items-center justify-center shadow-lg transition-transform duration-500 relative ${
                    isSpeaking ? "animate-bounce" : "hover:rotate-6"
                  }`}>
                    {/* Cute Ears */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-sky-500 border-4 border-white shadow-xs" />
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-sky-500 border-4 border-white shadow-xs" />
                    {/* Face */}
                    <div className="text-5xl mt-1">🐼</div>
                    {/* Smiling Cheeks */}
                    <div className="flex justify-between w-16 -mt-1">
                      <div className="w-3 h-1.5 rounded-full bg-pink-300 animate-pulse" />
                      <div className="w-3 h-1.5 rounded-full bg-pink-300 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xl tracking-tight text-sky-950 flex items-center justify-center gap-1.5">
                    <span>Pip, o Panda Azul</span>
                    <span className="animate-wiggle inline-block">👋💙</span>
                  </h3>
                  <p className="text-xs text-sky-850 font-medium bg-sky-200/50 px-3 py-1 rounded-full inline-block">
                    {isSpeaking ? "🔊 Pip está a falar contigo!" : "🎙️ Pip está a ouvir! Fala agora!"}
                  </p>
                </div>
              </div>

              {/* Giant Nursery Sound Buttons */}
              <div className="w-full space-y-2 mt-2">
                <p className="text-center text-xs font-bold text-sky-900 uppercase tracking-widest mb-1">Tenta dizer com o Pip: / Try saying:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Miau! 🐱", send: "Miaow!", color: "bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200", sfx: "giggle" as const },
                    { label: "Au-Au! 🐶", send: "Woof woof!", color: "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200", sfx: "clap" as const },
                    { label: "Olá! 👋", send: "Hello!", color: "bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200", sfx: "chime" as const },
                    { label: "Sol! ☀️", send: "Sun!", color: "bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200", sfx: "chime" as const }
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playWebAudioSfx(btn.sfx);
                        wsRef.current?.send(JSON.stringify({ type: "text", data: btn.send }));
                        updateTranscriptItem("user", btn.send);
                      }}
                      className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm shadow-xs transition-all active:scale-95 flex flex-col items-center gap-1 justify-center ${btn.color}`}
                    >
                      <span className="text-base font-bold">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CRIANÇAS PEQUENAS: Space Rocket Adventure & Star Quest Log */}
          {ageGroup === "Kids" && (
            <div className="flex-1 flex flex-col justify-around py-4 z-10">
              {/* Rocket Space Quest Status */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <div>
                      <h4 className="font-bold text-sm tracking-wide text-indigo-200 uppercase">Missão Espacial</h4>
                      <p className="text-xs text-slate-400">Conversa para lançar o foguete!</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900">
                      Level {Math.min(5, Math.floor(transcript.length / 2) + 1)}
                    </span>
                  </div>
                </div>

                {/* Rocket Trek visualizer */}
                <div className="relative h-6 bg-slate-900 border border-indigo-950 rounded-full overflow-hidden flex items-center px-2">
                  <div 
                    className="absolute h-full top-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-30 transition-all duration-700" 
                    style={{ width: `${Math.min(100, (transcript.length / 10) * 100)}%` }}
                  />
                  <div 
                    className="flex items-center transition-all duration-700 relative z-10 gap-1"
                    style={{ marginLeft: `calc(${Math.min(85, (transcript.length / 10) * 100)}% - 8px)` }}
                  >
                    <span className="text-lg animate-pulse">🚀</span>
                    {transcript.length >= 10 && <span className="text-lg animate-bounce">🌕</span>}
                  </div>
                </div>

                {/* Quest Star indicators */}
                <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-xl border border-white/5">
                  <span className="text-xs font-medium text-slate-300">Stars Earned:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const isActive = transcript.length >= starIdx * 2;
                      return (
                        <Star 
                          key={starIdx}
                          className={`w-5 h-5 transition-all duration-500 ${
                            isActive 
                              ? "text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                              : "text-slate-600"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Guidance Tips */}
              <div className="text-center px-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Space Log</span>
                <p className="text-sm font-medium text-slate-200">
                  {transcript.length >= 10 
                    ? "Missão Cumprida! Conseguiste aterrar na Lua! 🌕🎉" 
                    : "Cada frase que disseres alimenta o motor do foguete!"}
                </p>
              </div>

              {/* Animated Interactive Wave Center */}
              <div className="relative flex items-center justify-center h-24 my-1">
                <div className={`absolute w-24 h-24 rounded-full bg-pink-500/10 blur-xl transition-all duration-1000 ${isSpeaking ? "scale-125" : "scale-100"}`} />
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center shadow-lg transition-transform duration-500 ${isSpeaking ? "scale-110 rotate-180" : ""}`}>
                  <Smile className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* 3. PRÉ-ADOLESCENTES: Gaming/Leaderboard Dash */}
          {ageGroup === "PreTeens" && (
            <div className="flex-1 flex flex-col justify-around py-4 z-10 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fire Streak */}
                <div className="bg-slate-900/60 border border-indigo-900/40 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Flame className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300 block uppercase font-bold">Daily Streak</span>
                    <strong className="text-base text-white block">5 Dias 🔥</strong>
                  </div>
                </div>

                {/* Score Widget */}
                <div className="bg-slate-900/60 border border-indigo-900/40 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Trophy className="w-5 h-5 fill-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300 block uppercase font-bold">Your XP</span>
                    <strong className="text-base text-white block">{1200 + (transcript.length * 40)} XP</strong>
                  </div>
                </div>
              </div>

              {/* Category of Interest Selector */}
              <div className="bg-slate-900/40 border border-indigo-900/20 rounded-2xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Escolhe o Tema de Conversa: / Choose Theme:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "gaming", label: "🎮 Gaming (Roblox)", prompt: "Let's chat about video games, Minecraft, Roblox and gaming!" },
                    { id: "sports", label: "⚽ Futebol / Sports", prompt: "Let's talk about sports, soccer, football players, and active lifestyle!" },
                    { id: "music", label: "🎵 Música / TikTok", prompt: "Let's talk about popular songs, TikTok trends, and music bands!" },
                    { id: "food", label: "🍕 Comida / Food", prompt: "Let's talk about delicious food, pizzas, burgers, and recipes!" }
                  ].map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        setSelectedTopic(topic.id);
                        playWebAudioSfx("chime");
                        wsRef.current?.send(JSON.stringify({ type: "text", data: topic.prompt }));
                        updateTranscriptItem("user", `Conversa: ${topic.label}`);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-left truncate cursor-pointer ${
                        selectedTopic === topic.id 
                          ? "bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-950/50" 
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clan Leaderboard Preview */}
              <div className="bg-slate-900/50 border border-indigo-900/30 rounded-2xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Liga LingoLive / Clan Rank</span>
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-indigo-900/10 text-slate-400">
                    <span>1. Sofia 👑</span>
                    <span className="font-mono text-white">1,540 XP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 bg-indigo-900/20 px-2 rounded font-bold text-indigo-200">
                    <span>2. Tu (Você) ⚡</span>
                    <span className="font-mono text-indigo-300">{1200 + (transcript.length * 40)} XP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-slate-400">
                    <span>3. Lucas 🎮</span>
                    <span className="font-mono text-white">1,350 XP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. ADOLESCENTES: Alex WhatsApp/Discord Messenger UI Mockup */}
          {ageGroup === "Teens" && (
            <div className="flex-1 flex flex-col justify-around py-4 z-10 space-y-4">
              {/* Simulated Discord/WhatsApp calling screen representing Alex */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col">
                <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-950">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold font-mono text-slate-400">Discord Call with Alex</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded-full">
                    PING: 32ms
                  </span>
                </div>
                
                {/* Simulated Avatar Area */}
                <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 relative">
                  {/* Backdrop glowing visual */}
                  <div className={`absolute inset-0 bg-indigo-600/5 filter blur-xl transition-all duration-700 ${isSpeaking ? "opacity-100 scale-125" : "opacity-25"}`} />

                  {/* Alex avatar */}
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-indigo-800 shadow-lg border-2 ${
                    isSpeaking ? "border-violet-400 ring-4 ring-violet-500/20 scale-105" : "border-slate-700"
                  } transition-all duration-300`}>
                    <span className="text-3xl">🙋‍♂️</span>
                    
                    {/* Live Voice Indicator Bars */}
                    {isSpeaking && (
                      <div className="absolute -bottom-1 flex items-end gap-0.5 bg-violet-600 px-2 py-0.5 rounded-full border border-violet-400">
                        <div className="w-1 h-3.5 bg-white animate-wave-fast" />
                        <div className="w-1 h-2.5 bg-white animate-wave-slow" style={{ animationDelay: "150ms" }} />
                        <div className="w-1 h-4 bg-white animate-wave-fast" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-100 flex items-center justify-center gap-1">
                      <span>Alex, 16</span>
                      <span className="text-xs font-normal text-slate-400">(Native Friend)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Londres / Paris / Pequim / Rio de Janeiro</p>
                  </div>
                </div>
              </div>

              {/* Speed Controller & Controls Panel */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Speech Speed Helper:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setTeenSpeed("normal");
                        wsRef.current?.send(JSON.stringify({ type: "text", data: "Please resume speaking at normal speed. I got this!" }));
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        teenSpeed === "normal" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-slate-900 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      ⚡ Normal
                    </button>
                    <button
                      onClick={() => {
                        setTeenSpeed("slow");
                        wsRef.current?.send(JSON.stringify({ type: "text", data: "Alex, speak a bit slower and simpler please, buddy." }));
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        teenSpeed === "slow" 
                          ? "bg-amber-600 text-white" 
                          : "bg-slate-900 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      🐢 Slower
                    </button>
                  </div>
                </div>

                {/* Common Youth Slang Info Bar */}
                <div className="border-t border-slate-900 pt-2 text-xs flex items-center justify-between text-slate-400">
                  <span>🚀 Alex's Slang Tool:</span>
                  <span className="font-mono text-indigo-400 font-semibold italic bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/30">
                    {language.code === "en" ? '"Cool" / "Mate" / "No worries"' : 
                     language.code === "fr" ? '"Mec" / "Grave" / "Grave stylé"' :
                     language.code === "pt" ? '"Kamba" / "Mambo" / "Fixe"' : '"Māma" / "Nǐ hǎo"'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Speak Out Mode Selection Widget */}
          {sessionStatus === "ready" && (
            <div 
              className={`mb-4 p-4 border rounded-2xl space-y-2.5 z-10 text-left transition-all ${
                ageGroup === "Infancy"
                  ? "bg-white/70 border-sky-200 text-sky-950 shadow-sm"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-300"
              }`} 
              id="speak-out-mode-settings"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                  ageGroup === "Infancy" ? "text-sky-900" : "text-slate-300"
                }`}>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  🗣️ Speak Out: Modo de Conversação
                </span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  speakOutMode === "voice-input"
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 animate-pulse'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {speakOutMode === "voice-input" ? "Voz Ativa 🎙️" : "Silencioso 🤫"}
                </span>
              </div>

              <p className={`text-[11px] leading-normal ${
                ageGroup === "Infancy" ? "text-sky-800" : "text-slate-400"
              }`}>
                {speakOutMode === "voice-input" 
                  ? "Modo de conversa fluida por voz. Fale diretamente no microfone para conversar em tempo real."
                  : "Ideal para ambientes silenciosos. Digite sua resposta no teclado e ouça a pronúncia do tutor por áudio."}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSpeakOutMode('voice-input')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    speakOutMode === 'voice-input'
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      : ageGroup === "Infancy"
                        ? "bg-white/80 border-sky-200/50 text-sky-900 hover:bg-sky-100/50"
                        : "bg-slate-900/50 border-slate-800/30 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Voice-input Conversation: Fale e ouça"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Conversa por Voz</span>
                </button>

                <button
                  onClick={() => setSpeakOutMode('tts-only')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    speakOutMode === 'tts-only'
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30"
                      : ageGroup === "Infancy"
                        ? "bg-white/80 border-sky-200/50 text-sky-900 hover:bg-sky-100/50"
                        : "bg-slate-900/50 border-slate-800/30 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Text-to-Speech only: Digite e ouça"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Apenas Texto-para-Voz</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtitles Display card - Beautifully styled and formatted based on Age Group */}
          <div className={`p-5 rounded-2xl min-h-[110px] shadow-sm flex flex-col justify-center transition-all duration-300 border ${
            ageGroup === "Infancy"
              ? "bg-amber-50/90 border-amber-200/60 text-sky-950"
              : ageGroup === "Kids"
              ? "bg-slate-900/90 border-slate-800 text-white"
              : "bg-slate-950/90 border-slate-900 text-slate-200"
          }`}>
            {lastModelCaption ? (
              <div className="space-y-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  ageGroup === "Infancy" ? "text-sky-700" : "text-indigo-400"
                }`}>
                  {voice.name}
                </span>

                {/* Chinese characters mapping (Pinyin requirement) */}
                {language.code === "zh" && (ageGroup === "Infancy" || ageGroup === "Kids") ? (
                  renderChineseKaraoke(lastModelCaption)
                ) : (
                  <p className={`font-sans leading-relaxed text-center sm:text-left ${
                    ageGroup === "Infancy" 
                      ? "text-sky-950 font-extrabold text-xl" 
                      : ageGroup === "Kids"
                      ? "text-yellow-300 font-extrabold text-lg"
                      : "text-slate-100 font-medium text-sm italic"
                  }`}>
                    "{lastModelCaption}"
                  </p>
                )}
              </div>
            ) : lastUserCaption ? (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu dissete / You said</span>
                <p className={`italic ${ageGroup === "Infancy" ? "text-slate-800 font-bold" : "text-slate-300 text-sm"}`}>
                  "{lastUserCaption}"
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic text-center py-2 flex flex-col items-center gap-1 justify-center">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span>
                  {ageGroup === "Infancy" 
                    ? 'Diz "Olá" ao Pip para brincar!' 
                    : ageGroup === "Kids"
                    ? 'Inicia a missão! Fala no microfone agora.'
                    : 'Diz "Olá" ou digita uma mensagem para começar!'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right column: Interactive Transcript Scroll & Word Dictionary lookup */}
        <div className={`lg:col-span-7 ${isFocusMode ? "hidden" : "flex"} flex-col h-full bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden`}>
          {/* Section Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Real-time Interactive Transcript</span>
            </h3>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
              Tap any word for translation
            </span>
          </div>

          {/* Transcript Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                <Sparkles className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-700" id="empty-transcript-message">Inicia a conversa para ver a transcrição em tempo real.</p>
                <p className="text-xs max-w-xs text-center leading-relaxed text-slate-500">
                  A tua transcrição de conversa aparecerá aqui. Clica nas palavras para ver traduções e guardá-las no teu baralho.
                </p>
              </div>
            ) : (
              transcript.map((item) => {
                const isModel = item.role === "model";
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col max-w-[85%] ${
                      isModel ? "self-start items-start" : "self-end items-end ml-auto"
                    }`}
                  >
                    {/* Timestamp & Name */}
                    <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                      {isModel ? voice.name : "You"} • {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>

                    {/* Word-by-word interactive block */}
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      isModel 
                        ? "bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-tl-none" 
                        : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tr-none"
                    }`}>
                      {/* Split text into individual clickable word tags */}
                      {item.text.split(" ").map((word, wIdx) => {
                        // Keep pure alphabetic characters for click, but display the exact formatting
                        return (
                          <span
                            key={wIdx}
                            onClick={() => handleWordClick(word)}
                            className="inline-block mr-1 hover:text-indigo-600 hover:underline cursor-help transition-colors"
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Text Input Row (Fallback) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder={isWhisperTranscribing ? "Transcribing with Whisper..." : `Type a reply in ${language.name}...`}
              className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-hidden transition-all"
              disabled={sessionStatus !== "ready" || isWhisperTranscribing}
            />
            
            {/* Whisper Speech-to-Text Button */}
            <button
              onClick={toggleWhisperRecording}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center relative border ${
                isWhisperRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-500 shadow-md shadow-red-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200"
              } disabled:opacity-50 disabled:pointer-events-none`}
              disabled={sessionStatus !== "ready" || isWhisperTranscribing}
              title={isWhisperRecording ? "Click to stop recording" : "Speak with Whisper Speech-to-Text"}
            >
              {isWhisperTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : isWhisperRecording ? (
                <Mic className="w-4 h-4 animate-bounce" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isWhisperRecording && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-ping" />
              )}
            </button>

            <button
              onClick={handleSendText}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              disabled={!textInput.trim() || sessionStatus !== "ready" || isWhisperTranscribing || isWhisperRecording}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Instant Dictionary Floating Pane (Triggered by word clicking) */}
      {selectedPhrase && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhrase(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Phrase Heading */}
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Instant Dictionary Lookup</span>
              </div>
              <h4 className="text-2xl font-display font-bold text-slate-800">
                "{selectedPhrase}"
              </h4>
            </div>

            {isExplaining ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500">Asking AI to define and explain...</span>
              </div>
            ) : phraseExplanation ? (
              <div className="space-y-4">
                {/* Meaning & Phonetics */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-400 font-semibold uppercase">English Meaning</div>
                  <p className="text-slate-900 font-semibold text-lg mt-0.5">
                    {phraseExplanation.meaning}
                  </p>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    Pronounced: <strong className="text-slate-700">{phraseExplanation.pronunciation}</strong>
                  </div>
                </div>

                {/* Grammar note */}
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Grammar & Context Note</div>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                    {phraseExplanation.grammarNote}
                  </p>
                </div>

                {/* Usage Example */}
                <div className="border-l-2 border-indigo-400 pl-3">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Usage Example</div>
                  <p className="text-slate-800 text-sm font-semibold mt-1">
                    {phraseExplanation.exampleOriginal}
                  </p>
                  <p className="text-slate-500 text-xs italic mt-0.5">
                    {phraseExplanation.exampleTranslation}
                  </p>
                </div>

                {/* Save Word CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedPhrase(null)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-all cursor-pointer"
                  >
                    Got It
                  </button>
                  <button
                    onClick={handleSaveVocabulary}
                    disabled={explanationSaved}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      explanationSaved
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                    }`}
                  >
                    {explanationSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved in Deck</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 fill-white" />
                        <span>Save to Vocab Deck</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 flex flex-col items-center gap-1 text-sm">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-1" />
                <span>Could not generate phrase explanation. Please try clicking another word.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Room Session Ending footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3" id="session-actions-footer">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          No fim da sessão, o Tutor analisará fluência, vocabulário e pontos de melhoria.
        </p>
        
        <button
          onClick={handleEndSessionWithAudio}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
          id="end-session-btn"
          aria-label="Terminar sessão e receber feedback"
        >
          <Award className="w-4 h-4" />
          <span>Terminar sessão e receber feedback</span>
        </button>
      </div>

      {/* Beta Time Limit Reached Modal Overlay */}
      {isBetaExpired && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300" id="beta-expired-overlay">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Top Glow Bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600" />
            
            {/* Clock Icon */}
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-100 shadow-xs animate-bounce">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight">
              Programa BETA - Tempo Limite
            </h3>

            {/* Description containing the EXACT required Portuguese text */}
            <p className="text-slate-600 text-base font-semibold leading-relaxed mb-8 px-2" id="beta-expired-message">
              Programa BETA tempo terminado, adquira ja o pacote premium e tenha acesso a todas funcionalidades.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={onExit}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                id="btn-adquirir-premium"
              >
                <Sparkles className="w-5 h-5 fill-white animate-pulse" />
                <span>Adquirir Pacote Premium</span>
              </button>

              <button
                onClick={() => {
                    localStorage.removeItem("lingolive_beta_expired");
                    signOut(auth);
                }}
                className="w-full py-3.5 text-red-500 hover:text-red-800 font-bold hover:bg-red-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                id="btn-sair"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {showPronunciationModal && currentTip && (
        <PronunciationTipModal
          tip={currentTip}
          onClose={() => {
            setShowPronunciationModal(false);
            proceedToEndSession();
          }}
        />
      )}
    </div>
  );
}
