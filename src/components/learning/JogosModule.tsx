import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Flame, Gamepad2, ShoppingBag, UserCog, ClipboardList, 
  Sparkles, CheckCircle, Lock, Compass, GraduationCap, ShieldCheck, 
  Eye, Volume2, Gem, Type, ArrowRight, Play, RotateCw, Check, XCircle
} from 'lucide-react';
import { gamificationService } from '../../services/gamification';
import { UserGamificationState, StoreItem, GamificationChallenge } from '../../types/gamification';
import { useToast } from '../../context/ToastContext';

interface JogosModuleProps {
  onAddXp?: (xp: number) => void;
}

export const JogosModule: React.FC<JogosModuleProps> = ({ onAddXp }) => {
  const { addToast } = useToast();
  const userId = 'student-test-user'; // fallback or active user id

  // Gamification state
  const [gameState, setGameState] = useState<UserGamificationState | null>(null);
  const [challenges, setChallenges] = useState<GamificationChallenge[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activeTab, setActiveTab] = useState<'games' | 'store' | 'avatar' | 'challenges'>('games');
  
  // Games Sub-states
  const [currentGame, setCurrentGame] = useState<'none' | 'match' | 'bubble'>('none');
  
  // 1. Word Match Game State
  const [matchCards, setMatchCards] = useState<{ id: string; text: string; pairId: string; type: 'pt' | 'en'; isSelected: boolean; isMatched: boolean }[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [matchMoves, setMatchMoves] = useState(0);

  // 2. Vocabulary Bubble Pop State
  const [bubbleWord, setBubbleWord] = useState<{ pt: string; en: string; options: string[] } | null>(null);
  const [bubbleTimer, setBubbleTimer] = useState(15);
  const [bubbleScore, setBubbleScore] = useState(0);
  const [bubbleStage, setBubbleStage] = useState(1);
  const [isBubblePlaying, setIsBubblePlaying] = useState(false);

  // Load user data
  const loadGamificationData = async () => {
    try {
      const state = await gamificationService.getUserState(userId);
      setGameState(state);
      const chals = await gamificationService.getChallenges(userId);
      setChallenges(chals);
      setStoreItems(gamificationService['repository'].getStoreItems());
    } catch (err) {
      console.error('Failed to load gamification state', err);
    }
  };

  useEffect(() => {
    loadGamificationData();
  }, []);

  // Sync / Action Helpers
  const handleXpAward = async (amount: number, reason: string) => {
    if (!gameState) return;
    const res = await gamificationService.addXp(userId, amount, reason);
    if (onAddXp) onAddXp(amount);
    
    // Refresh state
    await loadGamificationData();
  };

  const handleCoinsAward = async (amount: number, reason: string) => {
    if (!gameState) return;
    await gamificationService.addCoins(userId, amount, reason);
    addToast(`Ganhaste +${amount} Moedas!`, 'success');
    await loadGamificationData();
  };

  // --- GAME 1: WORD MATCH ENGINE ---
  const startWordMatch = () => {
    const rawPairs = [
      { pt: 'Bom dia', en: 'Good morning' },
      { pt: 'Obrigado', en: 'Thank you' },
      { pt: 'Por favor', en: 'Please' },
      { pt: 'Maçã', en: 'Apple' },
      { pt: 'Cachorro', en: 'Dog' },
      { pt: 'Caneta', en: 'Pen' }
    ];

    const cards: any[] = [];
    rawPairs.forEach((pair, idx) => {
      cards.push({ id: `pt-${idx}`, text: pair.pt, pairId: `pair-${idx}`, type: 'pt', isSelected: false, isMatched: false });
      cards.push({ id: `en-${idx}`, text: pair.en, pairId: `pair-${idx}`, type: 'en', isSelected: false, isMatched: false });
    });

    // Shuffle cards
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setMatchCards(shuffled);
    setSelectedCardId(null);
    setMatchScore(0);
    setMatchMoves(0);
    setCurrentGame('match');
  };

  const handleCardClick = (cardId: string) => {
    const clickedCard = matchCards.find(c => c.id === cardId);
    if (!clickedCard || clickedCard.isMatched) return;

    // Highlight current card
    setMatchCards(prev => prev.map(c => c.id === cardId ? { ...c, isSelected: true } : c));

    if (selectedCardId === null) {
      setSelectedCardId(cardId);
    } else {
      // Second card selected
      const firstCard = matchCards.find(c => c.id === selectedCardId);
      if (!firstCard) return;

      setMatchMoves(prev => prev + 1);

      if (firstCard.pairId === clickedCard.pairId && firstCard.id !== clickedCard.id) {
        // MATCH SUCCESS
        setMatchCards(prev => prev.map(c => (c.id === firstCard.id || c.id === clickedCard.id) ? { ...c, isMatched: true, isSelected: false } : c));
        setMatchScore(prev => prev + 1);
        addToast('Combinação Perfeita! 🎉', 'info');
        
        // Check win condition
        const matchedCount = matchCards.filter(c => c.isMatched).length + 2;
        if (matchedCount === matchCards.length) {
          // Finished match game
          handleXpAward(15, 'Jogo de Associação');
          handleCoinsAward(10, 'Jogo de Associação');
          addToast('Completaste a Associação de Palavras! 🏆', 'success');
          setTimeout(() => setCurrentGame('none'), 1800);
        }
      } else {
        // MATCH FAIL - reset selection after 800ms
        setTimeout(() => {
          setMatchCards(prev => prev.map(c => (c.id === firstCard.id || c.id === clickedCard.id) ? { ...c, isSelected: false } : c));
        }, 800);
      }
      setSelectedCardId(null);
    }
  };

  // --- GAME 2: VOCABULARY BUBBLE POP ENGINE ---
  const startVocabularyPop = () => {
    const stages = [
      { pt: 'Livro', en: 'Book', options: ['Book', 'Table', 'House', 'Car'] },
      { pt: 'Cadeira', en: 'Chair', options: ['Chair', 'Window', 'Pen', 'Apple'] },
      { pt: 'Garrafa', en: 'Bottle', options: ['Key', 'Bottle', 'Phone', 'Glass'] },
      { pt: 'Computador', en: 'Computer', options: ['Screen', 'Keyboard', 'Computer', 'Mouse'] },
      { pt: 'Coração', en: 'Heart', options: ['Brain', 'Hand', 'Foot', 'Heart'] }
    ];

    setBubbleStage(1);
    setBubbleScore(0);
    setBubbleTimer(12);
    setBubbleWord(stages[0]);
    setIsBubblePlaying(true);
    setCurrentGame('bubble');
  };

  useEffect(() => {
    let interval: any = null;
    if (currentGame === 'bubble' && isBubblePlaying && bubbleTimer > 0) {
      interval = setInterval(() => {
        setBubbleTimer(t => t - 1);
      }, 1000);
    } else if (bubbleTimer === 0 && currentGame === 'bubble' && isBubblePlaying) {
      // Time out
      addToast('Tempo esgotado! ⏳', 'warning');
      advanceBubbleStage(false);
    }
    return () => clearInterval(interval);
  }, [currentGame, isBubblePlaying, bubbleTimer]);

  const handleBubbleOptionClick = (opt: string) => {
    if (!bubbleWord) return;
    const correct = opt === bubbleWord.en;
    if (correct) {
      setBubbleScore(s => s + 1);
      addToast('Excelente! 🎈', 'success');
    } else {
      addToast('Oooops, incorreto! ❌', 'error');
    }
    advanceBubbleStage(correct);
  };

  const advanceBubbleStage = (correct: boolean) => {
    const stages = [
      { pt: 'Livro', en: 'Book', options: ['Book', 'Table', 'House', 'Car'] },
      { pt: 'Cadeira', en: 'Chair', options: ['Chair', 'Window', 'Pen', 'Apple'] },
      { pt: 'Garrafa', en: 'Bottle', options: ['Key', 'Bottle', 'Phone', 'Glass'] },
      { pt: 'Computador', en: 'Computer', options: ['Screen', 'Keyboard', 'Computer', 'Mouse'] },
      { pt: 'Coração', en: 'Heart', options: ['Brain', 'Hand', 'Foot', 'Heart'] }
    ];

    const nextIdx = bubbleStage; // stage 1 maps to index 1, etc.
    if (nextIdx < stages.length) {
      setBubbleStage(s => s + 1);
      setBubbleWord(stages[nextIdx]);
      setBubbleTimer(12);
    } else {
      // Finished all stages
      setIsBubblePlaying(false);
      const totalScore = bubbleScore + (correct ? 1 : 0);
      const rewardXp = totalScore * 6;
      const rewardCoins = totalScore * 4;

      handleXpAward(rewardXp, 'Balões de Vocabulário');
      handleCoinsAward(rewardCoins, 'Balões de Vocabulário');
      addToast(`Fim do Jogo! Acertaste ${totalScore}/5 balões! 🎈`, 'info');
      setTimeout(() => setCurrentGame('none'), 2000);
    }
  };

  // --- REWARD STORE ENGINE ---
  const handleBuyItem = async (itemId: string) => {
    const res = await gamificationService.purchaseItem(userId, itemId);
    if (res.success) {
      addToast(res.message, 'success');
      loadGamificationData();
    } else {
      addToast(res.message, 'error');
    }
  };

  // --- CUSTOMIZATION / AVATAR EQUIP ENGINE ---
  const handleEquipItem = async (category: 'base' | 'accessory' | 'background' | 'title', itemId: string) => {
    const res = await gamificationService.equipCosmetic(userId, category, itemId);
    if (res.success) {
      addToast(res.message, 'success');
      loadGamificationData();
    } else {
      addToast(res.message, 'error');
    }
  };

  // --- QUESTS / CHALLENGES ENGINE ---
  const handleClaimChallenge = async (chalId: string) => {
    const res = await gamificationService.completeChallenge(userId, chalId);
    if (res.success) {
      addToast(`Recompensa coletada! +${res.xpEarned} XP e +${res.coinsEarned} Moedas!`, 'success');
      loadGamificationData();
    }
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <RotateCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-500">A carregar os teus dados de gamificação...</span>
      </div>
    );
  }

  // Calculate current level metrics
  const { level, xpInCurrentLevel, xpRequiredForNextLevel } = gamificationService.getLevelAndProgress(gameState.xp);
  const xpPercent = Math.min((xpInCurrentLevel / xpRequiredForNextLevel) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Visual Header / Gamer Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Card / Live Avatar Rendering */}
        <div className="flex items-center gap-4 border-b border-slate-800/60 pb-4 md:pb-0 md:border-b-0 md:border-r md:border-slate-800/60 pr-4">
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner overflow-hidden"
               style={{
                 background: gameState.avatar.background === 'cosmic' ? 'radial-gradient(circle, #312e81 0%, #030712 100%)' :
                             gameState.avatar.background === 'sunset' ? 'linear-gradient(to top, #b45309, #78350f)' :
                             gameState.avatar.background === 'emerald' ? 'linear-gradient(to bottom, #065f46, #022c22)' :
                             gameState.avatar.background === 'royal' ? 'radial-gradient(circle, #5b21b6 0%, #1e1b4b 100%)' : '#1e293b'
               }}>
            
            {/* Base Avatar rendering */}
            {gameState.avatar.base === 'explorer' && <Compass className="w-8 h-8 text-amber-400" />}
            {gameState.avatar.base === 'scholar' && <GraduationCap className="w-8 h-8 text-cyan-400" />}
            {gameState.avatar.base === 'wizard' && <Sparkles className="w-8 h-8 text-purple-400" />}
            {gameState.avatar.base === 'champion' && <ShieldCheck className="w-8 h-8 text-emerald-400" />}
            {gameState.avatar.base === 'neutral' && <Gamepad2 className="w-8 h-8 text-indigo-400" />}

            {/* Accessory Layer */}
            {gameState.avatar.accessory === 'glasses' && (
              <span className="absolute text-[10px] top-4 border-b border-white px-2 text-white">👓</span>
            )}
            {gameState.avatar.accessory === 'headphones' && (
              <span className="absolute text-[10px] top-1 border-b border-white px-2 text-white">🎧</span>
            )}
            {gameState.avatar.accessory === 'crown' && (
              <span className="absolute text-sm -top-1">👑</span>
            )}
            {gameState.avatar.accessory === 'cap' && (
              <span className="absolute text-xs -top-0.5">🧢</span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">{gameState.avatar.title || 'Iniciante'}</h3>
            <p className="text-xs text-slate-400 font-medium">Ofensiva de <span className="text-orange-400 font-bold">{gameState.streak} dias</span> 🔥</p>
          </div>
        </div>

        {/* XP Progress Slider */}
        <div className="flex flex-col justify-center border-b border-slate-800/60 py-4 md:py-0 md:border-b-0 md:border-r md:border-slate-800/60 px-2 md:px-6">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-indigo-400">Nível {level}</span>
            <span className="text-slate-400">{xpInCurrentLevel} / {xpRequiredForNextLevel} XP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">Ganha mais {xpRequiredForNextLevel - xpInCurrentLevel} XP para subir ao Nível {level + 1}!</span>
        </div>

        {/* Currency Display */}
        <div className="flex items-center justify-around md:justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <Coins className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Moedas</span>
              <span className="text-lg font-black text-amber-500 tracking-tight">{gameState.coins}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ofensiva</span>
              <span className="text-lg font-black text-orange-500 tracking-tight">{gameState.streak}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'games', label: 'Jogos de Línguas', icon: Gamepad2 },
          { id: 'challenges', label: 'Missões Diárias', icon: ClipboardList },
          { id: 'store', label: 'Loja de Cosméticos', icon: ShoppingBag },
          { id: 'avatar', label: 'Personalizar Avatar', icon: UserCog }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentGame('none');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                isActive ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Renderers */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${currentGame}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          {/* --- TAB: GAMES --- */}
          {activeTab === 'games' && currentGame === 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Game 1 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-indigo-300 hover:shadow-md transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-950 mb-1.5">Associação de Palavras</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Associe palavras correspondentes em Português e Inglês o mais rápido possível para ganhar recompensas e treinar seu raciocínio de vocabulário veloz.
                  </p>
                  <div className="flex gap-2 mb-6">
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full text-indigo-600 font-extrabold">+15 XP</span>
                    <span className="text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full text-amber-600 font-extrabold">+10 Moedas</span>
                  </div>
                </div>
                <button
                  onClick={startWordMatch}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Jogar Agora</span>
                </button>
              </div>

              {/* Card Game 2 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-cyan-300 hover:shadow-md transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-950 mb-1.5">Balões de Vocabulário</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Bubbles de tradução flutuam! Selecione a tradução correta antes que o tempo se esgote nesta arena rápida de memorização de vocabulário avançado.
                  </p>
                  <div className="flex gap-2 mb-6">
                    <span className="text-[10px] bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full text-cyan-600 font-extrabold">Até +30 XP</span>
                    <span className="text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full text-amber-600 font-extrabold">Até +20 Moedas</span>
                  </div>
                </div>
                <button
                  onClick={startVocabularyPop}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-cyan-600 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Rebentar Balões</span>
                </button>
              </div>
            </div>
          )}

          {/* GAMEPLAY: WORD MATCH */}
          {activeTab === 'games' && currentGame === 'match' && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-inner relative max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Associação de Palavras</h4>
                  <p className="text-xs text-slate-400 font-semibold">Movimentos efetuados: <span className="text-slate-700">{matchMoves}</span></p>
                </div>
                <button 
                  onClick={() => setCurrentGame('none')}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {matchCards.map(card => (
                  <button
                    key={card.id}
                    disabled={card.isMatched}
                    onClick={() => handleCardClick(card.id)}
                    className={`h-24 p-2 text-center text-xs font-bold rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                      card.isMatched 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-500 opacity-60' 
                        : card.isSelected 
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{card.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAMEPLAY: BUBBLE POP */}
          {activeTab === 'games' && currentGame === 'bubble' && bubbleWord && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-inner text-center max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-500">Etapa {bubbleStage} de 5</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Tempo: {bubbleTimer}s</span>
              </div>

              <span className="text-xs font-black uppercase text-indigo-400 tracking-widest block mb-1">Qual é a tradução de:</span>
              <h3 className="text-2xl font-black text-slate-900 mb-6">{bubbleWord.pt}</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {bubbleWord.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBubbleOptionClick(opt)}
                    className="py-4 px-3 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 cursor-pointer hover:bg-indigo-50/20 active:scale-95 transition-all flex items-center justify-center shadow-xs"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-1000"
                  style={{ width: `${(bubbleTimer / 12) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* --- TAB: CHALLENGES --- */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Quests Ativas</h4>
                <span className="text-xs text-slate-400 font-semibold">Reinicia todos os dias à meia-noite</span>
              </div>

              <div className="space-y-3">
                {challenges.map(chal => {
                  const percent = Math.min((chal.currentValue / chal.targetValue) * 100, 100);
                  const isClaimable = percent >= 100 && !gameState.completedChallenges.includes(chal.id);
                  const isClaimed = gameState.completedChallenges.includes(chal.id);

                  return (
                    <div 
                      key={chal.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                            chal.type === 'daily' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            {chal.type === 'daily' ? 'Diário' : 'Semanal'}
                          </span>
                          <h5 className="font-bold text-sm text-slate-900">{chal.title}</h5>
                        </div>
                        <p className="text-xs text-slate-500">{chal.description}</p>
                        
                        {/* Linear Progress */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 shrink-0">{chal.currentValue} / {chal.targetValue}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                        <div className="flex items-center gap-1 text-slate-500 mr-auto sm:mr-0">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-amber-500">{chal.rewardCoins}</span>
                          <span className="text-[10px] font-bold text-indigo-400">+{chal.rewardXp} XP</span>
                        </div>

                        {isClaimed ? (
                          <span className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center">
                            <Check className="w-3.5 h-3.5" />
                            Reclamado
                          </span>
                        ) : isClaimable ? (
                          <button
                            onClick={() => handleClaimChallenge(chal.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer transition-all w-full sm:w-auto"
                          >
                            Resgatar Recompensa
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold w-full sm:w-auto text-center">
                            Em Progresso
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- TAB: STORE --- */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Loja de Recompensas</h4>
                  <p className="text-xs text-slate-400">Troca as tuas moedas de conquistas por personalizações premium.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-black text-amber-500">{gameState.coins}</span>
                </div>
              </div>

              {/* Categorized store sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeItems.map(item => {
                  const isOwned = gameState.inventory.includes(item.id);
                  const canAfford = gameState.coins >= item.cost;
                  const isConsumable = item.category === 'streak_freeze';

                  return (
                    <div 
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden"
                    >
                      {isOwned && !isConsumable && (
                        <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full p-1 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 mb-3">
                          {item.category === 'avatar_skin' && <UserCog className="w-5 h-5 text-indigo-500" />}
                          {item.category === 'avatar_accessory' && <Eye className="w-5 h-5 text-amber-500" />}
                          {item.category === 'avatar_bg' && <Gem className="w-5 h-5 text-purple-500" />}
                          {item.category === 'title' && <Type className="w-5 h-5 text-cyan-500" />}
                          {item.category === 'streak_freeze' && <Lock className="w-5 h-5 text-sky-500" />}
                        </div>
                        <h5 className="font-bold text-sm text-slate-900">{item.name}</h5>
                        <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">{item.category.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.description}</p>
                      </div>

                      <div className="border-t border-slate-50 pt-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-extrabold text-slate-800">{item.cost} moedas</span>
                        </div>

                        {isOwned && !isConsumable ? (
                          <span className="px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-bold">
                            Adquirido
                          </span>
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => handleBuyItem(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              canAfford 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                            }`}
                          >
                            {isConsumable ? 'Comprar 1' : 'Adquirir'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- TAB: AVATAR CUSTOMIZATION --- */}
          {activeTab === 'avatar' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                {/* Visual Avatar Preview */}
                <div className="w-32 h-32 rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg relative shrink-0"
                     style={{
                       background: gameState.avatar.background === 'cosmic' ? 'radial-gradient(circle, #312e81 0%, #030712 100%)' :
                                   gameState.avatar.background === 'sunset' ? 'linear-gradient(to top, #b45309, #78350f)' :
                                   gameState.avatar.background === 'emerald' ? 'linear-gradient(to bottom, #065f46, #022c22)' :
                                   gameState.avatar.background === 'royal' ? 'radial-gradient(circle, #5b21b6 0%, #1e1b4b 100%)' : '#e2e8f0'
                     }}>
                  
                  {/* Base Avatar rendering */}
                  {gameState.avatar.base === 'explorer' && <Compass className="w-16 h-16 text-amber-400" />}
                  {gameState.avatar.base === 'scholar' && <GraduationCap className="w-16 h-16 text-cyan-400" />}
                  {gameState.avatar.base === 'wizard' && <Sparkles className="w-16 h-16 text-purple-400" />}
                  {gameState.avatar.base === 'champion' && <ShieldCheck className="w-16 h-16 text-emerald-400" />}
                  {gameState.avatar.base === 'neutral' && <Gamepad2 className="w-16 h-16 text-indigo-400" />}

                  {/* Accessory Layer */}
                  {gameState.avatar.accessory === 'glasses' && (
                    <span className="absolute text-xl top-10 border-b border-white px-4 text-white">👓</span>
                  )}
                  {gameState.avatar.accessory === 'headphones' && (
                    <span className="absolute text-xl top-5 border-b border-white px-4 text-white">🎧</span>
                  )}
                  {gameState.avatar.accessory === 'crown' && (
                    <span className="absolute text-2xl -top-2">👑</span>
                  )}
                  {gameState.avatar.accessory === 'cap' && (
                    <span className="absolute text-lg -top-1">🧢</span>
                  )}
                </div>

                <div className="space-y-1.5 text-center md:text-left">
                  <h4 className="font-extrabold text-lg text-slate-900">Salão de Costuras LingoLIVE</h4>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    Personaliza a tua aparência de perfil que é exibida para outros estudantes e professores nas ligas públicas e no ranking de pontuação geral.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-1.5 text-xs text-indigo-600 font-extrabold">
                    <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg">Base: {gameState.avatar.base}</span>
                    <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg">Acessório: {gameState.avatar.accessory || 'none'}</span>
                    <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg">Fundo: {gameState.avatar.background}</span>
                    <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg">Título: {gameState.avatar.title || 'Iniciante'}</span>
                  </div>
                </div>
              </div>

              {/* Equippable Sections Grid */}
              <div className="space-y-4">
                <h5 className="font-extrabold text-slate-800 text-sm">O Teu Roupeiro / Inventário</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Category: Base */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                    <h6 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">Estilo Base</h6>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'neutral', label: 'Padrão' },
                        { id: 'explorer', label: 'Explorador' },
                        { id: 'scholar', label: 'Estudioso' },
                        { id: 'wizard', label: 'Feiticeiro' },
                        { id: 'champion', label: 'Campeão' }
                      ].map(opt => {
                        const isOwned = opt.id === 'neutral' || gameState.inventory.includes(`skin_${opt.id}`);
                        const isEquipped = gameState.avatar.base === opt.id;
                        return (
                          <button
                            key={opt.id}
                            disabled={!isOwned}
                            onClick={() => handleEquipItem('base', opt.id)}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                              isEquipped 
                                ? 'bg-indigo-600 text-white' 
                                : isOwned 
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' 
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isEquipped && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Accessory */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                    <h6 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">Acessórios</h6>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'none', label: 'Sem item' },
                        { id: 'glasses', label: 'Óculos' },
                        { id: 'headphones', label: 'Auscultadores' },
                        { id: 'crown', label: 'Coroa' },
                        { id: 'cap', label: 'Boné' }
                      ].map(opt => {
                        const isOwned = opt.id === 'none' || gameState.inventory.includes(`acc_${opt.id}`);
                        const isEquipped = gameState.avatar.accessory === opt.id || (!gameState.avatar.accessory && opt.id === 'none');
                        return (
                          <button
                            key={opt.id}
                            disabled={!isOwned}
                            onClick={() => handleEquipItem('accessory', opt.id)}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                              isEquipped 
                                ? 'bg-indigo-600 text-white' 
                                : isOwned 
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' 
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isEquipped && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Background */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                    <h6 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">Planos de Fundo</h6>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'slate', label: 'Padrão' },
                        { id: 'cosmic', label: 'Espacial' },
                        { id: 'sunset', label: 'Sunset' },
                        { id: 'emerald', label: 'Esmeralda' },
                        { id: 'royal', label: 'Salão Real' }
                      ].map(opt => {
                        const isOwned = opt.id === 'slate' || gameState.inventory.includes(`bg_${opt.id}`);
                        const isEquipped = gameState.avatar.background === opt.id;
                        return (
                          <button
                            key={opt.id}
                            disabled={!isOwned}
                            onClick={() => handleEquipItem('background', opt.id)}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                              isEquipped 
                                ? 'bg-indigo-600 text-white' 
                                : isOwned 
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' 
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isEquipped && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Titles */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                    <h6 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">Títulos de Honra</h6>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'Iniciante', label: 'Iniciante' },
                        { id: 'Poliglota', label: 'Poliglota' },
                        { id: 'Mestre de Voz', label: 'Mestre de Voz' },
                        { id: 'Lenda', label: 'Lenda Ativa' }
                      ].map(opt => {
                        const isOwned = opt.id === 'Iniciante' || gameState.inventory.includes(`title_${opt.id === 'Lenda' ? 'legend' : opt.id === 'Mestre de Voz' ? 'voice_master' : 'polyglot'}`);
                        const isEquipped = gameState.avatar.title === opt.id;
                        return (
                          <button
                            key={opt.id}
                            disabled={!isOwned}
                            onClick={() => handleEquipItem('title', opt.id)}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                              isEquipped 
                                ? 'bg-indigo-600 text-white' 
                                : isOwned 
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700' 
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isEquipped && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
