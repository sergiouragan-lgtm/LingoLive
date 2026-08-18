import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

export const ExecutiveAIChat = () => {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages([...messages, userMsg]);
    setInput("");

    const response = await fetch("/api/executive-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
    });
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
  };

  return (
    <div className="bg-slate-950 rounded-2xl p-4 shadow-inner flex flex-col h-[500px] border border-slate-800">
      <h3 className="text-slate-200 font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
        <MessageSquare className="text-indigo-500 w-4 h-4" /> Executive AI
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none self-end ml-auto max-w-[85%]' : 'bg-slate-800 text-slate-200 rounded-bl-none self-start mr-auto max-w-[85%]'}`}>
                {m.text}
            </div>
        ))}
      </div>
      <div className="relative">
        <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-slate-900 text-slate-100 rounded-xl p-3 pr-10 text-sm border border-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="Analise métricas..."
        />
        <button onClick={handleSend} className="absolute right-2 top-2 p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
            <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
