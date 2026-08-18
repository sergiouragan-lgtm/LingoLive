import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { IntelligentProfile } from "../../types/intelligentProfile";
import { User } from "firebase/auth";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Globe, 
  User as UserIcon, 
  Compass, 
  Trophy, 
  BookOpen, 
  Target, 
  Clock, 
  Calendar,
  Gamepad2,
  Smile,
  Zap,
  HelpCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocalization, useLanguageChanged } from "../../context/LocalizationContext";
import type { Attribute, SmartProfile } from "../../profile/types";
import { getDefaultInterfaceLanguageForCountry } from "../../data/regionalLanguageCatalog";

interface OnboardingProps {
  user: User | null;
  onComplete: (profileData: any) => void;
}

// Full Country Details List
interface CountryItem {
  code: string;
  name: string;
  flag: string;
  currency: string;
  timezone: string;
}

const COUNTRIES: CountryItem[] = [
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "Euro", timezone: "Europe/Lisbon" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "Real", timezone: "America/Sao_Paulo" },
  { code: "AO", name: "Angola", flag: "🇦🇴", currency: "Kwanza", timezone: "Africa/Luanda" },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿", currency: "Metical", timezone: "Africa/Maputo" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻", currency: "Escudo", timezone: "Atlantic/Cape_Verde" },
  { code: "FR", name: "França", flag: "🇫🇷", currency: "Euro", timezone: "Europe/Paris" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", currency: "Dólar Americano", timezone: "America/New_York" },
  { code: "GW", name: "Guiné-Bissau", flag: "🇬🇼", currency: "Franco CFA", timezone: "Africa/Bissau" },
  { code: "ST", name: "São Tomé e Príncipe", flag: "🇸🇹", currency: "Dobra", timezone: "Africa/Sao_Tome" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", currency: "Dólar Americano", timezone: "Asia/Dili" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", currency: "Libra Esterlina", timezone: "Europe/London" },
  { code: "ES", name: "Espanha", flag: "🇪🇸", currency: "Euro", timezone: "Europe/Madrid" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪", currency: "Euro", timezone: "Europe/Berlin" },
  { code: "IT", name: "Itália", flag: "🇮🇹", currency: "Euro", timezone: "Europe/Rome" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "Yuan", timezone: "Asia/Shanghai" },
  { code: "JP", name: "Japão", flag: "🇯🇵", currency: "Iene", timezone: "Asia/Tokyo" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", currency: "Dólar Canadiano", timezone: "America/Toronto" },
  { code: "AU", name: "Austrália", flag: "🇦🇺", currency: "Dólar Australiano", timezone: "Australia/Sydney" }
];

interface LanguageItem {
  id: string;
  name: string;
  translated: string;
  desc: string;
  icon: string;
}

const LANGUAGES_LIST: LanguageItem[] = [
  { id: "Inglês", name: "English", translated: "Inglês", desc: "Idioma global, negócios e ciência", icon: "🌐" },
  { id: "Français", name: "Français", translated: "Francês", desc: "Cultura, diplomacia e negócios", icon: "🌐" },
  { id: "Português", name: "Português", translated: "Português", desc: "Comunicação global e literatura", icon: "🌐" },
  { id: "Español", name: "Español", translated: "Espanhol", desc: "Muito utilizado nas Américas e Europa", icon: "🌐" },
  { id: "Deutsch", name: "Deutsch", translated: "Alemão", desc: "Engenharia, indústria e tecnologia", icon: "🌐" },
  { id: "Italiano", name: "Italiano", translated: "Italiano", desc: "Arte, gastronomia e música clássica", icon: "🌐" },
  { id: "Chinês", name: "中文 (Zhōngwén)", translated: "Chinês", desc: "Negócios, tecnologia e comércio global", icon: "🌐" },
  { id: "Japonês", name: "日本語 (Nihongo)", translated: "Japonês", desc: "Tecnologia, cultura pop e inovação", icon: "🌐" },
  { id: "Russo", name: "Русский (Russkiy)", translated: "Russo", desc: "Ciência, literatura e tecnologia", icon: "🌐" },
  { id: "Coreano", name: "한국어 (Hangugeo)", translated: "Coreano", desc: "Música (K-Pop), tecnologia e cinema", icon: "🌐" },
  { id: "Tailandês", name: "ภาษาไทย (Phasa Thai)", translated: "Tailandês", desc: "Cultura, turismo e gastronomia", icon: "🌐" },
  { id: "Búlgaro", name: "Български (Bŭlgarski)", translated: "Búlgaro", desc: "História, língua eslava", icon: "🌐" },
  { id: "Alemão", name: "Deutsch", translated: "Alemão", desc: "História, filosofia e tecnologia", icon: "🌐" },
  { id: "Árabe", name: "العربية (Al-'Arabiyyah)", translated: "Árabe", desc: "História, comércio e diplomacia", icon: "🌐" }
];

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
  ],
  "Japonês": [
    { code: "JP", label: "Japão", flag: "🇯🇵", details: ["Japonês Padrão (Hyojungo)", "Foco em Tóquio", "Linguagem honorífica Keigo"] }
  ],
  "Russo": [
    { code: "RU", label: "Rússia", flag: "🇷🇺", details: ["Russo Padrão", "Foco em Moscovo", "Uso euro-asiático amplo"] }
  ],
  "Coreano": [
    { code: "KR", label: "Coreia do Sul", flag: "🇰🇷", details: ["Coreano de Seul", "K-Drama e K-Pop", "Escrita Hangul moderna"] }
  ],
  "Árabe": [
    { code: "EG", label: "Egito", flag: "🇪🇬", details: ["Árabe Egípcio", "Dialeto mais falado", "Cultura e mídia"] },
    { code: "SA", label: "Arábia Saudita", flag: "🇸🇦", details: ["Árabe Khaliji (Golfo)", "Popular para negócios e diplomacia"] },
    { code: "MSA", label: "Árabe Moderno Padrão", flag: "🌍", details: ["Fusha (Internacional)", "Mídia escrita, jornais e TV"] }
  ]
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "Estados Unidos": "us",
  "Brasil": "br",
  "Reino Unido": "gb",
  "França": "fr",
  "Japão": "jp",
  "Espanha": "es",
  "Itália": "it",
  "Alemanha": "de",
  "Angola": "ao",
  "Canadá": "ca",
};

