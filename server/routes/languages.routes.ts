import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeSetDoc, localMemoryDb } from "../services/firestoreSafe.service";
import { dbAdmin } from "../config/firebaseAdmin";

const router = Router();

export interface LanguageEngineItem {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  code: string;
  difficulty: "Fácil" | "Médio" | "Difícil" | string;
  writingSystem: string;
  rtl: boolean;
  availableLevels: string[];
  lessons: number;
  units: number;
  grammar: boolean;
  vocabulary: boolean;
  pronunciation: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  aiTutor: boolean;
  cultureModule: boolean;
  quizEngine: boolean;
  gameEngine: boolean;
  achievements: boolean;
  certification: boolean;
}

// Initial languages seeded with all 22 properties of the Language Engine
const DEFAULT_LANGUAGES: LanguageEngineItem[] = [
  {
    id: "en",
    name: "Inglês",
    nativeName: "English",
    flag: "🇺🇸",
    code: "en",
    difficulty: "Médio",
    writingSystem: "Latino",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    lessons: 150,
    units: 15,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: true,
  },
  {
    id: "fr",
    name: "Francês",
    nativeName: "Français",
    flag: "🇫🇷",
    code: "fr",
    difficulty: "Médio",
    writingSystem: "Latino",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2", "C1"],
    lessons: 120,
    units: 12,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: true,
  },
  {
    id: "pt",
    name: "Português",
    nativeName: "Português",
    flag: "🇦🇴",
    code: "pt",
    difficulty: "Fácil",
    writingSystem: "Latino",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    lessons: 140,
    units: 14,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: true,
  },
  {
    id: "es",
    name: "Espanhol",
    nativeName: "Español",
    flag: "🇪🇸",
    code: "es",
    difficulty: "Fácil",
    writingSystem: "Latino",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    lessons: 130,
    units: 13,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: true,
  },
  {
    id: "de",
    name: "Alemão",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    code: "de",
    difficulty: "Difícil",
    writingSystem: "Latino",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2", "C1"],
    lessons: 110,
    units: 11,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: true,
  },
  {
    id: "zh",
    name: "Chinês",
    nativeName: "中文 (Mandarim)",
    flag: "🇨🇳",
    code: "zh",
    difficulty: "Difícil",
    writingSystem: "Ideogramas Hanzi",
    rtl: false,
    availableLevels: ["A1", "A2", "B1", "B2"],
    lessons: 90,
    units: 9,
    grammar: true,
    vocabulary: true,
    pronunciation: true,
    speechRecognition: true,
    speechSynthesis: true,
    aiTutor: true,
    cultureModule: true,
    quizEngine: true,
    gameEngine: true,
    achievements: true,
    certification: false,
  }
];

// In-memory key for dynamic languages
const DYNAMIC_LANGS_KEY = "dynamic_languages_list";

// Helper: Get list of custom languages
async function getCustomLanguages(): Promise<LanguageEngineItem[]> {
  const customList: LanguageEngineItem[] = localMemoryDb.get(DYNAMIC_LANGS_KEY) || [];
  
  if (dbAdmin) {
    try {
      const snapshot = await dbAdmin.collection("languages").get();
      const dbList: LanguageEngineItem[] = [];
      snapshot.forEach((doc: any) => {
        dbList.push({ id: doc.id, ...doc.data() } as LanguageEngineItem);
      });
      // Merge unique ones, preferring Firestore
      const merged = [...dbList];
      customList.forEach(item => {
        if (!merged.some(m => m.id === item.id)) {
          merged.push(item);
        }
      });
      return merged;
    } catch (e) {
      console.warn("[Languages Engine] Firestore load failed, using local fallback state:", e);
    }
  }
  return customList;
}

