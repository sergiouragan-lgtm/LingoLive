export interface PhraseTemplate {
  word: string;
  meaning: string;
  pronunciation: string;
  grammarNote: string;
  exampleOriginal: string;
  exampleTranslation: string;
}

export const COMMON_PHRASES: Record<string, PhraseTemplate[]> = {
  pt: [
    {
      word: "Bom dia, como está?",
      meaning: "Good morning, how are you?",
      pronunciation: "Bohn dee-ah, koh-moh ess-tah?",
      grammarNote: "Greeting, formal or polite.",
      exampleOriginal: "Bom dia, como está? Tudo bem por aqui.",
      exampleTranslation: "Good morning, how are you? Everything is well here."
    },
    {
      word: "Muito obrigado",
      meaning: "Thank you very much (masculine)",
      pronunciation: "Mwee-toh oh-bree-gah-doh",
      grammarNote: "Thanking expression, use 'obrigada' if you are female.",
      exampleOriginal: "Muito obrigado pela sua ajuda excelente.",
      exampleTranslation: "Thank you very much for your excellent help."
    },
    {
      word: "Por favor",
      meaning: "Please",
      pronunciation: "Poor fah-voor",
      grammarNote: "Standard polite request.",
      exampleOriginal: "Pode trazer um copo de água, por favor?",
      exampleTranslation: "Can you bring a glass of water, please?"
    },
    {
      word: "Com licença",
      meaning: "Excuse me",
      pronunciation: "Kohn lee-sehn-sah",
      grammarNote: "Used to politely get past someone or gain attention.",
      exampleOriginal: "Com licença, posso passar por aqui?",
      exampleTranslation: "Excuse me, may I pass through here?"
    },
    {
      word: "Até logo",
      meaning: "See you later",
      pronunciation: "Ah-teh loh-goh",
      grammarNote: "Common friendly farewell.",
      exampleOriginal: "Tenho de ir agora, até logo!",
      exampleTranslation: "I have to go now, see you later!"
    },
    {
      word: "Prazer em conhecê-lo",
      meaning: "Nice to meet you",
      pronunciation: "Prah-zehr ehm koh-nyeh-seh-loh",
      grammarNote: "Conhecê-lo (masculine) / conhecê-la (feminine).",
      exampleOriginal: "Prazer em conhecê-lo, sou o novo estudante.",
      exampleTranslation: "Nice to meet you, I am the new student."
    },
    {
      word: "Quanto custa isto?",
      meaning: "How much does this cost?",
      pronunciation: "Kwahn-toh koos-tah ees-toh?",
      grammarNote: "Essential question for shopping.",
      exampleOriginal: "Quanto custa isto? Gostaria de comprar.",
      exampleTranslation: "How much does this cost? I would like to buy it."
    },
    {
      word: "Onde fica a casa de banho?",
      meaning: "Where is the bathroom?",
      pronunciation: "Ohn-deh fee-kah ah kah-zah jee bah-nyoo?",
      grammarNote: "'Casa de banho' is standard in Portugal/Angola.",
      exampleOriginal: "Desculpe, onde fica a casa de banho?",
      exampleTranslation: "Excuse me, where is the bathroom?"
    }
  ],
  fr: [
    {
      word: "Bonjour, comment ça va?",
      meaning: "Hello, how is it going?",
      pronunciation: "Bohn-zhoor, koh-mahn sah vah?",
      grammarNote: "Standard universal polite greeting.",
      exampleOriginal: "Bonjour, comment ça va aujourd'hui?",
      exampleTranslation: "Hello, how is it going today?"
    },
    {
      word: "S'il vous plaît",
      meaning: "Please (formal/plural)",
      pronunciation: "Seel voo pleh",
      grammarNote: "Use 's'il te plaît' for informal/singular.",
      exampleOriginal: "Un café et um croissant, s'il vous plaît.",
      exampleTranslation: "A coffee and a croissant, please."
    },
    {
      word: "Merci beaucoup",
      meaning: "Thank you very much",
      pronunciation: "Mair-see boh-koo",
      grammarNote: "Expression of high gratitude.",
      exampleOriginal: "Merci beaucoup pour votre accueil chaleureux.",
      exampleTranslation: "Thank you very much for your warm hospitality."
    },
    {
      word: "Excusez-moi",
      meaning: "Excuse me",
      pronunciation: "Ex-kew-zay mwah",
      grammarNote: "Polite attention-getter or apology.",
      exampleOriginal: "Excusez-moi, je cherche la gare.",
      exampleTranslation: "Excuse me, I am looking for the train station."
    },
    {
      word: "Enchanté",
      meaning: "Delighted / Nice to meet you",
      pronunciation: "Ahn-shahn-tay",
      grammarNote: "Add an extra 'e' (Enchantée) if you are female.",
      exampleOriginal: "Je m'appelle Pierre. Enchanté de vous rencontrer.",
      exampleTranslation: "My name is Pierre. Nice to meet you."
    },
    {
      word: "Où se trouvent les toilettes?",
      meaning: "Where are the toilets?",
      pronunciation: "Oo suh troov lay twah-let?",
      grammarNote: "Always plural in French.",
      exampleOriginal: "S'il vous plaît, où se trouvent les toilettes?",
      exampleTranslation: "Please, where are the toilets?"
    },
    {
      word: "Combien ça coûte?",
      meaning: "How much does it cost?",
      pronunciation: "Kohn-byehn sah koot?",
      grammarNote: "Very useful for commerce.",
      exampleOriginal: "C'est magnifique! Combien ça coûte?",
      exampleTranslation: "It's magnificent! How much does it cost?"
    },
    {
      word: "Au revoir",
      meaning: "Goodbye",
      pronunciation: "Oh r'vwahr",
      grammarNote: "Standard formal farewell.",
      exampleOriginal: "Merci pour tout, au revoir!",
      exampleTranslation: "Thank you for everything, goodbye!"
    }
  ],
  en: [
    {
      word: "Hello, nice to meet you!",
      meaning: "Olá, prazer em conhecer-te!",
      pronunciation: "Heh-loh, nahys too meet yoo!",
      grammarNote: "Friendly greeting for new acquaintances.",
      exampleOriginal: "Hello, nice to meet you! My name is Arthur.",
      exampleTranslation: "Olá, prazer em conhecer-te! Meu nome é Arthur."
    },
    {
      word: "Thank you so much",
      meaning: "Muito obrigado",
      pronunciation: "Thenk yoo soh muhch",
      grammarNote: "Sincere gratitude helper.",
      exampleOriginal: "Thank you so much for guiding me through the city.",
      exampleTranslation: "Muito obrigado por guiar-me pela cidade."
    },
    {
      word: "Could you help me, please?",
      meaning: "Poderia ajudar-me, por favor?",
      pronunciation: "Kood yoo help mee, pleez?",
      grammarNote: "Polite question using auxiliary verb 'could'.",
      exampleOriginal: "Excuse me, could you help me, please? I am lost.",
      exampleTranslation: "Com licença, poderia ajudar-me, por favor? Estou perdido."
    },
    {
      word: "How much is this?",
      meaning: "Quanto custa isto?",
      pronunciation: "How muhch iz this?",
      grammarNote: "Basic pricing question.",
      exampleOriginal: "I love this traditional scarf! How much is this?",
      exampleTranslation: "Eu adoro este cachecol tradicional! Quanto custa isto?"
    },
    {
      word: "Where is the nearest subway station?",
      meaning: "Onde fica a estação de metro mais próxima?",
      pronunciation: "Wair iz thuh neer-ist suhb-wey stey-shuhn?",
      grammarNote: "'Subway' is American; use 'underground' or 'tube' in UK.",
      exampleOriginal: "Excuse me, where is the nearest subway station?",
      exampleTranslation: "Com licença, onde fica a estação de metro mais próxima?"
    },
    {
      word: "Have a great day!",
      meaning: "Tenha um excelente dia!",
      pronunciation: "Hav ey greyt dey!",
      grammarNote: "Common polite departing wish.",
      exampleOriginal: "Thank you for the coffee. Have a great day!",
      exampleTranslation: "Obrigado pelo café. Tenha um excelente dia!"
    }
  ],
  zh: [
    {
      word: "你好，最近怎么样？ (Nǐ hǎo, zuìjìn zěnmeyàng?)",
      meaning: "Hello, how have you been lately?",
      pronunciation: "Nee hao, dway-jin dzen-muh-yahng?",
      grammarNote: "Standard modern Chinese greeting inquiry.",
      exampleOriginal: "你好，最近怎么样？好久不见！",
      exampleTranslation: "Hello, how have you been lately? Long time no see!"
    },
    {
      word: "谢谢你的帮助 (Xièxiè nǐ de bāngzhù)",
      meaning: "Thank you for your help",
      pronunciation: "Shyeh-shyeh nee duh bahng-joo",
      grammarNote: "'帮助' (bāngzhù) means help/assistance.",
      exampleOriginal: "谢谢你的帮助，我很感激。",
      exampleTranslation: "Thank you for your help, I am very grateful."
    },
    {
      word: "请问，洗手间在哪儿？ (Qǐngwèn, xǐshǒujiān zài nǎ'er?)",
      meaning: "Excuse me, where is the restroom?",
      pronunciation: "Cheeng-wen, shee-show-jyen dzai nar?",
      grammarNote: "'请问' means 'may I ask', a polite opener.",
      exampleOriginal: "请问，洗手间在哪儿？",
      exampleTranslation: "Excuse me, where is the restroom?"
    },
    {
      word: "这个多少钱？ (Zhège duōshǎo qián?)",
      meaning: "How much is this?",
      pronunciation: "Dze-guh dwo-shao chyen?",
      grammarNote: "'这个' means this, '多少钱' means how much money.",
      exampleOriginal: "老板，这个多少钱？",
      exampleTranslation: "Shopkeeper, how much is this?"
    },
    {
      word: "太谢谢了！ (Tài xièxièle!)",
      meaning: "Thank you so much!",
      pronunciation: "Tie shyeh-shyeh luh!",
      grammarNote: "Enthusiastic expression of gratitude.",
      exampleOriginal: "你帮了我大忙，太谢谢了！",
      exampleTranslation: "You helped me a lot, thank you so much!"
    },
    {
      word: "再见，祝你一天过得愉快！ (Zàijiàn, zhù nǐ yītiānguò dé yúkuài!)",
      meaning: "Goodbye, have a pleasant day!",
      pronunciation: "Dzai-jyen, joo nee yee-tyen gwo duh yoo-kwai!",
      grammarNote: "Polite farewell with well-wishes.",
      exampleOriginal: "我们要走了，再见，祝你一天过得愉快！",
      exampleTranslation: "We must go, goodbye, have a pleasant day!"
    }
  ]
};