const ANXIOUS_COUNTRIES = [
  { name: "Estados Unidos", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=300&auto=format&fit=crop&q=60", alert: "SISTEMA INTEGRADO" },
  { name: "Brasil", flag: "🇧🇷", image: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=300&auto=format&fit=crop&q=60", alert: "CONEXÃO ATIVA" },
  { name: "Reino Unido", flag: "🇬🇧", image: "https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?w=300&auto=format&fit=crop&q=60", alert: "ALTA DEMANDA" },
  { name: "França", flag: "🇫🇷", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&auto=format&fit=crop&q=60", alert: "FALANTES ATIVOS" },
  { name: "Japão", flag: "🇯🇵", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&auto=format&fit=crop&q=60", alert: "SESSÃO PRONTA" },
  { name: "Espanha", flag: "🇪🇸", image: "https://images.unsplash.com/photo-1543728770-1145156a65df?w=300&auto=format&fit=crop&q=60", alert: "ESTUDO IMERSIVO" },
  { name: "Itália", flag: "🇮🇹", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=60", alert: "CONEXÃO RÁPIDA" },
  { name: "Alemanha", flag: "🇩🇪", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=300&auto=format&fit=crop&q=60", alert: "FOCO TOTAL" },
  { name: "Angola", flag: "🇦🇴", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&auto=format&fit=crop&q=60", alert: "REGIONAL ATIVO" },
  { name: "Canadá", flag: "🇨🇦", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=60", alert: "SESSÕES ONLINE" },
];

const WELCOME_TRANSLATIONS: Record<string, { title: string; desc: string; button: string; countryName: string; flag: string }> = {
  pt: {
    title: "Bem-vindo ao LingoLIVE IA",
    desc: "Vamos configurar rapidamente a sua experiência de aprendizagem. Isso leva menos de 1 minuto.",
    button: "COMEÇAR",
    countryName: "Português",
    flag: "🇵🇹"
  },
  br: {
    title: "Bem-vindo ao LingoLIVE IA",
    desc: "Vamos configurar rapidamente a sua experiência de aprendizagem. Isso leva menos de 1 minuto.",
    button: "COMEÇAR",
    countryName: "Português (Brasil)",
    flag: "🇧🇷"
  },
  en: {
    title: "Welcome to LingoLIVE AI",
    desc: "Let's quickly set up your learning experience. This takes less than 1 minute.",
    button: "START",
    countryName: "English",
    flag: "🇺🇸"
  },
  zh: {
    title: "欢迎来到 LingoLIVE 智能",
    desc: "让我们快速设置您的学习体验。这只需不到1分钟。",
    button: "开始",
    countryName: "中文 (简体)",
    flag: "🇨🇳"
  },
  es: {
    title: "Bienvenido a LingoLIVE IA",
    desc: "Configuremos rápidamente tu experiencia de aprendizaje. Esto lleva menos de 1 minuto.",
    button: "COMENZAR",
    countryName: "Español",
    flag: "🇪🇸"
  },
  fr: {
    title: "Bienvenue sur LingoLIVE IA",
    desc: "Configurons rapidement votre expérience d'apprentissage. Cela prend moins d'une minute.",
    button: "COMMENCER",
    countryName: "Français",
    flag: "🇫🇷"
  },
  de: {
    title: "Willkommen bei LingoLIVE KI",
    desc: "Lassen Sie uns Ihre Lernerfahrung schnell einrichten. Das dauert weniger als 1 Minute.",
    button: "STARTEN",
    countryName: "Deutsch",
    flag: "🇩🇪"
  },
  ja: {
    title: "LingoLIVE AIへようこそ",
    desc: "学習体験をすばやく設定しましょう。1分もかかりません。",
    button: "開始",
    countryName: "日本語",
    flag: "🇯🇵"
  },
  it: {
    title: "Benvenuto in LingoLIVE IA",
    desc: "Configuriamo rapidamente la tua experiência de apprendimento. Ci vorrà meno di 1 minuto.",
    button: "INIZIA",
    countryName: "Italiano",
    flag: "🇮🇹"
  }
};

const ONBOARDING_I18N: Record<string, Record<string, string>> = {
  pt: {
    bannerTitle: "CONEXÃO MULTILÍNGUE GLOBAL EM ANDAMENTO... NÃO PERCA TEMPO!",
    bannerTime: "TEMPO CRÍTICO",
    step2_header: "Dados Pessoais",
    step2_title: "Conte-nos sobre você",
    step2_age: "Qual é a sua idade?",
    step2_age_placeholder: "Ex: 25",
    step2_age_error: "Insira uma idade válida entre 5 e 99 anos.",
    step2_gender: "Género",
    step2_male: "Masculino",
    step2_female: "Feminino",
    step2_other: "Prefiro não informar",
    step2_country: "País de Residência",
    step2_country_placeholder: "Pesquise o país (ex: Angola, Portugal...)",
    step2_country_empty: "Nenhum país encontrado",
    step2_currency: "Moeda",
    step2_timezone: "Fuso Horário",
    back: "Voltar",
    continue: "Continuar",
    step3_header: "Idioma Nativo",
    step3_title: "Qual é o seu idioma principal?",
    step4_back: "Voltar para escolha de idioma",
    step4_header1: "Etapa 1: Escolha o Idioma",
    step4_header2: "Etapa 2: Escolha a Variante Regional",
    step4_title1: "Que idioma deseja aprender?",
    step4_title2: "Qual variante de {lang} prefere?",
    step4_desc1: "Selecione um idioma da nossa lista interativa de parceiros de IA.",
    step4_desc2: "Escolha uma variante para a IA personalizar sotaque, vocabulário e referências culturais.",
    step4_search: "Pesquisar idioma nativo ou traduzido...",
    step4_empty: 'Nenhum idioma encontrado para "{search}"',
    step4_advance: "Avançar",
    step5_header: "Regionalismo & Gírias",
    step5_title: "Personalize o sotaque e gírias",
    step5_desc: "Defina qual variante regional você deseja focar e como a IA deve gerenciar gírias e expressões locais.",
    step5_selected: "Idioma Selecionado",
    step5_mode: "Modo de Aprendizagem",
    step5_mode_desc: "Standard foca na gramática; Colloquial foca no uso real das ruas.",
    step5_formal: "Formal",
    step5_colloquial: "Coloquial",
    step5_expr: "Expressões Regionais",
    step5_expr_desc: "Apresentar termos regionais como complementos de vocabulário.",
    step5_expr_enabled: "Habilitadas",
    step5_expr_disabled: "Bloqueadas",
    step5_slang: "Uso de Gírias Locais",
    step5_slang_desc_kids: "Gírias indisponíveis para faixa etária de 5 a 8 anos.",
    step5_slang_desc: "Adicionar gírias saudáveis do dia a dia no diálogo com o tutor.",
    step5_slang_locked: "Bloqueado por idade",
    step5_slang_allow: "Permitir",
    step5_slang_block: "Bloquear",
    step6_header: "Nível de Idioma",
    step6_title: "Qual é o seu nível atual?",
    step6_desc: "Selecione o nível que melhor descreve suas habilidades.",
    step6_or: "Ou",
    step6_test: "Não sei meu nível (Realizar teste de nivelamento)",
    step6_quest: "Questão {curr} de {total}",
    step6_cancel: "Cancelar",
    step6_done: "Teste Concluído!",
    step6_done_desc: "Acertou {score} de {total} questões. Estimamos seu nível ideal de proficiência!",
    step6_suggested: "Nível Sugerido",
    step6_confirm: "Confirmar e Avançar",
    step7_header: "Objetivo",
    step7_title: "Por que deseja aprender este idioma?",
    step7_desc: "Selecione um objetivo para personalizar as lições.",
    step8_header: "Tempo Disponível",
    step8_title: "Quanto tempo pretende estudar por dia?",
    step8_desc: "Selecione a intensidade de estudos diária.",
    step9_header: "Frequência",
    step9_title: "Quantos dias por semana pretende praticar?",
    step9_desc: "Praticar {days} {days_label} por semana garante consistência de estudo e ajuda na fixação rápida do idioma!",
    step9_day: "dia",
    step9_days: "dias",
    step10_loader_title: "A IA está preparando o seu plano personalizado.",
    step11_title: "Parabéns!",
    step11_desc: "Seu plano de aprendizagem foi criado com sucesso.",
    step11_profile_summary: "Resumo do Perfil",
    step11_age: "Idade",
    step11_years: "anos",
    step11_country: "País",
    step11_native: "Idioma Nativo",
    step11_target: "Idioma Alvo",
    step11_level: "Nível Estimado",
    step11_slangs_reg: "Gírias & Regionalismos",
    step11_slangs_lib: "Liberadas",
    step11_slangs_bloq: "Bloqueadas",
    step11_slangs_act: "Ativos",
    step11_slangs_inact: "Inativos",
    step11_daily_goal: "Meta Diária de Prática",
    step11_minutes_freq: "{minutes} minutos diários, {days} dias por semana ({mode})",
    step11_enter: "Entrar no Dashboard",
    analyse_profile: "Analisar Perfil"
  },
  br: {
    bannerTitle: "CONEXÃO MULTILÍNGUE GLOBAL EM ANDAMENTO... NÃO PERCA TEMPO!",
    bannerTime: "TEMPO CRÍTICO",
    step2_header: "Dados Pessoais",
    step2_title: "Conte-nos sobre você",
    step2_age: "Qual é a sua idade?",
    step2_age_placeholder: "Ex: 25",
    step2_age_error: "Insira uma idade válida entre 5 e 99 anos.",
    step2_gender: "Gênero",
    step2_male: "Masculino",
    step2_female: "Feminino",
    step2_other: "Prefiro não informar",
    step2_country: "País de Residência",
    step2_country_placeholder: "Pesquise o país (ex: Angola, Portugal...)",
    step2_country_empty: "Nenhum país encontrado",
    step2_currency: "Moeda",
    step2_timezone: "Fuso Horário",
    back: "Voltar",
    continue: "Continuar",
    step3_header: "Idioma Nativo",
    step3_title: "Qual é o seu idioma principal?",
    step4_back: "Voltar para escolha de idioma",
    step4_header1: "Etapa 1: Escolha o Idioma",
    step4_header2: "Etapa 2: Escolha a Variante Regional",
    step4_title1: "Que idioma deseja aprender?",
    step4_title2: "Qual variante de {lang} prefere?",
    step4_desc1: "Selecione um idioma da nossa lista interativa de parceiros de IA.",
    step4_desc2: "Escolha uma variante para a IA personalizar sotaque, vocabulário e referências culturais.",
    step4_search: "Pesquisar idioma nativo ou traduzido...",
    step4_empty: 'Nenhum idioma encontrado para "{search}"',
    step4_advance: "Avançar",
    step5_header: "Regionalismo & Gírias",
    step5_title: "Personalize o sotaque e gírias",
    step5_desc: "Defina qual variante regional você deseja focar e como a IA deve gerenciar gírias e expressões locais.",
    step5_selected: "Idioma Selecionado",
    step5_mode: "Modo de Aprendizagem",
    step5_mode_desc: "Standard foca na gramática; Colloquial foca no uso real das ruas.",
    step5_formal: "Formal",
    step5_colloquial: "Coloquial",
    step5_expr: "Expressões Regionais",
    step5_expr_desc: "Apresentar termos regionais como complementos de vocabulário.",
    step5_expr_enabled: "Habilitadas",
    step5_expr_disabled: "Bloqueadas",
    step5_slang: "Uso de Gírias Locais",
    step5_slang_desc_kids: "Gírias indisponíveis para faixa etária de 5 a 8 anos.",
    step5_slang_desc: "Adicionar gírias saudáveis do dia a dia no diálogo com o tutor.",
    step5_slang_locked: "Bloqueado por idade",
    step5_slang_allow: "Permitir",
    step5_slang_block: "Bloquear",
    step6_header: "Nível de Idioma",
    step6_title: "Qual é o seu nível atual?",
    step6_desc: "Selecione o nível que melhor descreve suas habilidades.",
    step6_or: "Ou",
    step6_test: "Não sei meu nível (Realizar teste de nivelamento)",
    step6_quest: "Questão {curr} de {total}",
    step6_cancel: "Cancelar",
    step6_done: "Teste Concluído!",
    step6_done_desc: "Acertou {score} de {total} questões. Estimamos seu nível ideal de proficiência!",
    step6_suggested: "Nível Sugerido",
    step6_confirm: "Confirmar e Avançar",
    step7_header: "Objetivo",
    step7_title: "Por que deseja aprender este idioma?",
    step7_desc: "Selecione um objetivo para personalizar as lições.",
    step8_header: "Tempo Disponível",
    step8_title: "Quanto tempo pretende estudar por dia?",
    step8_desc: "Selecione a intensidade de estudos diária.",
    step9_header: "Frequência",
    step9_title: "Quantos dias por semana pretende praticar?",
    step9_desc: "Praticar {days} {days_label} por semana garante consistência de estudo e ajuda na fixação rápida do idioma!",
    step9_day: "dia",
    step9_days: "dias",
    step10_loader_title: "A IA está preparando o seu plano personalizado.",
    step11_title: "Parabéns!",
    step11_desc: "Seu plano de aprendizagem foi criado com sucesso.",
    step11_profile_summary: "Resumo do Perfil",
    step11_age: "Idade",
    step11_years: "anos",
    step11_country: "País",
    step11_native: "Idioma Nativo",
    step11_target: "Idioma Alvo",
    step11_level: "Nível Estimado",
    step11_slangs_reg: "Gírias & Regionalismos",
    step11_slangs_lib: "Liberadas",
    step11_slangs_bloq: "Bloqueadas",
    step11_slangs_act: "Ativos",
    step11_slangs_inact: "Inativos",
    step11_daily_goal: "Meta Diária de Prática",
    step11_minutes_freq: "{minutes} minutos diários, {days} dias por semana ({mode})",
    step11_enter: "Entrar no Dashboard",
    analyse_profile: "Analisar Perfil"
  },
  en: {
    bannerTitle: "GLOBAL MULTILINGUAL CONNECTION IN PROGRESS... DO NOT WASTE TIME!",
    bannerTime: "CRITICAL TIME",
    step2_header: "Personal Data",
    step2_title: "Tell us about yourself",
    step2_age: "How old are you?",
    step2_age_placeholder: "E.g.: 25",
    step2_age_error: "Enter a valid age between 5 and 99 years old.",
    step2_gender: "Gender",
    step2_male: "Male",
    step2_female: "Female",
    step2_other: "Prefer not to say",
    step2_country: "Country of Residence",
    step2_country_placeholder: "Search country (e.g., Angola, United States...)",
    step2_country_empty: "No country found",
    step2_currency: "Currency",
    step2_timezone: "Timezone",
    back: "Back",
    continue: "Continue",
    step3_header: "Native Language",
    step3_title: "What is your main language?",
    step4_back: "Back to language selection",
    step4_header1: "Step 1: Choose Language",
    step4_header2: "Step 2: Choose Regional Variant",
    step4_title1: "Which language do you want to learn?",
    step4_title2: "Which variant of {lang} do you prefer?",
    step4_desc1: "Select a language from our interactive list of AI partners.",
    step4_desc2: "Choose a variant for the AI to customize accent, vocabulary, and cultural references.",
    step4_search: "Search native or translated language...",
    step4_empty: 'No language found for "{search}"',
    step4_advance: "Advance",
    step5_header: "Regionalism & Slang",
    step5_title: "Customize your accent and slang",
    step5_desc: "Define which regional variant you want to focus on and how the AI should handle slang and local expressions.",
    step5_selected: "Selected Language",
    step5_mode: "Learning Mode",
    step5_mode_desc: "Standard focuses on grammar; Colloquial focuses on real street use.",
    step5_formal: "Formal",
    step5_colloquial: "Colloquial",
    step5_expr: "Regional Expressions",
    step5_expr_desc: "Show regional terms as vocabulary complements.",
    step5_expr_enabled: "Enabled",
    step5_expr_disabled: "Blocked",
    step5_slang: "Use of Local Slang",
    step5_slang_desc_kids: "Slang is unavailable for ages 5 to 8.",
    step5_slang_desc: "Add healthy daily slang to dialogue with the tutor.",
    step5_slang_locked: "Age locked",
    step5_slang_allow: "Allow",
    step5_slang_block: "Block",
    step6_header: "Language Level",
    step6_title: "What is your current level?",
    step6_desc: "Select the level that best describes your skills.",
    step6_or: "Or",
    step6_test: "I don't know my level (Take leveling test)",
    step6_quest: "Question {curr} of {total}",
    step6_cancel: "Cancel",
    step6_done: "Test Completed!",
    step6_done_desc: "Got {score} of {total} questions correct. We estimated your ideal proficiency level!",
    step6_suggested: "Suggested Level",
    step6_confirm: "Confirm and Advance",
    step7_header: "Goal",
    step7_title: "Why do you want to learn this language?",
    step7_desc: "Select a goal to customize the lessons.",
    step8_header: "Study Frequency",
    step8_title: "How much time do you plan to study daily?",
    step8_desc: "Select daily study intensity.",
    step9_header: "Frequency",
    step9_title: "How many days a week do you plan to practice?",
    step9_desc: "Practicing {days} {days_label} a week ensures study consistency and helps in rapid language retention!",
    step9_day: "day",
    step9_days: "days",
    step10_loader_title: "The AI is preparing your customized plan.",
    step11_title: "Congratulations!",
    step11_desc: "Your learning plan has been successfully created.",
    step11_profile_summary: "Profile Summary",
    step11_age: "Age",
    step11_years: "years old",
    step11_country: "Country",
    step11_native: "Native Language",
    step11_target: "Target Language",
    step11_level: "Estimated Level",
    step11_slangs_reg: "Slang & Regionalisms",
    step11_slangs_lib: "Released",
    step11_slangs_bloq: "Blocked",
    step11_slangs_act: "Active",
    step11_slangs_inact: "Inactive",
    step11_daily_goal: "Daily Practice Goal",
    step11_minutes_freq: "{minutes} daily minutes, {days} days per week ({mode})",
    step11_enter: "Enter Dashboard",
    analyse_profile: "Analyse Profile"
  },
  zh: {
    bannerTitle: "全球多语言连接正在进行中... 抓紧时间！",
    bannerTime: "关键时刻",
    step2_header: "个人数据",
    step2_title: "介绍一下您自己",
    step2_age: "您的年龄是多少？",
    step2_age_placeholder: "例如: 25",
    step2_age_error: "请输入5到99岁之间的有效年龄。",
    step2_gender: "性别",
    step2_male: "男性",
    step2_female: "女性",
    step2_other: "不想透露",
    step2_country: "居住国家",
    step2_country_placeholder: "搜索国家 (例如: 安哥拉, 葡萄牙...)",
    step2_country_empty: "未找到国家",
    step2_currency: "货币",
    step2_timezone: "时区",
    back: "返回",
    continue: "继续",
    step3_header: "母语",
    step3_title: "您的主要语言是什么？",
    step4_back: "返回语言选择",
    step4_header1: "第1步：选择语言",
    step4_header2: "第2步：选择区域变体",
    step4_title1: "您想学习哪种语言？",
    step4_title2: "您更喜欢 {lang} 的哪种变体？",
    step4_desc1: "从我们的交互式人工智能伙伴列表中选择一种语言。",
    step4_desc2: "选择一个变体以让 AI 个性化口音、词汇和文化背景。",
    step4_search: "搜索母语或翻译语言...",
    step4_empty: '未找到符合 "{search}" 的语言',
    step4_advance: "前进",
    step5_header: "区域主义与口语",
    step5_title: "定制您的口音和俚语",
    step5_desc: "定义您想关注的区域变体以及 AI 应如何处理俚语和地方表达。",
    step5_selected: "已选语言",
    step5_mode: "学习模式",
    step5_mode_desc: "标准模式侧重于语法；口语模式侧重于实际街头使用。",
    step5_formal: "正式",
    step5_colloquial: "口语",
    step5_expr: "区域表达",
    step5_expr_desc: "将区域词汇作为词汇补充展示。",
    step5_expr_enabled: "已启用",
    step5_expr_disabled: "已禁用",
    step5_slang: "使用当地俚语",
    step5_slang_desc_kids: "5至8岁的儿童不可使用俚语。",
    step5_slang_desc: "在与导师对话中加入日常健康的俚语。",
    step5_slang_locked: "因年龄锁定",
    step5_slang_allow: "允许",
    step5_slang_block: "禁用",
    step6_header: "语言水平",
    step6_title: "您目前的水平是多少？",
    step6_desc: "选择最能描述您技能的水平。",
    step6_or: "或者",
    step6_test: "我不知道我的水平 (进行分级测试)",
    step6_quest: "第 {curr} 题，共 {total} 题",
    step6_cancel: "取消",
    step6_done: "测试完成！",
    step6_done_desc: "您答对了 {score} 道题（共 {total} 道）。我们已估算出您的理想语言水平！",
    step6_suggested: "建议水平",
    step6_confirm: "确认并前进",
    step7_header: "学习目标",
    step7_title: "您为什么想学习这门语言？",
    step7_desc: "选择一个目标以个性化课程。",
    step8_header: "每日时间",
    step8_title: "您每天计划学习多长时间？",
    step8_desc: "选择每日学习强度。",
    step9_header: "频次",
    step9_title: "您计划每周练习几天？",
    step9_desc: "每周练习 {days} 天能确保学习连贯性，并帮助您迅速掌握语言！",
    step9_day: "天",
    step9_days: "天",
    step10_loader_title: "AI 正在生成您的专属个性化方案...",
    step11_title: "恭喜您！",
    step11_desc: "您的学习计划已成功创建。",
    step11_profile_summary: "个人档案摘要",
    step11_age: "年龄",
    step11_years: "岁",
    step11_country: "国家",
    step11_native: "母语",
    step11_target: "目标语言",
    step11_level: "评估水平",
    step11_slangs_reg: "俚语和区域主义",
    step11_slangs_lib: "已启用",
    step11_slangs_bloq: "已禁用",
    step11_slangs_act: "启用",
    step11_slangs_inact: "禁用",
    step11_daily_goal: "每日练习目标",
    step11_minutes_freq: "每天 {minutes} 分钟，每周 {days} 天 ({mode})",
    step11_enter: "进入控制面板",
    analyse_profile: "分析档案"
  },
  es: {
    bannerTitle: "¡CONEXIÓN MULTILINGÜE GLOBAL EN CURSO... NO PIERDAS TIEMPO!",
    bannerTime: "TIEMPO CRÍTICO",
    step2_header: "Datos Personales",
    step2_title: "Cuéntanos sobre ti",
    step2_age: "¿Cuál es tu edad?",
    step2_age_placeholder: "Ej: 25",
    step2_age_error: "Ingresa una edad válida entre 5 y 99 años.",
    step2_gender: "Género",
    step2_male: "Masculino",
    step2_female: "Femenino",
    step2_other: "Prefiero no decirlo",
    step2_country: "País de Residencia",
    step2_country_placeholder: "Buscar país (ej: Angola, España...)",
    step2_country_empty: "Ningún país encontrado",
    step2_currency: "Moneda",
    step2_timezone: "Zona Horaria",
    back: "Volver",
    continue: "Continuar",
    step3_header: "Idioma Nativo",
    step3_title: "¿Cuál es tu idioma principal?",
    step4_back: "Volver a la selección de idioma",
    step4_header1: "Paso 1: Elige el Idioma",
    step4_header2: "Paso 2: Elige la Variante Regional",
    step4_title1: "¿Qué idioma deseas aprender?",
    step4_title2: "¿Qué variante de {lang} prefieres?",
    step4_desc1: "Selecciona un idioma de nuestra lista interactiva de socios de IA.",
    step4_desc2: "Elige una variante para que la IA personalice el acento, vocabulario y referencias culturales.",
    step4_search: "Buscar idioma nativo o traducido...",
    step4_empty: 'Ningún idioma encontrado para "{search}"',
    step4_advance: "Avanzar",
    step5_header: "Regionalismo y Jerga",
    step5_title: "Personaliza el acento y la jerga",
    step5_desc: "Define en qué variante regional deseas enfocarte y cómo la IA debe manejar la jerga y las expresiones locales.",
    step5_selected: "Idioma Seleccionado",
    step5_mode: "Modo de Aprendizaje",
    step5_mode_desc: "Estándar se enfoca en la gramática; Coloquial se enfoca en el uso real de la calle.",
    step5_formal: "Formal",
    step5_colloquial: "Coloquial",
    step5_expr: "Expresiones Regionales",
    step5_expr_desc: "Presentar términos regionales como complementos de vocabulario.",
    step5_expr_enabled: "Habilitadas",
    step5_expr_disabled: "Bloqueadas",
    step5_slang: "Uso de Jerga Local",
    step5_slang_desc_kids: "La jerga no está disponible para edades de 5 a 8 años.",
    step5_slang_desc: "Agregar jerga diaria saludable en el diálogo con el tutor.",
    step5_slang_locked: "Bloqueado por edad",
    step5_slang_allow: "Permitir",
    step5_slang_block: "Bloquear",
    step6_header: "Nivel de Idioma",
    step6_title: "¿Cuál es tu nivel actual?",
    step6_desc: "Selecciona el nivel que mejor describa tus habilidades.",
    step6_or: "O",
    step6_test: "No sé mi nivel (Realizar prueba de nivelación)",
    step6_quest: "Pregunta {curr} de {total}",
    step6_cancel: "Cancelar",
    step6_done: "¡Prueba Completada!",
    step6_done_desc: "Acertaste {score} de {total} preguntas. ¡Estimamos tu nivel de competencia ideal!",
    step6_suggested: "Nivel Sugerido",
    step6_confirm: "Confirmar y Avanzar",
    step7_header: "Objetivo",
    step7_title: "¿Por qué deseas aprender este idioma?",
    step7_desc: "Selecciona un objetivo para personalizar las lecciones.",
    step8_header: "Tiempo Disponible",
    step8_title: "¿Cuánto tiempo planeas estudiar al día?",
    step8_desc: "Selecciona la intensidad de estudio diaria.",
    step9_header: "Frecuencia",
    step9_title: "¿Cuántos días a la semana planeas practicar?",
    step9_desc: "¡Practicar {days} {days_label} a la semana asegura la consistencia y ayuda a retener el idioma rápidamente!",
    step9_day: "día",
    step9_days: "días",
    step10_loader_title: "La IA está preparando tu plan personalizado.",
    step11_title: "¡Felicitaciones!",
    step11_desc: "Tu plan de aprendizaje ha sido creado con éxito.",
    step11_profile_summary: "Resumen del Perfil",
    step11_age: "Edad",
    step11_years: "años",
    step11_country: "País",
    step11_native: "Idioma Nativo",
    step11_target: "Idioma Objetivo",
    step11_level: "Nivel Estimado",
    step11_slangs_reg: "Jerga y Regionalismos",
    step11_slangs_lib: "Habilitadas",
    step11_slangs_bloq: "Bloqueadas",
    step11_slangs_act: "Activos",
    step11_slangs_inact: "Inactivos",
    step11_daily_goal: "Meta de Práctica Diaria",
    step11_minutes_freq: "{minutes} minutos diarios, {days} días por semana ({mode})",
    step11_enter: "Entrar al Panel de Control",
    analyse_profile: "Analizar Perfil"
  },
  fr: {
    bannerTitle: "CONNEXION MULTILINGUE GLOBALE EN COURS... NE PERDEZ PAS DE TEMPS !",
    bannerTime: "TEMPS CRITIQUE",
    step2_header: "Données Personnelles",
    step2_title: "Parlez-nous de vous",
    step2_age: "Quel est votre âge ?",
    step2_age_placeholder: "Ex : 25",
    step2_age_error: "Saisissez un âge valide entre 5 et 99 ans.",
    step2_gender: "Genre",
    step2_male: "Masculin",
    step2_female: "Féminin",
    step2_other: "Préfère ne pas répondre",
    step2_country: "Pays de Résidence",
    step2_country_placeholder: "Rechercher le pays (ex : Angola, France...)",
    step2_country_empty: "Aucun pays trouvé",
    step2_currency: "Devise",
    step2_timezone: "Fuseau Horaire",
    back: "Retour",
    continue: "Continuer",
    step3_header: "Langue Maternelle",
    step3_title: "Quelle est votre langue principale ?",
    step4_back: "Retour au choix de la langue",
    step4_header1: "Étape 1 : Choisir la Langue",
    step4_header2: "Étape 2 : Choisir la Variante Régionale",
    step4_title1: "Quelle langue souhaitez-vous apprendre ?",
    step4_title2: "Quelle variante de {lang} préférez-vous ?",
    step4_desc1: "Sélectionnez une langue dans notre liste interactive de partenaires IA.",
    step4_desc2: "Choisissez une variante pour que l'IA personnalise l'accent, le vocabulaire et les références culturelles.",
    step4_search: "Rechercher langue maternelle ou traduite...",
    step4_empty: 'Aucune langue trouvée pour "{search}"',
    step4_advance: "Avancer",
    step5_header: "Régionalisme & Argot",
    step5_title: "Personnalisez l'accent et l'argot",
    step5_desc: "Définissez la variante régionale sur laquelle vous souhaitez vous concentrer et comment l'IA doit gérer l'argot et les expressions locales.",
    step5_selected: "Langue Sélectionnée",
    step5_mode: "Mode d'Apprentissage",
    step5_mode_desc: "Standard se concentre sur la grammaire ; Familier se concentre sur l'usage réel de la rue.",
    step5_formal: "Formel",
    step5_colloquial: "Familier",
    step5_expr: "Expressions Régionales",
    step5_expr_desc: "Présenter des termes régionaux en tant que compléments de vocabulaire.",
    step5_expr_enabled: "Activées",
    step5_expr_disabled: "Bloquées",
    step5_slang: "Utilisation de l'Argot Local",
    step5_slang_desc_kids: "Argot indisponible pour les enfants de 5 à 8 ans.",
    step5_slang_desc: "Ajouter de l'argot quotidien sain dans le dialogue avec le tuteur.",
    step5_slang_locked: "Bloqué par l'âge",
    step5_slang_allow: "Autoriser",
    step5_slang_block: "Bloquer",
    step6_header: "Niveau de Langue",
    step6_title: "Quel est votre niveau actuel ?",
    step6_desc: "Sélectionnez le niveau qui décrit le mieux vos compétences.",
    step6_or: "Ou",
    step6_test: "Je ne connais pas mon niveau (Faire un test de niveau)",
    step6_quest: "Question {curr} sur {total}",
    step6_cancel: "Annuler",
    step6_done: "Test Terminé !",
    step6_done_desc: "Vous avez obtenu {score} bonnes réponses sur {total}. Nous avons estimé votre niveau idéal !",
    step6_suggested: "Niveau Suggéré",
    step6_confirm: "Confirmer et Continuer",
    step7_header: "Objectif",
    step7_title: "Pourquoi voulez-vous apprendre cette langue ?",
    step7_desc: "Sélectionnez un objectif pour personnaliser les cours.",
    step8_header: "Temps Disponible",
    step8_title: "Combien de temps prévoyez-vous d'étudier par jour ?",
    step8_desc: "Sélectionnez l'intensité d'étude quotidienne.",
    step9_header: "Fréquence",
    step9_title: "Combien de jours par semaine prévoyez-vous de pratiquer ?",
    step9_desc: "Pratiquer {days} {days_label} par semaine assure la régularité et favorise une rétention rapide !",
    step9_day: "jour",
    step9_days: "jours",
    step10_loader_title: "L'IA prépare votre plan personnalisé.",
    step11_title: "Félicitations !",
    step11_desc: "Votre plan d'apprentissage a été créé avec succès.",
    step11_profile_summary: "Résumé du Profil",
    step11_age: "Âge",
    step11_years: "ans",
    step11_country: "Pays",
    step11_native: "Langue Maternelle",
    step11_target: "Langue Cible",
    step11_level: "Niveau Estimé",
    step11_slangs_reg: "Argot & Régionalismes",
    step11_slangs_lib: "Activés",
    step11_slangs_bloq: "Bloqués",
    step11_slangs_act: "Actifs",
    step11_slangs_inact: "Inactifs",
    step11_daily_goal: "Objectif Quotidien",
    step11_minutes_freq: "{minutes} minutes par jour, {days} jours par semaine ({mode})",
    step11_enter: "Entrer au Tableau de Bord",
    analyse_profile: "Analyser le Profil"
  },
  de: {
    bannerTitle: "GLOBALE MEHRSPRACHIGE VERBINDUNG IN ARBEIT... VERLIEREN SIE KEINE ZEIT!",
    bannerTime: "KRITISCHE ZEIT",
    step2_header: "Persönliche Daten",
    step2_title: "Erzählen Sie uns über sich",
    step2_age: "Wie alt sind Sie?",
    step2_age_placeholder: "Z.B.: 25",
    step2_age_error: "Geben Sie ein gültiges Alter zwischen 5 und 99 Jahren ein.",
    step2_gender: "Geschlecht",
    step2_male: "Männlich",
    step2_female: "Weiblich",
    step2_other: "Keine Angabe",
    step2_country: "Wohnsitzland",
    step2_country_placeholder: "Land suchen (z. B. Angola, Deutschland...)",
    step2_country_empty: "Kein Land gefunden",
    step2_currency: "Währung",
    step2_timezone: "Zeitzone",
    back: "Zurück",
    continue: "Weiter",
    step3_header: "Muttersprache",
    step3_title: "Was ist Ihre Hauptsprache?",
    step4_back: "Zurück zur Sprachauswahl",
    step4_header1: "Schritt 1: Sprache wählen",
    step4_header2: "Schritt 2: Regionale Variante wählen",
    step4_title1: "Welche Sprache möchten Sie lernen?",
    step4_title2: "Welche Variante von {lang} bevorzugen Sie?",
    step4_desc1: "Wählen Sie eine Sprache aus unserer interaktiven Liste von KI-Partnern.",
    step4_desc2: "Wählen Sie eine Variante, damit die KI Akzent, Wortschatz und kulturelle Bezüge anpassen kann.",
    step4_search: "Mutter- oder übersetzte Sprache suchen...",
    step4_empty: 'Keine Sprache für "{search}" gefunden',
    step4_advance: "Vorwärts",
    step5_header: "Regionalismus & Umgangssprache",
    step5_title: "Passen Sie den Akzent und die Umgangssprache an",
    step5_desc: "Legen Sie fest, auf welche regionale Variante Sie sich konzentrieren möchten und wie die KI mit Umgangssprache und lokalen Ausdrücken umgehen soll.",
    step5_selected: "Ausgewählte Sprache",
    step5_mode: "Lernmodus",
    step5_mode_desc: "Standard konzentriert sich auf Grammatik; Umgangssprache konzentriert sich auf die reale Straße.",
    step5_formal: "Formal",
    step5_colloquial: "Umgangssprachlich",
    step5_expr: "Regionale Ausdrücke",
    step5_expr_desc: "Präsentieren Sie regionale Begriffe als Wortschatz-Ergänzung.",
    step5_expr_enabled: "Aktiviert",
    step5_expr_disabled: "Blockiert",
    step5_slang: "Verwendung lokaler Umgangssprache",
    step5_slang_desc_kids: "Umgangssprache ist für das Alter 5 bis 8 nicht verfügbar.",
    step5_slang_desc: "Fügen Sie dem Dialog mit dem Tutor gesunde tägliche Umgangssprache hinzu.",
    step5_slang_locked: "Altersgesperrt",
    step5_slang_allow: "Erlauben",
    step5_slang_block: "Blockieren",
    step6_header: "Sprachniveau",
    step6_title: "Was ist Ihr aktuelles Niveau?",
    step6_desc: "Wählen Sie das Niveau, das Ihre Fähigkeiten am besten beschreibt.",
    step6_or: "Oder",
    step6_test: "Ich kenne mein Niveau nicht (Einstufungstest machen)",
    step6_quest: "Frage {curr} von {total}",
    step6_cancel: "Abbrechen",
    step6_done: "Test abgeschlossen!",
    step6_done_desc: "Sie haben {score} von {total} Fragen richtig beantwortet. Wir haben Ihr ideales Sprachniveau geschätzt!",
    step6_suggested: "Empfohlenes Niveau",
    step6_confirm: "Bestätigen und weiter",
    step7_header: "Lernziel",
    step7_title: "Warum möchten Sie diese Sprache lernen?",
    step7_desc: "Wählen Sie ein Ziel aus, um den Unterricht anzupassen.",
    step8_header: "Lernzeit",
    step8_title: "Wie lange möchten Sie täglich lernen?",
    step8_desc: "Wählen Sie die tägliche Lernintensität.",
    step9_header: "Häufigkeit",
    step9_title: "Wie viele Tage in der Woche möchten Sie üben?",
    step9_desc: "Das Üben an {days} {days_label} pro Woche sichert Beständigkeit und fördert schnelles Behalten!",
    step9_day: "Tag",
    step9_days: "Tagen",
    step10_loader_title: "Die KI bereitet Ihren maßgeschneiderten Plan vor.",
    step11_title: "Herzlichen Glückwunsch!",
    step11_desc: "Ihr Lernplan wurde erfolgreich erstellt.",
    step11_profile_summary: "Profilübersicht",
    step11_age: "Alter",
    step11_years: "Jahre",
    step11_country: "Land",
    step11_native: "Muttersprache",
    step11_target: "Zielsprache",
    step11_level: "Geschätztes Niveau",
    step11_slangs_reg: "Umgangssprache & Regionalismen",
    step11_slangs_lib: "Freigegeben",
    step11_slangs_bloq: "Blockiert",
    step11_slangs_act: "Aktiv",
    step11_slangs_inact: "Inaktiv",
    step11_daily_goal: "Tägliches Übungsziel",
    step11_minutes_freq: "{minutes} Minuten täglich, {days} Tage pro Woche ({mode})",
    step11_enter: "Zum Dashboard gehen",
    analyse_profile: "Profil analysieren"
  },
  ja: {
    bannerTitle: "グローバル多言語接続が進行中... 時間を無駄にしないでください！",
    bannerTime: "クリティカルタイム",
    step2_header: "個人データ",
    step2_title: "あなたについて教えてください",
    step2_age: "年齢は？",
    step2_age_placeholder: "例：25",
    step2_age_error: "5歳から99歳までの有効な年齢を入力してください。",
    step2_gender: "性別",
    step2_male: "男性",
    step2_female: "女性",
    step2_other: "回答しない",
    step2_country: "居住国",
    step2_country_placeholder: "国を検索 (例: アンゴラ, 日本...)",
    step2_country_empty: "国が見つかりません",
    step2_currency: "通貨",
    step2_timezone: "タイムゾーン",
    back: "戻る",
    continue: "続行",
    step3_header: "母国語",
    step3_title: "あなたの主な言語は何ですか？",
    step4_back: "言語選択に戻る",
    step4_header1: "ステップ 1: 言語を選択",
    step4_header2: "ステップ 2: 地域バリアントを選択",
    step4_title1: "どの言語を学びたいですか？",
    step4_title2: "{lang} のどのバリアントがお好みですか？",
    step4_desc1: "インタラクティブな AI パートナーのリストから言語を選択します。",
    step4_desc2: "AI がアクセント、語彙、文化的参照をカスタマイズできるようにバリアントを選択します。",
    step4_search: "母国語または翻訳言語を検索...",
    step4_empty: '"{search}" の言語が見つかりません',
    step4_advance: "進む",
    step5_header: "地域主義とスラング",
    step5_title: "アクセントとスラングをカスタマイズする",
    step5_desc: "焦点を当てたい地域バリアントと、AI がスラングやローカルな表現をどのように処理するかを定義します。",
    step5_selected: "選択された言語",
    step5_mode: "学習モード",
    step5_mode_desc: "標準は文法に焦点を当て、口語は実際の街路での使用に焦点を当てます。",
    step5_formal: "フォーマル",
    step5_colloquial: "口語",
    step5_expr: "地域表現",
    step5_expr_desc: "語彙の補足として地域用語を提示します。",
    step5_expr_enabled: "有効",
    step5_expr_disabled: "ブロック済み",
    step5_slang: "ローカルスラングの使用",
    step5_slang_desc_kids: "5〜8歳のお子様はスラングを利用できません。",
    step5_slang_desc: "チューターとの対話に健康的で日常的なスラングを追加します。",
    step5_slang_locked: "年齢制限あり",
    step5_slang_allow: "許可する",
    step5_slang_block: "ブロックする",
    step6_header: "言語レベル",
    step6_title: "現在のレベルは？",
    step6_desc: "あなたのスキルを最もよく表すレベルを選択してください。",
    step6_or: "または",
    step6_test: "レベルがわからない (レベル判定テストを受ける)",
    step6_quest: "質問 {curr} / {total}",
    step6_cancel: "キャンセル",
    step6_done: "テスト完了！",
    step6_done_desc: "{total} 問中 {score} 問正解しました。あなたの理想の習得レベルを推定しました！",
    step6_suggested: "おすすめレベル",
    step6_confirm: "確認して進む",
    step7_header: "目標",
    step7_title: "なぜこの言語を学びたいのですか？",
    step7_desc: "レッスンをカスタマイズする目標を選択します。",
    step8_header: "学習頻度",
    step8_title: "毎日どのくらい勉強する予定ですか？",
    step8_desc: "1日の学習強度を選択します。",
    step9_header: "頻度",
    step9_title: "週に何日練習する予定ですか？",
    step9_desc: "週に {days} 日練習すると、一貫した学習が可能になり、素早い定着に繋がります！",
    step9_day: "日",
    step9_days: "日",
    step10_loader_title: "AI がカスタマイズされた学習プランを作成しています。",
    step11_title: "おめでとうございます！",
    step11_desc: "あなたの学習プランが正常に作成されました。",
    step11_profile_summary: "プロフィールの概要",
    step11_age: "年齢",
    step11_years: "歳",
    step11_country: "居住国",
    step11_native: "母国語",
    step11_target: "目標言語",
    step11_level: "推定レベル",
    step11_slangs_reg: "スラングと地域用語",
    step11_slangs_lib: "解除済み",
    step11_slangs_bloq: "制限済み",
    step11_slangs_act: "有効",
    step11_slangs_inact: "無効",
    step11_daily_goal: "1日の目標",
    step11_minutes_freq: "毎日 {minutes} 分、週に {days} 日 ({mode})",
    step11_enter: "ダッシュボードに入る",
    analyse_profile: "プロフィールを分析する"
  },
  it: {
    bannerTitle: "CONNESSIONE MULTILINGUE GLOBALE IN CORSO... NON PERDERE TEMPO!",
    bannerTime: "TEMPO CRITICO",
    step2_header: "Dati Personali",
    step2_title: "Raccontaci di te",
    step2_age: "Qual è la tua età?",
    step2_age_placeholder: "Es: 25",
    step2_age_error: "Inserisci un'età valida tra 5 e 99 anni.",
    step2_gender: "Genere",
    step2_male: "Maschile",
    step2_female: "Femminile",
    step2_other: "Preferisco non dire",
    step2_country: "Paese di Residenza",
    step2_country_placeholder: "Cerca paese (es: Angola, Italia...)",
    step2_country_empty: "Nessun paese trovato",
    step2_currency: "Valuta",
    step2_timezone: "Fuso Orario",
    back: "Indietro",
    continue: "Continua",
    step3_header: "Lingua Madre",
    step3_title: "Qual è la tua lingua principale?",
    step4_back: "Torna alla scelta della lingua",
    step4_header1: "Fase 1: Scegli la Lingua",
    step4_header2: "Fase 2: Scegli la Variante Regionale",
    step4_title1: "Quale lingua desideri imparare?",
    step4_title2: "Quale variante di {lang} preferisci?",
    step4_desc1: "Seleziona una lingua dalla nostra lista interattiva di partner IA.",
    step4_desc2: "Scegli una variante in modo che l'IA possa personalizzare l'accento, il vocabolario e i riferimenti culturali.",
    step4_search: "Cerca lingua madre o tradotta...",
    step4_empty: 'Nessuna lingua trovata per "{search}"',
    step4_advance: "Avanza",
    step5_header: "Regionalismo e Gergo",
    step5_title: "Personalizza l'accento e il gergo",
    step5_desc: "Definisci su quale variante regionale desideri concentrarti e come l'IA dovrebbe gestire il gergo e le espressioni locali.",
    step5_selected: "Lingua Selezionata",
    step5_mode: "Modalità di Apprendimento",
    step5_mode_desc: "Standard si concentra sulla grammatica; Colloquiale si concentra sull'uso reale della strada.",
    step5_formal: "Formale",
    step5_colloquial: "Colloquiale",
    step5_expr: "Espressioni Regionali",
    step5_expr_desc: "Presentare termini regionali come complementi di vocabolario.",
    step5_expr_enabled: "Abilitate",
    step5_expr_disabled: "Bloccate",
    step5_slang: "Uso del Gergo Locale",
    step5_slang_desc_kids: "Il gergo non è disponibile per età comprese tra 5 e 8 anni.",
    step5_slang_desc: "Aggiungi del gergo quotidiano sano nel dialogo con il tutor.",
    step5_slang_locked: "Bloccato dall'età",
    step5_slang_allow: "Consenti",
    step5_slang_block: "Blocca",
    step6_header: "Livello di Lingua",
    step6_title: "Qual è il tuo livello attuale?",
    step6_desc: "Seleziona il livello que descrive al meglio le tue abilità.",
    step6_or: "O",
    step6_test: "Non conosco il mio livello (Fai il test di livello)",
    step6_quest: "Domanda {curr} di {total}",
    step6_cancel: "Annulla",
    step6_done: "Test Completato!",
    step6_done_desc: "Hai risposto correttamente a {score} domande su {total}. Abbiamo stimato il tuo livello ideale!",
    step6_suggested: "Livello Suggerito",
    step6_confirm: "Conferma e Continua",
    step7_header: "Obiettivo",
    step7_title: "Perché desideri imparare questa lingua?",
    step7_desc: "Seleziona un obiettivo per personalizzare le lezioni.",
    step8_header: "Tempo Disponibile",
    step8_title: "Quanto tempo intendi studiare al giorno?",
    step8_desc: "Seleziona l'intensità di studio giornaliera.",
    step9_header: "Frequenza",
    step9_title: "Quanti giorni alla settimana intendi esercitarti?",
    step9_desc: "Esercitarsi per {days} {days_label} alla settimana assicura la costanza e favorisce una memorizzazione rapida!",
    step9_day: "giorno",
    step9_days: "giorni",
    step10_loader_title: "L'IA sta preparando il tuo piano personalizzato.",
    step11_title: "Congratulazioni!",
    step11_desc: "Il tuo piano di apprendimento è stato creato con successo.",
    step11_profile_summary: "Riepilogo del Profilo",
    step11_age: "Età",
    step11_years: "anni",
    step11_country: "Paese",
    step11_native: "Lingua Madre",
    step11_target: "Lingua Obiettivo",
    step11_level: "Livello Stimato",
    step11_slangs_reg: "Gergo & Regionalismi",
    step11_slangs_lib: "Abilitate",
    step11_slangs_bloq: "Bloccate",
    step11_slangs_act: "Attivi",
    step11_slangs_inact: "Inattivi",
    step11_daily_goal: "Obiettivo Giornaliero",
    step11_minutes_freq: "{minutes} minuti al giorno, {days} giorni alla settimana ({mode})",
    step11_enter: "Entra nel Pannello di Controllo",
    analyse_profile: "Analizza Profilo"
  }
};

const translateCountryName = (name: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Portugal": { zh: "葡萄牙", en: "Portugal", es: "Portugal", fr: "Portugal", de: "Portugal", ja: "ポルトガル", it: "Portogallo", pt: "Portugal", br: "Portugal" },
    "Brasil": { zh: "巴西", en: "Brazil", es: "Brasil", fr: "Brésil", de: "Brasilien", ja: "ブラジル", it: "Brasile", pt: "Brasil", br: "Brasil" },
    "Angola": { zh: "安哥拉", en: "Angola", es: "Angola", fr: "Angola", de: "Angola", ja: "アンゴラ", it: "Angola", pt: "Angola", br: "Angola" },
    "Moçambique": { zh: "莫桑比克", en: "Mozambique", es: "Mozambique", fr: "Mozambique", de: "Mosambik", ja: "モザンビーク", it: "Mozambico", pt: "Moçambique", br: "Moçambique" },
    "Cabo Verde": { zh: "佛得角", en: "Cape Verde", es: "Cabo Verde", fr: "Cap-Vert", de: "Kap Verde", ja: "カーボベルデ", it: "Capo Verde", pt: "Cabo Verde", br: "Cabo Verde" },
    "França": { zh: "法国", en: "France", es: "Francia", fr: "France", de: "Frankreich", ja: "フランス", it: "Francia", pt: "França", br: "França" },
    "Estados Unidos": { zh: "美国", en: "United States", es: "Estados Unidos", fr: "États-Unis", de: "Vereinigte Staaten", ja: "アメリカ合衆国", it: "Stati Uniti", pt: "Estados Unidos", br: "Estados Unidos" },
    "Guiné-Bissau": { zh: "几内亚比绍", en: "Guinea-Bissau", es: "Guinea-Bisáu", fr: "Guinée-Bissau", de: "Guinea-Bissau", ja: "ギニアビサウ", it: "Guinea-Bissau", pt: "Guiné-Bissau", br: "Guiné-Bissau" },
    "São Tomé e Príncipe": { zh: "圣多美和普林西比", en: "São Tomé and Príncipe", es: "Santo Tomé y Príncipe", fr: "Sao Tomé-et-Principe", de: "São Tomé und Príncipe", ja: "サントメ・プリンシペ", it: "São Tomé e Príncipe", pt: "São Tomé e Príncipe", br: "São Tomé e Príncipe" },
    "Timor-Leste": { zh: "东帝汶", en: "East Timor", es: "Timor Oriental", fr: "Timor oriental", de: "Osttimor", ja: "东ティモール", it: "Timor Est", pt: "Timor-Leste", br: "Timor-Leste" },
    "Reino Unido": { zh: "英国", en: "United Kingdom", es: "Reino Unido", fr: "Royaume-Uni", de: "Vereinigtes Königreich", ja: "イギリス", it: "Regno Unito", pt: "Reino Unido", br: "Reino Unido" },
    "Espanha": { zh: "西班牙", en: "Spain", es: "España", fr: "Espagne", de: "Spanien", ja: "スペイン", it: "Spagna", pt: "Espanha", br: "Espanha" },
    "Alemanha": { zh: "德国", en: "Germany", es: "Alemania", fr: "Allemagne", de: "Deutschland", ja: "ドイツ", it: "Germania", pt: "Alemanha", br: "Alemanha" },
    "Itália": { zh: "意大利", en: "Italy", es: "Italia", fr: "Italie", de: "Italien", ja: "イタリア", it: "Italia", pt: "Itália", br: "Itália" },
    "China": { zh: "中国", en: "China", es: "China", fr: "Chine", de: "China", ja: "中国", it: "Cina", pt: "China", br: "China" },
    "Japão": { zh: "日本", en: "Japan", es: "Japón", fr: "Japon", de: "Japan", ja: "日本", it: "Giappone", pt: "Japão", br: "Japão" },
    "Canadá": { zh: "加拿大", en: "Canada", es: "Canadá", fr: "Canada", de: "Kanada", ja: "カナダ", it: "Canada", pt: "Canadá", br: "Canadá" },
    "Austrália": { zh: "澳大利亚", en: "Australia", es: "Australia", fr: "Australie", de: "Australien", ja: "オーストラリア", it: "Australia", pt: "Austrália", br: "Austrália" }
  };
  return map[name]?.[lang] || map[name]?.pt || name;
};

const translateLanguageDesc = (desc: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Idioma global, negócios e ciência": {
      zh: "全球通用语言、商业和科学",
      en: "Global language, business, and science",
      es: "Idioma global, negocios y ciencia",
      fr: "Langue mondiale, affaires et science",
      de: "Globale Sprache, Wirtschaft und Wissenschaft",
      ja: "グローバル言語、ビジネス、科学",
      it: "Lingua globale, affari e scienza",
      pt: "Idioma global, negócios e ciência",
      br: "Idioma global, negócios e ciência"
    },
    "Cultura, diplomacia e negócios": {
      zh: "文化、外交和商业",
      en: "Culture, diplomacy, and business",
      es: "Cultura, diplomacia y negocios",
      fr: "Culture, diplomatie et affaires",
      de: "Kultur, Diplomatie und Wirtschaft",
      ja: "文化、外交、ビジネス",
      it: "Cultura, diplomazia e affari",
      pt: "Cultura, diplomacia e negócios",
      br: "Cultura, diplomacia e negócios"
    },
    "Comunicação global e literatura": {
      zh: "全球交流和文学",
      en: "Global communication and literature",
      es: "Comunicación global y literatura",
      fr: "Communication globale et littérature",
      de: "Globale Kommunikation und Literatur",
      ja: "グローバルコミュニケーションと文学",
      it: "Comunicazione globale e letteratura",
      pt: "Comunicação global e literatura",
      br: "Comunicação global e literatura"
    },
    "Muito utilizado nas Américas e Europa": {
      zh: "在美洲和欧洲广泛使用",
      en: "Widely used in the Americas and Europe",
      es: "Ampliamente utilizado en las Américas y Europa",
      fr: "Très utilisé dans les Amériques et en Europe",
      de: "Weit verbreitet in Amerika und Europa",
      ja: "南北アメリカとヨーロッパで広く使用されています",
      it: "Ampiamente utilizzato nelle Americhe e in Europa",
      pt: "Muito utilizado nas Américas e Europa",
      br: "Muito utilizado nas Américas e Europa"
    },
    "Engenharia, indústria e tecnologia": {
      zh: "工程、工业和技术",
      en: "Engineering, industry, and technology",
      es: "Ingeniería, industria y tecnología",
      fr: "Ingénierie, industrie et technologie",
      de: "Ingenieurwesen, Industrie und Technologie",
      ja: "工学、産業、技術",
      it: "Ingegneria, industria e tecnologia",
      pt: "Engenharia, indústria e tecnologia",
      br: "Engenharia, indústria e tecnologia"
    },
    "Arte, gastronomia e música clássica": {
      zh: "艺术、美食和古典音乐",
      en: "Art, gastronomy, and classical music",
      es: "Arte, gastronomía y música clásica",
      fr: "Art, gastronomie et musique classique",
      de: "Kunst, Gastronomie und klassische Musik",
      ja: "アート、美食、クラシック音楽",
      it: "Arte, gastronomia e musica classica",
      pt: "Arte, gastronomia e música clássica",
      br: "Arte, gastronomia e música clássica"
    },
    "Negócios, tecnologia e comércio global": {
      zh: "商业、技术和全球贸易",
      en: "Business, technology, and global trade",
      es: "Negocios, tecnología y comercio global",
      fr: "Affaires, technologie et commerce mondial",
      de: "Wirtschaft, Technologie und globaler Handel",
      ja: "ビジネス、技術、グローバル貿易",
      it: "Affari, tecnologia e commercio globale",
      pt: "Negócios, tecnologia e comércio global",
      br: "Negócios, tecnologia e comércio global"
    },
    "Tecnologia, cultura pop e inovação": {
      zh: "技术、流行文化和创新",
      en: "Technology, pop culture, and innovation",
      es: "Tecnología, cultura pop e innovación",
      fr: "Technologie, pop culture et innovation",
      de: "Technologie, Popkultur und Innovation",
      ja: "技術、ポップカルチャー、イノベーション",
      it: "Tecnologia, cultura pop e innovazione",
      pt: "Tecnologia, cultura pop e inovação",
      br: "Tecnologia, cultura pop e inovação"
    },
    "Ciência, literatura e tecnologia": {
      zh: "科学、文学和技术",
      en: "Science, literature, and technology",
      es: "Ciencia, literatura y tecnología",
      fr: "Science, littérature et technologie",
      de: "Wissenschaft, Literatur und Technologie",
      ja: "科学、文学、技術",
      it: "Scienza, literatura e tecnologia",
      pt: "Ciência, literatura e tecnologia",
      br: "Ciência, literatura e tecnologia"
    },
    "Música (K-Pop), tecnologia e cinema": {
      zh: "音乐 (K-Pop)、技术和电影",
      en: "Music (K-Pop), technology, and cinema",
      es: "Música (K-Pop), tecnología y cine",
      fr: "Musique (K-Pop), technologie et cinéma",
      de: "Musik (K-Pop), Technologie und Kino",
      ja: "音楽（K-POP）、技術、映画",
      it: "Musica (K-Pop), tecnologia e cinema",
      pt: "Música (K-Pop), tecnologia e cinema",
      br: "Música (K-Pop), tecnologia e cinema"
    },
    "História, comércio e diplomacia": {
      zh: "历史、贸易和外交",
      en: "History, trade, and diplomacy",
      es: "Historia, comercio y diplomacia",
      fr: "Histoire, commerce et diplomatie",
      de: "Geschichte, Handel und Diplomatie",
      ja: "歴史、貿易、外交",
      it: "Storia, commercio e diplomazia",
      pt: "História, comércio e diplomacia",
      br: "História, comércio e diplomacia"
    }
  };
  return map[desc]?.[lang] || desc;
};

const translateNativeLanguageName = (name: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Português": { zh: "葡萄牙语", en: "Portuguese", es: "Portugués", fr: "Portugais", de: "Portugiesisch", ja: "ポルトガル語", it: "Portoghese", pt: "Português", br: "Português" },
    "Inglês": { zh: "英语", en: "English", es: "Inglés", fr: "Anglais", de: "Englisch", ja: "英語", it: "Inglese", pt: "Inglês", br: "Inglês" },
    "Francês": { zh: "法语", en: "French", es: "Francés", fr: "Français", de: "Französisch", ja: "フランス語", it: "Francese", pt: "Francês", br: "Francês" },
    "Chinês": { zh: "中文", en: "Chinese", es: "Chino", fr: "Chinois", de: "Chinesisch", ja: "中国語", it: "Cinese", pt: "Chinês", br: "Chinês" },
    "Espanhol": { zh: "西班牙语", en: "Spanish", es: "Español", fr: "Espagnol", de: "Spanisch", ja: "スペイン語", it: "Spagnolo", pt: "Espanhol", br: "Espanhol" },
    "Árabe": { zh: "阿拉伯语", en: "Arabic", es: "Árabe", fr: "Arabe", de: "Arabisch", ja: "アラビア語", it: "Arabo", pt: "Árabe", br: "Árabe" },
    "Outros": { zh: "其他", en: "Others", es: "Otros", fr: "Autres", de: "Andere", ja: "その他", it: "Altri", pt: "Outros", br: "Outros" }
  };
  return map[name]?.[lang] || name;
};

const translateRegionalVariantLabel = (label: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Estados Unidos": { zh: "美国", en: "United States", es: "Estados Unidos", fr: "États-Unis", de: "Vereinigte Staaten", ja: "アメリカ合衆国", it: "Stati Uniti", pt: "Estados Unidos" },
    "Reino Unido": { zh: "英国", en: "United Kingdom", es: "Reino Unido", fr: "Royaume-Uni", de: "Vereinigtes Königreich", ja: "イギリス", it: "Regno Unito", pt: "Reino Unido" },
    "Canadá": { zh: "加拿大", en: "Canada", es: "Canadá", fr: "Canada", de: "Kanada", ja: "カナダ", it: "Canada", pt: "Canadá" },
    "Austrália": { zh: "澳大利亚", en: "Australia", es: "Australia", fr: "Australie", de: "Australien", ja: "オーストラリア", it: "Australia", pt: "Austrália" },
    "Inglês Internacional": { zh: "国际英语", en: "International English", es: "Inglés Internacional", fr: "Anglais International", de: "Internationales Englisch", ja: "国際英語", it: "Inglese Internazionale", pt: "Inglês Internacional" },
    "Brasil": { zh: "巴西", en: "Brazil", es: "Brasil", fr: "Brésil", de: "Brasilien", ja: "ブラジル", it: "Brasile", pt: "Brasil" },
    "Portugal": { zh: "葡萄牙", en: "Portugal", es: "Portugal", fr: "Portugal", de: "Portugal", ja: "ポルトガル", it: "Portogallo", pt: "Portugal" },
    "Angola": { zh: "安哥拉", en: "Angola", es: "Angola", fr: "Angola", de: "Angola", ja: "アンゴラ", it: "Angola", pt: "Angola" },
    "Moçambique": { zh: "莫桑比克", en: "Mozambique", es: "Mozambique", fr: "Mozambique", de: "Mosambik", ja: "モザンビーク", it: "Mozambico", pt: "Moçambique" },
    "França": { zh: "法国", en: "France", es: "Francia", fr: "France", de: "Frankreich", ja: "フランス", it: "Francia", pt: "França" },
    "Canadá (Quebec)": { zh: "加拿大 (魁北克)", en: "Canada (Quebec)", es: "Canadá (Quebec)", fr: "Canada (Québec)", de: "Kanada (Quebec)", ja: "カナダ (ケベック)", it: "Canada (Quebec)", pt: "Canadá (Quebec)" },
    "Bélgica": { zh: "比利时", en: "Belgium", es: "Bélgica", fr: "Belgique", de: "Belgien", ja: "ベルギー", it: "Belgio", pt: "Bélgica" },
    "Suíça": { zh: "瑞士", en: "Switzerland", es: "Suiza", fr: "Suisse", de: "Schweiz", ja: "スイス", it: "Svizzera", pt: "Suíça" },
    "Espanha": { zh: "西班牙", en: "Spain", es: "España", fr: "Espagne", de: "Spanien", ja: "スペイン", it: "Spagna", pt: "Espanha" },
    "México": { zh: "墨西哥", en: "Mexico", es: "México", fr: "Mexique", de: "Mexiko", ja: "メキシコ", it: "Messico", pt: "México" },
    "Argentina": { zh: "阿根廷", en: "Argentina", es: "Argentina", fr: "Argentine", de: "Argentinien", ja: "アルゼンチン", it: "Argentina", pt: "Argentina" },
    "Colômbia": { zh: "哥伦比亚", en: "Colombia", es: "Colombia", fr: "Colombie", de: "Kolumbien", ja: "コロンビア", it: "Colombia", pt: "Colômbia" },
    "Alemanha": { zh: "德国", en: "Germany", es: "Alemania", fr: "Allemagne", de: "Deutschland", ja: "ドイツ", it: "Germania", pt: "Alemanha" },
    "Áustria": { zh: "奥地利", en: "Austria", es: "Austria", fr: "Autriche", de: "Österreich", ja: "オーストリア", it: "Austria", pt: "Áustria" },
    "Itália": { zh: "意大利", en: "Italy", es: "Italia", fr: "Italie", de: "Italien", ja: "イタリア", it: "Italia", pt: "Itália" },
    "China (Mandarim)": { zh: "中国 (普通话)", en: "China (Mandarin)", es: "China (Mandarín)", fr: "Chine (Mandarin)", de: "China (Mandarin)", ja: "中国 (北京語)", it: "Cina (Mandarino)", pt: "China (Mandarim)" },
    "Taiwan": { zh: "台湾", en: "Taiwan", es: "Taiwán", fr: "Taïwan", de: "Taiwan", ja: "台湾", it: "Taiwan", pt: "Taiwan" },
    "Japão": { zh: "日本", en: "Japan", es: "Japón", fr: "Japon", de: "Japan", ja: "日本", it: "Giappone", pt: "Japão" },
    "Rússia": { zh: "俄罗斯", en: "Russia", es: "Rusia", fr: "Russie", de: "Russland", ja: "ロシア", it: "Russia", pt: "Rússia" },
    "Coreia do Sul": { zh: "韩国", en: "South Korea", es: "Corea del Sur", fr: "Corée du Sud", de: "Südkorea", ja: "大韓民国", it: "Corea del Sud", pt: "Coreia do Sul" },
    "Egito": { zh: "埃及", en: "Egypt", es: "Egipto", fr: "Égypte", de: "Ägypten", ja: "エジプト", it: "Egitto", pt: "Egito" },
    "Arábia Saudita": { zh: "沙特阿拉伯", en: "Saudi Arabia", es: "Arabia Saudí", fr: "Arabie Saoudite", de: "Saudi-Arabien", ja: "サウジアラビア", it: "Arabia Saudita", pt: "Arábia Saudita" },
    "Árabe Moderno Padrão": { zh: "现代标准阿拉伯语", en: "Modern Standard Arabic", es: "Árabe Estándar Moderno", fr: "Arabe Standard Moderne", de: "Modernes Standardarabisch", ja: "現代標準アラビア語", it: "Arabo Standard Moderno", pt: "Árabe Moderno Padrão" }
  };
  return map[label]?.[lang] || label;
};

const translateRegionalVariantDetails = (detail: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Pronúncia americana": { zh: "美式发音", en: "American pronunciation", es: "Pronunciación americana", fr: "Prononciation américaine", de: "Amerikanische Aussprache", ja: "アメリカ発音", it: "Pronuncia americana", pt: "Pronúncia americana" },
    "Expressões americanas": { zh: "美式表达", en: "American expressions", es: "Expresiones americanas", fr: "Expressions américaines", de: "Amerikanische Ausdrücke", ja: "アメリカの表現", it: "Espressioni americane", pt: "Expressões americanas" },
    "Popular para negócios": { zh: "商业热门", en: "Popular for business", es: "Popular para negocios", fr: "Populaire pour les affaires", de: "Beliebt für Geschäfte", ja: "ビジネスで人気", it: "Popolare per gli affari", pt: "Popular para negócios" },
    "Pronúncia britânica": { zh: "英式发音", en: "British pronunciation", es: "Pronunciación británica", fr: "Prononciation britannique", de: "Britische Aussprache", ja: "イギリス発音", it: "Pronuncia britannica", pt: "Pronúncia britânica" },
    "Expressões britânicas": { zh: "英式表达", en: "British expressions", es: "Expresiones británicas", fr: "Expressions britanniques", de: "Britische Ausdrücke", ja: "イギリスの表現", it: "Espressioni britanniche", pt: "Expressões britânicas" },
    "Uso académico": { zh: "学术用途", en: "Academic use", es: "Uso académico", fr: "Usage académique", de: "Akademische Nutzung", ja: "学術的用途", it: "Uso accademico", pt: "Uso académico" },
    "Inglês canadiano": { zh: "加拿大英语", en: "Canadian English", es: "Inglés canadiense", fr: "Anglais canadien", de: "Kanadisches Englisch", ja: "カナダ英語", it: "Inglese canadese", pt: "Inglês canadiano" },
    "Sotaque suave": { zh: "温柔口音", en: "Gentle accent", es: "Acento suave", fr: "Accent doux", de: "Sanfter Akzent", ja: "穏やかなアクセント", it: "Accento dolce", pt: "Sotaque suave" },
    "Bilinguismo": { zh: "双语环境", en: "Bilingualism", es: "Bilingüismo", fr: "Bilinguisme", de: "Zweisprachigkeit", ja: "バイリンガリズム", it: "Bilinguismo", pt: "Bilinguismo" },
    "Inglês australiano": { zh: "澳大利亚英语", en: "Australian English", es: "Inglés australiano", fr: "Anglais australien", de: "Australisches Englisch", ja: "オーストラリア英語", it: "Inglese australiano", pt: "Inglês australiano" },
    "Expressões únicas": { zh: "独特表达", en: "Unique expressions", es: "Expresiones únicas", fr: "Expressions uniques", de: "Einzigartige Ausdrücke", ja: "ユニークな表現", it: "Espressioni uniche", pt: "Expressões uniques" },
    "Estilo descontraído": { zh: "轻松风格", en: "Relaxed style", es: "Estilo relajado", fr: "Style décontracté", de: "Entspannter Stil", ja: "リラックスしたスタイル", it: "Stile rilassato", pt: "Estilo descontraído" },
    "Recomendado": { zh: "推荐", en: "Recommended", es: "Recomendado", fr: "Recommandé", de: "Empfohlen", ja: "おすすめ", it: "Consigliato", pt: "Recomendado" },
    "Compreensão universal": { zh: "通用理解", en: "Universal understanding", es: "Comprensión universal", fr: "Compréhension universelle", de: "Universelles Verständnis", ja: "普遍的な理解", it: "Comprensione universale", pt: "Compreensão universal" },
    "Uso global": { zh: "全球使用", en: "Global use", es: "Global use", fr: "Usage mondial", de: "Globale Nutzung", ja: "グローバルな使用", it: "Uso globale", pt: "Uso global" },
    "Português Brasileiro": { zh: "巴西葡萄牙语", en: "Brazilian Portuguese", es: "Portugués brasileño", fr: "Portugais brésilien", de: "Brasilianisches Portugiesisch", ja: "ブラジルポルトガル語", it: "Portoghese brasiliano", pt: "Português Brasileiro" },
    "Sotaque melódico": { zh: "悦耳口音", en: "Melodic accent", es: "Acento melódico", fr: "Accent mélodique", de: "Melodischer Akzent", ja: "旋律的なアクセント", it: "Accento melodico", pt: "Sotaque melódico" },
    "Expressões vibrantes": { zh: "活力表达", en: "Vibrant expressions", es: "Expresiones vibrantes", fr: "Expressions vibrantes", de: "Lebendige Ausdrücke", ja: "活気に満ちた表現", it: "Espressioni vivaci", pt: "Expressões vibrantes" },
    "Português Europeu": { zh: "欧洲葡萄牙语", en: "European Portuguese", es: "Portugués europeo", fr: "Portugais européen", de: "Europäisches Portugiesisch", ja: "欧州ポルトガル語", it: "Portoghese europeo", pt: "Português Europeu" },
    "Sotaque clássico": { zh: "经典口音", en: "Classic accent", es: "Acento clásico", fr: "Accent classique", de: "Klassischer Akzent", ja: "クラシックなアクセント", it: "Accento classico", pt: "Sotaque clássico" },
    "Expressões tradicionais": { zh: "传统表达", en: "Traditional expressions", es: "Expresiones tradicionales", fr: "Expressions traditionnelles", de: "Traditionelle Ausdrücke", ja: "伝統的な表現", it: "Espressioni tradizionali", pt: "Expressões tradicionais" },
    "Português Angolano": { zh: "安哥拉葡萄牙语", en: "Angolan Portuguese", es: "Portugués angoleño", fr: "Portugais angolais", de: "Angolanisches Portugiesisch", ja: "アンゴラポルトガル語", it: "Portoghese angolano", pt: "Português Angolano" },
    "Sotaque africano único": { zh: "独特非洲口音", en: "Unique African accent", es: "Acento africano único", fr: "Accent africain unique", de: "Einzigartiger afrikanischer Akzent", ja: "ユニークなアフリカ口音", it: "Accento africano unico", pt: "Sotaque africano único" },
    "Cultura rica": { zh: "丰富文化", en: "Rich culture", es: "Cultura rica", fr: "Culture riche", de: "Reiche Kultur", ja: "豊かな文化", it: "Cultura ricca", pt: "Cultura rica" },
    "Português Moçambicano": { zh: "莫桑比克葡萄牙语", en: "Mozambican Portuguese", es: "Portugués mozambiqueño", fr: "Portugais mozambicain", de: "Mosambikanisches Portugiesisch", ja: "モザンビークポルトガル語", it: "Portoghese mozambicano", pt: "Português Moçambicano" },
    "Sotaque rítmico": { zh: "节奏口音", en: "Rhythmic accent", es: "Acento rítmico", fr: "Accent rythmique", de: "Rhythmischer Akzent", ja: "リズム感のあるアクセント", it: "Accento ritmico", pt: "Sotaque rítmico" },
    "Identidade local": { zh: "地方特色", en: "Local identity", es: "Identité locale", fr: "Identité locale", de: "Lokale Identität", ja: "地域アイデンティティ", it: "Identità locale", pt: "Identidade local" },
    "Francês Europeu": { zh: "欧洲法语", en: "European French", es: "Francés europeo", fr: "Français européen", de: "Europäisches Französisch", ja: "欧州フランス語", it: "Francese europeo", pt: "Francês Europeu" },
    "Padrão de negócios e diplomacia": { zh: "商业与外交标准", en: "Business & diplomacy standard", es: "Estándar de negocios y diplomacia", fr: "Norme commerciale et diplomatique", de: "Standard für Wirtschaft und Diplomatie", ja: "ビジネスと外交の標準", it: "Standard per affari e diplomazia", pt: "Padrão de negócios e diplomacia" },
    "Francês Quebequense": { zh: "魁北克法语", en: "Quebec French", es: "Francés quebequense", fr: "Français québécois", de: "Quebec-Französisch", ja: "ケベックフランス語", it: "Francese del Quebec", pt: "Francês Quebequense" },
    "Expressões clássicas norte-americanas": { zh: "经典北美表达", en: "Classic North American expressions", es: "Expresiones clásicas norteamericanas", fr: "Expressions classiques nord-américaines", de: "Klassische nordamerikanische Ausdrücke", ja: "クラシックな北米の表現", it: "Espressioni classiche nordamericane", pt: "Expressões clássicas norte-americanas" },
    "Francês Belga": { zh: "比利时法语", en: "Belgian French", es: "Francés belga", fr: "Francés belge", de: "Belgisches Französisch", ja: "ベルギーフランス語", it: "Francese belga", pt: "Francês Belga" },
    "Sotaque e termos específicos": { zh: "特定口音及术语", en: "Specific accent and terms", es: "Acento y términos específicos", fr: "Accent et termes spécifiques", de: "Spezifischer Akzent und Begriffe", ja: "特定のアクセントと用語", it: "Accento e termini specifici", pt: "Sotaque e termos específicos" },
    "Septante e nonante": { zh: "70与90数词用法", en: "Septante and nonante", es: "Uso de septante y nonante", fr: "Septante et nonante", de: "Septante und nonante", ja: "70と90", it: "Settanta e novanta", pt: "Septante e nonante" },
    "Francês Suíço": { zh: "瑞士法语", en: "Swiss French", es: "Francés suizo", fr: "Français suisse", de: "Schweizer Französisch", ja: "スイスフランス語", it: "Francese svizzero", pt: "Francês Suíço" },
    "Sotaque melodioso": { zh: "悦耳口音", en: "Melodious accent", es: "Acento melodioso", fr: "Accent mélodieux", de: "Melodischer Akzent", ja: "メロディアスなアクセント", it: "Accento melodioso", pt: "Sotaque melodioso" },
    "Uso financeiro": { zh: "金融界广泛使用", en: "Financial use", es: "Uso financiero", fr: "Usage financier", de: "Finanzielle Nutzung", ja: "金融用途", it: "Uso finanziario", pt: "Uso financeiro" },
    "Espanhol Castelhano": { zh: "卡斯蒂利亚西班牙语", en: "Castilian Spanish", es: "Español castellano", fr: "Espagnol castillan", de: "Kastilisches Spanisch", ja: "カスティリャスペイン語", it: "Spagnolo castigliano", pt: "Espanhol Castelhano" },
    "Pronúncia europeia clássica": { zh: "经典欧洲发音", en: "Classic European pronunciation", es: "Pronunciación europea clásica", fr: "Prononciation européenne classique", de: "Klassische europäische Aussprache", ja: "クラシックな欧州発音", it: "Pronuncia classica europea", pt: "Pronúncia europeia clássica" },
    "Espanhol Mexicano": { zh: "墨西哥西班牙语", en: "Mexican Spanish", es: "Español mexicano", fr: "Espagnol mexicain", de: "Mexikanisches Spanisch", ja: "メキシコスペイン語", it: "Spagnolo messicano", pt: "Espanhol Mexicano" },
    "Maior população hispânica": { zh: "最大西语人口", en: "Largest Hispanic population", es: "Mayor población hispana", fr: "Plus grande population hispanique", de: "Größte spanischsprachige Bevölkerung", ja: "最大のヒスパニック人口", it: "Maggiore popolazione ispanica", pt: "Maior população hispânica" },
    "Mídia e negócios": { zh: "媒体与商业热门", en: "Media & business", es: "Medios y negocios", fr: "Médias et affaires", de: "Medien & Geschäft", ja: "メディアとビジネス", it: "Media e affari", pt: "Mídia e negócios" },
    "Espanhol Rioplatense": { zh: "拉普拉塔河西班牙语", en: "Rioplatense Spanish", es: "Español rioplatense", fr: "Espagnol rioplatense", de: "Rioplatense-Spanisch", ja: "リオプラテンセスペイン語", it: "Spagnolo rioplatense", pt: "Espanhol Rioplatense" },
    "Sotaque único": { zh: "独特口音", en: "Unique accent", es: "Acento único", fr: "Accent unique", de: "Einzigartiger Akzent", ja: "ユニークなアクセント", it: "Accento unico", pt: "Sotaque único" },
    "Uso do 'vos'": { zh: "人称vos特殊代词", en: "Use of 'vos'", es: "Uso de 'vos'", fr: "Utilisation du 'vos'", de: "Verwendung von 'vos'", ja: "「vos」の使用", it: "Uso del 'vos'", pt: "Uso do 'vos'" },
    "Espanhol Colombiano": { zh: "哥伦比亚西班牙语", en: "Colombian Spanish", es: "Español colombiano", fr: "Espagnol colombien", de: "Kolumbianisches Spanisch", ja: "コロンビアスペイン語", it: "Spagnolo colombiano", pt: "Espanhol Colombiano" },
    "Pronúncia clara e neutra": { zh: "清晰中立的发音", en: "Clear and neutral pronunciation", es: "Pronunciación clara y neutra", fr: "Prononciation claire et neutre", de: "Klare und neutrale Aussprache", ja: "明確でニュートラルな発音", it: "Pronuncia chiara e neutra", pt: "Pronúncia clara e neutra" },
    "Alemão Standard Hochdeutsch": { zh: "标准高地德语", en: "Standard German (Hochdeutsch)", es: "Alemán estándar (Hochdeutsch)", fr: "Allemand standard (Hochdeutsch)", de: "Standard-Hochdeutsch", ja: "標準ドイツ語", it: "Tedesco standard (Hochdeutsch)", pt: "Alemão Standard Hochdeutsch" },
    "Língua de engenharia e ciência": { zh: "工程和科学语言", en: "Language of engineering & science", es: "Línea de ingeniería y ciencia", fr: "Langue de l'ingénierie et des sciences", de: "Sprache der Ingenieurwissenschaften & Wissenschaft", ja: "工学と科学の言語", it: "Lingua dell'ingegneria e della scienza", pt: "Língua de engenharia e ciência" },
    "Alemão Austríaco": { zh: "奥地利德语", en: "Austrian German", es: "Austria", fr: "Autriche", de: "Österreichisches Deutsch", ja: "オーストリアドイツ語", it: "Tedesco austriaco", pt: "Alemão Austríaco" },
    "Nuances locais e sotaque elegante": { zh: "地方特色与优雅口音", en: "Local nuances and elegant accent", es: "Matices locales y acento elegante", fr: "Nuances locales et accent élégant", de: "Lokale Nuancen und eleganter Akzent", ja: "地元のニュアンスと上品なアクセント", it: "Sfumature locali e accento elegante", pt: "Nuances locais e sotaque elegante" },
    "Alemão Suíço": { zh: "瑞士德语", en: "Swiss German", es: "Alemán suizo", fr: "Allemand suisse", de: "Schweizerdeutsch", ja: "スイスドイツ語", it: "Tedesco svizzero", pt: "Alemão Suíço" },
    "Dialeto único e sotaque característico": { zh: "独特方言和特征口音", en: "Unique dialect and characteristic accent", es: "Dialecto único y acento característico", fr: "Dialecte unique et accent caractéristique", de: "Einzigartiger Dialekt und charakteristischer Akzent", ja: "ユニークな方言と特徴的なアクセント", it: "Dialetto unico e accento caratteristico", pt: "Dialeto único e sotaque característico" },
    "Padrão de Florença": { zh: "佛罗伦萨标准音", en: "Florence standard", es: "Estándar de Florencia", fr: "Norme de Florence", de: "Florenz-Standard", ja: "フィレンツェ標準", it: "Standard di Firenze", pt: "Padrão de Florença" },
    "Língua da arte, gastronomia e música": { zh: "艺术、美食与音乐之语言", en: "Language of art, gastronomy & music", es: "Idioma del arte, gastronomía y música", fr: "Langue de l'art, de la gastronomie et de la musique", de: "Sprache der Kunst, Gastronomie & Musik", ja: "芸術、美食、音楽の言語", it: "Lingua dell'arte, della gastronomia e della musica", pt: "Língua da arte, gastronomia e música" },
    "Mandarim Simplificado": { zh: "简体中文", en: "Simplified Mandarin", es: "Mandarín simplificado", fr: "Mandarin simplifié", de: "Vereinfachtes Mandarin", ja: "簡体字中国語", it: "Mandarino semplificato", pt: "Mandarim Simplificado" },
    "Uso oficial de Pequim": { zh: "北京官方标准", en: "Official Beijing use", es: "Uso oficial de Pekín", fr: "Usage officiel de Pékin", de: "Offizieller Peking-Gebrauch", ja: "北京の公式な使用", it: "Uso ufficiale di Pechino", pt: "Uso oficial de Pequim" },
    "Mandarim Tradicional": { zh: "繁体中文", en: "Traditional Mandarin", es: "Mandarín tradicional", fr: "Mandarin traditionnel", de: "Traditionelles Mandarin", ja: "繁体字中国語", it: "Mandarino tradizionale", pt: "Mandarim Tradicional" },
    "Escrita tradicional": { zh: "繁体字书写", en: "Traditional writing", es: "Escritura tradicional", fr: "Écriture traditionnelle", de: "Traditionelle Schrift", ja: "繁体字表記", it: "Scrittura tradizionale", pt: "Escrita tradicional" },
    "Nuances locais": { zh: "地方特色", en: "Local nuances", es: "Matices locales", fr: "Nuances locales", de: "Lokale Nuancen", ja: "地元のニュアンス", it: "Sfumature locali", pt: "Nuances locais" },
    "Japonês Padrão (Hyojungo)": { zh: "标准日语 (共通语)", en: "Standard Japanese (Hyojungo)", es: "Japonés estándar (Hyojungo)", fr: "Japonais standard (Hyojungo)", de: "Standardjapanisch (Hyojungo)", ja: "標準語 (標準語)", it: "Giapponese standard (Hyojungo)", pt: "Japonês Padrão (Hyojungo)" },
    "Foco em Tóquio": { zh: "以东京为基准", en: "Focused on Tokyo", es: "Enfoque en Tokio", fr: "Axé sur Tokyo", de: "Fokus auf Tokio", ja: "東京に焦点を当てる", it: "Focalizzato su Tokyo", pt: "Foco em Tóquio" },
    "Linguagem honorífica Keigo": { zh: "敬语表达系统", en: "Honorific language Keigo", es: "Lenguaje honorífico Keigo", fr: "Langage honorifique Keigo", de: "Höflichkeitssprache Keigo", ja: "敬語表現", it: "Linguaggio onorifico Keigo", pt: "Linguagem honorífica Keigo" },
    "Russo Padrão": { zh: "标准俄语", en: "Standard Russian", es: "Ruso estándar", fr: "Russe standard", de: "Standardrussisch", ja: "標準ロシア語", it: "Russo standard", pt: "Russo Padrão" },
    "Foco em Moscovo": { zh: "以莫斯科为基准", en: "Focused on Moscow", es: "Enfoque en Moscú", fr: "Axé sur Moscou", de: "Fokus auf Moskau", ja: "モスクワに焦点を当てる", it: "Focalizzato su Mosca", pt: "Foco em Moscovo" },
    "Uso euro-asiático amplo": { zh: "广泛欧亚大陆使用", en: "Broad Eurasian use", es: "Uso euroasiático amplio", fr: "Large usage eurasiatique", de: "Breite eurasische Nutzung", ja: "幅広いユーラシアでの使用", it: "Ampio uso eurasiatico", pt: "Uso euro-asiático amplo" },
    "Coreano de Seul": { zh: "首尔标准韩语", en: "Seoul Korean", es: "Coreano de Seúl", fr: "Coréen de Séoul", de: "Seoul-Koreanisch", ja: "ソウル韓国語", it: "Coreano di Seul", pt: "Coreano de Seul" },
    "K-Drama e K-Pop": { zh: "韩剧与韩流音乐", en: "K-Drama and K-Pop", es: "K-Drama y K-Pop", fr: "K-Drama et K-Pop", de: "K-Drama und K-Pop", ja: "韓国ドラマとK-POP", it: "Drama coreani e K-Pop", pt: "K-Drama e K-Pop" },
    "Escrita Hangul moderna": { zh: "现代谚文书写", en: "Modern Hangul writing", es: "Escritura Hangul moderna", fr: "Écriture Hangul moderne", de: "Moderne Hangul-Schrift", ja: "現代ハングル表記", it: "Scrittura Hangul moderna", pt: "Escrita Hangul moderna" },
    "Árabe Egípcio": { zh: "埃及阿拉伯语", en: "Egyptian Arabic", es: "Árabe egipcio", fr: "Arabe égyptien", de: "Ägyptisches Arabisch", ja: "エジプトアラビア語", it: "Arabo egiziano", pt: "Árabe Egípcio" },
    "Dialeto mais falado": { zh: "使用最广泛的方言", en: "Most spoken dialect", es: "Dialecto más hablado", fr: "Dialecte le plus parlé", de: "Meistgesprochener Dialekt", ja: "最も話されている方言", it: "Dialetto più parlato", pt: "Dialeto mais falado" },
    "Cultura e mídia": { zh: "文化与媒体", en: "Culture & media", es: "Cultura y medios", fr: "Culture et médias", de: "Kultur & Medien", ja: "文化とメディア", it: "Cultura e media", pt: "Cultura e mídia" },
    "Árabe Khaliji (Golfo)": { zh: "海湾阿拉伯语", en: "Gulf Arabic (Khaliji)", es: "Árabe del Golfo (Jalichi)", fr: "Arabe du Golfe (Khaliji)", de: "Golf-Arabisch (Khalidschi)", ja: "湾岸アラビア語", it: "Arabo del Golfo (Khaliji)", pt: "Árabe Khaliji (Golfo)" },
    "Fusha (Internacional)": { zh: "书面阿拉伯语 (Fusha)", en: "Fusha (International)", es: "Fusha (Internacional)", fr: "Fusha (International)", de: "Fusha (International)", ja: "フスハ (国際標準)", it: "Fusha (Internazionale)", pt: "Fusha (Internacional)" },
    "Mídia escrita, jornais e TV": { zh: "印刷媒体、报纸和电视", en: "Written media, newspapers & TV", es: "Medios escritos, periódicos y TV", fr: "Médias écrits, journaux et TV", de: "Schriftmedien, Zeitungen & TV", ja: "書面メディア、新聞、テレビ", it: "Media scritti, giornali e TV", pt: "Mídia escrita, jornais e TV" }
  };
  return map[detail]?.[lang] || detail;
};

const translateGoalName = (name: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Trabalho": { zh: "工作", en: "Work", es: "Trabajo", fr: "Travail", de: "Arbeit", ja: "仕事", it: "Lavoro", pt: "Trabalho" },
    "Viagens": { zh: "旅行", en: "Travel", es: "Viajes", fr: "Voyages", de: "Reisen", ja: "旅行", it: "Viaggi", pt: "Viagens" },
    "Escola": { zh: "学校", en: "School", es: "Escuela", fr: "École", de: "Schule", ja: "学校", it: "Scuola", pt: "Escola" },
    "Universidade": { zh: "大学", en: "University", es: "Universidad", fr: "Université", de: "Universität", ja: "大学", it: "Università", pt: "Universidade" },
    "Negócios": { zh: "商业", en: "Business", es: "Negocios", fr: "Affaires", de: "Geschäft", ja: "ビジネス", it: "Affari", pt: "Negócios" },
    "Mudança de país": { zh: "移民定居", en: "Relocation", es: "Mudanza de país", fr: "Relocalisation", de: "Auswanderung", ja: "海外移住", it: "Trasferimento", pt: "Mudança de país" },
    "Conversação": { zh: "日常交流", en: "Conversation", es: "Conversación", fr: "Conversation", de: "Konversation", ja: "会話", it: "Conversazione", pt: "Conversação" },
    "Exames": { zh: "应试准备", en: "Exams", es: "Exámenes", fr: "Examens", de: "Prüfungen", ja: "試験対策", it: "Esami", pt: "Exames" },
    "Cultura": { zh: "文化兴趣", en: "Culture", es: "Cultura", fr: "Culture", de: "Kultur", ja: "文化", it: "Cultura", pt: "Cultura" },
    "Outro": { zh: "其他目的", en: "Other", es: "Otro", fr: "Autre", de: "Anderes", ja: "その他", it: "Altro", pt: "Outro" }
  };
  return map[name]?.[lang] || name;
};

const translateAiLoadingText = (text: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Analisando o seu perfil...": {
      zh: "正在分析您的个人档案...",
      en: "Analyzing your profile...",
      es: "Analizando tu perfil...",
      fr: "Analyse de votre profil...",
      de: "Profil wird analysiert...",
      ja: "プロフィールを分析中...",
      it: "Analisi del tuo profilo...",
      pt: "Analisando o seu perfil...",
      br: "Analisando o seu perfil..."
    },
    "Criando aulas...": {
      zh: "正在创建课程...",
      en: "Creating lessons...",
      es: "Creando lecciones...",
      fr: "Création des leçons...",
      de: "Lektionen werden erstellt...",
      ja: "レッスンを作成中...",
      it: "Creazione delle lezioni...",
      pt: "Criando aulas...",
      br: "Criando aulas..."
    },
    "Selecionando exercícios...": {
      zh: "正在选择练习...",
      en: "Selecting exercises...",
      es: "Selecionando ejercicios...",
      fr: "Sélection des exercices...",
      de: "Übungen werden ausgewählt...",
      ja: "演習を選択中...",
      it: "Selezione degli esercizi...",
      pt: "Selecionando exercícios...",
      br: "Selecionando exercícios..."
    },
    "Configurando jogos...": {
      zh: "正在配置游戏...",
      en: "Configuring games...",
      es: "Configurando juegos...",
      fr: "Configuration des jeux...",
      de: "Spiele werden konfiguriert...",
      ja: "ゲームを設定中...",
      it: "Configurazione dei giochi...",
      pt: "Configurando jogos...",
      br: "Configurando jogos..."
    },
    "Preparando professor virtual...": {
      zh: "正在准备虚拟教师...",
      en: "Preparing virtual tutor...",
      es: "Preparando tutor virtual...",
      fr: "Préparation du tuteur virtuel...",
      de: "Virtueller Tutor wird vorbereitet...",
      ja: "バーチャル講師を準備中...",
      it: "Preparazione del tutor virtuale...",
      pt: "Preparando professor virtual...",
      br: "Preparando professor virtual..."
    }
  };
  return map[text]?.[lang] || text;
};

