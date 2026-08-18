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
    vocabDeck: "Baralho de Vocabulário",
    accessActivation: "Ativação de Acesso",
    activateSubscriptionTitle: "Ative a Sua Subscrição",
    selectPlanDesc: "Por favor, selecione e ative um dos planos para desbloquear o Dashboard e iniciar a sua prática ilimitada com Inteligência Artificial.",
    backToPlans: "← Voltar aos Planos",
    selectedPlan: "Plano Selecionado",
    secureCheckout: "Checkout Seguro",
    card: "Cartão",
    express: "Express",
    paypal: "PayPal",
    iban: "IBAN",
    stripeRedirect: "Será redirecionado com total segurança para o portal do Stripe para efetuar o pagamento do plano {plan}.",
    noCardStored: "Nenhum detalhe de cartão é armazenado nos nossos servidores.",
    paypalOrder: "Será criada uma ordem segura de pagamento via PayPal. Ao prosseguir, um registo pendente será criado para validação imediata da subscrição do plano {plan}.",
    paypalWarranty: "Garantia de transação segura integrada e conformidade regulamentar.",
    multicaixaInfo: "Pagamento via Multicaixa Express (Angola): Insira o seu número de telemóvel associado e receberá uma notificação no seu telemóvel para confirmar o pagamento.",
    phoneExpress: "Telemóvel Express",
    transferInfo: "Para ativar via transferência bancária, por favor efetue a transferência para o seguinte IBAN e clique em Ativar Subscrição.",
    bank: "Banco:",
    beneficiary: "Beneficiário:",
    ibanLabel: "IBAN:",
    paymentSuccess: "Pagamento Processado com Sucesso! Redirecionando...",
    processing: "Processando...",
    activateSubscription: "Ativar Subscrição",
    starterTrial: "Starter Trial",
    free: "Grátis",
    starterPeriod: "por 7 dias, depois $9.90/mês",
    mostPopular: "Mais Popular",
    starterDesc: "Ideal para iniciar os estudos do dia a dia.",
    feat1_1: "Prática básica de conversação com IA",
    feat1_2: "Acesso a 1 idioma alvo",
    feat1_3: "Estatísticas diárias básicas",
    feat1_4: "Cancelamento a qualquer momento",
    activateFreeTrial: "Ativar Teste Grátis",
    premiumVip: "Premium VIP",
    perMonth: "por mês",
    bestValue: "Melhor Valor",
    premiumDesc: "Acesso total à inteligência artificial avançada.",
    feat2_1: "Conversas ilimitadas com múltiplos tutores",
    feat2_2: "Acesso a todos os idiomas e sotaques",
    feat2_3: "Relatórios pedagógicos detalhados",
    feat2_4: "Exercícios personalizados por IA",
    feat2_5: "Acesso prioritário a novas funcionalidades",
    activatePremium: "Ativar Premium",
    familyPlan: "Plano Familiar",
    familyDesc: "Partilhe a aprendizagem com a sua família.",
    feat3_1: "Até 5 perfis de utilizador independentes",
    feat3_2: "Todas as funcionalidades Premium VIP",
    feat3_3: "Controlo parental de progresso",
    feat3_4: "Suporte dedicado 24/7",
    activateFamily: "Ativar Plano Familiar",
    planFree: "Plano Gratuito",
    priceZero: "AOA 0",
    descFree: "Acesso básico de teste",
    featFree1: "Acesso limitado 2 min por sala",
    featFree2: "Recursos essenciais de diálogo",
    featFree3: "Ideal para conhecer a plataforma",
    planMonthly: "Plano Mensal",
    descMonthly: "Acesso contínuo mês a mês",
    featMonthly1: "Acesso a todos os cenários práticos",
    featMonthly2: "Suporte especializado 12h",
    featMonthly3: "Suporte Prioritário",
    planQuarterly: "Plano Trimestral",
    descQuarterly: "Economia e consistência",
    featQuarterly1: "Acesso a todos os cenários práticos",
    featQuarterly2: "Suporte especializado 24h",
    featQuarterly3: "Acesso prioritário a atualizações",
    featQuarterly4: "Suporte Prioritário VIP",
    planYearly: "Plano Anual",
    descYearly: "O melhor custo-benefício de aprendizado",
    featYearly1: "Acesso total e ilimitado a tudo",
    featYearly2: "Suporte especializado 24h VIP",
    featYearly3: "Garantia de novos módulos",
    featYearly4: "Suporte prioritário vitalício",
    backToApp: "Voltar ao App",
    upgradePremium: "Upgrade Premium",
    unlockPotential: "Desbloqueie todo o seu potencial",
    plansAndPrices: "Planos e Preços",
    plansDesc: "Adquira um plano premium e desfrute de acesso ilimitado a todos os cenários, suporte dedicado e recursos exclusivos para acelerar a fluência do seu idioma.",
    swipePlans: "Deslize para o lado para ver mais planos",
    bestOffer: "Melhor oferta ⭐",
    buyNow: "Comprar Agora",
    startFree: "Começar Grátis",
    starting: "Iniciando...",
    subTitle: "Assinatura",
    subStateLoading: "A carregar...",
    subStateError: "Erro ao carregar assinatura",
    subStateReviewRequired: "Revisão necessária",
    subStateTrial: "Período de teste",
    subStatePendingPayment: "Pagamento pendente",
    subStateActive: "Ativo",
    subStateGracePeriod: "Período de carência",
    subStateCancelAtPeriodEnd: "Cancelamento agendado",
    subStateExpired: "Expirado",
    subStateCancelled: "Cancelado",
    subStateSuspended: "Suspenso",
    subStateUnknown: "Desconhecido",
    subManage: "Gerir Assinatura",
    subValidUntil: "Válido até"
  },
  br: {
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
    loading: "Carregando...",
    recentActivity: "Atividade Recente",
    practiceRoom: "Sala de Prática",
    liveChat: "Conversação em Tempo Real",
    streak: "Sequência de Dias",
    vocabDeck: "Baralho de Vocabulário",
    accessActivation: "Ativação de Acesso",
    activateSubscriptionTitle: "Ative a Sua Subscrição",
    selectPlanDesc: "Por favor, selecione e ative um dos planos para desbloquear o Dashboard e iniciar a sua prática ilimitada com Inteligência Artificial.",
    backToPlans: "← Voltar aos Planos",
    selectedPlan: "Plano Selecionado",
    secureCheckout: "Checkout Seguro",
    card: "Cartão",
    express: "Express",
    paypal: "PayPal",
    iban: "IBAN",
    stripeRedirect: "Será redirecionado com total segurança para o portal do Stripe para efetuar o pagamento do plano {plan}.",
    noCardStored: "Nenhum detalhe de cartão é armazenado nos nossos servidores.",
    paypalOrder: "Será criada uma ordem segura de pagamento via PayPal. Ao prosseguir, um registo pendente será criado para validação imediata da subscrição do plano {plan}.",
    paypalWarranty: "Garantia de transação segura integrada e conformidade regulamentar.",
    multicaixaInfo: "Pagamento via Multicaixa Express (Angola): Insira o seu número de telemóvel associado e receberá uma notificação no seu telemóvel para confirmar o pagamento.",
    phoneExpress: "Telemóvel Express",
    transferInfo: "Para ativar via transferência bancária, por favor efetue a transferência para o seguinte IBAN e clique em Ativar Subscrição.",
    bank: "Banco:",
    beneficiary: "Beneficiário:",
    ibanLabel: "IBAN:",
    paymentSuccess: "Pagamento Processado com Sucesso! Redirecionando...",
    processing: "Processando...",
    activateSubscription: "Ativar Subscrição",
    starterTrial: "Starter Trial",
    free: "Grátis",
    starterPeriod: "por 7 dias, depois $9.90/mês",
    mostPopular: "Mais Popular",
    starterDesc: "Ideal para iniciar os estudos do dia a dia.",
    feat1_1: "Prática básica de conversação com IA",
    feat1_2: "Acesso a 1 idioma alvo",
    feat1_3: "Estatísticas diárias básicas",
    feat1_4: "Cancelamento a qualquer momento",
    activateFreeTrial: "Ativar Teste Grátis",
    premiumVip: "Premium VIP",
    perMonth: "por mês",
    bestValue: "Melhor Valor",
    premiumDesc: "Acesso total à inteligência artificial avançada.",
    feat2_1: "Conversas ilimitadas com múltiplos tutores",
    feat2_2: "Acesso a todos os idiomas e sotaques",
    feat2_3: "Relatórios pedagógicos detalhados",
    feat2_4: "Exercícios personalizados por IA",
    feat2_5: "Acesso prioritário a novas funcionalidades",
    activatePremium: "Ativar Premium",
    familyPlan: "Plano Familiar",
    familyDesc: "Partilhe a aprendizagem com a sua família.",
    feat3_1: "Até 5 perfis de utilizador independentes",
    feat3_2: "Todas as funcionalidades Premium VIP",
    feat3_3: "Controlo parental de progresso",
    feat3_4: "Suporte dedicado 24/7",
    activateFamily: "Ativar Plano Familiar",
    planFree: "Plano Gratuito",
    priceZero: "AOA 0",
    descFree: "Acesso básico de teste",
    featFree1: "Acesso limitado 2 min por sala",
    featFree2: "Recursos essenciais de diálogo",
    featFree3: "Ideal para conhecer a plataforma",
    planMonthly: "Plano Mensal",
    descMonthly: "Acesso contínuo mês a mês",
    featMonthly1: "Acesso a todos os cenários práticos",
    featMonthly2: "Suporte especializado 12h",
    featMonthly3: "Suporte Prioritário",
    planQuarterly: "Plano Trimestral",
    descQuarterly: "Economia e consistência",
    featQuarterly1: "Acesso a todos os cenários práticos",
    featQuarterly2: "Suporte especializado 24h",
    featQuarterly3: "Acesso prioritário a atualizações",
    featQuarterly4: "Suporte Prioritário VIP",
    planYearly: "Plano Anual",
    descYearly: "O melhor custo-benefício de aprendizado",
    featYearly1: "Acesso total e ilimitado a tudo",
    featYearly2: "Suporte especializado 24h VIP",
    featYearly3: "Garantia de novos módulos",
    featYearly4: "Suporte prioritário vitalício",
    backToApp: "Voltar ao App",
    upgradePremium: "Upgrade Premium",
    unlockPotential: "Desbloqueie todo o seu potencial",
    plansAndPrices: "Planos e Preços",
    plansDesc: "Adquira um plano premium e desfrute de acesso ilimitado a todos os cenários, suporte dedicado e recursos exclusivos para acelerar a fluência do seu idioma.",
    swipePlans: "Deslize para o lado para ver mais planos",
    bestOffer: "Melhor oferta ⭐",
    buyNow: "Comprar Agora",
    startFree: "Começar Grátis",
    starting: "Iniciando...",
    subTitle: "Assinatura",
    subStateLoading: "Carregando...",
    subStateError: "Erro ao carregar assinatura",
    subStateReviewRequired: "Revisão necessária",
    subStateTrial: "Período de teste",
    subStatePendingPayment: "Pagamento pendente",
    subStateActive: "Ativo",
    subStateGracePeriod: "Período de carência",
    subStateCancelAtPeriodEnd: "Cancelamento agendado",
    subStateExpired: "Expirado",
    subStateCancelled: "Cancelado",
    subStateSuspended: "Suspenso",
    subStateUnknown: "Desconhecido",
    subManage: "Gerir Assinatura",
    subValidUntil: "Válido até"
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
    vocabDeck: "Vocabulary Deck",
    accessActivation: "Access Activation",
    activateSubscriptionTitle: "Activate Your Subscription",
    selectPlanDesc: "Please select and activate one of the plans to unlock the Dashboard and start your unlimited AI-powered practice.",
    backToPlans: "← Back to Plans",
    selectedPlan: "Selected Plan",
    secureCheckout: "Secure Checkout",
    card: "Card",
    express: "Express",
    paypal: "PayPal",
    iban: "IBAN",
    stripeRedirect: "You will be redirected securely to the Stripe portal to pay for the {plan} plan.",
    noCardStored: "No card details are stored on our servers.",
    paypalOrder: "A secure PayPal order will be created. Upon proceeding, a pending record will be created for immediate validation of the {plan} plan subscription.",
    paypalWarranty: "Integrated secure transaction guarantee and regulatory compliance.",
    multicaixaInfo: "Payment via Multicaixa Express (Angola): Enter your associated mobile number and you will receive a notification on your phone to confirm the payment.",
    phoneExpress: "Express Phone",
    transferInfo: "To activate via bank transfer, please make the transfer to the following IBAN and click Activate Subscription.",
    bank: "Bank:",
    beneficiary: "Beneficiary:",
    ibanLabel: "IBAN:",
    paymentSuccess: "Payment Processed Successfully! Redirecting...",
    processing: "Processing...",
    activateSubscription: "Activate Subscription",
    starterTrial: "Starter Trial",
    free: "Free",
    starterPeriod: "for 7 days, then $9.90/month",
    mostPopular: "Most Popular",
    starterDesc: "Ideal to start everyday studies.",
    feat1_1: "Basic AI conversation practice",
    feat1_2: "Access to 1 target language",
    feat1_3: "Basic daily statistics",
    feat1_4: "Cancel anytime",
    activateFreeTrial: "Activate Free Trial",
    premiumVip: "Premium VIP",
    perMonth: "per month",
    bestValue: "Best Value",
    premiumDesc: "Full access to advanced AI.",
    feat2_1: "Unlimited conversations with multiple tutors",
    feat2_2: "Access to all languages and accents",
    feat2_3: "Detailed pedagogical reports",
    feat2_4: "AI-personalized exercises",
    feat2_5: "Priority access to new features",
    activatePremium: "Activate Premium",
    familyPlan: "Family Plan",
    familyDesc: "Share learning with your family.",
    feat3_1: "Up to 5 independent user profiles",
    feat3_2: "All Premium VIP features",
    feat3_3: "Parental progress control",
    feat3_4: "Dedicated 24/7 support",
    activateFamily: "Activate Family Plan",
    planFree: "Free Plan",
    priceZero: "AOA 0",
    descFree: "Basic access for testing",
    featFree1: "Limited access 2 min per room",
    featFree2: "Essential dialogue features",
    featFree3: "Ideal to get to know the platform",
    planMonthly: "Monthly Plan",
    descMonthly: "Continuous month-to-month access",
    featMonthly1: "Access to all practice scenarios",
    featMonthly2: "12h specialized support",
    featMonthly3: "Priority Support",
    planQuarterly: "Quarterly Plan",
    descQuarterly: "Savings and consistency",
    featQuarterly1: "Access to all practice scenarios",
    featQuarterly2: "24h specialized support",
    featQuarterly3: "Priority access to updates",
    featQuarterly4: "VIP Priority Support",
    planYearly: "Yearly Plan",
    descYearly: "The best value for learning",
    featYearly1: "Total and unlimited access to everything",
    featYearly2: "24h VIP specialized support",
    featYearly3: "Guarantee of new modules",
    featYearly4: "Lifetime priority support",
    backToApp: "Back to App",
    upgradePremium: "Upgrade Premium",
    unlockPotential: "Unlock all your potential",
    plansAndPrices: "Plans and Prices",
    plansDesc: "Get a premium plan and enjoy unlimited access to all scenarios, dedicated support, and exclusive resources to accelerate your language fluency.",
    swipePlans: "Swipe to the side to see more plans",
    bestOffer: "Best offer ⭐",
    buyNow: "Buy Now",
    startFree: "Start Free",
    starting: "Starting...",
    subTitle: "Subscription",
    subStateLoading: "Loading...",
    subStateError: "Error loading subscription",
    subStateReviewRequired: "Review required",
    subStateTrial: "Trial period",
    subStatePendingPayment: "Pending payment",
    subStateActive: "Active",
    subStateGracePeriod: "Grace period",
    subStateCancelAtPeriodEnd: "Cancel scheduled",
    subStateExpired: "Expired",
    subStateCancelled: "Cancelled",
    subStateSuspended: "Suspended",
    subStateUnknown: "Unknown",
    subManage: "Manage Subscription",
    subValidUntil: "Valid until"
  },
  zh: {
    dashboardTitle: "学习控制面板",
    dashboardSubtitle: "通过人工智能技术和文化沉浸学习语言。",
    activeCountry: "活跃地区概况",
    subActiveCountry: "检测到的位置和文化背景",
    currencySymbol: "货币与符号",
    officialLanguage: "官方语言",
    countryCode: "国家代码",
    slangDict: "当地俚语和方言词典",
    holidaysSection: "国家法定节假日及庆典",
    themesSection: "推荐对话主题",
    dateFormatLabel: "地区日期格式",
    changeCountry: "更改活跃国家",
    changeActiveCountry: "更改活跃国家",
    iaAssistant: "AI 助手",
    loading: "加载中...",
    recentActivity: "近期活动",
    practiceRoom: "练习室",
    liveChat: "实时对话",
    streak: "连续天数",
    vocabDeck: "词汇卡包"
  },
  es: {
    dashboardTitle: "Panel de Aprendizaje",
    dashboardSubtitle: "Aprende idiomas con tecnología de Inteligência Artificial e inmersión cultural.",
    activeCountry: "Perfil Regional Activo",
    subActiveCountry: "Ubicación y contexto cultural detectados",
    currencySymbol: "Moneda y Símbolo",
    officialLanguage: "Idioma Oficial",
    countryCode: "Código de País",
    slangDict: "Diccionario de Jerga y Modismos Locales",
    holidaysSection: "Feriados y Festividades Nacionales",
    themesSection: "Temas de Conversación Recomendados",
    dateFormatLabel: "Formato de Fecha Regional",
    changeCountry: "Cambiar País Activo",
    changeActiveCountry: "Cambiar País Activo",
    iaAssistant: "Asistente de IA",
    loading: "Cargando...",
    recentActivity: "Actividad Reciente",
    practiceRoom: "Sala de Práctica",
    liveChat: "Conversación en Tiempo Real",
    streak: "Racha de Días",
    vocabDeck: "Baraja de Vocabulario"
  },
  fr: {
    dashboardTitle: "Tableau de Bord d'Apprentissage",
    dashboardSubtitle: "Apprenez des langues avec l'intelligence artificielle et l'immersion culturelle.",
    activeCountry: "Profil Régional Actif",
    subActiveCountry: "Localisation et contexte culturel détectés",
    currencySymbol: "Devise et Symbole",
    officialLanguage: "Langue Officielle",
    countryCode: "Code du Pays",
    slangDict: "Dictionnaire d'Argot et de Dialectes Locaux",
    holidaysSection: "Jours Fériés & Festivités Nationales",
    themesSection: "Thèmes de Conversation Recommandés",
    dateFormatLabel: "Format de Date Régional",
    changeCountry: "Changer de Pays Actif",
    changeActiveCountry: "Changer de Pays Actif",
    iaAssistant: "Assistant IA",
    loading: "Chargement...",
    recentActivity: "Activité Récente",
    practiceRoom: "Salle d'Entraînement",
    liveChat: "Conversation en Temps Réel",
    streak: "Série de Jours",
    vocabDeck: "Deck de Vocabulaire"
  },
  de: {
    dashboardTitle: "Lern-Dashboard",
    dashboardSubtitle: "Lernen Sie Sprachen mit KI-gestützter Technologie und kultureller Immersion.",
    activeCountry: "Aktives Regionales Profil",
    subActiveCountry: "Standort und kultureller Kontext erkannt",
    currencySymbol: "Währung und Symbol",
    officialLanguage: "Offizielle Sprache",
    countryCode: "Ländercode",
    slangDict: "Lokales Umgangssprachen- & Dialektwörterbuch",
    holidaysSection: "Nationale Feiertage & Festlichkeiten",
    themesSection: "Empfohlene Konversationsthemen",
    dateFormatLabel: "Regionales Datumsformat",
    changeCountry: "Aktives Land ändern",
    changeActiveCountry: "Aktives Land ändern",
    iaAssistant: "KI-Assistent",
    loading: "Laden...",
    recentActivity: "Letzte Aktivität",
    practiceRoom: "Übungsraum",
    liveChat: "Echtzeit-Konversation",
    streak: "Tages-Streak",
    vocabDeck: "Vokabeldeck"
  },
  ja: {
    dashboardTitle: "学習ダッシュボード",
    dashboardSubtitle: "AI技術と文化的没入で言語を学びます。",
    activeCountry: "アクティブな地域プロフィール",
    subActiveCountry: "検出された位置と文化的文脈",
    currencySymbol: "通貨と記号",
    officialLanguage: "公用語",
    countryCode: "国コード",
    slangDict: "地元のスラング＆方言辞書",
    holidaysSection: "祝日＆祭日",
    themesSection: "推奨される会話テーマ",
    dateFormatLabel: "地域の地域日付形式",
    changeCountry: "有効な国を変更",
    changeActiveCountry: "有効な国を変更",
    iaAssistant: "AI アシスタント",
    loading: "読み込み中...",
    recentActivity: "最近の活動",
    practiceRoom: "練習室",
    liveChat: "リアルタイム会話",
    streak: "継続日数",
    vocabDeck: "単語カード"
  },
  it: {
    dashboardTitle: "Pannello di Apprendimento",
    dashboardSubtitle: "Impara le lingue con l'intelligenza artificiale e l'immersione culturale.",
    activeCountry: "Profilo Regionale Attivo",
    subActiveCountry: "Posizione e contesto culturale rilevati",
    currencySymbol: "Valuta e Simbolo",
    officialLanguage: "Lingua Ufficiale",
    countryCode: "Codice Paese",
    slangDict: "Dizionario di Gergo e Dialetti Locali",
    holidaysSection: "Festività & Celebrazioni Nazionali",
    themesSection: "Temi di Conversazione Raccomandati",
    dateFormatLabel: "Formato Data Regionale",
    changeCountry: "Cambia Paese Attivo",
    changeActiveCountry: "Cambia Paese Attivo",
    iaAssistant: "Assistente IA",
    loading: "Caricamento...",
    recentActivity: "Actività Recente",
    practiceRoom: "Sala di Pratica",
    liveChat: "Conversazione in Tempo Reale",
    streak: "Serie di Giorni",
    vocabDeck: "Mazzo di Vocabolario"
  },
  ar: {
    dashboardTitle: "لوحة التحكم التعليمية",
    dashboardSubtitle: "تعلم اللغات باستخدام تقنية الذكاء الاصطناعي والانغماس الثقافي.",
    activeCountry: "الملف الإقليمي النشط",
    subActiveCountry: "الموقع والسياق الثقافي المكتشف",
    currencySymbol: "العملة والرمز",
    officialLanguage: "اللغة الرسمية",
    countryCode: "رمز الدولة",
    slangDict: "قاموس العامية واللهجات المحلية",
    holidaysSection: "العطلات الوطنية والاحتفالات",
    themesSection: "موضوعات المحادثة الموصى بها",
    dateFormatLabel: "تنسيق التاريخ الإقليمي",
    changeCountry: "تغيير الدولة النشطة",
    changeActiveCountry: "تغيير الدولة النشطة",
    iaAssistant: "مساعد الذكاء الاصطناعي",
    loading: "جاري التحميل...",
    recentActivity: "النشاط الأخير",
    practiceRoom: "غرفة التدريب",
    liveChat: "المحادثة في الوقت الحقيقي",
    streak: "سلسلة الأيام",
    vocabDeck: "مجموعة الكلمات"
  },
  he: {
    dashboardTitle: "לוח בקרה ללמידה",
    dashboardSubtitle: "למד שפות באמצעות טכנולוגיית בינה מלאכותית וטבילה תרבותית.",
    activeCountry: "פרופיל אזורי פעיל",
    subActiveCountry: "מיקום והקשר תרבותי שזוהו",
    currencySymbol: "מטבע וסמל",
    officialLanguage: "שפה רשמית",
    countryCode: "קוד מדינה",
    slangDict: "מילون סל描ג ודיאלקטים מקומיים",
    holidaysSection: "חגים לאומיים וחגיגות",
    themesSection: "נושאי שיחה מומלצים",
    dateFormatLabel: "פורמט תאריך אזורי",
    changeCountry: "שנה מדינה פעילה",
    changeActiveCountry: "שנה מדינה פעילה",
    iaAssistant: "עוזר בינה מלאכותית",
    loading: "טוען...",
    recentActivity: "פעילות אחרונה",
    practiceRoom: "חדר תרגול",
    liveChat: "שיחה בזמן אמת",
    streak: "רצף ימים",
    vocabDeck: "חפיסת מילים"
  }
};

