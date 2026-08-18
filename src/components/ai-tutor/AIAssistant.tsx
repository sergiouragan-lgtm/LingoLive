import React, { useState } from 'react';
import { MessageSquare, Sparkles, Send, Minus, Maximize2 } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { auth } from '../../firebase';

export const AIAssistant: React.FC<{ userId?: string }> = ({ userId }) => {
  const { localization } = useLocalization();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Olá! Sou o seu Professor Virtual. Como posso ajudar você hoje? Posso traduzir frases ou explicar conceitos.' }
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dynamic user profile loading
  const profile = (() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const stored = localStorage.getItem(`lingolive_user_sub_${currentUser.uid}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
    }
    return null;
  })();

  const handleSend = async (task: 'explain' | 'translate' | 'correct' | 'example' | 'chat' | 'roleplay' | 'lesson' = 'chat') => {
    if (!input.trim() && task === 'chat') return;
    
    const userMessage = { role: 'user' as const, text: input || 'Ajude-me' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ 
          userId,
          messages: newMessages, 
          task: task,
          userContext: { 
            level: profile?.level || 'A1', 
            languageLearning: [profile?.learningLanguage || 'English'], 
            languageNative: profile?.nativeLanguage || 'Portuguese',
            localization: localization,
            age: profile?.age || 25,
            learningGoal: profile?.learningGoal || 'Geral',
            targetRegion: profile?.targetRegion || 'US',
            languageMode: profile?.languageMode || 'Standard',
            allowRegionalExpressions: profile?.allowRegionalExpressions !== false,
            allowSlang: profile?.allowSlang !== false,
            preferredAIModel: localStorage.getItem("lingolive_conversational_ai_model") || "gpt-4o"
          }
        })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant' as const, text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Desculpe, não consegui processar isso agora.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-heading font-semibold">Professor Virtual</h3>
        </div>
        <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1 rounded-md">
            <Minus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-slate-100'}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">IA pensando...</div>}
      </div>
      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex gap-2 text-xs flex-wrap">
          <button onClick={() => handleSend('correct')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Corrigir</button>
          <button onClick={() => handleSend('explain')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Explicar</button>
          <button onClick={() => handleSend('translate')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Traduzir</button>
          <button onClick={() => handleSend('example')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Exemplo</button>
          <button onClick={() => handleSend('roleplay')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Roleplay</button>
          <button onClick={() => handleSend('lesson')} className="bg-slate-200 p-1 rounded hover:bg-slate-300">Lição</button>
        </div>
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-lg p-2"
            placeholder="Digite sua dúvida..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend('chat')}
          />
          <button onClick={() => handleSend('chat')} className="bg-primary text-white p-2 rounded-lg">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