const translateTimeText = (text: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "10 minutos": { zh: "10 分钟", en: "10 minutes", es: "10 minutos", fr: "10 minutes", de: "10 Minuten", ja: "10分", it: "10 minuti", pt: "10 minutos" },
    "15 minutos": { zh: "15 分钟", en: "15 minutes", es: "15 minutos", fr: "15 minutes", de: "15 Minuten", ja: "15分", it: "15 minuti", pt: "15 minutos" },
    "20 minutos": { zh: "20 分钟", en: "20 minutes", es: "20 minutes", fr: "20 minutes", de: "20 Minuten", ja: "20分", it: "20 minuti", pt: "20 minutos" },
    "30 minutos": { zh: "30 分钟", en: "30 minutes", es: "30 minutes", fr: "30 minutes", de: "30 Minuten", ja: "30分", it: "30 minuti", pt: "30 minutos" },
    "45 minutos": { zh: "45 分钟", en: "45 minutes", es: "45 minutes", fr: "45 minutes", de: "45 Minuten", ja: "45分", it: "45 minuti", pt: "45 minutos" },
    "1 hora": { zh: "1 小时", en: "1 hour", es: "1 hora", fr: "1 heure", de: "1 Stunde", ja: "1時間", it: "1 ora", pt: "1 hora" },
    "Mais de 1 hora": { zh: "1 小时以上", en: "More than 1 hour", es: "Más de 1 hora", fr: "Plus d'une heure", de: "Mehr als 1 Stunde", ja: "1時間以上", it: "Più di 1 ora", pt: "Mais de 1 hora" }
  };
  return map[text]?.[lang] || text;
};