export interface DialectInfo {
  id: string;
  name: string;
  vocabularyOverrides: Record<string, string>;
  pronunciationTip: string;
}

export interface RegionalVariantInfo {
  countryCode: string;
  countryName: string;
  officialLanguages: string[];
  regionalLanguages: string[];
  dialects: DialectInfo[];
}

export const REGIONAL_VARIANTS_LIE: Record<string, RegionalVariantInfo> = {
  AO: {
    countryCode: 'AO',
    countryName: 'Angola',
    officialLanguages: ['pt'],
    regionalLanguages: ['Kimbundu', 'Umbundu', 'Kikongo', 'Chokwe', 'Ngangela', 'Fiote', 'Nyaneka', 'Kwanyama'],
    dialects: [
      {
        id: 'kimbundu',
        name: 'Kimbundu',
        vocabularyOverrides: {
          'amigo': 'wi',
          'tudo bem': 'mambo fixe',
          'garota': 'catorzinha',
          'sair': 'bazar',
          'coisa': 'mambo'
        },
        pronunciationTip: 'Pronúncia com ritmo compassado, vogais finais abertas e sonoridade musical típica do norte de Angola.'
      },
      {
        id: 'umbundu',
        name: 'Umbundu',
        vocabularyOverrides: {
          'bom dia': 'walunga',
          'obrigado': 'ndapandula',
          'dinheiro': 'olombongo',
          'comida': 'okulya'
        },
        pronunciationTip: 'Acento rítmico centrado no planalto central angolano, com entonação suave e cadência harmónica.'
      },
      {
        id: 'kikongo',
        name: 'Kikongo',
        vocabularyOverrides: {
          'irmão': 'mpangi',
          'olá': 'kiambote',
          'casa': 'nzo',
          'professor': 'nlongi'
        },
        pronunciationTip: 'Cadência tonal forte, herança direta das línguas bantus do norte e oeste de Angola.'
      }
    ]
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigéria',
    officialLanguages: ['en'],
    regionalLanguages: ['Igbo', 'Yoruba', 'Hausa', 'Fulfulde', 'Kanuri', 'Tiv'],
    dialects: [
      {
        id: 'igbo',
        name: 'Igbo',
        vocabularyOverrides: {
          'olá': 'Nnoo',
          'tudo bem': 'Kedu',
          'obrigado': 'Imela',
          'amigo': 'Oyi'
        },
        pronunciationTip: 'Tonal pronunciation with nasalized vowels and high/low pitch distinctions.'
      },
      {
        id: 'yoruba',
        name: 'Yoruba',
        vocabularyOverrides: {
          'olá': 'Bawo',
          'bem-vindo': 'E kabo',
          'obrigado': 'Oshe',
          'mãe': 'Iya'
        },
        pronunciationTip: 'Exibe três tons básicos (alto, médio, baixo), exigindo modulação melódica cuidadosa.'
      },
      {
        id: 'hausa',
        name: 'Hausa',
        vocabularyOverrides: {
          'olá': 'Sannu',
          'bom dia': 'Ina kwana',
          'obrigado': 'Na gode',
          'sim': 'Toh'
        },
        pronunciationTip: 'Entonação suave caracterizada por consoantes implosivas e ejetivas específicas.'
      }
    ]
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    officialLanguages: ['pt'],
    regionalLanguages: ['Língua Geral Paulista', 'Nheengatu', 'Kaingang', 'Guarani'],
    dialects: [
      {
        id: 'paulista',
        name: 'Paulista (R caipira)',
        vocabularyOverrides: {
          'porta': 'porrrta',
          'legal': 'da hora',
          'menino': 'muleque',
          'estojo': 'penal'
        },
        pronunciationTip: 'Presença do R retroflexo ("r caipira") e vocalização aberta das sílabas átonas.'
      },
      {
        id: 'carioca',
        name: 'Carioca',
        vocabularyOverrides: {
          'tudo bem': 'coé',
          'legal': 'maneiro',
          'rapaz': 'mermão',
          'biscoito': 'bolacha'
        },
        pronunciationTip: 'Sibilância acentuada no "S" (com som de "X") e ditongação forte de vogais antes de sibilantes.'
      }
    ]
  },
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    officialLanguages: ['pt'],
    regionalLanguages: ['Mirandês'],
    dialects: [
      {
        id: 'alentejano',
        name: 'Alentejano',
        vocabularyOverrides: {
          'menino': 'moço',
          'rápido': 'devagarinho',
          'trabalho': 'sachada',
          'azeite': 'ouro líquido'
        },
        pronunciationTip: 'Entonação arrastada e cantada, com alongamento das vogais tônicas.'
      },
      {
        id: 'nortenho',
        name: 'Nortenho',
        vocabularyOverrides: {
          'menino': 'gajo',
          'legal': 'porreiro',
          'muito': 'bué',
          'irmão': 'mano'
        },
        pronunciationTip: 'Troca sutil do "V" pelo "B" e pronúncia forte dos dígrafos consonantais.'
      }
    ]
  }
};

