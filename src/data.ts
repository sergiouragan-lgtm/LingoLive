import { Language, Scenario, Voice } from "./types";

export const LANGUAGES: Language[] = [
  { code: "pt", name: "Portuguese (Angola)", flag: "🇦🇴", defaultVoice: "Zephyr" },
  { code: "fr", name: "French", flag: "🇫🇷", defaultVoice: "Kore" },
  { code: "en", name: "English", flag: "🇺🇸", defaultVoice: "Charon" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", defaultVoice: "Aoede" }
];

export const SCENARIOS: Scenario[] = [
  {
    id: "casual_chat",
    title: "Casual Friendly Chat",
    description: "Meet a warm local resident in a park and share your hobbies, background, and travel experiences.",
    iconName: "MessageCircle",
    promptContext: "The user is meeting you in a beautiful public park. Engage in casual friendly small talk, ask them what they like about your country, what their hobbies are, and share small anecdotes."
  },
  {
    id: "cafe_order",
    title: "Ordering at a Cafe",
    description: "Step into a cozy local cafe, order a warm drink and pastry, ask about ingredients, and settle the bill.",
    iconName: "Coffee",
    promptContext: "You are the barista at 'Cafe Aromas'. Greet the customer warmly, recommend a special pastry or pour-over coffee, help them customize their order, and request payment."
  },
  {
    id: "hotel_checkin",
    title: "Hotel Check-In",
    description: "Check into a charming boutique hotel, specify your room preferences, and ask for recommendations.",
    iconName: "Hotel",
    promptContext: "You are the receptionist at 'Hotel Splendide'. Welcome the guest, ask for their reservation details, explain breakfast times, and give them 2 hidden local tips for dinner nearby."
  },
  {
    id: "job_interview",
    title: "Mock Job Interview",
    description: "Test your skills in a professional interview for a role at a creative local startup.",
    iconName: "Briefcase",
    promptContext: "You are the hiring manager at a fast-growing local startup. Conduct a warm but professional interview. Ask about their background, why they want this job, and how they handle team collaboration."
  },
  {
    id: "asking_directions",
    title: "Asking for Directions",
    description: "You're slightly lost. Stop a friendly passerby to ask for directions to a scenic viewpoint or station.",
    iconName: "Map",
    promptContext: "You are a helpful local resident walking down the street. The user will ask you for directions to the grand square or the local station. Explain the directions using simple landmarks and turns."
  },
  {
    id: "doctors_visit",
    title: "At the Doctor's Clinic",
    description: "Explain a minor physical symptom (like a sore throat or headache) and get supportive medical advice.",
    iconName: "Activity",
    promptContext: "You are Dr. Elena, a kind and supportive family doctor. Ask the patient how they are feeling, listen to their symptoms, offer gentle medical advice, and suggest resting or drinking water."
  }
];

export const VOICES: Voice[] = [
  { name: "Zephyr", gender: "Female", description: "Warm, expressive, clear tone - excellent for Portuguese, French, and general dialogue." },
  { name: "Kore", gender: "Female", description: "Soft, gentle, calm pace - ideal for French, English, and soothing practice." },
  { name: "Aoede", gender: "Female", description: "Clear, highly articulate, balanced voice - perfect for Chinese and tonal language training." },
  { name: "Fenrir", gender: "Male", description: "Deep, resonant, steady pacing - perfect for European languages and structured sessions." },
  { name: "Charon", gender: "Male", description: "Clear, crisp, professional and highly articulation-conscious - ideal for clear pronunciation." }
];

export interface CuriosityTip {
  title: string;
  text: string;
  kidTitle?: string;
  kidText?: string;
}

export const EDUCATIONAL_CURIOSITIES: Record<string, CuriosityTip[]> = {
  pt: [
    {
      title: "Origem da Palavra Saudade",
      text: "A palavra 'saudade' tem origem no latim 'solitudo' (solidão). Tornou-se um dos símbolos mais poéticos e profundos da língua portuguesa e da cultura lusófona, representando uma falta sentida com carinho.",
      kidTitle: "O mistério de 'Saudade' ✨",
      kidText: "Você sabia que a palavra 'saudade' só existe de um jeito especial no português? Ela descreve aquele aperto quentinho no coração quando sentimos falta de alguém que amamos muito!"
    },
    {
      title: "Raízes Árabes no Português",
      text: "Muitas palavras em português iniciadas por 'al-' têm origem árabe, como 'alface', 'almofada' e 'algodão'. Isso se deve à convivência histórica na Península Ibérica durante a Idade Média.",
      kidTitle: "Palavras detetives! 🔍",
      kidText: "Palavras como 'alface' e 'almofada' vieram de um idioma muito antigo chamado árabe! Há muitos anos, as pessoas misturaram os idiomas e criaram essas palavras fofas."
    },
    {
      title: "Língua mais falada no Hemisfério Sul",
      text: "O português é a língua oficial mais falada em todo o Hemisfério Sul, graças à grande população do Brasil e de nações africanas vibrantes como Angola, Moçambique e Cabo Verde.",
      kidTitle: "O Português é um Gigante! 🌍",
      kidText: "A língua portuguesa é a mais falada em toda a metade de baixo do planeta Terra! Milhões de crianças na África, América do Sul e Europa batem papo em português todos os dias!"
    }
  ],
  en: [
    {
      title: "Evolution of English Vocabulary",
      text: "English is a Germanic language, but over 60% of its vocabulary is borrowed from French and Latin, leading to a rich set of synonyms (e.g., 'ask' vs 'inquire', 'help' vs 'assist').",
      kidTitle: "Uma língua cheia de misturas! 🍕",
      kidText: "Sabia que o inglês é como uma pizza super recheada? Ele pegou palavras emprestadas do francês, latim e até do grego! Por isso existem tantas palavras legais para dizer a mesma coisa."
    },
    {
      title: "The Air Traffic Controller Rule",
      text: "English is the official language of aviation worldwide. All international pilots and air traffic controllers must speak English during commercial flights to ensure global safety.",
      kidTitle: "Idioma das Nuvens! ✈️",
      kidText: "O inglês é a língua oficial dos pilotos de avião! Todos os pilotos do mundo inteiro conversam em inglês para garantir que as viagens no céu sejam super seguras."
    },
    {
      title: "The Most Common Word",
      text: "The word 'the' is the absolute most frequently used word in the English language, accounting for about 7% of all words written or spoken.",
      kidTitle: "A rainha das palavras! 👑",
      kidText: "A palavrinha 'the' é a mais falada do mundo em inglês! Ela aparece em quase todas as frases para apontar algo especial, como 'the dog' (o cachorro)."
    }
  ],
  fr: [
    {
      title: "La Langue de la Diplomatie",
      text: "French has traditionally been the official language of diplomacy, international treaties, and major sports organisations like the International Olympic Committee.",
      kidTitle: "O Idioma dos Reis! 👑",
      kidText: "O francês já foi a língua oficial da diplomacia e de reis por centenas de anos! Até hoje, nas Olimpíadas, os anúncios oficiais são feitos primeiro em francês."
    },
    {
      title: "The Silent Letters",
      text: "French contains many silent letters, especially at the end of words (like 'e', 's', 't'). This is historically preserved from Old French pronunciation patterns.",
      kidTitle: "Letrinhas Fantasmas! 👻",
      kidText: "O francês adora 'letrinhas fantasmas'! Muitas vezes, palavras terminam com letras que a gente escreve, mas não fala nadinha, como em 'petit' ou 'paris'!"
    },
    {
      title: "The Accent Marks",
      text: "French accents (like acute, grave, and circumflex) do not just change pronunciation; they can also distinguish words (e.g., 'ou' means 'or', while 'où' means 'where').",
      kidTitle: "Chapeuzinhos Mágicos! 🎩",
      kidText: "No francês, os acentos são como chapeuzinhos mágicos! Eles mudam o som da letra e até o significado das palavras, como diferenciar onde você está de uma escolha!"
    }
  ],
  zh: [
    {
      title: "The Power of Tones",
      text: "Mandarin Chinese is a tonal language. The same syllable 'ma' can mean 'mother' (mā), 'hemp' (má), 'horse' (mǎ), or 'scold' (mà) depending entirely on your tone of voice.",
      kidTitle: "Cantando o idioma! 🎵",
      kidText: "Falar chinês é quase como cantar! A mesma palavra 'ma' pode significar 'mãe', 'cavalo' ou 'bronca' dependendo se a sua voz sobe ou desce de tom!"
    },
    {
      title: "Concept-Based Characters",
      text: "Chinese characters (Hanzi) are logograms. They represent words or ideas rather than sounds, which means people who speak different dialects can still read the same writing.",
      kidTitle: "Desenhos que falam! ✍️",
      kidText: "Os caracteres chineses são como desenhos secretos! Cada um conta uma historinha ou ideia em vez de só fazer um barulho. Escrever chinês é uma arte linda!"
    },
    {
      title: "An Ancient Writing System",
      text: "The Chinese writing system is over 3,000 years old, making it one of the oldest continuously used written languages in human history.",
      kidTitle: "Letras Dinossauros! 🦖",
      kidText: "A escrita do chinês é super antiga, existindo há mais de 3.000 anos! É uma das escritas mais antigas e legais do mundo que as pessoas ainda usam hoje!"
    }
  ]
};
