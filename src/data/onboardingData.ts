export interface CountryItem {
  code: string;
  name: string;
  flag: string;
  currency: string;
  timezone: string;
}

export const COUNTRIES: CountryItem[] = [
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

export interface LanguageItem {
  id: string;
  name: string;
  translated: string;
  desc: string;
  icon: string;
}

export const LANGUAGES_LIST: LanguageItem[] = [
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

export interface RegionalVariantItem {
  code: string;
  label: string;
  flag: string;
  details: string[];
}

export const REGIONAL_VARIANTS: Record<string, RegionalVariantItem[]> = {
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

export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
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

export const ANXIOUS_COUNTRIES = [
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

export const WELCOME_TRANSLATIONS: Record<string, { title: string; desc: string; button: string; countryName: string; flag: string }> = {
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
    countryName: "中文",
    flag: "🇨🇳"
  }
};
