import React, { useState, useRef, useEffect } from "react";
import { getAuth } from "firebase/auth";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VocabItem {
  word: string;
  translation: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  cefrLevel: string;
}

interface Props {
  ebookId: string;
  chapterTitle: string;
  chapterContent: string;
  ebookLanguage: string;
  cefrLevel: string;
  onSaveWord?: (word: string, translation: string) => void;
}

type Tab = "chat" | "vocab" | "grammar";

export function EbookAIAssistant({
  ebookId,
  chapterTitle,
  chapterContent,
  ebookLanguage,
  cefrLevel,
  onSaveWord,
}: Props) {
  const user = getAuth().currentUser;
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Olá! Sou o Kamba IA, o seu assistente de leitura. Posso ajudá-lo a entender o conteúdo de "${chapterTitle}", explicar vocabulário e gramática. O que gostaria de saber?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [grammarSentence, setGrammarSentence] = useState("");
  const [grammarResult, setGrammarResult] = useState<{
    explanation: string;
    structure: string;
    tips: string[];
  } | null>(null);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/ebook/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ebookId,
          chapterTitle,
          chapterContent,
          ebookLanguage,
          cefrLevel,
          history: messages.slice(-6),
          message: userMsg,
        }),
      });
      const data = await res.json();
      setMessages([...newHistory, { role: "assistant", content: data.reply ?? "Erro ao processar resposta." }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Erro de ligação. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  async function loadVocab() {
    if (vocab.length > 0 || vocabLoading) return;
    setVocabLoading(true);
    setVocabError(null);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/ebook/assistant/vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebookId, chapterContent, ebookLanguage, cefrLevel, count: 12 }),
      });
      const data = await res.json();
      setVocab(data.vocabulary ?? []);
    } catch {
      setVocabError("Não foi possível carregar vocabulário. Tente novamente.");
    } finally {
      setVocabLoading(false);
    }
  }

  async function explainGrammar() {
    if (!grammarSentence.trim() || grammarLoading) return;
    setGrammarLoading(true);
    setGrammarResult(null);
    setGrammarError(null);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/ebook/assistant/grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebookId, sentence: grammarSentence, ebookLanguage, cefrLevel }),
      });
      const data = await res.json();
      setGrammarResult(data.explanation ?? null);
    } catch {
      setGrammarError("Não foi possível obter a explicação. Tente novamente.");
    } finally {
      setGrammarLoading(false);
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "vocab") loadVocab();
  }

  function handleSave(item: VocabItem) {
    setSavedWords((prev) => new Set([...prev, item.word]));
    onSaveWord?.(item.word, item.translation);
  }

  const cefrColors: Record<string, string> = {
    A1: "#22c55e", A2: "#84cc16", B1: "#eab308",
    B2: "#f97316", C1: "#ef4444", C2: "#8b5cf6",
  };

  return (
    <>
      <style>{`
        .ai-assistant-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
        }
        .ai-bubble-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent, #7c3aed);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ai-bubble-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(124,58,237,0.5);
        }
        .ai-panel {
          position: fixed;
          bottom: 88px;
          right: 24px;
          width: 360px;
          max-height: 540px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.16);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
        }
        .ai-panel-header {
          padding: 14px 16px 10px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: var(--accent, #7c3aed);
          color: #fff;
        }
        .ai-panel-title {
          font-weight: 700;
          font-size: 15px;
          margin: 0 0 8px;
        }
        .ai-tabs {
          display: flex;
          gap: 4px;
        }
        .ai-tab {
          padding: 4px 12px;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.4);
          background: transparent;
          color: rgba(255,255,255,0.8);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ai-tab.active {
          background: rgba(255,255,255,0.25);
          color: #fff;
          border-color: rgba(255,255,255,0.6);
        }
        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-msg {
          max-width: 85%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
        }
        .ai-msg.user {
          align-self: flex-end;
          background: var(--accent, #7c3aed);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .ai-msg.assistant {
          align-self: flex-start;
          background: var(--hover-bg, #f3f4f6);
          color: var(--text, #111827);
          border-bottom-left-radius: 4px;
        }
        .ai-input-row {
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid var(--border, #e5e7eb);
        }
        .ai-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--hover-bg, #f9fafb);
          color: var(--text, #111827);
          font-size: 13px;
          outline: none;
        }
        .ai-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent, #7c3aed);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-send-btn:disabled { opacity: 0.5; cursor: default; }
        .vocab-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
        .vocab-card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 10px;
          padding: 10px;
          background: var(--card-bg, #fff);
        }
        .vocab-word { font-weight: 700; font-size: 15px; color: var(--text, #111827); }
        .vocab-pos { font-size: 11px; color: var(--muted, #6b7280); margin-left: 6px; }
        .vocab-trans { font-size: 12px; color: var(--accent, #7c3aed); margin-top: 2px; }
        .vocab-def { font-size: 12px; color: var(--muted, #6b7280); margin-top: 2px; }
        .vocab-ex { font-size: 12px; font-style: italic; color: var(--text, #374151); margin-top: 4px; }
        .vocab-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .vocab-save-btn {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 99px;
          border: 1px solid var(--accent, #7c3aed);
          background: transparent;
          color: var(--accent, #7c3aed);
          cursor: pointer;
        }
        .vocab-save-btn.saved { background: var(--accent, #7c3aed); color: #fff; }
        .grammar-pane { padding: 12px; }
        .grammar-input-row { display: flex; gap: 6px; margin-bottom: 12px; }
        .grammar-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--hover-bg, #f9fafb);
          color: var(--text, #111827);
          font-size: 13px;
        }
        .grammar-btn {
          padding: 8px 14px;
          border-radius: 8px;
          background: var(--accent, #7c3aed);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        }
        .grammar-btn:disabled { opacity: 0.5; cursor: default; }
        .grammar-result { font-size: 13px; line-height: 1.6; }
        .grammar-structure {
          font-family: monospace;
          font-size: 12px;
          background: var(--hover-bg, #f3f4f6);
          padding: 8px;
          border-radius: 6px;
          margin: 8px 0;
          color: var(--accent, #7c3aed);
        }
        .grammar-tips { padding-left: 16px; color: var(--muted, #6b7280); font-size: 12px; }
        .grammar-tips li { margin-bottom: 4px; }
        @media (max-width: 480px) {
          .ai-panel { width: calc(100vw - 24px); right: 12px; }
        }
      `}</style>

      <div className="ai-assistant-bubble">
        <button
          className="ai-bubble-btn"
          onClick={() => setIsOpen((o) => !o)}
          title="Assistente IA"
        >
          {isOpen ? "✕" : "🤖"}
        </button>

        {isOpen && (
          <div className="ai-panel">
            <div className="ai-panel-header">
              <p className="ai-panel-title">Kamba IA — Assistente de Leitura</p>
              <div className="ai-tabs">
                {(["chat", "vocab", "grammar"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    className={`ai-tab${tab === t ? " active" : ""}`}
                    onClick={() => handleTabChange(t)}
                  >
                    {t === "chat" ? "💬 Chat" : t === "vocab" ? "📚 Vocabulário" : "📐 Gramática"}
                  </button>
                ))}
              </div>
            </div>

            {tab === "chat" && (
              <>
                <div className="ai-messages">
                  {messages.map((m, i) => (
                    <div key={i} className={`ai-msg ${m.role}`}>
                      {m.content}
                    </div>
                  ))}
                  {loading && (
                    <div className="ai-msg assistant" style={{ opacity: 0.6 }}>
                      A pensar…
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="ai-input-row">
                  <input
                    className="ai-input"
                    placeholder="Faça uma pergunta sobre o capítulo…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="ai-send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                    ➤
                  </button>
                </div>
              </>
            )}

            {tab === "vocab" && (
              <div className="ai-messages" style={{ overflowY: "auto" }}>
                {vocabLoading ? (
                  <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 20 }}>
                    A extrair vocabulário…
                  </p>
                ) : vocabError ? (
                  <p style={{ textAlign: "center", color: "#ef4444", fontSize: 12, padding: 20 }}>
                    {vocabError}
                  </p>
                ) : vocab.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 20 }}>
                    Nenhum vocabulário carregado ainda.
                  </p>
                ) : (
                  <div className="vocab-list">
                    {vocab.map((item, i) => (
                      <div key={i} className="vocab-card">
                        <div>
                          <span className="vocab-word">{item.word}</span>
                          <span className="vocab-pos">{item.partOfSpeech}</span>
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: cefrColors[item.cefrLevel] ?? "#6b7280",
                              color: "#fff",
                            }}
                          >
                            {item.cefrLevel}
                          </span>
                        </div>
                        <div className="vocab-trans">🇵🇹 {item.translation}</div>
                        <div className="vocab-def">{item.definition}</div>
                        <div className="vocab-ex">"{item.example}"</div>
                        <div className="vocab-actions">
                          <span />
                          <button
                            className={`vocab-save-btn${savedWords.has(item.word) ? " saved" : ""}`}
                            onClick={() => handleSave(item)}
                            disabled={savedWords.has(item.word)}
                          >
                            {savedWords.has(item.word) ? "✓ Guardada" : "Guardar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "grammar" && (
              <div className="ai-messages" style={{ overflowY: "auto" }}>
                <div className="grammar-pane">
                  <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                    Cole uma frase do capítulo para obter uma explicação gramatical:
                  </p>
                  <div className="grammar-input-row">
                    <input
                      className="grammar-input"
                      placeholder="Cole uma frase aqui…"
                      value={grammarSentence}
                      onChange={(e) => setGrammarSentence(e.target.value)}
                    />
                    <button
                      className="grammar-btn"
                      onClick={explainGrammar}
                      disabled={grammarLoading || !grammarSentence.trim()}
                    >
                      {grammarLoading ? "…" : "Explicar"}
                    </button>
                  </div>
                  {grammarError && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{grammarError}</p>
                  )}
                  {grammarResult && (
                    <div className="grammar-result">
                      <p>{grammarResult.explanation}</p>
                      <div className="grammar-structure">{grammarResult.structure}</div>
                      <ul className="grammar-tips">
                        {grammarResult.tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
