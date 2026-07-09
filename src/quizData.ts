export interface QuizQuestion {
  id: string;
  grade: "Creche" | "Pré-escolar" | "1º Ano" | "2º Ano" | "3º Ano" | "4º Ano" | "5º Ano" | "6º Ano" | "7º Ano";
  category: "Cultura Geral" | "Disciplinas Escolares";
  languageCode: "pt" | "en" | "fr" | "zh";
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // PORTUGUESE (pt) - ANGOLA/GLOBAL
  // ==========================================
  
  // --- CRECHE (Daycare) ---
  {
    id: "pt_creche_cg_1",
    grade: "Creche",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual é o animal símbolo nacional de Angola que tem cornos longos e vive na floresta?",
    options: ["Leão", "Palanca Negra Gigante", "Girafa", "Elefante"],
    correctAnswerIndex: 1,
    explanation: "A Palanca Negra Gigante é um animal único no mundo e é o grande símbolo nacional de Angola!"
  },
  {
    id: "pt_creche_cg_2",
    grade: "Creche",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Como se chama a fruta doce e amarela que cresce em cachos e os macaquinhos adoram?",
    options: ["Banana", "Maçã", "Abacaxi", "Limão"],
    correctAnswerIndex: 0,
    explanation: "A banana é uma fruta amarela, doce e muito saudável, perfeita para crescer forte!"
  },
  {
    id: "pt_creche_de_1",
    grade: "Creche",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Se tens 1 maçã vermelha e o teu amigo te dá mais 1 maçã, com quantas maçãs ficas?",
    options: ["1 maçã", "2 maçãs", "3 maçãs", "Nenhuma"],
    correctAnswerIndex: 1,
    explanation: "Excelente! 1 + 1 é igual a 2 maçãs gostosas."
  },
  {
    id: "pt_creche_de_2",
    grade: "Creche",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual destas cores é a cor do céu num dia limpo e bonito de sol?",
    options: ["Vermelho", "Verde", "Azul", "Preto"],
    correctAnswerIndex: 2,
    explanation: "O céu limpo de dia é Azul! O azul também está na bandeira de muitos países."
  },

  // --- PRÉ-ESCOLAR ---
  {
    id: "pt_pre_cg_1",
    grade: "Pré-escolar",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual é a capital de Angola, uma cidade linda banhada pelo Oceano Atlântico?",
    options: ["Benguela", "Huambo", "Luanda", "Lubango"],
    correctAnswerIndex: 2,
    explanation: "Luanda é a capital e a maior cidade de Angola, famosa pela sua linda Baía de Luanda!"
  },
  {
    id: "pt_pre_cg_2",
    grade: "Pré-escolar",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual destas plantas do deserto do Namibe em Angola pode viver mais de mil anos?",
    options: ["Welwitschia Mirabilis", "Roseira", "Pinheiro", "Palmeira de Dendém"],
    correctAnswerIndex: 0,
    explanation: "A Welwitschia Mirabilis é uma planta incrível do deserto de Angola que consegue sobreviver centenas de anos com pouca água!"
  },
  {
    id: "pt_pre_de_1",
    grade: "Pré-escolar",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual é a primeira letra da palavra 'Angola'?",
    options: ["Letra B", "Letra A", "Letra O", "Letra L"],
    correctAnswerIndex: 1,
    explanation: "A palavra 'Angola' começa com a vogal 'A'!"
  },
  {
    id: "pt_pre_de_2",
    grade: "Pré-escolar",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual destas formas geométricas se parece com uma bola de futebol bem redonda?",
    options: ["Quadrado", "Triângulo", "Círculo", "Retângulo"],
    correctAnswerIndex: 2,
    explanation: "O círculo é redondo como a bola de futebol, o sol e a lua cheia!"
  },

  // --- 1º ANO ---
  {
    id: "pt_1_cg_1",
    grade: "1º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Como se chama a moeda oficial de Angola?",
    options: ["Kwanza", "Metical", "Dólar", "Euro"],
    correctAnswerIndex: 0,
    explanation: "O Kwanza (AOA) é a unidade monetária oficial da República de Angola."
  },
  {
    id: "pt_1_cg_2",
    grade: "1º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual destas cores NÃO faz parte da bandeira nacional de Angola?",
    options: ["Vermelho", "Preto", "Amarelo", "Verde"],
    correctAnswerIndex: 3,
    explanation: "A bandeira de Angola é vermelha e preta, com uma figura amarela no centro. Não tem a cor verde!"
  },
  {
    id: "pt_1_de_1",
    grade: "1º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Se juntarmos as letras 'P' e 'A' e depois as letras 'I', qual palavra carinhosa formamos?",
    options: ["Pão", "Pai", "Mãe", "Amigo"],
    correctAnswerIndex: 1,
    explanation: "P + A + I forma 'Pai'!"
  },
  {
    id: "pt_1_de_2",
    grade: "1º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Quantos dedos temos ao todo nas nossas duas mãos juntas?",
    options: ["5 dedos", "8 dedos", "10 dedos", "12 dedos"],
    correctAnswerIndex: 2,
    explanation: "Temos 5 dedos em cada mão. Juntando as duas mãos: 5 + 5 = 10 dedos!"
  },

  // --- 2º ANO ---
  {
    id: "pt_2_cg_1",
    grade: "2º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual é o maior rio que corre inteiramente dentro do território de Angola?",
    options: ["Rio Kwanza", "Rio Congo", "Rio Zambeze", "Rio Cunene"],
    correctAnswerIndex: 0,
    explanation: "O Rio Kwanza é o maior rio totalmente angolano e dá nome à moeda nacional!"
  },
  {
    id: "pt_2_cg_2",
    grade: "2º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Em que continente fica localizado o belíssimo país de Angola?",
    options: ["Europa", "Ásia", "África", "América"],
    correctAnswerIndex: 2,
    explanation: "Angola fica localizada na costa ocidental da África Austral, um continente maravilhoso e diversificado!"
  },
  {
    id: "pt_2_de_1",
    grade: "2º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual é o antónimo (o oposto) da palavra 'Frio'?",
    options: ["Gelo", "Quente", "Chuva", "Fresco"],
    correctAnswerIndex: 1,
    explanation: "O oposto ou antónimo de frio é Quente!"
  },
  {
    id: "pt_2_de_2",
    grade: "2º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Quanto é 5 vezes o número 3? (5 x 3)",
    options: ["10", "15", "18", "20"],
    correctAnswerIndex: 1,
    explanation: "Multiplicar 5 por 3 é o mesmo que fazer 3 + 3 + 3 + 3 + 3, que é igual a 15!"
  },

  // --- 3º ANO ---
  {
    id: "pt_3_cg_1",
    grade: "3º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual é o nome do famoso pico ou monte que é o ponto mais alto de Angola?",
    options: ["Monte Moco", "Monte Serra da Chela", "Pico de Cabinda", "Monte Lupangue"],
    correctAnswerIndex: 0,
    explanation: "O Monte Moco é o ponto mais alto de Angola, com 2.620 metros de altitude, localizado na província do Huambo."
  },
  {
    id: "pt_3_cg_2",
    grade: "3º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Que estilo musical e de dança angolano, muito alegre, foi declarado património cultural nacional?",
    options: ["Salsa", "Semba", "Tango", "Samba"],
    correctAnswerIndex: 1,
    explanation: "O Semba é a dança e estilo musical tradicional de Angola que inspirou muitos outros ritmos pelo mundo fora, incluindo o samba!"
  },
  {
    id: "pt_3_de_1",
    grade: "3º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Na frase: 'A Palanca correu muito rápido.', qual palavra é o VERBO (ação)?",
    options: ["A", "Palanca", "correu", "muito"],
    correctAnswerIndex: 2,
    explanation: "'correu' é o verbo, porque indica a ação praticada pelo sujeito (a Palanca)."
  },
  {
    id: "pt_3_de_2",
    grade: "3º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Como chamamos aos animais que se alimentam exclusivamente de plantas, como as girafas e as ovelhas?",
    options: ["Carnívoros", "Herbívoros", "Omnívoros", "Insetívoros"],
    correctAnswerIndex: 1,
    explanation: "Os animais que comem apenas plantas são chamados de Herbívoros."
  },

  // --- 4º ANO ---
  {
    id: "pt_4_cg_1",
    grade: "4º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Como se chamam as famosas quedas de água em Malanje, uma das maiores atrações naturais de Angola?",
    options: ["Cataratas Vitória", "Quedas de Kalandula", "Quedas do Ruacaná", "Quedas de Epupa"],
    correctAnswerIndex: 1,
    explanation: "As Quedas de Kalandula, localizadas no rio Lucala em Malanje, são das quedas de água mais altas e bonitas de África!"
  },
  {
    id: "pt_4_cg_2",
    grade: "4º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual oceano banha toda a costa ocidental de Angola, trazendo brisas frescas às praias?",
    options: ["Oceano Índico", "Oceano Pacífico", "Oceano Atlântico", "Oceano Glacial Ártico"],
    correctAnswerIndex: 2,
    explanation: "Toda a costa oeste de Angola é banhada pelo magnífico Oceano Atlântico!"
  },
  {
    id: "pt_4_de_1",
    grade: "4º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual é o plural correto da palavra 'Kwanza'?",
    options: ["Kwanzas", "Kwanzes", "Kwanzoes", "Kwanza"],
    correctAnswerIndex: 0,
    explanation: "O plural de 'Kwanza' é 'Kwanzas', acrescentando apenas o 's' no final!"
  },
  {
    id: "pt_4_de_2",
    grade: "4º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual órgão do corpo humano bombeia o sangue para manter o nosso corpo com energia?",
    options: ["Cérebro", "Estômago", "Coração", "Pulmões"],
    correctAnswerIndex: 2,
    explanation: "O coração é um músculo incrível que trabalha sem parar para bombear o sangue por todo o corpo!"
  },

  // --- 5º ANO ---
  {
    id: "pt_5_cg_1",
    grade: "5º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Em que ano Angola proclamou solenemente a sua independência nacional?",
    options: ["1961", "1975", "1992", "2002"],
    correctAnswerIndex: 1,
    explanation: "Angola proclamou a sua Independência no dia 11 de Novembro de 1975!"
  },
  {
    id: "pt_5_cg_2",
    grade: "5º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual província angolana é conhecida mundialmente pela impressionante fenda vulcânica da Tundavala?",
    options: ["Huíla (Lubango)", "Namibe", "Cabinda", "Uíge"],
    correctAnswerIndex: 0,
    explanation: "A Fenda da Tundavala fica na província da Huíla, perto da cidade do Lubango, e oferece uma vista de cortar a respiração!"
  },
  {
    id: "pt_5_de_1",
    grade: "5º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Na matemática, como chamamos uma fração onde o numerador e o denominador são iguais (ex: 4/4)?",
    options: ["Fração Nula", "Fração Própria", "Fração Unitária (ou igual à unidade)", "Fração Imprópria"],
    correctAnswerIndex: 2,
    explanation: "Uma fração como 4/4 representa 1 inteiro, sendo por isso igual à unidade."
  },
  {
    id: "pt_5_de_2",
    grade: "5º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual elemento químico essencial os seres humanos inspiram do ar para sobreviver?",
    options: ["Dióxido de Carbono", "Oxigénio", "Azoto", "Hidrogénio"],
    correctAnswerIndex: 1,
    explanation: "Nós respiramos o Oxigénio (O2) presente no ar, essencial para as nossas células produzirem energia."
  },

  // --- 6º ANO ---
  {
    id: "pt_6_cg_1",
    grade: "6º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Quantas províncias constituem a divisão política e administrativa de Angola?",
    options: ["15 províncias", "18 províncias", "20 províncias", "12 províncias"],
    correctAnswerIndex: 1,
    explanation: "Angola é subdividida administrativamente em 18 províncias maravilhosas!"
  },
  {
    id: "pt_6_cg_2",
    grade: "6º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Quem foi o primeiro Presidente de Angola, proclamador da independência nacional em 1975?",
    options: ["José Eduardo dos Santos", "Dr. António Agostinho Neto", "Jonas Savimbi", "João Lourenço"],
    correctAnswerIndex: 1,
    explanation: "O Dr. António Agostinho Neto, médico e poeta ilustre, foi o primeiro Presidente de Angola."
  },
  {
    id: "pt_6_de_1",
    grade: "6º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Qual das seguintes frases apresenta um pronome pessoal na função de complemento direto?",
    options: ["Eu fui ao mercado.", "O professor viu-me na escola.", "A casa é muito alta.", "Eles cantaram ontem."],
    correctAnswerIndex: 1,
    explanation: "Na frase 'viu-me', o pronome 'me' indica quem foi visto (eu), funcionando como complemento direto."
  },
  {
    id: "pt_6_de_2",
    grade: "6º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Que planeta do Sistema Solar é conhecido como o 'Planeta Vermelho' devido ao seu solo rico em óxido de ferro?",
    options: ["Vénus", "Júpiter", "Marte", "Saturno"],
    correctAnswerIndex: 2,
    explanation: "Marte é conhecido como o Planeta Vermelho pelas suas características de solo de poeira avermelhada."
  },

  // --- 7º ANO ---
  {
    id: "pt_7_cg_1",
    grade: "7º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Qual das seguintes províncias angolanas é um enclave geográfico (separado do resto do território principal pelo Rio Congo)?",
    options: ["Zaire", "Cabinda", "Lunda Norte", "Namibe"],
    correctAnswerIndex: 1,
    explanation: "Cabinda é uma província angolana rica em recursos naturais que constitui um enclave, rodeada pela República Democrática do Congo e pelo oceano."
  },
  {
    id: "pt_7_cg_2",
    grade: "7º Ano",
    category: "Cultura Geral",
    languageCode: "pt",
    question: "Que escritor angolano escreveu a famosa obra literária 'Luuanda', vencendo prestigiados prémios internacionais?",
    options: ["Pepetela", "Luandino Vieira", "Ondjaki", "Agostinho Neto"],
    correctAnswerIndex: 1,
    explanation: "José Luandino Vieira escreveu 'Luuanda' em 1963, um clássico da literatura que recria o falar criativo dos musseques de Luanda!"
  },
  {
    id: "pt_7_de_1",
    grade: "7º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Na física, qual é a velocidade aproximada da luz no vácuo?",
    options: ["300.000 km/s", "150.000 km/s", "340 m/s", "1.000.000 km/s"],
    correctAnswerIndex: 0,
    explanation: "A luz viaja incrivelmente rápido, a cerca de 300 mil quilómetros por segundo (300.000 km/s)!"
  },
  {
    id: "pt_7_de_2",
    grade: "7º Ano",
    category: "Disciplinas Escolares",
    languageCode: "pt",
    question: "Como se classifica a oração sublinhada em: 'Nós fomos correr *porque o dia estava lindo*.'?",
    options: ["Oração coordenada explicativa", "Oração subordinada adverbial causal", "Oração subordinada adverbial final", "Oração subordinada adjetiva"],
    correctAnswerIndex: 1,
    explanation: "'porque o dia estava lindo' expressa o motivo ou causa de termos ido correr, sendo classificada como subordinada adverbial causal."
  },

  // ==========================================
  // ENGLISH (en)
  // ==========================================
  {
    id: "en_creche_cg_1",
    grade: "Creche",
    category: "Cultura Geral",
    languageCode: "en",
    question: "What animal makes a 'woof woof' sound and loves to play fetch?",
    options: ["Cat", "Dog", "Cow", "Lion"],
    correctAnswerIndex: 1,
    explanation: "Dogs bark and say 'woof woof'!"
  },
  {
    id: "en_creche_de_1",
    grade: "Creche",
    category: "Disciplinas Escolares",
    languageCode: "en",
    question: "What color do you get if you mix Red and Yellow paint?",
    options: ["Green", "Blue", "Orange", "Purple"],
    correctAnswerIndex: 2,
    explanation: "Mixing red and yellow creates a bright, warm Orange color!"
  },
  {
    id: "en_pre_cg_1",
    grade: "Pré-escolar",
    category: "Cultura Geral",
    languageCode: "en",
    question: "How many days are there in a standard week?",
    options: ["5 days", "6 days", "7 days", "10 days"],
    correctAnswerIndex: 2,
    explanation: "There are 7 days in a week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday."
  },
  {
    id: "en_1_de_1",
    grade: "1º Ano",
    category: "Disciplinas Escolares",
    languageCode: "en",
    question: "Which of the following is a vowel in the English alphabet?",
    options: ["B", "M", "E", "T"],
    correctAnswerIndex: 2,
    explanation: "The vowels in English are A, E, I, O, U."
  },
  {
    id: "en_3_cg_1",
    grade: "3º Ano",
    category: "Cultura Geral",
    languageCode: "en",
    question: "Which country is home to the famous ancient pyramids of Giza?",
    options: ["Egypt", "Mexico", "Italy", "China"],
    correctAnswerIndex: 0,
    explanation: "The historic Giza Pyramids are located in Egypt, Africa."
  },
  {
    id: "en_5_de_1",
    grade: "5º Ano",
    category: "Disciplinas Escolares",
    languageCode: "en",
    question: "What is the name of the process by which green plants make their food using sunlight?",
    options: ["Respiration", "Photosynthesis", "Digestion", "Evaporation"],
    correctAnswerIndex: 1,
    explanation: "Photosynthesis allows plants to absorb light energy and convert it into chemical food."
  },
  {
    id: "en_7_de_1",
    grade: "7º Ano",
    category: "Disciplinas Escolares",
    languageCode: "en",
    question: "In English grammar, which word in this sentence is an ADVERB: 'The cheetah ran extremely fast'?",
    options: ["cheetah", "ran", "extremely", "fast"],
    correctAnswerIndex: 2,
    explanation: "'extremely' is an adverb of degree modifying another adverb ('fast')."
  },

  // ==========================================
  // FRENCH (fr)
  // ==========================================
  {
    id: "fr_creche_cg_1",
    grade: "Creche",
    category: "Cultura Geral",
    languageCode: "fr",
    question: "Quel animal dit 'miaou' et aime boire du lait ?",
    options: ["Le chien", "Le chat", "La vache", "L'oiseau"],
    correctAnswerIndex: 1,
    explanation: "Le chat fait 'miaou' et adore jouer avec les pelotes de laine !"
  },
  {
    id: "fr_3_cg_1",
    grade: "3º Ano",
    category: "Cultura Geral",
    languageCode: "fr",
    question: "Quel monument très célèbre se trouve à Paris et ressemble à une grande tour de fer ?",
    options: ["Le Colisée", "La Tour Eiffel", "Le Louvre", "La Statue de la Liberté"],
    correctAnswerIndex: 1,
    explanation: "La Tour Eiffel est le symbole majestueux de Paris, construite par Gustave Eiffel !"
  },
  {
    id: "fr_5_de_1",
    grade: "5º Ano",
    category: "Disciplinas Escolares",
    languageCode: "fr",
    question: "Quel est le synonyme du mot 'magnifique' ?",
    options: ["Triste", "Grand", "Superbe", "Petit"],
    correctAnswerIndex: 2,
    explanation: "Superbe est un excellent synonyme de magnifique."
  },

  // ==========================================
  // CHINESE (zh)
  // ==========================================
  {
    id: "zh_creche_cg_1",
    grade: "Creche",
    category: "Cultura Geral",
    languageCode: "zh",
    question: "哪种黑白相间、胖乎乎的可爱动物最喜欢吃竹子？",
    options: ["熊猫 (Panda)", "老虎 (Tiger)", "狮子 (Lion)", "猴子 (Monkey)"],
    correctAnswerIndex: 0,
    explanation: "大熊猫是中国特有的珍稀动物，非常喜欢吃竹子！"
  },
  {
    id: "zh_3_cg_1",
    grade: "3º Ano",
    category: "Cultura Geral",
    languageCode: "zh",
    question: "中国最著名的、蜿蜒在山脊上的古代防御墙叫什么？",
    options: ["金字塔", "长城 (The Great Wall)", "埃菲尔铁塔", "故宫"],
    correctAnswerIndex: 1,
    explanation: "万里长城是中国古代的宏伟防线，闻名世界！"
  }
];