const translateIntensityText = (intensity: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Leve": { zh: "轻度", en: "Light", es: "Leve", fr: "Léger", de: "Leicht", ja: "ライト", it: "Leggero", pt: "Leve" },
    "Básico": { zh: "基础", en: "Basic", es: "Básico", fr: "Basique", de: "Basis", ja: "ベーシック", it: "Base", pt: "Básico" },
    "Moderado": { zh: "中度", en: "Moderate", es: "Moderado", fr: "Modéré", de: "Moderat", ja: "モデレート", it: "Moderato", pt: "Moderado" },
    "Recomendado": { zh: "推荐", en: "Recommended", es: "Recommended", fr: "Recommandé", de: "Empfohlen", ja: "おすすめ", it: "Consigliato", pt: "Recomendado" },
    "Intenso": { zh: "高强度", en: "Intense", es: "Intenso", fr: "Intense", de: "Intensiv", ja: "インテンス", it: "Intenso", pt: "Intenso" },
    "Avançado": { zh: "专业级", en: "Advanced", es: "Avanzado", fr: "Avancé", de: "Fortgeschritten", ja: "アドバンスド", it: "Avanzato", pt: "Avançado" },
    "Extremo": { zh: "发烧级", en: "Extreme", es: "Extremo", fr: "Extrême", de: "Extrem", ja: "エクストリーム", it: "Estremo", pt: "Extremo" }
  };
  return map[intensity]?.[lang] || intensity;
};

