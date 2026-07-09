export interface CountryDetail {
  code: string;
  name: string;
  flag: string;
  language: string;
  currency: string;
  symbol: string;
  dateFormat: string;
  slangs: { term: string; meaning: string; example: string }[];
  holidays: { date: string; name: string; description: string }[];
  themes: { title: string; description: string }[];
}

export const COUNTRY_DETAILS: Record<string, CountryDetail> = {
  BR: {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    language: 'Português (Brasil)',
    currency: 'Real',
    symbol: 'R$',
    dateFormat: 'DD/MM/YYYY',
    slangs: [
      { term: 'Cara / Mano', meaning: 'Sujeito, pessoa, amigo', example: 'E aí mano, tudo bem?' },
      { term: 'Legal / Bacana', meaning: 'Algo bom, agradável ou bonito', example: 'Este aplicativo de inglês é muito legal!' },
      { term: 'Pegar leve', meaning: 'Ir com calma, não exagerar', example: 'Pega leve no exercício hoje.' },
      { term: 'Gambiarra', meaning: 'Solução improvisada e engenhosa para resolver um problema', example: 'Fizemos uma gambiarra temporária e deu super certo.' },
      { term: 'Maneiro', meaning: 'Interessante, excelente', example: 'A aula de hoje foi muito maneira!' }
    ],
    holidays: [
      { date: '07/09', name: 'Independência do Brasil', description: 'Celebração da declaração de independência do Brasil em relação a Portugal.' },
      { date: '12/10', name: 'Nossa Senhora Aparecida', description: 'Dia da Padroeira do Brasil e também comemoração do Dia das Crianças.' },
      { date: '15/11', name: 'Proclamação da República', description: 'Celebração do aniversário do fim do Império e início da República em 1889.' }
    ],
    themes: [
      { title: 'Futebol e Paixão Nacional', description: 'Explore a história dos grandes craques e como o esporte dita o ritmo cultural do país.' },
      { title: 'MPB e Bossa Nova', description: 'Converse sobre a revolução musical de Tom Jobim, João Gilberto e a poesia urbana brasileira.' },
      { title: 'Culinária Regional', description: 'Aprenda sobre iguarias como feijoada, pão de queijo e os sabores únicos do Nordeste e Norte.' }
    ]
  },
  AO: {
    code: 'AO',
    name: 'Angola',
    flag: '🇦🇴',
    language: 'Português (Angola)',
    currency: 'Kwanza',
    symbol: 'Kz',
    dateFormat: 'DD/MM/YYYY',
    slangs: [
      { term: 'Mambo', meaning: 'Coisa, situação, assunto', example: 'Aquele mambo está totalmente resolvido.' },
      { term: 'Catorzinha', meaning: 'Garota jovem', example: 'A catorzinha estuda na escola primária.' },
      { term: 'Fixe', meaning: 'Legal, bom, excelente', example: 'Este telefone novo é muito fixe!' },
      { term: 'Bazar', meaning: 'Ir embora, sair de um local', example: 'Vamos bazar daqui a pouco.' },
      { term: 'Wi / Muata', meaning: 'Amigo, parceiro ou chefe respeitado', example: 'E aí meu wi, tranquilo?' }
    ],
    holidays: [
      { date: '11/11', name: 'Dia da Independência', description: 'Celebração da libertação nacional obtida em 1975 do regime colonial.' },
      { date: '04/04', name: 'Dia da Paz e Reconciliação', description: 'Assinatura dos acordos de paz que colocaram fim à guerra civil em 2002.' },
      { date: '17/09', name: 'Dia do Fundador da Nação', description: 'Homenagem ao primeiro presidente de Angola, Dr. António Agostinho Neto.' }
    ],
    themes: [
      { title: 'Semba, Kizomba e Kuduro', description: 'Descubra a energia contagiante e a herança rítmica destas danças internacionais.' },
      { title: 'Quedas de Kalandula', description: 'Uma das maiores maravilhas naturais de África, localizada na província de Malanje.' },
      { title: 'Muamba de Galinha', description: 'Converse sobre a rica gastronomia local e os rituais das refeições em família.' }
    ]
  },
  PT: {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    language: 'Português (Portugal)',
    currency: 'Euro',
    symbol: '€',
    dateFormat: 'DD/MM/YYYY',
    slangs: [
      { term: 'Gajo / Gaja', meaning: 'Rapaz ou rapariga, pessoa', example: 'Aquele gajo corre imenso.' },
      { term: 'Fixe', meaning: 'Bom, porreiro, interessante', example: 'A aula de ontem foi mesmo fixe.' },
      { term: 'Bué', meaning: 'Muito, em grande quantidade', example: 'Estou bué cansado hoje.' },
      { term: 'Porreiro', meaning: 'Simpático, agradável, excelente', example: 'O professor é um gajo porreiro.' },
      { term: 'Bora lá', meaning: 'Vamos a isso, incentivo para ir', example: 'Bora lá estudar português!' }
    ],
    holidays: [
      { date: '10/06', name: 'Dia de Portugal', description: 'Homenagem a Portugal, a Camões e às Comunidades Portuguesas espalhadas pelo mundo.' },
      { date: '25/04', name: 'Revolução dos Cravos', description: 'Aniversário da revolução de 1974 que restaurou a democracia em Portugal.' },
      { date: '01/12', name: 'Restauração da Independência', description: 'Comemoração da independência nacional face à dinastia filipina espanhola em 1640.' }
    ],
    themes: [
      { title: 'O Fado e a Saudade', description: 'Debata a melancolia e a beleza do fado tradicional de Lisboa e de Coimbra.' },
      { title: 'Pastéis de Belém', description: 'Converse sobre as lendas, receitas secretas e pastelaria icónica do país.' },
      { title: 'Descobrimentos Marítimos', description: 'Analise a era dourada dos navegadores portugueses e a globalização histórica.' }
    ]
  },
  MZ: {
    code: 'MZ',
    name: 'Moçambique',
    flag: '🇲🇿',
    language: 'Português (Moçambique)',
    currency: 'Metical',
    symbol: 'MT',
    dateFormat: 'DD/MM/YYYY',
    slangs: [
      { term: 'Maningue', meaning: 'Muito, imensamente', example: 'Gosto maningue deste aplicativo.' },
      { term: 'Txilar', meaning: 'Relaxar, curtir, passar o tempo', example: 'Vamos txilar na praia hoje à tarde.' },
      { term: 'Chapa', meaning: 'Transporte público coletivo', example: 'Peguei o chapa bem cedo.' },
      { term: 'Xitique', meaning: 'Poupança rotativa informal entre amigos', example: 'Recebi a minha parte do xitique.' },
      { term: 'Macha', meaning: 'Trabalho árduo ou caminhada longa', example: 'Foi uma grande macha para chegar aqui.' }
    ],
    holidays: [
      { date: '25/06', name: 'Dia da Independência de Moçambique', description: 'Comemoração da independência proclamada em 1975.' },
      { date: '03/02', name: 'Dia dos Heróis Moçambicanos', description: 'Data de aniversário da morte de Eduardo Mondlane, fundador da FRELIMO.' },
      { date: '04/10', name: 'Dia da Paz e Reconciliação', description: 'Celebração dos acordos de Roma que trouxeram a paz ao povo moçambicano.' }
    ],
    themes: [
      { title: 'Marrabenta e Danças Típicas', description: 'Conheça o ritmo urbano que une instrumentos tradicionais e influências modernas.' },
      { title: 'Arte de Makonde', description: 'Aprecie a mestria dos escultores de pau-preto que contam histórias ancestrais.' },
      { title: 'Arquipélago de Bazaruto', description: 'Imagine as praias idílicas, recifes intocados e ecossistemas marinhos deslumbrantes.' }
    ]
  },
  US: {
    code: 'US',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    language: 'Inglês (Estados Unidos)',
    currency: 'Dólar Americano',
    symbol: '$',
    dateFormat: 'MM/DD/YYYY',
    slangs: [
      { term: 'Cool', meaning: 'Legal, interessante', example: 'That new feature is really cool!' },
      { term: "What's up", meaning: 'Como vai, o que está acontecendo', example: 'Hey, what\'s up buddy?' },
      { term: 'Piece of cake', meaning: 'Algo extremamente fácil', example: 'The quiz was a piece of cake.' },
      { term: 'Bust / Busted', meaning: 'Fracassar ou ser pego fazendo algo errado', example: 'He got busted cheating.' },
      { term: 'Couch potato', meaning: 'Pessoa preguiçosa que assiste muita TV', example: 'Don\'t be a couch potato, let\'s walk!' }
    ],
    holidays: [
      { date: '07/04', name: 'Independence Day', description: 'Declaration of independence from Great Britain in 1776.' },
      { date: '11/26', name: 'Thanksgiving Day', description: 'Harvest festival giving thanks for blessing of the past year.' },
      { date: '05/25', name: 'Memorial Day', description: 'Remembering and honoring the military personnel who died in service.' }
    ],
    themes: [
      { title: 'Hollywood and Cinema', description: 'Explore how storytelling via blockbusters impacts visual media globally.' },
      { title: 'Sports Culture', description: 'Learn about the massive popularity of American Football, NBA, and baseball leagues.' },
      { title: 'National Parks Scenic Views', description: 'Imagine exploring majestic lands like Grand Canyon, Yellowstone, and Yosemite.' }
    ]
  },
  ZA: {
    code: 'ZA',
    name: 'África do Sul',
    flag: '🇿🇦',
    language: 'Inglês (África do Sul)',
    currency: 'Rand',
    symbol: 'R',
    dateFormat: 'YYYY/MM/DD',
    slangs: [
      { term: 'Lekker', meaning: 'Excelente, delicioso, legal', example: 'We had a lekker time last night.' },
      { term: 'Howzit', meaning: 'Como vai você, saudação comum', example: 'Howzit my friend!' },
      { term: 'Bru', meaning: 'Irmão, amigo, cara', example: 'Where are you going, bru?' },
      { term: 'Ubuntu', meaning: 'Humanidade para com os outros (filosofia)', example: 'They showed deep ubuntu during the crisis.' },
      { term: 'Biltong', meaning: 'Carne seca curada tradicional', example: 'I love eating beef biltong.' }
    ],
    holidays: [
      { date: '04/27', name: 'Freedom Day', description: 'Commemorating the first post-apartheid democratic elections held in 1994.' },
      { date: '09/24', name: 'Heritage Day', description: 'Celebrating the diverse cultural heritage that makes up the Rainbow Nation.' },
      { date: '06/16', name: 'Youth Day', description: 'Honoring those who lost their lives in the Soweto uprising of 1976.' }
    ],
    themes: [
      { title: 'Nelson Mandela legacy', description: 'Reflect upon the inspiring message of peace, forgiveness, and human rights.' },
      { title: 'Kruger Safari Wonders', description: 'Imagine seeing the big five animal species in one of Africa\'s largest reserves.' },
      { title: 'Traditional Braai gathering', description: 'Understand the central social ritual of gathering around a wood-fired barbecue.' }
    ]
  }
};

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    dashboardTitle: "Painel de Aprendizagem",
    dashboardSubtitle: "Aprenda idiomas com tecnologia de Inteligência Artificial e imersão cultural.",
    activeCountry: "Perfil Regional Ativo",
    subActiveCountry: "Localização e contexto cultural detectados",
    currencySymbol: "Moeda e Símbolo",
    officialLanguage: "Idioma Oficial",
    countryCode: "Código do País",
    slangDict: "Dicionário de Calão e Gírias Locais",
    holidaysSection: "Feriados e Festividades Nacionais",
    themesSection: "Temas de Conversação Recomendados",
    dateFormatLabel: "Formato de Data Regional",
    changeCountry: "Mudar País Ativo",
    changeActiveCountry: "Alterar País Ativo",
    iaAssistant: "IA Assistente",
    loading: "A carregar...",
    recentActivity: "Atividade Recente",
    practiceRoom: "Sala de Prática",
    liveChat: "Conversação em Tempo Real",
    streak: "Sequência de Dias",
    vocabDeck: "Baralho de Vocabulário"
  },
  en: {
    dashboardTitle: "Learning Dashboard",
    dashboardSubtitle: "Learn languages with AI-powered technology and cultural immersion.",
    activeCountry: "Active Regional Profile",
    subActiveCountry: "Location and cultural context detected",
    currencySymbol: "Currency and Symbol",
    officialLanguage: "Official Language",
    countryCode: "Country Code",
    slangDict: "Local Slang & Dialect Dictionary",
    holidaysSection: "National Holidays & Festivities",
    themesSection: "Recommended Conversation Themes",
    dateFormatLabel: "Regional Date Format",
    changeCountry: "Change Active Country",
    changeActiveCountry: "Change Active Country",
    iaAssistant: "AI Assistant",
    loading: "Loading...",
    recentActivity: "Recent Activity",
    practiceRoom: "Practice Room",
    liveChat: "Real-time Conversation",
    streak: "Days Streak",
    vocabDeck: "Vocabulary Deck"
  }
};

export function formatDate(date: Date, country: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  if (country === 'US') {
    return `${month}/${day}/${year}`;
  } else if (country === 'ZA') {
    return `${year}/${month}/${day}`;
  }
  return `${day}/${month}/${year}`;
}