// 1. GET ALL LANGUAGES (Default + Custom merged)
router.get("/languages", async (req, res) => {
  try {
    const custom = await getCustomLanguages();
    
    // Merge, ensuring custom ones override or add to defaults
    const allLangs = [...DEFAULT_LANGUAGES];
    custom.forEach((customLang) => {
      const idx = allLangs.findIndex(l => l.id === customLang.id);
      if (idx > -1) {
        allLangs[idx] = customLang;
      } else {
        allLangs.push(customLang);
      }
    });

    return res.json(allLangs);
  } catch (err: any) {
    console.error("[Languages Engine] Error listing languages:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. CREATE NEW LANGUAGE (Requires Auth)
router.post("/languages", requireAuth, async (req: any, res) => {
  const newLang: Partial<LanguageEngineItem> = req.body;

  if (!newLang.id || !newLang.name || !newLang.nativeName || !newLang.code) {
    return res.status(400).json({ error: "Os campos id, name, nativeName e code são obrigatórios." });
  }

  // Set default properties for all 22 fields if they aren't provided
  const completeLang: LanguageEngineItem = {
    id: newLang.id.toLowerCase().trim(),
    name: newLang.name.trim(),
    nativeName: newLang.nativeName.trim(),
    flag: newLang.flag || "🏳️",
    code: newLang.code.toLowerCase().trim(),
    difficulty: newLang.difficulty || "Médio",
    writingSystem: newLang.writingSystem || "Latino",
    rtl: !!newLang.rtl,
    availableLevels: newLang.availableLevels || ["A1", "A2"],
    lessons: Number(newLang.lessons) || 10,
    units: Number(newLang.units) || 1,
    grammar: newLang.grammar !== false,
    vocabulary: newLang.vocabulary !== false,
    pronunciation: newLang.pronunciation !== false,
    speechRecognition: newLang.speechRecognition !== false,
    speechSynthesis: newLang.speechSynthesis !== false,
    aiTutor: newLang.aiTutor !== false,
    cultureModule: newLang.cultureModule !== false,
    quizEngine: newLang.quizEngine !== false,
    gameEngine: newLang.gameEngine !== false,
    achievements: newLang.achievements !== false,
    certification: newLang.certification !== false,
  };

  try {
    // Persist to localMemoryDb
    const currentCustom = localMemoryDb.get(DYNAMIC_LANGS_KEY) || [];
    const filtered = currentCustom.filter((l: any) => l.id !== completeLang.id);
    localMemoryDb.set(DYNAMIC_LANGS_KEY, [...filtered, completeLang]);

    // Persist to Firestore if available
    await safeSetDoc("languages", completeLang.id, completeLang);

    console.log(`[Languages Engine] Novo idioma adicionado com sucesso: ${completeLang.name} (${completeLang.code})`);
    return res.status(201).json(completeLang);
  } catch (err: any) {
    console.error("[Languages Engine] Erro ao criar novo idioma:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE LANGUAGE (Requires Auth)
router.put("/languages/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const updates: Partial<LanguageEngineItem> = req.body;

  try {
    const custom = await getCustomLanguages();
    const existing = custom.find(l => l.id === id) || DEFAULT_LANGUAGES.find(l => l.id === id);

    if (!existing) {
      return res.status(404).json({ error: "Idioma não encontrado." });
    }

    const updatedLang: LanguageEngineItem = {
      ...existing,
      ...updates,
      id: existing.id // protect id from being changed
    };

    // Update custom list in Memory DB
    const currentCustom = localMemoryDb.get(DYNAMIC_LANGS_KEY) || [];
    const filtered = currentCustom.filter((l: any) => l.id !== id);
    localMemoryDb.set(DYNAMIC_LANGS_KEY, [...filtered, updatedLang]);

    // Update in Firestore
    await safeSetDoc("languages", id, updatedLang);

    return res.json(updatedLang);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. DELETE CUSTOM LANGUAGE (Requires Auth)
router.delete("/languages/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  if (DEFAULT_LANGUAGES.some(l => l.id === id)) {
    return res.status(400).json({ error: "Não é permitido eliminar os idiomas padrão do sistema." });
  }

  try {
    const currentCustom = localMemoryDb.get(DYNAMIC_LANGS_KEY) || [];
    const filtered = currentCustom.filter((l: any) => l.id !== id);
    localMemoryDb.set(DYNAMIC_LANGS_KEY, filtered);

    if (dbAdmin) {
      await dbAdmin.collection("languages").doc(id).delete();
    }

    return res.json({ success: true, message: "Idioma personalizado eliminado com sucesso." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