const translateLevelName = (title: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Iniciante": { zh: "初学者", en: "Beginner", es: "Principiante", fr: "Débutant", de: "Anfänger", ja: "初心者", it: "Principiante", pt: "Iniciante" },
    "Básico": { zh: "基础", en: "Basic", es: "Básico", fr: "Élémentaire", de: "Grundlagen", ja: "初級", it: "Base", pt: "Básico" },
    "Intermédio": { zh: "中级", en: "Intermediate", es: "Intermedio", fr: "Intermédiaire", de: "Mittelstufe", ja: "中級", it: "Intermedio", pt: "Intermédio" },
    "Intermédio Avançado": { zh: "中高级", en: "Upper Intermediate", es: "Intermedio Avanzado", fr: "Intermédiaire Supérieur", de: "Fortgeschrittene Mittelstufe", ja: "中上級", it: "Intermedio Avanzato", pt: "Intermédio Avançado" },
    "Avançado": { zh: "高级", en: "Advanced", es: "Avanzado", fr: "Avancé", de: "Fortgeschritten", ja: "上級", it: "Avanzato", pt: "Avançado" },
    "Fluente": { zh: "流利", en: "Fluent", es: "Fluido", fr: "Courant", de: "Fließend", ja: "流暢", it: "Fluente", pt: "Fluente" }
  };
  return map[title]?.[lang] || title;
};

