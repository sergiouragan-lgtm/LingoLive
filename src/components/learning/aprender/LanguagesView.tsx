import React, { useState, useEffect } from 'react';
import { Search, Globe, Check, Sparkles, BookOpen, ChevronRight, Save, MapPin, Plus, Trash2, Edit3, Settings, ToggleLeft, ToggleRight, Database, AlertCircle, Cpu, Languages, ArrowRight, Compass, Heart, Volume2, Activity, Award, Network, ChevronDown, Book, FileText, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../../types';

export interface LanguageEngineItem {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  code: string;
  difficulty: string;
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

interface RegionalVariantItem {
  code: string;
  label: string;
  flag: string;
  details: string[];
}

const REGIONAL_VARIANTS: Record<string, RegionalVariantItem[]> = {
  "Inglês": [
    { code: "US", label: "Estados Unidos", flag: "🇺🇸", details: ["Pronúncia americana", "Expressões americanas", "Popular para negócios"] },
    { code: "GB", label: "Reino Unido", flag: "🇬🇧", details: ["Pronúncia britânica", "Expressões britânicas", "Uso académico"] },
    { code: "CA", label: "Canadá", flag: "🇨🇦", details: ["Inglês canadiano", "Sotaque suave", "Bilinguismo"] },
    { code: "AU", label: "Austrália", flag: "🇦🇺", details: ["Inglês australiano", "Expressões únicas", "Estilo descontraído"] },
    { code: "INT", label: "Inglês Internacional", flag: "🌍", details: ["Recomendado", "Compreensão universal", "Uso global"] }
  ],
  "Português": [
    { code: "BR", label: "Brasil", flag: "🇧🇷", details: ["Português Brasileiro", "Sotaque melódico", "Expressões vibrantes"] },
    { code: "PT", label: "Portugal", flag: "🇵🇹", details: ["Português Europeu", "Sotaque clássico", "Expressões tradicionais"] },
    { code: "AO", label: "Angola", flag: "🇦🇴", details: ["Português Angolano", "Sotaque africano único", "Cultura rica"] },
    { code: "MZ", label: "Moçambique", flag: "🇲🇿", details: ["Português Moçambicano", "Sotaque rítmico", "Identidade local"] }
  ],
  "Francês": [
    { code: "FR", label: "França", flag: "🇫🇷", details: ["Francês Europeu", "Padrão de negócios e diplomacia"] },
    { code: "CA", label: "Canadá (Quebec)", flag: "🇨🇦", details: ["Francês Quebequense", "Expressões clássicas norte-americanas"] },
    { code: "BE", label: "Bélgica", flag: "🇧🇪", details: ["Francês Belga", "Sotaque e termos específicos", "Septante e nonante"] },
    { code: "CH", label: "Suíça", flag: "🇨🇭", details: ["Francês Suíço", "Sotaque melodioso", "Uso financeiro"] }
  ],
  "Espanhol": [
    { code: "ES", label: "Espanha", flag: "🇪🇸", details: ["Espanhol Castelhano", "Pronúncia europeia clássica"] },
    { code: "MX", label: "México", flag: "🇲🇽", details: ["Espanhol Mexicano", "Maior população hispânica", "Mídia e negócios"] },
    { code: "AR", label: "Argentina", flag: "🇦🇷", details: ["Espanhol Rioplatense", "Sotaque único", "Uso do 'vos'"] },
    { code: "CO", label: "Colômbia", flag: "🇨🇴", details: ["Espanhol Colombiano", "Pronúncia clara e neutra"] }
  ],
  "Alemão": [
    { code: "DE", label: "Alemanha", flag: "🇩🇪", details: ["Alemão Standard Hochdeutsch", "Língua de engenharia e ciência"] },
    { code: "AT", label: "Áustria", flag: "🇦🇹", details: ["Alemão Austríaco", "Nuances locais e sotaque elegante"] },
    { code: "CH", label: "Suíça", flag: "🇨🇭", details: ["Alemão Suíço", "Dialeto único e sotaque característico"] }
  ],
  "Italiano": [
    { code: "IT", label: "Itália", flag: "🇮🇹", details: ["Padrão de Florença", "Língua da arte, gastronomia e música"] }
  ],
  "Chinês": [
    { code: "CN", label: "China (Mandarim)", flag: "🇨🇳", details: ["Mandarim Simplificado", "Uso oficial de Pequim"] },
    { code: "TW", label: "Taiwan", flag: "🇹🇼", details: ["Mandarim Tradicional", "Escrita tradicional", "Nuances locais"] }
  ]
};

export interface TaxonomyNode {
  title: string;
  value: string;
  desc: string;
}

export interface FullTaxonomy {
  regiao: TaxonomyNode;
  pronuncia: TaxonomyNode;
  vocabulario: TaxonomyNode;
  ortografia: TaxonomyNode;
  cultura: TaxonomyNode;
  iaConversacional: TaxonomyNode;
  vozes: TaxonomyNode;
  exercicios: TaxonomyNode;
  certificacoes: TaxonomyNode;
}

export const getTaxonomyData = (lang: string, region: string): FullTaxonomy => {
  const cleanLang = (lang || "").trim();
  const cleanRegion = (region || "").trim();

  if (cleanLang === "Inglês" && cleanRegion === "US") {
    return {
      regiao: { title: "Região", value: "América do Norte (General American)", desc: "Sotaque General American, cobrindo o inglês executivo, científico e de negócios dos Estados Unidos da América." },
      pronuncia: { title: "Pronúncia", value: "Fonética Rótica & Flapping de /t/", desc: "Sons do /r/ acentuados pós-vocálicos e redução vocálica. O /t/ intervocálico converte-se em flap rápido [d] (ex: 'water')." },
      vocabulario: { title: "Vocabulário", value: "Léxico Standard dos EUA", desc: "Uso ativo de termos nativos como 'subway', 'elevator', 'apartment', 'soccer', 'cookie', 'french fries' e gírias locais." },
      ortografia: { title: "Ortografia", value: "Normas Webster (Merriam-Webster)", desc: "Adoção rigorosa da grafia americana standard: terminações em -or (color), -er (center) e verbos em -ize (realize)." },
      cultura: { title: "Cultura", value: "Estilo Pragmático-Corporativo", desc: "Incorporação de celebrações dos EUA (Thanksgiving, 4th of July), etiqueta de negócios de Silicon Valley e provérbios americanos." },
      iaConversacional: { title: "IA Conversacional", value: "Tom Assertivo & Negócios", desc: "A IA adapta-se a um tom otimista, assertivo, focado em pragmatismo, eficácia corporativa e resolução direta de dúvidas." },
      vozes: { title: "Vozes", value: "4 Vozes Premium Neurais (2F / 2M)", desc: "Acesso a quatro vozes sintéticas ultra-realistas calibradas com sotaque General American, otimizadas para shadowing." },
      exercicios: { title: "Exercícios", value: "Apresentações e Redação Executiva", desc: "Simulações de entrevistas de emprego nos EUA, elaboração de e-mails de vendas corporativas e escuta de sotaques regionais." },
      certificacoes: { title: "Certificações", value: "Alinhamento TOEFL iBT & IELTS", desc: "Atividades dinâmicas e critérios de avaliação configurados conforme o padrão de pontuação do TOEFL iBT e IELTS." }
    };
  }

  if (cleanLang === "Inglês" && cleanRegion === "GB") {
    return {
      regiao: { title: "Região", value: "Reino Unido & Commonwealth", desc: "Sotaque clássico britânico Received Pronunciation (RP) com variações de Londres (Estuário) a sotaques do norte." },
      pronuncia: { title: "Pronúncia", value: "Fonética Não-Rótica", desc: "Supressão do som do /r/ no fim das sílabas (ex: 'car' soa 'cah'). Uso distinto do 't' glotal em falas informais." },
      vocabulario: { title: "Vocabulário", value: "Dicionário Britânico Standard", desc: "Utiliza termos característicos como 'underground', 'lift', 'flat', 'football', 'biscuit', 'chips' e gírias tradicionais." },
      ortografia: { title: "Ortografia", value: "Padrão de Escrita de Oxford", desc: "Grafia britânica tradicional: terminações em -our (colour), -re (centre) e desinências verbais preferencialmente em -ise." },
      cultura: { title: "Cultura", value: "Etiqueta e Tradição Britânica", desc: "Expressões refinadas de cortesia formal ('mind the gap', 'cheers'), herança histórica, e hábitos de convívio britânicos." },
      iaConversacional: { title: "IA Conversacional", value: "Tom Polido e Intelectual", desc: "Postura elegante, respostas completas, com alto teor linguístico, vocabulário erudito e cortesia académica." },
      vozes: { title: "Vozes", value: "3 Vozes de Alta Fidelidade (1F / 1M / 1N)", desc: "Vozes neurais britânicas cristalinas de extrema clareza e uma voz de síntese académica com tom neutro." },
      exercicios: { title: "Exercícios", value: "Discussão e Análise Literária", desc: "Leitura guiada de artigos da BBC, shadowing de sotaques britânicos e elaboração de relatórios formais." },
      certificacoes: { title: "Certificações", value: "Exames Cambridge (CAE/CPE)", desc: "Exercícios estruturados para responder aos padrões exigidos pelas certificações Cambridge e IELTS Academic." }
    };
  }

  if (cleanLang === "Português" && cleanRegion === "BR") {
    return {
      regiao: { title: "Região", value: "Brasil (Nacional)", desc: "Calibração focada na variante brasileira, com foco especial nas normas urbanas de prestígio do Sudeste e Sul." },
      pronuncia: { title: "Pronúncia", value: "Vogais Abertas & Ritmo Melódico", desc: "Entonação aberta, ritmo de fala silábico e cadenciado, e vocalização do /l/ final de palavra como som de [u]." },
      vocabulario: { title: "Vocabulário", value: "Léxico Coloquial & Técnico", desc: "Expressões comuns como 'celular', 'ônibus', 'trem', 'café da manhã', 'legal', 'cara' e terminologia tecnológica nativa." },
      ortografia: { title: "Ortografia", value: "Acordo Ortográfico (Norma BR)", desc: "Remoção total de consoantes mudas não articuladas (ex: 'ação', 'ótimo') conforme a Convenção Ortográfica Brasileira." },
      cultura: { title: "Cultura", value: "História & Cotidiano Brasileiro", desc: "Provérbios brasileiros, feriados nacionais, gírias locais, hábitos sociais contemporâneos e riqueza musical." },
      iaConversacional: { title: "IA Conversacional", value: "Persona Afetiva e Dinâmica", desc: "A IA Kamba assume uma postura extremamente acolhedora, com uso frequente de termos motivadores e linguagem amigável." },
      vozes: { title: "Vozes", value: "4 Vozes Locais (2F / 2M)", desc: "Modelos neurais com sotaques brasileiros naturais de excelente cadência, ideais para shadowing e diálogos rápidos." },
      exercicios: { title: "Exercícios", value: "Interações Sociais & Gírias", desc: "Simulações de compras cotidianas, redação informal e interpretação de gírias e expressões regionais do Brasil." },
      certificacoes: { title: "Certificações", value: "Alinhamento Celpe-Bras", desc: "Atividades e escutas preparatórias estruturadas nos moldes do exame oficial brasileiro de proficiência Celpe-Bras." }
    };
  }

  if (cleanLang === "Português" && cleanRegion === "PT") {
    return {
      regiao: { title: "Região", value: "Portugal Continental e Ilhas", desc: "Padrão europeu de referência fonológica (Coimbra/Lisboa), contemplando nuances fonéticas do norte e arquipélagos." },
      pronuncia: { title: "Pronúncia", value: "Ritmo Acentual & Redução de Vogais", desc: "Silibação fechada com forte redução de vogais átonas, ritmo rápido e pronúncia marcada de consoantes sibilantes." },
      vocabulario: { title: "Vocabulário", value: "Dicionário Europeu", desc: "Uso de vocábulos exclusivos como 'telemóvel', 'autocarro', 'comboio', 'pequeno-almoço', 'fixe', 'gajo', 'propina'." },
      ortografia: { title: "Ortografia", value: "Padrão Europeu Pós-Acordo", desc: "Conserva algumas consoantes quando são articuladas na norma europeia, com regras de hifenização tradicionais de Portugal." },
      cultura: { title: "Cultura", value: "Tradição Lusa & Literatura", desc: "Provérbios clássicos de Portugal, fado, gastronomia portuguesa, herança histórica profunda e referências literárias camonianas." },
      iaConversacional: { title: "IA Conversacional", value: "Persona Polida e Respeitosa", desc: "Configuração do Kamba para uso preciso da cortesia lusa (distinção entre tratamento informal 'tu' e formal 'o senhor/a senhora')." },
      vozes: { title: "Vozes", value: "3 Vozes de Alta Definição", desc: "Vozes neurais portuguesas refinadas de alta fidelidade que articulam o ritmo europeu com extrema precisão." },
      exercicios: { title: "Exercícios", value: "Shadowing Rápido & Redação Formal", desc: "Treinos auditivos para compreender a fala nativa acelerada, interpretação de notícias de Portugal e cartas administrativas." },
      certificacoes: { title: "Certificações", value: "Diretrizes do CAPLE", desc: "Simulações calibradas para os testes oficiais de proficiência europeia CAPLE (CIPLE, DEPLE, DIPLE)." }
    };
  }

  if (cleanLang === "Português" && cleanRegion === "AO") {
    return {
      regiao: { title: "Região", value: "Angola (Padrão Luanda)", desc: "Calibração e foco dialetal centrados na norma de Luanda, estendendo-se por todo o território angolano." },
      pronuncia: { title: "Pronúncia", value: "Ritmo Rítmico & Vogais Claras", desc: "Articulação vocal ampla e sonora com ritmo de fala cadenciado, melodioso e de excelente legibilidade auditiva." },
      vocabulario: { title: "Vocabulário", value: "Léxico de Angola & Kimbundu", desc: "Riquíssimo acervo de termos e empréstimos das línguas nacionais (como Kimbundu), ex: 'machimbombo', 'kota', 'ndengue', 'wi', 'kamba'." },
      ortografia: { title: "Ortografia", value: "Normas da República de Angola", desc: "Respeito às convenções e grafias recomendadas em Angola inseridas no quadro do Acordo Ortográfico." },
      cultura: { title: "Cultura", value: "Tradição Oral & Ritmos Nacionais", desc: "Semba, Kizomba, literatura angolana contemporânea, provérbios tradicionais e ricas narrativas folclóricas locais." },
      iaConversacional: { title: "IA Conversacional", value: "Tom Caloroso & Altíssimo Respeito", desc: "Calibração do Kamba AI para saudações tradicionais com elevado respeito geracional ('kotes', 'ndengues') e fomento local." },
      vozes: { title: "Vozes", value: "2 Vozes Cadenciadas Locais", desc: "Vozes masculinas e femininas neurais com sotaque angolano legítimo de excelente ritmo de entonação." },
      exercicios: { title: "Exercícios", value: "Diálogos e Reuniões de Negócios", desc: "Simulações de reuniões de negócios em Luanda, conversas socioculturais imersivas e shadowing de regionalismos angolanos." },
      certificacoes: { title: "Certificações", value: "Certificado LingoLIVE Angola", desc: "Geração de relatórios de proficiência e badges customizados de fluência adaptados para o mercado angolano." }
    };
  }

  // Fallback default
  return {
    regiao: { title: "Região", value: `${cleanLang} (${cleanRegion})`, desc: `Foco geográfico e dialetal calibrado para o país e províncias associadas ao código de variante regional '${cleanRegion}'.` },
    pronuncia: { title: "Pronúncia", value: "Entonação e Sotaque Local", desc: "Regulação do motor fonético da IA para reproduzir as inflexões, ritmos e sons vocálicos tradicionais da região." },
    vocabulario: { title: "Vocabulário", value: "Dicionário Dialetal Ativo", desc: "Mapeamento automático de termos nativos e vocábulos comuns para garantir o falar local natural." },
    ortografia: { title: "Ortografia", value: "Convenção Escrita Local", desc: "Escrita alinhada com as reformas oficiais de ortografia, pontuação e convenções gramaticais do território." },
    cultura: { title: "Cultura", value: "Contextualização de Costumes", desc: "Inclusão de tradições históricas, provérbios populares e referências sociais nas conversas da IA." },
    iaConversacional: { title: "IA Conversacional", value: "Persona Cognitiva Adaptativa", desc: "Ajuste do comportamento e da formalidade de chat da IA para respeitar a etiqueta social preferida localmente." },
    vozes: { title: "Vozes", value: "Motores Vocais Locais", desc: "Seleção e aceleração de vozes com sotaque nativo para simulação humana em tempo real." },
    exercicios: { title: "Exercícios", value: "Práticas Imersivas Regionais", desc: "Exercícios adaptados para fixar o vocabulário regionalizado, sotaques nativos e compreensão de áudios locais." },
    certificacoes: { title: "Certificações", value: "Quadro de Proficiência Local", desc: "Relatórios de competência linguística baseados nas diretrizes globais do CEFR para o nível correspondente." }
  };
};

interface LanguagesViewProps {
  selectedLanguage: Language;
  setSelectedLanguage: (l: Language) => void;
  userProfile: any;
  onUpdateLanguageAndVariant: (langName: string, variantCode: string) => Promise<void>;
  localization: any;
}

export const LanguagesView: React.FC<LanguagesViewProps> = ({
  selectedLanguage,
  setSelectedLanguage,
  userProfile,
  onUpdateLanguageAndVariant,
  localization
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState<string>("Inglês");
  const [activeRegion, setActiveRegion] = useState<string>("US");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'picker' | 'engine'>('picker');
  const [activeTaxonomyNode, setActiveTaxonomyNode] = useState<keyof FullTaxonomy>('regiao');

  // Language Engine State
  const [languages, setLanguages] = useState<LanguageEngineItem[]>([]);
  const [isLoadingLangs, setIsLoadingLangs] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // New Language Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newNativeName, setNewNativeName] = useState('');
  const [newFlag, setNewFlag] = useState('🏳️');
  const [newCode, setNewCode] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('Médio');
  const [newWritingSystem, setNewWritingSystem] = useState('Latino');
  const [newRtl, setNewRtl] = useState(false);
  const [newLevels, setNewLevels] = useState('A1, A2, B1, B2');
  const [newLessons, setNewLessons] = useState(30);
  const [newUnits, setNewUnits] = useState(3);
  const [newGrammar, setNewGrammar] = useState(true);
  const [newVocabulary, setNewVocabulary] = useState(true);
  const [newPronunciation, setNewPronunciation] = useState(true);
  const [newSpeechRec, setNewSpeechRec] = useState(true);
  const [newSpeechSynth, setNewSpeechSynth] = useState(true);
  const [newAiTutor, setNewAiTutor] = useState(true);
  const [newCultureModule, setNewCultureModule] = useState(true);
  const [newQuizEngine, setNewQuizEngine] = useState(true);
  const [newGameEngine, setNewGameEngine] = useState(true);
  const [newAchievements, setNewAchievements] = useState(true);
  const [newCertification, setNewCertification] = useState(true);

  // Load languages from Express Language Engine API
  const loadLanguagesFromApi = async () => {
    setIsLoadingLangs(true);
    try {
      const res = await fetch("/api/languages");
      if (res.ok) {
        const data = await res.json();
        setLanguages(data);
      } else {
        throw new Error("Não foi possível carregar a API do Motor de Idiomas.");
      }
    } catch (e) {
      console.warn("[Languages Engine] Erro ao carregar da API, usando fallback resiliente em memória local:", e);
      // Fallback local se a API não responder
      setLanguages([
        {
          id: "en", name: "Inglês", nativeName: "English", flag: "🇺🇸", code: "en",
          difficulty: "Médio", writingSystem: "Latino", rtl: false,
          availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"], lessons: 150, units: 15,
          grammar: true, vocabulary: true, pronunciation: true, speechRecognition: true,
          speechSynthesis: true, aiTutor: true, cultureModule: true, quizEngine: true,
          gameEngine: true, achievements: true, certification: true
        },
        {
          id: "fr", name: "Francês", nativeName: "Français", flag: "🇫🇷", code: "fr",
          difficulty: "Médio", writingSystem: "Latino", rtl: false,
          availableLevels: ["A1", "A2", "B1", "B2", "C1"], lessons: 120, units: 12,
          grammar: true, vocabulary: true, pronunciation: true, speechRecognition: true,
          speechSynthesis: true, aiTutor: true, cultureModule: true, quizEngine: true,
          gameEngine: true, achievements: true, certification: true
        },
        {
          id: "pt", name: "Português", nativeName: "Português", flag: "🇦🇴", code: "pt",
          difficulty: "Fácil", writingSystem: "Latino", rtl: false,
          availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"], lessons: 140, units: 14,
          grammar: true, vocabulary: true, pronunciation: true, speechRecognition: true,
          speechSynthesis: true, aiTutor: true, cultureModule: true, quizEngine: true,
          gameEngine: true, achievements: true, certification: true
        },
        {
          id: "es", name: "Espanhol", nativeName: "Español", flag: "🇪🇸", code: "es",
          difficulty: "Fácil", writingSystem: "Latino", rtl: false,
          availableLevels: ["A1", "A2", "B1", "B2", "C1", "C2"], lessons: 130, units: 13,
          grammar: true, vocabulary: true, pronunciation: true, speechRecognition: true,
          speechSynthesis: true, aiTutor: true, cultureModule: true, quizEngine: true,
          gameEngine: true, achievements: true, certification: true
        }
      ]);
    } finally {
      setIsLoadingLangs(false);
    }
  };

  useEffect(() => {
    loadLanguagesFromApi();
  }, []);

  // Synchronize state with current database profile
  useEffect(() => {
    if (userProfile?.learningLanguage) {
      setActiveLang(userProfile.learningLanguage);
    }
    if (userProfile?.targetRegion) {
      setActiveRegion(userProfile.targetRegion);
    }
  }, [userProfile]);

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentVariants = REGIONAL_VARIANTS[activeLang] || [
    { code: "Standard", label: "Padrão Internacional", flag: "🌍", details: ["Fidelidade gramatical", "Sotaque neutro", "Aceito globalmente"] }
  ];

  // Auto select a valid variant if activeLang changes
  const handleSelectLanguage = (langName: string) => {
    setActiveLang(langName);
    const variants = REGIONAL_VARIANTS[langName] || [];
    if (variants.length > 0) {
      setActiveRegion(variants[0].code);
    } else {
      setActiveRegion("Standard");
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await onUpdateLanguageAndVariant(activeLang, activeRegion);
    } catch (error) {
      console.error("Failed to update regional preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new dynamic language to the Language Engine
  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newId || !newName || !newNativeName || !newCode) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios (ID, Nome, Nome Nativo e Código).");
      return;
    }

    const payload: Partial<LanguageEngineItem> = {
      id: newId.toLowerCase().trim(),
      name: newName.trim(),
      nativeName: newNativeName.trim(),
      flag: newFlag.trim(),
      code: newCode.toLowerCase().trim(),
      difficulty: newDifficulty,
      writingSystem: newWritingSystem,
      rtl: newRtl,
      availableLevels: newLevels.split(',').map(s => s.trim()).filter(Boolean),
      lessons: Number(newLessons),
      units: Number(newUnits),
      grammar: newGrammar,
      vocabulary: newVocabulary,
      pronunciation: newPronunciation,
      speechRecognition: newSpeechRec,
      speechSynthesis: newSpeechSynth,
      aiTutor: newAiTutor,
      cultureModule: newCultureModule,
      quizEngine: newQuizEngine,
      gameEngine: newGameEngine,
      achievements: newAchievements,
      certification: newCertification,
    };

    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Reload from server
        await loadLanguagesFromApi();
        setShowAddModal(false);
        // Clear inputs
        setNewId('');
        setNewName('');
        setNewNativeName('');
        setNewFlag('🏳️');
        setNewCode('');
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Erro ao registar o idioma no servidor.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao ligar ao servidor.");
    }
  };

  // Toggle a single engine boolean property via API
  const handleToggleProperty = async (langId: string, property: keyof LanguageEngineItem) => {
    const lang = languages.find(l => l.id === langId);
    if (!lang) return;

    const updatedValue = !lang[property];
    
    try {
      // Optimistic update
      setLanguages(prev => prev.map(l => l.id === langId ? { ...l, [property]: updatedValue } : l));

      const res = await fetch(`/api/languages/${langId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ [property]: updatedValue })
      });

      if (!res.ok) {
        // Rollback on error
        setLanguages(prev => prev.map(l => l.id === langId ? { ...l, [property]: !updatedValue } : l));
        console.error("Falha ao atualizar propriedade do Motor no servidor.");
      }
    } catch (e) {
      // Rollback
      setLanguages(prev => prev.map(l => l.id === langId ? { ...l, [property]: !updatedValue } : l));
      console.error(e);
    }
  };

  // Delete dynamic custom language
  const handleDeleteLanguage = async (langId: string) => {
    if (["en", "fr", "pt", "es", "de", "zh"].includes(langId)) {
      alert("Não é permitido eliminar os idiomas nucleares padrão do sistema.");
      return;
    }

    if (!window.confirm("Tem a certeza que deseja eliminar este idioma do Motor LingoLIVE?")) {
      return;
    }

    try {
      const res = await fetch(`/api/languages/${langId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setLanguages(prev => prev.filter(l => l.id !== langId));
      } else {
        const err = await res.json();
        alert(err.error || "Falha ao apagar idioma.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeVariantDetails = currentVariants.find(v => v.code === activeRegion) || currentVariants[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in" id="languages-view-container">
      {/* Header with Selector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} className="animate-pulse text-indigo-400" />
            <span>Painel Core LingoLIVE IA</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-100 bg-clip-text text-transparent">
            {activeTab === 'picker' ? 'Selecione o Idioma & Variante Regional' : 'Motor de Idiomas Global (Language Engine)'}
          </h2>
          <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
            {activeTab === 'picker' 
              ? 'Personalize o sotaque, vocabulário e expressões culturais que a inteligência artificial utilizará para conversar consigo.'
              : 'Gerencie o compilador fonético, módulos cognitivos, inteligibilidade verbal e recursos lúdicos para cada idioma registado.'}
          </p>
        </div>

        {/* Tab Toggle Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'picker'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} />
            <span>Foco Regional</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={14} />
            <span>Language Engine</span>
          </button>
        </div>
      </div>

      {activeTab === 'picker' ? (
        /* TAB 1: FOCUS REGIONAL PICKER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: LANGUAGES GRID */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} className="text-indigo-400" />
                1. Escolha o Idioma
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredLanguages.length} disponíveis
              </span>
            </div>

            {/* Search Field */}
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Pesquisar idioma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
            </div>

            {/* Languages Scroll List */}
            <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {isLoadingLangs ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  A carregar motor de idiomas...
                </div>
              ) : filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang, index) => {
                  const isSelected = activeLang === lang.name;
                  return (
                    <motion.button
                      key={lang.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.4) }}
                      onClick={() => handleSelectLanguage(lang.name)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-left group relative overflow-hidden ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/40 shadow-indigo-500/5'
                          : 'border-slate-850 hover:border-slate-750 bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 transition-colors ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-750 group-hover:text-indigo-400'
                        }`}>
                          {lang.flag}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-100 block group-hover:text-indigo-300 transition-colors">
                            {lang.name}
                            <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                              ({lang.nativeName})
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Sistema: {lang.writingSystem} • Dificuldade: <span className="text-indigo-400 font-medium">{lang.difficulty}</span>
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 shrink-0">
                        {isSelected ? (
                          <span className="p-1 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                            <Check size={10} />
                          </span>
                        ) : (
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhum idioma ativo para "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: REGIONAL VARIANTS SELECTOR */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} className="text-indigo-400" />
                2. Variante Regional de {activeLang}
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-800 px-2 py-0.5 rounded-full">
                {currentVariants.length} variante(s)
              </span>
            </div>

            {/* Regional Variant Cards Grid */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 md:p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-normal mb-1">
                Selecione o sotaque e o dicionário local. A inteligência artificial ajustará a fonética, a entonação da voz e as gírias do dia-a-dia de acordo com a sua escolha:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {currentVariants.map((variant) => {
                  const isSelected = activeRegion === variant.code;
                  return (
                    <button
                      key={variant.code}
                      type="button"
                      onClick={() => setActiveRegion(variant.code)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl filter drop-shadow-sm shrink-0">
                            {variant.flag}
                          </span>
                          <span className="font-bold text-xs text-slate-200 group-hover:text-indigo-300 transition-colors block truncate max-w-[120px]">
                            {variant.label}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="p-0.5 bg-indigo-500 text-white rounded-full shrink-0">
                            <Check size={8} />
                          </span>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-700 group-hover:border-indigo-500/40 transition-colors" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-auto">
                        {variant.details.slice(0, 2).map((detail, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-850 rounded text-[9px] text-slate-400 border border-slate-700/60 font-medium truncate max-w-full">
                            {detail}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selection Info Footer */}
              <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Variante Ativa</span>
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="text-base">{activeVariantDetails?.flag}</span>
                    {activeLang} - {activeVariantDetails?.label || "Padrão"} ({activeRegion})
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSavePreferences}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 shrink-0"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Confirmar Escolha Regional</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* TAXONOMY STRUCTURAL TREE DIAGRAM (IDIOMA -> VARIANTE -> 9 ATTRIBUTES) */}
          <div className="col-span-1 md:col-span-12 lg:col-span-12 mt-6 space-y-6">
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Network className="text-indigo-400 animate-pulse" size={18} />
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Taxonomia Estrutural da Variante Selecionada
                </h4>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-normal">
                Veja como o Motor de Inteligência LingoLIVE se ramifica a partir do idioma base até aos 9 pilares funcionais da variante regional escolhida:
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* TREE CANVAS/DIAGRAM */}
              <div className="xl:col-span-7 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden">
                {/* Subtle Grid Accent in background */}
                <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                
                {/* Tree Structure rendering */}
                <div className="relative flex flex-col items-center md:items-start gap-6 md:pl-4 z-10">
                  {/* ROOT NODE: IDIOMA */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg ring-1 ring-slate-800/50">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                      <Globe size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Idioma Raiz</span>
                      <span className="text-xs font-extrabold text-slate-100">{activeLang}</span>
                    </div>
                  </div>

                  {/* Vertical Connector 1 */}
                  <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-emerald-500 md:ml-4" />

                  {/* SUB-ROOT NODE: VARIANTE */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-emerald-500/30 px-4 py-2.5 rounded-xl shadow-lg ring-1 ring-emerald-500/20">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                      {activeVariantDetails?.flag || "🌍"}
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">Variante de Foco</span>
                      <span className="text-xs font-extrabold text-slate-100">
                        {activeVariantDetails?.label || "Padrão"} ({activeRegion})
                      </span>
                    </div>
                  </div>

                  {/* Vertical Connector 2 */}
                  <div className="hidden md:block w-0.5 h-4 bg-emerald-500 md:ml-4" />

                  {/* 9 Taxonomy Leaf Nodes Grid */}
                  <div className="w-full mt-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-3 text-center md:text-left">
                      Selecione um dos 9 pilares de governação abaixo para inspecionar em detalhe:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: "regiao", title: "Região", icon: Compass, color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
                        { key: "pronuncia", title: "Pronúncia", icon: Mic, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" },
                        { key: "vocabulario", title: "Vocabulário", icon: Book, color: "text-violet-400 border-violet-500/20 bg-violet-500/5" },
                        { key: "ortografia", title: "Ortografia", icon: FileText, color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
                        { key: "cultura", title: "Cultura", icon: Heart, color: "text-rose-400 border-rose-500/20 bg-rose-500/5" },
                        { key: "iaConversacional", title: "IA Conversacional", icon: Cpu, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                        { key: "vozes", title: "Vozes", icon: Volume2, color: "text-teal-400 border-teal-500/20 bg-teal-500/5" },
                        { key: "exercicios", title: "Exercícios", icon: Activity, color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
                        { key: "certificacoes", title: "Certificações", icon: Award, color: "text-purple-400 border-purple-500/20 bg-purple-500/5" }
                      ].map((node) => {
                        const IconComponent = node.icon;
                        const isCurrent = activeTaxonomyNode === node.key;
                        const taxInfo = getTaxonomyData(activeLang, activeRegion)[node.key as keyof FullTaxonomy];
                        
                        return (
                          <button
                            key={node.key}
                            type="button"
                            onClick={() => setActiveTaxonomyNode(node.key as keyof FullTaxonomy)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 group/node hover:scale-[1.02] ${
                              isCurrent
                                ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10"
                                : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isCurrent ? "bg-indigo-500/20 text-indigo-300" : node.color
                            }`}>
                              <IconComponent size={14} className={isCurrent ? "" : "group-hover/node:animate-pulse"} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block leading-none">
                                {node.title}
                              </span>
                              <span className="text-xs font-bold block truncate mt-0.5 text-slate-200 group-hover/node:text-indigo-300 transition-colors">
                                {taxInfo?.value || "Carregando..."}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SPEC DETAILS DRAWER CARD */}
              <div className="xl:col-span-5">
                <AnimatePresence mode="wait">
                  {(() => {
                    const activeTaxInfo = getTaxonomyData(activeLang, activeRegion)[activeTaxonomyNode];
                    if (!activeTaxInfo) return null;

                    const nodeMeta = {
                      regiao: { title: "Região Geopolítica", icon: Compass, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                      pronuncia: { title: "Regulamento Fonético", icon: Mic, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
                      vocabulario: { title: "Léxico & Regionalismos", icon: Book, color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
                      ortografia: { title: "Regra Ortográfica", icon: FileText, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
                      cultura: { title: "Património Cultural", icon: Heart, color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
                      iaConversacional: { title: "Tom & Engenharia Cognitiva", icon: Cpu, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                      vozes: { title: "Motores Neurais Ativos", icon: Volume2, color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
                      exercicios: { title: "Cenários de Prática", icon: Activity, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
                      certificacoes: { title: "Padrão de Avaliação", icon: Award, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
                    }[activeTaxonomyNode];

                    const IconComp = nodeMeta.icon;

                    return (
                      <motion.div
                        key={activeTaxonomyNode}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="bg-slate-900/40 border border-indigo-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl ring-1 ring-indigo-500/10"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${nodeMeta.color}`}>
                            <IconComp size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">
                              {nodeMeta.title}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-100 mt-0.5">
                              {activeTaxInfo.title}
                            </h4>
                          </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Configuração Ativa</span>
                          <span className="text-xs font-bold text-indigo-300 block">
                            {activeTaxInfo.value}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Impacto de Governação</span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 p-4 border border-slate-850/60 rounded-xl">
                            {activeTaxInfo.desc}
                          </p>
                        </div>

                        {/* Integration checkmark status */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-400 font-medium">
                          <Check size={12} className="shrink-0" />
                          <span>Módulo de IA integrado e operando sob restrição de {activeVariantDetails?.label || "Padrão"}.</span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: DETAILED LANGUAGE ENGINE SCHEMATICS (22 PROPERTIES CONTROLLER) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-400" size={18} />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Módulos de Sistema & Engenharia Cognitiva
              </h3>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <Plus size={14} />
              <span>Compilar Novo Idioma</span>
            </button>
          </div>

          {/* Grid of Languages Engine Configuration Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {languages.map((lang) => (
              <div 
                key={lang.id} 
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden group"
              >
                {/* Visual Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-slate-800 p-2 rounded-xl border border-slate-750">
                      {lang.flag}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-100">{lang.name}</h4>
                        <span className="text-xs text-slate-400">({lang.nativeName})</span>
                        <span className="px-2 py-0.5 bg-slate-800 rounded-full text-[10px] text-indigo-400 font-bold border border-slate-700 uppercase">
                          {lang.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dificuldade: <span className="text-indigo-300 font-bold">{lang.difficulty}</span> • Escrita: <span className="text-slate-300">{lang.writingSystem}</span> {lang.rtl && <span className="text-amber-400 font-bold ml-1">(RTL)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Delete button only for dynamic languages */}
                  {!["en", "fr", "pt", "es", "de", "zh"].includes(lang.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLanguage(lang.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title="Eliminar este idioma personalizado"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Níveis</span>
                    <span className="text-xs font-bold text-slate-300">{lang.availableLevels.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Lições</span>
                    <span className="text-xs font-bold text-slate-300">{lang.lessons}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Unidades</span>
                    <span className="text-xs font-bold text-slate-300">{lang.units}</span>
                  </div>
                </div>

                {/* 12 Boolean Engine Capabilities Toggles */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2.5">
                    Módulos Funcionais Ativos (22 Elementos de Governação)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "grammar", label: "Grammar Core" },
                      { key: "vocabulary", label: "Vocab Dict" },
                      { key: "pronunciation", label: "Phonetic Core" },
                      { key: "speechRecognition", label: "Whisper Speech" },
                      { key: "speechSynthesis", label: "TTS Synthesis" },
                      { key: "aiTutor", label: "Kamba AI Tutor" },
                      { key: "cultureModule", label: "Culture Map" },
                      { key: "quizEngine", label: "Quiz Engine" },
                      { key: "gameEngine", label: "Gamification" },
                      { key: "achievements", label: "Achievements" },
                      { key: "certification", label: "CEFR Certificate" }
                    ].map((feature) => {
                      const value = !!lang[feature.key as keyof LanguageEngineItem];
                      return (
                        <button
                          key={feature.key}
                          type="button"
                          onClick={() => handleToggleProperty(lang.id, feature.key as keyof LanguageEngineItem)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                            value 
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold' 
                              : 'bg-slate-950/30 border-slate-850 text-slate-500'
                          }`}
                        >
                          <span>{feature.label}</span>
                          {value ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPILATION / ADD NEW LANGUAGE DIALOG (MODAL) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="text-indigo-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-100">Compilar Novo Idioma no Motor Cognitivo</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddLanguage} className="space-y-4">
                {/* Block 1: Identificadores Nucleares */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">ID do Idioma *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: ja" 
                      required
                      value={newId}
                      onChange={(e) => {
                        setNewId(e.target.value);
                        setNewCode(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Nome em Português *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Japonês" 
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Nome Nativo *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 日本語" 
                      required
                      value={newNativeName}
                      onChange={(e) => setNewNativeName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Block 2: Características Tipográficas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Bandeira (Emoji)</label>
                    <input 
                      type="text" 
                      value={newFlag}
                      onChange={(e) => setNewFlag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Código ISO</label>
                    <input 
                      type="text" 
                      value={newCode}
                      placeholder="Ex: ja"
                      required
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Dificuldade</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Sistema de Escrita</label>
                    <input 
                      type="text" 
                      value={newWritingSystem}
                      onChange={(e) => setNewWritingSystem(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Block 3: Métricas Pedagógicas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Níveis CEFR</label>
                    <input 
                      type="text" 
                      value={newLevels}
                      onChange={(e) => setNewLevels(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Total Lições</label>
                    <input 
                      type="number" 
                      value={newLessons}
                      onChange={(e) => setNewLessons(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Total Unidades</label>
                    <input 
                      type="number" 
                      value={newUnits}
                      onChange={(e) => setNewUnits(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        id="newRtl"
                        checked={newRtl}
                        onChange={(e) => setNewRtl(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0"
                      />
                      <label htmlFor="newRtl" className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Escrita RTL</label>
                    </div>
                  </div>
                </div>

                {/* Block 4: Toggles de Motor Cognitivo */}
                <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                    Ativar Módulos Funcionais (Schema 22 Itens)
                  </span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { state: newGrammar, setter: setNewGrammar, label: "Módulo de Gramática" },
                      { state: newVocabulary, setter: setNewVocabulary, label: "Vocabulário Ativo" },
                      { state: newPronunciation, setter: setNewPronunciation, label: "Motor de Fonemas" },
                      { state: newSpeechRec, setter: setNewSpeechRec, label: "Reconhecimento (Whisper)" },
                      { state: newSpeechSynth, setter: setNewSpeechSynth, label: "Síntese Vocal (TTS)" },
                      { state: newAiTutor, setter: setNewAiTutor, label: "Tutor IA Kamba" },
                      { state: newCultureModule, setter: setNewCultureModule, label: "Módulo Cultural" },
                      { state: newQuizEngine, setter: setNewQuizEngine, label: "Motor de Quizzes" },
                      { state: newGameEngine, setter: setNewGameEngine, label: "Jogos & Lúdico" },
                      { state: newAchievements, setter: setNewAchievements, label: "Sistema Conquistas" },
                      { state: newCertification, setter: setNewCertification, label: "Certificação CEFR" },
                    ].map((m, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input 
                          type="checkbox"
                          checked={m.state}
                          onChange={(e) => m.setter(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-850 text-indigo-500 focus:ring-0"
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 active:scale-95"
                  >
                    <Save size={14} />
                    <span>Salvar e Compilar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Information Section */}
      <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[30%] h-[200%] rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none rotate-12" />
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 animate-pulse">
          <BookOpen size={20} />
        </div>
        <div className="space-y-1 z-10">
          <h4 className="font-bold text-sm text-slate-200">Como funciona a Governação e Escalonamento Regional?</h4>
          <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
            A arquitetura LingoLIVE baseia-se num motor em rede acoplado a microsserviços neurais distribuídos. Quando ativa uma variante regional, as chamadas direcionadas à inteligência artificial são instruídas a modelar o sotaque selecionado e as particularidades lexicais. O painel superior <strong className="text-indigo-400">Language Engine</strong> permite auditar todas as 22 capacidades regulamentares de cada idioma dinamicamente.
          </p>
        </div>
      </div>
    </div>
  );
};