// Domain-specific translations for advanced motor (LIE)
export const DOMAIN_TRANSLATIONS: Record<string, Record<string, Record<string, string>>> = {
  interface: {
    pt: { title: "Interface do LingoLIVE" },
    en: { title: "LingoLIVE Interface" }
  },
  courses: {
    pt: { intro: "Bem-vindo ao curso de línguas moderno." },
    en: { intro: "Welcome to the modern language course." }
  },
  tutor: {
    pt: { greeting: "Olá! Como posso te ajudar a praticar hoje?" },
    en: { greeting: "Hello! How can I help you practice today?" }
  },
  notifications: {
    pt: { title: "Lembrete Diário de Ofensiva ⏰" },
    en: { title: "Daily Streak Reminder ⏰" }
  },
  emails: {
    pt: { welcome: "Bem-vindo à nossa comunidade de aprendizagem global!" },
    en: { welcome: "Welcome to our global learning community!" }
  },
  certificates: {
    pt: { title: "Certificado de Conclusão de Curso Oficial" },
    en: { title: "Official Course Completion Certificate" }
  },
  reports: {
    pt: { title: "Relatório de Desempenho Semanal" },
    en: { title: "Weekly Performance Report" }
  },
  marketplace: {
    pt: { title: "Mercado de Prática e Avatares" },
    en: { title: "Practice & Avatars Marketplace" }
  },
  assessment: {
    pt: { title: "Estúdio de Avaliação Diagnóstica" },
    en: { title: "Diagnostic Assessment Studio" }
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