const translateLevelDesc = (desc: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Consigo entender frases do dia a dia e palavras simples.": {
      zh: "我能理解日常短语和简单的词汇。",
      en: "I can understand everyday phrases and simple words.",
      es: "Puedo entender frases cotidianas y palabras sencillas.",
      fr: "Je peux comprendre des phrases quotidiennes et des mots simples.",
      de: "Ich kann alltägliche Ausdrücke und einfache Wörter verstehen.",
      ja: "日常的なフレーズや簡単な単語を理解できます。",
      it: "Riesco a capire frasi quotidiane e parole semplici.",
      pt: "Consigo entender frases do dia a dia e palavras simples."
    },
    "Consigo comunicar em tarefas simples e rotineiras.": {
      zh: "我能在简单而常规的任务中进行交流。",
      en: "I can communicate in simple and routine tasks.",
      es: "Puedo comunicarme en tareas simples y rutinarias.",
      fr: "Je peux communiquer lors de tâches simples et courantes.",
      de: "Ich kann mich in einfachen, routinemäßigen Situationen verständigen.",
      ja: "簡単で日常的な業務について意思疎通ができます。",
      it: "Riesco a comunicare in compiti semplici e di routine.",
      pt: "Consigo comunicar em tarefas simples e rotineiras."
    },
    "Consigo lidar com a maioria das situações de viagem.": {
      zh: "我能应对旅行中的大多数情况。",
      en: "I can handle most travel situations.",
      es: "Puedo manejar la mayoría de las situaciones de viaje.",
      fr: "Je peux gérer la plupart des situations de voyage.",
      de: "Ich kann die meisten Reisesituationen bewältigen.",
      ja: "旅行中の大半の事態に対処できます。",
      it: "Riesco ad affrontare la maggior parte delle situazioni in viaggio.",
      pt: "Consigo lidar com a maioria das situações de viagem."
    },
    "Consigo dialogar de forma fluida com falantes nativos.": {
      zh: "我能与母语人士流利地对话。",
      en: "I can converse fluently with native speakers.",
      es: "Puedo conversar con fluidez con hablantes nativos.",
      fr: "Je peux converser couramment avec des locuteurs natifs.",
      de: "Ich kann mich fließend mit Muttersprachlern unterhalten.",
      ja: "ネイティブスピーカーと流暢に会話ができます。",
      it: "Riesco a dialogare in modo fluido con i madrelingua.",
      pt: "Consigo dialogar de forma fluida com falantes nativos."
    },
    "Compreendo uma vasta gama de textos complexos.": {
      zh: "我能理解广泛的复杂文本。",
      en: "I understand a wide range of complex texts.",
      es: "Entiendo una amplia gama de textos complejos.",
      fr: "Je comprends une large gamme de textes complexes.",
      de: "Ich verstehe eine breite Palette anspruchsvoller Texte.",
      ja: "広範で複雑なテキストを理解できます。",
      it: "Capisco un'ampia gamma di testi complessi.",
      pt: "Compreendo uma vasta gama de textos complexos."
    },
    "Consigo entender e falar com total facilidade e precisão.": {
      zh: "我能毫不费力、准确地理解和表达。",
      en: "I can understand and speak with complete ease and precision.",
      es: "Puedo entender y hablar con total facilidad y precisión.",
      fr: "Je peux comprendre et parler avec une facilité et une précision totales.",
      de: "Ich kann mühelos und präzise verstehen und sprechen.",
      ja: "完全に容易かつ正確に理解し、話すことができます。",
      it: "Riesco a comprendere e parlare con totale facilità e precisione.",
      pt: "Consigo entender e falar com total facilidade e precisão."
    }
  };
  return map[desc]?.[lang] || desc;
};

const translateLoaderText = (text: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    "Analisando o seu perfil...": { zh: "正在分析您的个人概况...", en: "Analyzing your profile...", es: "Analizando tu perfil...", fr: "Analyse de votre profil...", de: "Ihr Profil wird analysiert...", ja: "プロフィールを分析しています...", it: "Analizzando il tuo profilo...", pt: "Analisando o seu perfil..." },
    "Criando aulas...": { zh: "正在创建课程...", en: "Creating lessons...", es: "Creando clases...", fr: "Création des cours...", de: "Lektionen werden erstellt...", ja: "レッスンを作成しています...", it: "Creando lezioni...", pt: "Criando aulas..." },
    "Selecionando exercícios...": { zh: "正在挑选练习题...", en: "Selecting exercises...", es: "Selecting exercises...", fr: "Sélection des exercices...", de: "Übungen werden ausgewählt...", ja: "エクササイズを選択しています...", it: "Selezionando esercizi...", pt: "Selecionando exercícios..." },
    "Configurando jogos...": { zh: "正在配置游戏...", en: "Configuring games...", es: "Configurando juegos...", fr: "Configuration des jeux...", de: "Spiele werden eingerichtet...", ja: "ゲームを設定しています...", it: "Configurando giochi...", pt: "Configurando jogos..." },
    "Preparando professor virtual...": { zh: "正在准备虚拟教师...", en: "Preparing virtual tutor...", es: "Preparando tutor virtual...", fr: "Préparation de l'enseignant virtuel...", de: "Virtueller Lehrer wird vorbereitet...", ja: "バーチャル講師を準備しています...", it: "Preparando insegnante virtuale...", pt: "Preparando professor virtual..." }
  };
  return map[text]?.[lang] || text;
};

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const { setLocalization, localization } = useLocalization();
  const [, setDummy] = useState({});
  useLanguageChanged(() => setDummy({}));
  
  const [currentWelcomeLang, setCurrentWelcomeLang] = useState<string>(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) return "zh";
    if (browserLang.startsWith("es")) return "es";
    if (browserLang.startsWith("fr")) return "fr";
    if (browserLang.startsWith("de")) return "de";
    if (browserLang.startsWith("ja")) return "ja";
    if (browserLang.startsWith("it")) return "it";
    if (browserLang.startsWith("en")) return "en";
    if (browserLang.includes("br")) return "br";
    return "pt";
  });

  // Synchronize state with context
  useEffect(() => {
    if (localization?.language && localization.language !== currentWelcomeLang) {
      setCurrentWelcomeLang(localization.language);
    }
  }, [localization?.language]);

  const ot = (key: string, defaultText: string = ''): string => {
    const currentLang = currentWelcomeLang || "pt";
    const dict = ONBOARDING_I18N[currentLang] || ONBOARDING_I18N.pt;
    return dict[key] || ONBOARDING_I18N.pt[key] || defaultText || key;
  };
  const [isWelcomeLangDropdownOpen, setIsWelcomeLangDropdownOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Anxiety-inducing rapid live millisecond/second ticker for global immersive feel
  const [tickerTime, setTickerTime] = useState({ min: 14, sec: 59, ms: 99 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTime(prev => {
        let nMs = prev.ms - 7;
        let nSec = prev.sec;
        let nMin = prev.min;
        if (nMs < 0) {
          nMs = 99 + nMs;
          nSec -= 1;
        }
        if (nSec < 0) {
          nSec = 59;
          nMin -= 1;
        }
        if (nMin < 0) {
          nMin = 14;
          nSec = 59;
          nMs = 99;
        }
        return { min: nMin, sec: nSec, ms: nMs };
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Profile Form States
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [learningIntent, setLearningIntent] = useState<boolean>(true);
  const [countryCode, setCountryCode] = useState<string>("");
  const [countrySearch, setCountrySearch] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState<string>("");
  const [learningLanguage, setLearningLanguage] = useState<string>("");
  
  // Local state for interactive 2-step language wizard
  const [langWizardStep, setLangWizardStep] = useState<1 | 2>(1);
  const [langSearch, setLangSearch] = useState<string>("");
  
  // Regional & Pedagogical preferences
  const [targetRegion, setTargetRegion] = useState<string>("US");
  const [languageMode, setLanguageMode] = useState<string>("Standard");
  const [allowRegionalExpressions, setAllowRegionalExpressions] = useState<boolean>(true);
  const [allowSlang, setAllowSlang] = useState<boolean>(true);

  const [level, setLevel] = useState<string>("");
  const [learningGoal, setLearningGoal] = useState<string>("");
  const [dailyGoal, setDailyGoal] = useState<number>(20);
  const [studyFrequency, setStudyFrequency] = useState<number>(5);

  // Mini Quiz States for "Não sei meu nível"
  const [quizStep, setQuizStep] = useState(0); // 0 means not started, 1, 2, 3 questions, 4 results
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState(0);

  // AI loading screens text state
  const [aiLoadingIndex, setAiLoadingIndex] = useState(0);
  const aiLoadingTexts = [
    "Analisando o seu perfil...",
    "Criando aulas...",
    "Selecionando exercícios...",
    "Configurando jogos...",
    "Preparando professor virtual..."
  ];

  // Country filtering
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);

  // 1. Load Saved Onboarding Draft / Intermediate Progress on Mount
  useEffect(() => {
    if (!user) return;
    
    const loadSavedOnboardingProgress = async () => {
      try {
        // Try local storage cache first for zero-latency loading
        const cacheKey = `lingolive_onboarding_draft_${user.uid}`;
        const cachedDataStr = localStorage.getItem(cacheKey);
        let draftData: any = null;
        if (cachedDataStr) {
          try {
            draftData = JSON.parse(cachedDataStr);
          } catch (e) {}
        }
        
        // Fetch from Firestore to sync any existing draft across devices
        let firestoreData: any = null;
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            firestoreData = userSnap.data();
          }
        } catch (dbErr) {
          console.warn("Could not load onboarding draft from Firestore:", dbErr);
        }
        
        const mergedData = { ...draftData, ...firestoreData };
        if (mergedData.onboardingStep && !mergedData.profileCompleted) {
          setStep(mergedData.onboardingStep);
          if (mergedData.age) setAge(Number(mergedData.age));
          if (mergedData.gender) setGender(mergedData.gender);
          if (mergedData.role) setRole(mergedData.role);
          if (mergedData.countryCode) setCountryCode(mergedData.countryCode);
          if (mergedData.nativeLanguage) setNativeLanguage(mergedData.nativeLanguage);
          if (mergedData.learningLanguage) setLearningLanguage(mergedData.learningLanguage);
          if (mergedData.targetRegion) setTargetRegion(mergedData.targetRegion);
          if (mergedData.languageMode) setLanguageMode(mergedData.languageMode);
          if (mergedData.allowRegionalExpressions !== undefined) setAllowRegionalExpressions(mergedData.allowRegionalExpressions);
          if (mergedData.allowSlang !== undefined) setAllowSlang(mergedData.allowSlang);
          if (mergedData.level) setLevel(mergedData.level);
          if (mergedData.learningGoal) setLearningGoal(mergedData.learningGoal);
          if (mergedData.dailyGoal) setDailyGoal(Number(mergedData.dailyGoal));
          if (mergedData.studyFrequency) setStudyFrequency(Number(mergedData.studyFrequency));
        }
      } catch (err) {
        console.error("Error loading onboarding draft:", err);
      }
    };
    
    loadSavedOnboardingProgress();
  }, [user]);

  // 2. Save Onboarding Draft / Intermediate Progress automatically on step or field change
  useEffect(() => {
    if (!user || step === 1 || step === 11) return; // Skip splash and loading final steps
    
    const saveDraftProgress = async () => {
      const draftData = {
        onboardingStep: step,
        age: age ? Number(age) : "",
        gender,
        role,
        countryCode,
        nativeLanguage,
        learningLanguage,
        targetRegion,
        languageMode,
        allowRegionalExpressions,
        allowSlang,
        level,
        learningGoal,
        dailyGoal,
        studyFrequency,
        profileCompleted: false, // Explicitly false while draft
        updatedAt: new Date().toISOString()
      };
      
      const cacheKey = `lingolive_onboarding_draft_${user.uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(draftData));
      
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          onboardingStep: step,
          age: age ? Number(age) : "",
          gender,
          role,
          countryCode,
          nativeLanguage,
          learningLanguage,
          targetRegion,
          languageMode,
          allowRegionalExpressions,
          allowSlang,
          level,
          learningGoal,
          dailyGoal,
          studyFrequency,
          profileCompleted: false,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not save onboarding draft to Firestore:", err);
      }
    };
    
    // Simple debounce to prevent Firestore write rate-limiting during typing
    const timeoutId = setTimeout(() => {
      saveDraftProgress();
    }, 600);
    
    return () => clearTimeout(timeoutId);
  }, [step, age, gender, countryCode, nativeLanguage, learningLanguage, targetRegion, languageMode, allowRegionalExpressions, allowSlang, level, learningGoal, dailyGoal, studyFrequency, user]);

  // Automatically update targetRegion defaults when learningLanguage changes
  useEffect(() => {
    if (!learningLanguage) return;
    if (learningLanguage === "Inglês") {
      setTargetRegion("US");
    } else if (learningLanguage === "Português") {
      setTargetRegion("BR");
    } else if (learningLanguage === "Francês") {
      setTargetRegion("FR");
    } else if (learningLanguage === "Espanhol") {
      setTargetRegion("ES");
    } else if (learningLanguage === "Alemão") {
      setTargetRegion("DE");
    } else if (learningLanguage === "Italiano") {
      setTargetRegion("IT");
    } else if (learningLanguage === "Chinês") {
      setTargetRegion("CN");
    } else if (learningLanguage === "Japonês") {
      setTargetRegion("JP");
    } else if (learningLanguage === "Russo") {
      setTargetRegion("RU");
    } else if (learningLanguage === "Coreano") {
      setTargetRegion("KR");
    } else if (learningLanguage === "Árabe") {
      setTargetRegion("EG");
    } else {
      setTargetRegion("Standard");
    }
  }, [learningLanguage]);

  // AI loading loop
  useEffect(() => {
    if (step === 10) {
      const interval = setInterval(() => {
        setAiLoadingIndex(prev => {
          if (prev < aiLoadingTexts.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 600);

      const timeout = setTimeout(() => {
        setStep(11);
      }, 3200);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [step]);

  // Handle Leveling quiz
  const quizQuestions = [
    {
      question: "Escolha a frase gramaticalmente correta em Inglês:",
      options: [
        "She go to the school every day.",
        "She goes to the school every day.",
        "She going to school every day."
      ],
      correct: 1
    },
    {
      question: "Qual é a resposta mais adequada para: 'How have you been?'",
      options: [
        "I am fine, thanks, and you?",
        "I have 25 years old.",
        "Yes, I like soccer."
      ],
      correct: 0
    },
    {
      question: "Preencha a lacuna: 'If it rains tomorrow, we _______ the picnic.'",
      options: [
        "will cancel",
        "would cancel",
        "canceled"
      ],
      correct: 0
    }
  ];

  const handleQuizAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === quizQuestions[quizStep - 1].correct;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    setQuizAnswers(prev => [...prev, optionIndex]);

    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      // Done. Determine level based on final score
      const finalScore = quizScore + (isCorrect ? 1 : 0);
      let calculatedLevel = "A1";
      if (finalScore === 1) calculatedLevel = "A2";
      if (finalScore === 2) calculatedLevel = "B1";
      if (finalScore === 3) calculatedLevel = "B2";
      
      setLevel(calculatedLevel);
      setQuizStep(4);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      if (!age || age < 5 || age > 99) return;
      if (!gender) return;
      if (!role) return;
      if (!countryCode) return;

      if (role !== "ESTUDANTE" && !learningIntent) {
        await saveNonLearnerProfileAndFinish();
        setStep(11);
        return;
      }
    }
    if (step === 3 && !nativeLanguage) return;
    if (step === 4) {
      if (langWizardStep === 1) {
        if (!learningLanguage) return;
        setLangWizardStep(2);
        return;
      } else {
        if (!targetRegion) return;
      }
    }
    if (step === 5 && !targetRegion) return;
    if (step === 6 && !level) return;
    if (step === 7 && !learningGoal) return;

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 4 && langWizardStep === 2) {
      setLangWizardStep(1);
      return;
    }
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const saveProfileAndFinish = async () => {
    if (!user) return;
    if (isSaving) return;
    
    setIsSaving(true);
    setError("");

    try {
      const intelligentProfileData: Omit<IntelligentProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
        personalData: {
          age: age ? Number(age) : null,
          gender,
          country: countryCode,
          role
        },
        languageProfile: {
          nativeLanguage: nativeLanguage || "Português",
          targetLanguage: learningLanguage || "Inglês",
          level,
          goals: [learningGoal],
          learningStyle: "adaptive"
        },
        aiPreferences: {
          languageMode,
          allowRegionalExpressions,
          allowSlang,
          dailyGoal,
          studyFrequency
        },
        recommendations: {
          learningPath: "initial_assessment",
          aiTutorEnabled: true
        },
        onboardingCompleted: true,
        profileVersion: 1
      };

      // CORREÇÃO DE AUDITORIA: além do formato legado acima (mantido por
      // compatibilidade), gravamos também os domínios oficiais do SmartProfile
      // (com o invólucro Attribute<T>) — é isto que o resto da app (App.tsx,
      // LocalizationContext, tutor de IA) realmente lê. Sem isto, o idioma
      // escolhido aqui nunca chegava a refletir-se na interface nem no tutor.
      const nowIso = new Date().toISOString();
      const makeAttribute = <T,>(value: T, source: string = 'user'): Attribute<T> => ({
        value,
        confidence: 1,
        source,
        lastUpdated: nowIso,
        validationStatus: 'verified',
        version: '1.0.0'
      });

      const resolvedCountry = (countryCode || 'US').toUpperCase();
      const resolvedInterfaceLanguage =
        getDefaultInterfaceLanguageForCountry(resolvedCountry) ||
        (nativeLanguage ? nativeLanguage.toLowerCase() : 'pt');

      const smartProfileDomains: Partial<SmartProfile> = {
        identity: {
          userId: makeAttribute(user.uid, 'system'),
          fullName: makeAttribute(user.displayName || ''),
          preferredDisplayName: makeAttribute(user.displayName || user.email?.split('@')[0] || ''),
          birthDate: makeAttribute(''),
          gender: makeAttribute(gender || ''),
        } as any,
        localization: {
          country: makeAttribute(resolvedCountry),
          interfaceLanguage: makeAttribute(resolvedInterfaceLanguage),
          nativeLanguage: makeAttribute(nativeLanguage || 'pt'),
          timezone: makeAttribute(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
        } as any,
        learning: {
          cefrLevel: makeAttribute(level || 'A1'),
          vocabularySize: makeAttribute(0),
          learningStyle: makeAttribute('adaptive'),
          targetLanguage: makeAttribute(learningLanguage || 'en'),
          targetLanguages: makeAttribute([learningLanguage || 'en']),
        } as any,
        account: {
          role: makeAttribute(role || 'Student'),
          status: makeAttribute('ACTIVE'),
          dailyGoal: makeAttribute(dailyGoal),
          subscriptionActive: makeAttribute(false),
          lastLogin: makeAttribute(nowIso),
        } as any,
      };

      const userData = {
        age: age ? Number(age) : null,
        role: role || "Student",
        status: "ACTIVE",
        onboardingCompleted: true,
        welcomeCompleted: true,
        learningIntent: true,
        updatedAt: serverTimestamp()
      };

      const batch = writeBatch(db);
      const intelligentProfileRef = doc(db, "intelligentProfiles", user.uid);
      const userRef = doc(db, "users", user.uid);
      
      const existingProfileSnapshot = await getDoc(intelligentProfileRef);
      const existingProfile = existingProfileSnapshot.exists() ? existingProfileSnapshot.data() : null;

      batch.set(intelligentProfileRef, {
        ...intelligentProfileData,
        ...smartProfileDomains,
        userId: user.uid,
        createdAt: existingProfile?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      batch.set(userRef, userData, { merge: true });

      await batch.commit();

      // Sincroniza imediatamente a interface com o país/idioma escolhidos no
      // wizard, para o utilizador ver a mudança já nesta sessão (não só na
      // próxima vez que entrar).
      try {
        const currencyByCountry: Record<string, string> = {
          AO: 'AOA', BR: 'BRL', PT: 'EUR', MZ: 'MZN', US: 'USD', ZA: 'ZAR',
          CV: 'AOA', GW: 'AOA', ST: 'AOA', TL: 'USD', NG: 'USD', GB: 'USD',
          DE: 'EUR', IT: 'EUR', CN: 'USD', IN: 'USD',
        };
        await setLocalization({
          country: resolvedCountry,
          language: resolvedInterfaceLanguage,
          currency: currencyByCountry[resolvedCountry] || localization.currency,
        });
      } catch (syncErr) {
        console.warn('[ONBOARDING] Perfil gravado, mas falhou a sincronização imediata da interface:', syncErr);
      }

      const savedProfileSnapshot = await getDoc(intelligentProfileRef);
      const savedProfile = savedProfileSnapshot.exists() ? savedProfileSnapshot.data() : {};

      console.info("[ONBOARDING] Perfil confirmado e gravado com sucesso", {
        userId: user.uid,
        onboardingCompleted: true
      });

      onComplete({
        ...savedProfile,
        ...userData,
        uid: user.uid,
        status: "ACTIVE",
        onboardingCompleted: true,
        welcomeCompleted: true
      });
    } catch (err: any) {
      console.error("Erro ao criar perfil inteligente:", err);
      setError(err?.message || "Erro ao salvar o perfil. Por favor tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveNonLearnerProfileAndFinish = async () => {
    if (!user) return;
    if (isSaving) return;
    
    setIsSaving(true);
    setError("");

    try {
      const userData = {
        age: age ? Number(age) : null,
        role: role || "Student",
        status: "ACTIVE",
        onboardingCompleted: true,
        welcomeCompleted: true,
        learningIntent: false,
        updatedAt: serverTimestamp()
      };

      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, userData, { merge: true });

      console.info("[ONBOARDING] Perfil não-aprendiz confirmado e gravado com sucesso", {
        userId: user.uid,
        onboardingCompleted: true
      });

      onComplete({
        ...userData,
        uid: user.uid,
        status: "ACTIVE",
        onboardingCompleted: true,
        welcomeCompleted: true
      });
    } catch (err: any) {
      console.error("Erro ao salvar perfil não-aprendiz:", err);
      setError(err?.message || "Erro ao salvar o perfil. Por favor tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start pt-32 pb-8 px-4 relative overflow-hidden" id="onboarding-flow-container">
      {/* Dynamic styles for high-intensity marquee animation */}
      <style>{`
        @keyframes marquee-anxious {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333333%); }
        }
        .animate-marquee-anxious {
          animation: marquee-anxious 20s linear infinite;
        }
        .animate-marquee-anxious:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ANXIOUS GLOBAL TRACKER BANNER (RED ZONE INDICATOR) */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-slate-950/95 border-b-2 border-red-500/40 overflow-hidden flex flex-col z-20 shadow-lg shadow-red-500/5 select-none" id="anxious-countries-marquee-banner">
        {/* Ticker alert bar */}
        <div className="w-full flex items-center justify-between px-4 py-1.5 bg-red-950/80 border-b border-red-500/30 text-[10px] font-mono text-red-400 font-extrabold tracking-tight">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="uppercase tracking-wider">CONEXÃO MULTILÍNGUE GLOBAL EM ANDAMENTO... NÃO PERCA TEMPO!</span>
          </div>
          <div className="flex items-center gap-1.5 text-white bg-red-900/60 px-2 py-0.5 rounded border border-red-500/40 font-bold shrink-0">
            <span>TEMPO CRÍTICO:</span>
            <span className="text-red-300 tabular-nums font-mono">
              {String(tickerTime.min).padStart(2, '0')}:
              {String(tickerTime.sec).padStart(2, '0')}.
              <span className="text-red-500 text-[9px] font-bold">{String(tickerTime.ms).padStart(2, '0')}</span>
            </span>
          </div>
        </div>

        {/* Marquee Loop */}
        <div className="flex-1 flex items-center relative overflow-hidden w-full bg-slate-950/50">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-4 w-max animate-marquee-anxious py-1">
            {[...ANXIOUS_COUNTRIES, ...ANXIOUS_COUNTRIES, ...ANXIOUS_COUNTRIES].map((country, idx) => (
              <div 
                key={idx} 
                className="w-48 h-16 rounded-xl overflow-hidden relative border border-red-500/20 shadow-md shadow-red-500/5 flex items-center px-3 gap-3 shrink-0 group hover:border-red-500/60 transition-colors"
                style={{
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.9)), url(${country.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Urgency signal dot */}
                <div className="absolute top-1 right-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider">{country.alert}</span>
                </div>

                {/* Country Flag with pulse aura */}
                <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 shadow-inner shrink-0 overflow-hidden">
                  <img 
                    src={`https://flagcdn.com/w40/${COUNTRY_NAME_TO_CODE[country.name] || 'xx'}.png`} 
                    alt={country.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 rounded-lg border border-red-500/30 animate-pulse" />
                </div>


                {/* Country Name and status */}
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-xs text-white truncate">{country.name}</span>
                  <span className="text-[10px] text-red-400 font-mono tracking-tighter flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    ONLINE • {((idx * 37) % 310) + 150} estudando
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scanning Bottom Laser line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
      </div>

      {/* Visual Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[150px] pointer-events-none" />

      {/* Progress indicators */}
      {step > 1 && step < 10 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div 
              key={num} 
              className={`h-2 rounded-full transition-all duration-300 ${
                step - 1 >= num ? "w-8 bg-indigo-500" : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-lg bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <div className="relative inline-flex mb-2">
                <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl border border-indigo-500/20 shadow-inner">
                  <Sparkles size={36} className="animate-pulse" />
                </div>
                {/* Globe button overlapping top-right of sparkles */}
                <button
                  type="button"
                  onClick={() => setIsWelcomeLangDropdownOpen(!isWelcomeLangDropdownOpen)}
                  className="absolute -top-2 -right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition shadow-lg border border-indigo-400 z-30 cursor-pointer flex items-center justify-center animate-bounce"
                  title="Alterar idioma / Change language"
                  id="welcome-language-toggle"
                >
                  <Globe size={18} />
                </button>
                
                <AnimatePresence>
                  {isWelcomeLangDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto py-1"
                      id="welcome-language-dropdown"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold text-center">
                        Selecionar Idioma
                      </div>
                      {Object.entries(WELCOME_TRANSLATIONS).map(([code, item]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCurrentWelcomeLang(code);
                            let country = 'US';
                            let currency = 'USD';
                            if (code === 'zh') { country = 'CN'; currency = 'CNY'; }
                            else if (code === 'ja') { country = 'JP'; currency = 'JPY'; }
                            else if (code === 'de') { country = 'DE'; currency = 'EUR'; }
                            else if (code === 'es') { country = 'ES'; currency = 'EUR'; }
                            else if (code === 'fr') { country = 'FR'; currency = 'EUR'; }
                            else if (code === 'it') { country = 'IT'; currency = 'EUR'; }
                            else if (code === 'br') { country = 'BR'; currency = 'BRL'; }
                            else if (code === 'pt') { country = 'PT'; currency = 'EUR'; }

                            setLocalization({
                              country,
                              language: code,
                              currency
                            });
                            setIsWelcomeLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-xs text-slate-200 transition text-left cursor-pointer ${
                            currentWelcomeLang === code ? "bg-indigo-500/10 font-bold" : ""
                          }`}
                        >
                          <span className="text-base leading-none">{item.flag}</span>
                          <span className="flex-1 truncate">{item.countryName}</span>
                          {currentWelcomeLang === code && <Check size={12} className="text-indigo-400 animate-pulse" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                  {WELCOME_TRANSLATIONS[currentWelcomeLang]?.title || WELCOME_TRANSLATIONS.pt.title}
                </h1>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  {WELCOME_TRANSLATIONS[currentWelcomeLang]?.desc || WELCOME_TRANSLATIONS.pt.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                <span>{WELCOME_TRANSLATIONS[currentWelcomeLang]?.button || WELCOME_TRANSLATIONS.pt.button}</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PERSONAL DATA */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon size={12} />
                  <span>{ot("step2_header", "Dados Pessoais")}</span>
                </div>
                <h2 className="text-xl font-bold">{ot("step2_title", "Conte-nos sobre você")}</h2>
              </div>

              {/* Q0: Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Papel no LingoLIVE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                >
                  <option value="">Selecione um papel</option>
                  <option value="STUDENT">Estudante</option>
                  <option value="TEACHER">Professor</option>
                  <option value="PARENT">Pai/Mãe</option>
                  <option value="SCHOOL_ADMIN">Admin Escolar</option>
                  <option value="SCHOOL_OWNER">Dono de Escola</option>
                </select>
              </div>

              {/* Q0.5: Learning Intent */}
              {role !== "" && role !== "ESTUDANTE" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Também queres aprender uma língua?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLearningIntent(true)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        learningIntent === true
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setLearningIntent(false)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        learningIntent === false
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              )}

              {/* Q1: Age */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">{ot("step2_age", "Qual é a sua idade?")}</label>
                <input
                  type="number"
                  min="5"
                  max="99"
                  placeholder={ot("step2_age_placeholder", "Ex: 25")}
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setAge(val);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
                {age !== "" && (age < 5 || age > 99) && (
                  <p className="text-xs text-rose-400">{ot("step2_age_error", "Insira uma idade válida entre 5 e 99 anos.")}</p>
                )}
              </div>

              {/* Q2: Gender */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">{ot("step2_gender", "Género")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Masculino", "Feminino", "Prefiro não informar"].map((g) => {
                    const translatedG = g === "Masculino" ? ot("step2_male", "Masculino") : g === "Feminino" ? ot("step2_female", "Feminino") : ot("step2_other", "Prefiro não informar");
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-3 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          gender === g
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {translatedG}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3: Searchable Country Dropdown */}
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-slate-400 block flex items-center gap-1">
                  <Globe size={12} />
                  <span>{ot("step2_country", "País de Residência")}</span>
                </label>
                
                {/* Search / Selection Field */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={ot("step2_country_placeholder", "Pesquise o país (ex: Angola, Portugal...)")}
                    value={isCountryDropdownOpen ? countrySearch : (selectedCountry ? `${selectedCountry.flag} ${translateCountryName(selectedCountry.name, currentWelcomeLang)}` : "")}
                    onFocus={() => {
                      setIsCountryDropdownOpen(true);
                      setCountrySearch("");
                    }}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm cursor-pointer"
                  />
                  <div className="absolute right-3 top-3.5 text-slate-400 pointer-events-none">
                    <Globe size={16} />
                  </div>
                </div>

                {isCountryDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 bg-slate-900 border border-slate-700 rounded-xl overflow-y-auto z-30 shadow-2xl py-1">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(c.code);
                            setIsCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <span className="text-base">{c.flag}</span>
                          <span>{translateCountryName(c.name, currentWelcomeLang)}</span>
                          {countryCode === c.code && <Check size={14} className="ml-auto text-indigo-400" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-500 text-center">{ot("step2_country_empty", "Nenhum país encontrado")}</div>
                    )}
                  </div>
                )}
                {selectedCountry && (
                  <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-400 uppercase tracking-wide">
                    <span>{ot("step2_currency", "Moeda")}: <strong>{selectedCountry.currency}</strong></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>{ot("step2_timezone", "Fuso Horário")}: <strong>{selectedCountry.timezone}</strong></span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  disabled={!age || age < 5 || age > 99 || !gender || !countryCode}
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: NATIVE LANGUAGE */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {ot("step3_header", "Idioma Nativo")}
                </div>
                <h2 className="text-xl font-bold">{ot("step3_title", "Qual é o seu idioma principal?")}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Português", "Inglês", "Francês", "Chinês", "Espanhol", "Árabe", "Outros"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setNativeLanguage(lang)}
                    className={`py-4 px-4 rounded-xl font-semibold text-sm border text-left transition-all cursor-pointer flex items-center justify-between ${
                      nativeLanguage === lang
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <span>{translateNativeLanguageName(lang, currentWelcomeLang)}</span>
                    {nativeLanguage === lang && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  disabled={!nativeLanguage}
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: TARGET LANGUAGE (TWO-STEP INTERACTIVE WIZARD) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {langWizardStep === 2 && (
                <button
                  type="button"
                  onClick={() => setLangWizardStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mb-1 cursor-pointer font-medium bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20"
                >
                  <ArrowLeft size={12} />
                  <span>{ot("step4_back", "Voltar para escolha de idioma")}</span>
                </button>
              )}

              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe size={12} />
                  <span>
                    {langWizardStep === 1 ? ot("step4_header1", "Etapa 1: Escolha o Idioma") : ot("step4_header2", "Etapa 2: Escolha a Variante Regional")}
                  </span>
                </div>
                <h2 className="text-xl font-bold">
                  {langWizardStep === 1 ? ot("step4_title1", "Que idioma deseja aprender?") : ot("step4_title2", "Qual variante de {lang} prefere?").replace("{lang}", translateNativeLanguageName(learningLanguage, currentWelcomeLang))}
                </h2>
                <p className="text-slate-400 text-xs">
                  {langWizardStep === 1 
                    ? ot("step4_desc1", "Selecione um idioma da nossa lista interativa de parceiros de IA.")
                    : ot("step4_desc2", "Escolha uma variante para a IA personalizar sotaque, vocabulário e referências culturais.")}
                </p>
              </div>

              {/* ETAPA 1: IDIOMAS COM BUSCA */}
              {langWizardStep === 1 && (
                <div className="space-y-3">
                  {/* Search bar */}
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400">
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder={ot("step4_search", "Pesquisar idioma nativo ou traduzido...")}
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {(() => {
                      const filtered = LANGUAGES_LIST.filter(l => 
                        l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
                        l.translated.toLowerCase().includes(langSearch.toLowerCase()) || 
                        l.desc.toLowerCase().includes(langSearch.toLowerCase())
                      );
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-xs text-slate-500">
                            {ot("step4_empty", 'Nenhum idioma encontrado para "{search}"').replace("{search}", langSearch)}
                          </div>
                        );
                      }
                      return filtered.map((lang) => {
                        const isSelected = learningLanguage === lang.id;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              setLearningLanguage(lang.id);
                              // Auto transition to step 2
                              setLangWizardStep(2);
                            }}
                            className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500"
                                : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Neutral icon */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 transition-colors ${
                                isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400 group-hover:bg-slate-750 group-hover:text-indigo-400"
                              }`}>
                                {lang.icon}
                              </div>
                              <div className="text-left leading-snug">
                                <span className="font-bold text-sm text-slate-100 block group-hover:text-indigo-300 transition-colors">
                                  {translateNativeLanguageName(lang.name, currentWelcomeLang)}
                                  <span className="text-xs text-slate-400 font-normal ml-1.5">
                                    ({translateNativeLanguageName(lang.translated, currentWelcomeLang)})
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-normal">
                                  {translateLanguageDesc(lang.desc, currentWelcomeLang)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* ETAPA 2: VARIANTES REGIONAIS */}
              {langWizardStep === 2 && (
                <div className="space-y-3">
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                    {(() => {
                      const variants = REGIONAL_VARIANTS[learningLanguage] || [
                        { code: "Standard", label: "Padrão Internacional", flag: "🌍", details: ["Fidelidade gramatical", "Sotaque neutro", "Aceito globalmente"] }
                      ];
                      return variants.map((variant) => {
                        const isSelected = targetRegion === variant.code;
                        return (
                          <button
                            key={variant.code}
                            type="button"
                            onClick={() => setTargetRegion(variant.code)}
                            className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500"
                                : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Flag or region indicator */}
                              <span className="text-2xl shrink-0 filter drop-shadow">
                                {variant.flag}
                              </span>
                              <div className="text-left">
                                <span className="font-bold text-sm text-slate-200 block group-hover:text-indigo-300 transition-colors">
                                  {translateRegionalVariantLabel(variant.label, currentWelcomeLang)}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {variant.details.map((detail, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-850 rounded text-[9px] text-slate-400 border border-slate-700/60 font-medium">
                                      {translateRegionalVariantDetails(detail, currentWelcomeLang)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="p-1 bg-indigo-500 text-white rounded-full shrink-0">
                                <Check size={10} />
                              </span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  disabled={langWizardStep === 1 ? !learningLanguage : !targetRegion}
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/10"
                >
                  <span>{langWizardStep === 1 ? ot("step4_advance", "Avançar") : ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REGIONAL VARIANT & PREFERENCES */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Compass size={12} />
                  <span>{ot("step5_header", "Regionalismo & Gírias")}</span>
                </div>
                <h2 className="text-xl font-bold">{ot("step5_title", "Personalize o seu sotaque e gírias")}</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {ot("step5_desc", "Defina qual variante regional você deseja focar e como a IA deve gerenciar gírias e expressões locais.")}
                </p>
              </div>

              {/* Selected Language and Variant Summary Display */}
              <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">{ot("step5_selected", "Idioma Selecionado")}</span>
                  <span className="text-sm font-bold text-slate-100 mt-1 block">
                    {translateNativeLanguageName(learningLanguage, currentWelcomeLang)} ({translateRegionalVariantLabel(targetRegion, currentWelcomeLang) || targetRegion})
                  </span>
                </div>
                <div className="text-2xl">
                  {(() => {
                    const variants = REGIONAL_VARIANTS[learningLanguage] || [];
                    const currentVar = variants.find(v => v.code === targetRegion);
                    return currentVar?.flag || "🌍";
                  })()}
                </div>
              </div>

              {/* Mode, Regional and Slang preferences */}
              <div className="space-y-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
                
                {/* 1. Language Mode */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block">{ot("step5_mode", "Modo de Aprendizagem")}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {ot("step5_mode_desc", "Standard foca na gramática; Colloquial foca no uso real das ruas.")}
                    </span>
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLanguageMode("Standard")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        languageMode === "Standard" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {ot("step5_formal", "Formal")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguageMode("Colloquial")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        languageMode === "Colloquial" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {ot("step5_colloquial", "Coloquial")}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-800/60 my-2" />

                {/* 2. Regional Expressions Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block">{ot("step5_expr", "Expressões Regionais")}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {ot("step5_expr_desc", "Apresentar termos regionais como complementos de vocabulário.")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowRegionalExpressions(!allowRegionalExpressions)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer border ${
                      allowRegionalExpressions
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {allowRegionalExpressions ? ot("step5_expr_enabled", "Habilitadas") : ot("step5_expr_disabled", "Bloqueadas")}
                  </button>
                </div>

                <div className="h-px bg-slate-800/60 my-2" />

                {/* 3. Slangs toggle (age locked if age <= 8) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block">{ot("step5_slang", "Uso de Gírias Locais")}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {age !== "" && Number(age) <= 8
                        ? ot("step5_slang_desc_kids", "Gírias indisponíveis para faixa etária de 5 a 8 anos.")
                        : ot("step5_slang_desc", "Adicionar gírias saudáveis do dia a dia no diálogo com o tutor.")}
                    </span>
                  </div>
                  {age !== "" && Number(age) <= 8 ? (
                    <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[9px] font-bold shrink-0">
                      {ot("step5_slang_locked", "Bloqueado por idade")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAllowSlang(!allowSlang)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer border ${
                        allowSlang
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}
                    >
                      {allowSlang ? ot("step5_slang_allow", "Permitir") : ot("step5_slang_block", "Bloquear")}
                    </button>
                  )}
                </div>

              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: LEVEL */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {quizStep === 0 ? (
                <>
                  <div className="space-y-1">
                    <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      {ot("step6_header", "Proficiência")}
                    </div>
                    <h2 className="text-xl font-bold">{ot("step6_title", "Qual é o seu nível atual?")}</h2>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {[
                      { code: "A1", title: "Iniciante", desc: "Consigo entender frases do dia a dia e palavras simples." },
                      { code: "A2", title: "Básico", desc: "Consigo comunicar em tarefas simples e rotineiras." },
                      { code: "B1", title: "Intermédio", desc: "Consigo lidar com a maioria das situações de viagem." },
                      { code: "B2", title: "Intermédio Avançado", desc: "Consigo dialogar de forma fluida com falantes nativos." },
                      { code: "C1", title: "Avançado", desc: "Compreendo uma vasta gama de textos complexos." },
                      { code: "C2", title: "Fluente", desc: "Consigo entender e falar com total facilidade e precisão." }
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setLevel(item.code)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          level === item.code
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                          {item.code}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-xs">{translateLevelName(item.title, currentWelcomeLang)}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{translateLevelDesc(item.desc, currentWelcomeLang)}</div>
                        </div>
                        {level === item.code && <Check size={16} className="ml-auto text-indigo-400 shrink-0" />}
                      </button>
                    ))}

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-800 px-2 text-slate-500 font-bold">{ot("step6_or", "Ou")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuizStep(1);
                        setQuizAnswers([]);
                        setQuizScore(0);
                      }}
                      className="w-full p-4 rounded-xl border border-dashed border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs"
                    >
                      <HelpCircle size={16} />
                      <span>{ot("step6_test", "Não sei meu nível (Realizar teste de nivelamento)")}</span>
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {ot("back", "Voltar")}
                    </button>
                    <button
                      type="button"
                      disabled={!level}
                      onClick={handleNext}
                      className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <span>{ot("continue", "Continuar")}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : quizStep <= 3 ? (
                // Leveling Test Question View
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {ot("step6_quest", "Questão {curr} de {total}").replace("{curr}", String(quizStep)).replace("{total}", "3")}
                    </span>
                    <button
                      onClick={() => setQuizStep(0)}
                      className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
                    >
                      {ot("step6_cancel", "Cancelar")}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-100">{quizQuestions[quizStep - 1].question}</h3>
                    
                    <div className="space-y-2">
                      {quizQuestions[quizStep - 1].options.map((option, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleQuizAnswer(index)}
                          className="w-full p-4 rounded-xl text-left border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all font-semibold text-xs cursor-pointer"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Leveling Test Result View
                <div className="text-center space-y-6 py-4">
                  <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    <Trophy size={36} className="text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{ot("step6_done", "Teste Concluído!")}</h3>
                    <p className="text-slate-400 text-xs">
                      {ot("step6_done_desc", "Acertou {score} de {total} questões. Estimamos seu nível ideal de proficiência!").replace("{score}", String(quizScore)).replace("{total}", "3")}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 border border-indigo-500/30 rounded-2xl inline-block">
                    <div className="text-3xl font-extrabold text-indigo-400">{level}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mt-1">{ot("step6_suggested", "Nível Sugerido")}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQuizStep(0); // Exit back to Step 5 main screen to accept/continue
                    }}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                  >
                    {ot("step6_confirm", "Confirmar e Avançar")}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 7: OBJECTIVE */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {ot("step7_header", "Objetivo")}
                </div>
                <h2 className="text-xl font-bold">{ot("step7_title", "Por que deseja aprender este idioma?")}</h2>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {[
                  { name: "Trabalho", emoji: "💼" },
                  { name: "Viagens", emoji: "✈️" },
                  { name: "Escola", emoji: "🎒" },
                  { name: "Universidade", emoji: "🎓" },
                  { name: "Negócios", emoji: "📊" },
                  { name: "Mudança de país", emoji: "🌍" },
                  { name: "Conversação", emoji: "💬" },
                  { name: "Exames", emoji: "📝" },
                  { name: "Cultura", emoji: "🎭" },
                  { name: "Outro", emoji: "🔮" }
                ].map((goal) => (
                  <button
                    key={goal.name}
                    type="button"
                    onClick={() => setLearningGoal(goal.name)}
                    className={`py-3.5 px-4 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      learningGoal === goal.name
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-lg">{goal.emoji}</span>
                    <span>{translateGoalName(goal.name, currentWelcomeLang)}</span>
                    {learningGoal === goal.name && <Check size={14} className="ml-auto text-indigo-400" />}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  disabled={!learningGoal}
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 8: TIME */}
          {step === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {ot("step8_header", "Tempo Disponível")}
                </div>
                <h2 className="text-xl font-bold">{ot("step8_title", "Quanto tempo pretende estudar por dia?")}</h2>
              </div>

              <div className="space-y-2">
                {[
                  { text: "10 minutos", min: 10, intensity: "Leve" },
                  { text: "15 minutos", min: 15, intensity: "Básico" },
                  { text: "20 minutos", min: 20, intensity: "Moderado" },
                  { text: "30 minutos", min: 30, intensity: "Recomendado" },
                  { text: "45 minutos", min: 45, intensity: "Intenso" },
                  { text: "1 hora", min: 60, intensity: "Avançado" },
                  { text: "Mais de 1 hora", min: 90, intensity: "Extremo" }
                ].map((item) => (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => setDailyGoal(item.min)}
                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      dailyGoal === item.min
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock size={16} className={dailyGoal === item.min ? "text-indigo-400" : "text-slate-500"} />
                      <span className="font-bold text-xs">{translateTimeText(item.text, currentWelcomeLang)}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      dailyGoal === item.min ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
                    }`}>{translateIntensityText(item.intensity, currentWelcomeLang)}</span>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("continue", "Continuar")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 9: FREQUENCY */}
          {step === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {ot("step9_header", "Frequência")}
                </div>
                <h2 className="text-xl font-bold">{ot("step9_title", "Quantos dias por semana pretende praticar?")}</h2>
              </div>

              <div className="flex items-center justify-center gap-2 py-6">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStudyFrequency(num)}
                    className={`h-11 w-11 rounded-full text-sm font-extrabold transition-all cursor-pointer border flex items-center justify-center ${
                      studyFrequency === num
                        ? "bg-indigo-500 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/20"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
                <Calendar size={20} className="mx-auto text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">
                  {ot("step9_desc", "Praticar {days} {days_label} por semana garante consistência de estudo e ajuda na fixação rápida do idioma!")
                    .replace("{days}", String(studyFrequency))
                    .replace("{days_label}", studyFrequency === 1 ? ot("step9_day", "dia") : ot("step9_days", "dias"))}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {ot("back", "Voltar")}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{ot("analyse_profile", "Analisar Perfil")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 10: AI CREATION LOADER */}
          {step === 10 && (
            <motion.div
              key="step10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8 py-8"
            >
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
                <Loader2 size={48} className="text-indigo-400 animate-spin" />
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">
                  {ot("step10_loader_title", "A IA está preparando o seu plano personalizado.")}
                </h2>
                
                {/* Status indicator list */}
                <div className="max-w-xs mx-auto text-left space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
                  {aiLoadingTexts.map((text, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs transition-opacity duration-300">
                      {idx < aiLoadingIndex ? (
                        <Check size={14} className="text-emerald-400 shrink-0" />
                      ) : idx === aiLoadingIndex ? (
                        <Loader2 size={14} className="text-indigo-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span className={
                        idx < aiLoadingIndex 
                          ? "text-slate-400 line-through" 
                          : idx === aiLoadingIndex 
                            ? "text-indigo-300 font-bold" 
                            : "text-slate-600"
                      }>
                        {translateAiLoadingText(text, currentWelcomeLang)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 11: CONGRATULATIONS & SUMMARY */}
          {step === 11 && (
            <motion.div
              key="step11"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                <Check size={36} className="text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                  {ot("step11_title", "Parabéns!")}
                </h2>
                <p className="text-slate-400 text-xs">
                  {ot("step11_desc", "Seu plano de aprendizagem foi criado com sucesso.")}
                </p>
              </div>

              {/* Profile Summary Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left grid grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_age", "Idade")}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {age} {ot("step11_years", "anos")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_country", "País")}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {selectedCountry?.flag} {translateCountryName(selectedCountry?.name || "", currentWelcomeLang)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_native", "Idioma Nativo")}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {translateNativeLanguageName(nativeLanguage, currentWelcomeLang)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_target", "Idioma Alvo")}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {translateNativeLanguageName(learningLanguage, currentWelcomeLang)} ({targetRegion})
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_level", "Nível Estimado")}
                  </span>
                  <span className="text-slate-200 font-semibold text-indigo-400 font-bold">
                    {translateLevelName(level, currentWelcomeLang)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_slangs_reg", "Gírias & Regionalismos")}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {allowSlang ? ot("step11_slangs_lib", "Liberadas") : ot("step11_slangs_bloq", "Bloqueadas")} | {allowRegionalExpressions ? ot("step11_slangs_act", "Ativos") : ot("step11_slangs_inact", "Inativos")}
                  </span>
                </div>
                <div className="space-y-0.5 col-span-2 border-t border-slate-800 pt-2.5">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wide">
                    {ot("step11_daily_goal", "Meta Diária de Prática")}
                  </span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} className="text-indigo-400" />
                    <span>
                      {ot("step11_minutes_freq", "{minutes} minutos diários, {days} dias por semana ({mode})")
                        .replace("{minutes}", String(dailyGoal))
                        .replace("{days}", String(studyFrequency))
                        .replace("{mode}", languageMode === "Standard" ? ot("step5_formal", "Formal") : ot("step5_colloquial", "Coloquial"))}
                    </span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={saveProfileAndFinish}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>A Entrar no Dashboard...</span>
                  </>
                ) : (
                  ot("step11_enter", "Entrar no Dashboard")
                )}
              </button>
              {error && (
                <p className="text-red-500 text-center mt-4 text-sm">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
