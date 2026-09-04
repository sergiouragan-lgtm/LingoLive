/**
 * Block Editor — 7 pedagogical block types for LingoLive Ebook Studio.
 * Self-contained, no external editor dependencies.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  AlignLeft, MessageSquare, Table, BookOpen, ChevronDown, ChevronUp,
  HelpCircle, Volume2, GripVertical, Trash2, Copy, Plus, GraduationCap,
  Loader2, Check, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType =
  | "paragraph"
  | "dialogue"
  | "grammar-table"
  | "vocab-card"
  | "accordion"
  | "quiz"
  | "audio-player";

export interface ParagraphData {
  text: string;
  heading?: "" | "h2" | "h3";
}
export interface DialogueData {
  speaker: string;
  text: string;
  tone: "formal" | "casual" | "neutral";
}
export interface GrammarTableData {
  caption: string;
  headers: string[];
  rows: string[][];
}
export interface VocabCardData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}
export interface AccordionData {
  title: string;
  content: string;
}
export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
export interface AudioPlayerData {
  text: string;
  voice: string;
  status: "pending" | "ready";
}

export type AnyBlockData =
  | ParagraphData
  | DialogueData
  | GrammarTableData
  | VocabCardData
  | AccordionData
  | QuizData
  | AudioPlayerData;

export interface Block {
  id: string;
  type: BlockType;
  data: AnyBlockData;
}

// ─── Factories ────────────────────────────────────────────────────────────────

let _idCounter = 0;
function newId() {
  return `blk-${Date.now()}-${_idCounter++}`;
}

export function createBlock(type: BlockType): Block {
  const defaults: Record<BlockType, AnyBlockData> = {
    paragraph: { text: "", heading: "" },
    dialogue: { speaker: "Personagem A", text: "", tone: "neutral" },
    "grammar-table": {
      caption: "Tabela Gramatical",
      headers: ["Forma", "Exemplo", "Tradução"],
      rows: [["", "", ""]],
    },
    "vocab-card": { word: "", phonetic: "", partOfSpeech: "nome", definition: "", example: "" },
    accordion: { title: "Clique para expandir", content: "" },
    quiz: { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" },
    "audio-player": { text: "", voice: "Rachel", status: "pending" },
  };
  return { id: newId(), type, data: defaults[type] };
}

/** Convert blocks to flat markdown string (for Gemini / plain-text preview) */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph": {
          const d = b.data as ParagraphData;
          if (d.heading === "h2") return `## ${d.text}`;
          if (d.heading === "h3") return `### ${d.text}`;
          return d.text;
        }
        case "dialogue": {
          const d = b.data as DialogueData;
          return `**${d.speaker}:** "${d.text}"`;
        }
        case "grammar-table": {
          const d = b.data as GrammarTableData;
          const header = `| ${d.headers.join(" | ")} |`;
          const sep = `| ${d.headers.map(() => "---").join(" | ")} |`;
          const rows = d.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
          return `${d.caption}\n\n${header}\n${sep}\n${rows}`;
        }
        case "vocab-card": {
          const d = b.data as VocabCardData;
          return `**${d.word}** /${d.phonetic}/ (${d.partOfSpeech})\n${d.definition}\n*${d.example}*`;
        }
        case "accordion": {
          const d = b.data as AccordionData;
          return `### ${d.title}\n${d.content}`;
        }
        case "quiz": {
          const d = b.data as QuizData;
          const opts = d.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n");
          return `**Questão:** ${d.question}\n${opts}\n**Resposta:** ${String.fromCharCode(65 + d.correctIndex)}`;
        }
        case "audio-player": {
          const d = b.data as AudioPlayerData;
          return `🔊 *Áudio:* ${d.text}`;
        }
        default:
          return "";
      }
    })
    .join("\n\n");
}

/** Import markdown string as a single paragraph block */
export function markdownToBlocks(text: string): Block[] {
  if (!text.trim()) return [createBlock("paragraph")];
  return [{ id: newId(), type: "paragraph", data: { text, heading: "" } as ParagraphData }];
}

// ─── Block type meta ──────────────────────────────────────────────────────────

const BLOCK_META: Record<BlockType, { label: string; icon: React.FC<{ className?: string }> }> = {
  paragraph: { label: "Parágrafo", icon: AlignLeft },
  dialogue: { label: "Diálogo", icon: MessageSquare },
  "grammar-table": { label: "Tabela Gramatical", icon: Table },
  "vocab-card": { label: "Vocab Card", icon: BookOpen },
  accordion: { label: "Acordeão", icon: ChevronDown },
  quiz: { label: "Quiz", icon: HelpCircle },
  "audio-player": { label: "Áudio TTS", icon: Volume2 },
};

// ─── Individual block editors ─────────────────────────────────────────────────

function ParagraphEditor({
  data, onChange,
}: {
  data: ParagraphData;
  onChange: (d: ParagraphData) => void;
}) {
  const headingClass = data.heading === "h2"
    ? "text-xl font-bold"
    : data.heading === "h3"
    ? "text-lg font-semibold"
    : "text-sm";

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {(["", "h2", "h3"] as const).map((h) => (
          <button
            key={h}
            onClick={() => onChange({ ...data, heading: h })}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${data.heading === h ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            {h === "" ? "¶" : h === "h2" ? "H2" : "H3"}
          </button>
        ))}
      </div>
      <textarea
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        placeholder="Escreva o conteúdo aqui..."
        className={`w-full bg-slate-800/60 border border-slate-600/40 rounded-xl p-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed ${headingClass}`}
        rows={data.heading ? 2 : 5}
      />
    </div>
  );
}

function DialogueEditor({
  data, onChange,
}: {
  data: DialogueData;
  onChange: (d: DialogueData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Personagem</label>
          <input
            value={data.speaker}
            onChange={(e) => onChange({ ...data, speaker: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-600/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            placeholder="Nome do personagem"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tom</label>
          <select
            value={data.tone}
            onChange={(e) => onChange({ ...data, tone: e.target.value as DialogueData["tone"] })}
            className="bg-slate-800/60 border border-slate-600/40 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
          >
            <option value="formal">Formal</option>
            <option value="neutral">Neutro</option>
            <option value="casual">Casual</option>
          </select>
        </div>
      </div>
      <div className={`border-l-4 pl-4 rounded-r-xl py-2 ${data.tone === "formal" ? "border-blue-500 bg-blue-500/5" : data.tone === "casual" ? "border-amber-500 bg-amber-500/5" : "border-slate-500 bg-slate-500/5"}`}>
        <p className="text-xs font-bold text-slate-300 mb-1">{data.speaker || "Personagem"}</p>
        <textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Fala do personagem..."
          className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none"
          rows={3}
        />
      </div>
    </div>
  );
}

function GrammarTableEditor({
  data, onChange,
}: {
  data: GrammarTableData;
  onChange: (d: GrammarTableData) => void;
}) {
  const updateHeader = (i: number, val: string) => {
    const headers = [...data.headers];
    headers[i] = val;
    onChange({ ...data, headers });
  };
  const updateCell = (r: number, c: number, val: string) => {
    const rows = data.rows.map((row) => [...row]);
    rows[r][c] = val;
    onChange({ ...data, rows });
  };
  const addRow = () =>
    onChange({ ...data, rows: [...data.rows, data.headers.map(() => "")] });
  const removeRow = (i: number) =>
    onChange({ ...data, rows: data.rows.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <input
        value={data.caption}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
        className="w-full bg-slate-800/60 border border-slate-600/40 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
        placeholder="Título da tabela"
      />
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800">
              {data.headers.map((h, i) => (
                <th key={i} className="p-2 border border-slate-700/50">
                  <input
                    value={h}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    className="w-full bg-transparent text-indigo-300 font-bold text-xs text-center focus:outline-none placeholder-slate-500"
                    placeholder={`Coluna ${i + 1}`}
                  />
                </th>
              ))}
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-slate-700/50 hover:bg-slate-800/40">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2 border border-slate-700/30">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-full bg-transparent text-slate-200 text-xs text-center focus:outline-none placeholder-slate-600"
                      placeholder="..."
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    onClick={() => removeRow(ri)}
                    className="text-slate-600 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar linha
      </button>
    </div>
  );
}

function VocabCardEditor({
  data, onChange,
}: {
  data: VocabCardData;
  onChange: (d: VocabCardData) => void;
}) {
  const POS_OPTIONS = ["nome", "verbo", "adjetivo", "advérbio", "preposição", "conjunção", "interjeição", "frase"];
  return (
    <div className="bg-slate-800/40 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Palavra</label>
          <input
            value={data.word}
            onChange={(e) => onChange({ ...data, word: e.target.value })}
            className="w-full bg-slate-700/60 border border-slate-600/40 rounded-lg px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-indigo-500"
            placeholder="Word"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Fonética /…/</label>
          <input
            value={data.phonetic}
            onChange={(e) => onChange({ ...data, phonetic: e.target.value })}
            className="w-full bg-slate-700/60 border border-slate-600/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            placeholder="/fəʊˈnetɪk/"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Classe gramatical</label>
        <select
          value={data.partOfSpeech}
          onChange={(e) => onChange({ ...data, partOfSpeech: e.target.value })}
          className="bg-slate-700/60 border border-slate-600/40 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
        >
          {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Definição</label>
        <textarea
          value={data.definition}
          onChange={(e) => onChange({ ...data, definition: e.target.value })}
          rows={2}
          className="w-full bg-slate-700/60 border border-slate-600/40 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
          placeholder="Definição clara e concisa"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Exemplo</label>
        <input
          value={data.example}
          onChange={(e) => onChange({ ...data, example: e.target.value })}
          className="w-full bg-slate-700/60 border border-slate-600/40 rounded-lg px-3 py-2 text-sm text-slate-300 italic focus:outline-none focus:border-indigo-500"
          placeholder="Frase de exemplo em contexto"
        />
      </div>
    </div>
  );
}

function AccordionEditor({
  data, onChange,
}: {
  data: AccordionData;
  onChange: (d: AccordionData) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-600/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-3">
        <input
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="flex-1 bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
          placeholder="Título do acordeão"
        />
        <button onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-white transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <textarea
          value={data.content}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={4}
          className="w-full bg-slate-900/40 px-4 py-3 text-sm text-slate-300 placeholder-slate-500 resize-none focus:outline-none border-t border-slate-700/30"
          placeholder="Conteúdo expandido..."
        />
      )}
    </div>
  );
}

function QuizEditor({
  data, onChange,
}: {
  data: QuizData;
  onChange: (d: QuizData) => void;
}) {
  const updateOption = (i: number, val: string) => {
    const options = [...data.options];
    options[i] = val;
    onChange({ ...data, options });
  };
  const LETTERS = ["A", "B", "C", "D"];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Pergunta</label>
        <textarea
          value={data.question}
          onChange={(e) => onChange({ ...data, question: e.target.value })}
          rows={2}
          className="w-full bg-slate-800/60 border border-slate-600/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 font-medium"
          placeholder="Escreva a pergunta..."
        />
      </div>
      <div className="space-y-2">
        {data.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => onChange({ ...data, correctIndex: i })}
              className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${data.correctIndex === i ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            >
              {LETTERS[i]}
            </button>
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className={`flex-1 bg-slate-800/60 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${data.correctIndex === i ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-600/40 focus:border-indigo-500"}`}
              placeholder={`Opção ${LETTERS[i]}`}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Explicação (opcional)</label>
        <textarea
          value={data.explanation}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          rows={2}
          className="w-full bg-slate-800/60 border border-slate-600/40 rounded-xl px-3 py-2 text-sm text-slate-300 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
          placeholder="Por que esta é a resposta correta?"
        />
      </div>
    </div>
  );
}

function AudioPlayerEditor({
  data, onChange,
}: {
  data: AudioPlayerData;
  onChange: (d: AudioPlayerData) => void;
}) {
  const VOICES = ["Rachel", "Adam", "Elli", "Sam", "Josh", "Arnold", "Bella", "Domi", "Emily"];
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Voz Neural</label>
          <select
            value={data.voice}
            onChange={(e) => onChange({ ...data, voice: e.target.value })}
            className="bg-slate-800/60 border border-slate-600/40 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
          >
            {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <span className={`px-2.5 py-2 rounded-lg text-xs font-bold ${data.status === "ready" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
            {data.status === "ready" ? "✓ Pronto" : "Pendente"}
          </span>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Texto para narrar</label>
        <textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          rows={4}
          className="w-full bg-slate-800/60 border border-slate-600/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
          placeholder="Texto que será convertido em áudio neural..."
        />
      </div>
      <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
        <Volume2 className="w-4 h-4 text-indigo-400" />
        <span className="text-xs text-slate-400 flex-1">
          A geração TTS será processada ao exportar o e-book
        </span>
      </div>
    </div>
  );
}

// ─── Level Adapter Popover ────────────────────────────────────────────────────

function LevelAdapterPopover({
  onAdapt, onClose,
}: {
  onAdapt: (level: string) => void;
  onClose: () => void;
}) {
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const COLORS: Record<string, string> = {
    A1: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border-emerald-500/30",
    A2: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border-emerald-500/30",
    B1: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border-blue-500/30",
    B2: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border-blue-500/30",
    C1: "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 border-purple-500/30",
    C2: "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 border-purple-500/30",
  };
  return (
    <div className="absolute top-8 right-0 z-30 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 flex gap-1.5 flex-wrap w-44">
      <p className="w-full text-xs text-slate-400 font-bold mb-1">Adaptar ao nível CEFR:</p>
      {LEVELS.map((l) => (
        <button
          key={l}
          onClick={() => { onAdapt(l); onClose(); }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${COLORS[l]}`}
        >
          {l}
        </button>
      ))}
      <button onClick={onClose} className="w-full mt-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancelar</button>
    </div>
  );
}

// ─── Block Shell (toolbar + content) ─────────────────────────────────────────

function BlockShell({
  block, index, isFirst, isLast,
  onUpdate, onMoveUp, onMoveDown, onDelete, onDuplicate,
  onAdaptLevel, adaptingLevel,
}: {
  block: Block;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (data: AnyBlockData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAdaptLevel: (level: string) => Promise<void>;
  adaptingLevel: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;

  const renderEditor = () => {
    switch (block.type) {
      case "paragraph":
        return <ParagraphEditor data={block.data as ParagraphData} onChange={onUpdate} />;
      case "dialogue":
        return <DialogueEditor data={block.data as DialogueData} onChange={onUpdate} />;
      case "grammar-table":
        return <GrammarTableEditor data={block.data as GrammarTableData} onChange={onUpdate} />;
      case "vocab-card":
        return <VocabCardEditor data={block.data as VocabCardData} onChange={onUpdate} />;
      case "accordion":
        return <AccordionEditor data={block.data as AccordionData} onChange={onUpdate} />;
      case "quiz":
        return <QuizEditor data={block.data as QuizData} onChange={onUpdate} />;
      case "audio-player":
        return <AudioPlayerEditor data={block.data as AudioPlayerData} onChange={onUpdate} />;
    }
  };

  return (
    <div
      className={`group relative border rounded-2xl transition-all ${hovered ? "border-indigo-500/50 bg-slate-800/40" : "border-slate-700/30 bg-slate-800/20"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowLevelPicker(false); }}
    >
      {/* Block toolbar */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b transition-colors ${hovered ? "border-slate-600/60" : "border-transparent"}`}>
        <div className={`flex items-center gap-1.5 flex-1 ${hovered ? "opacity-100" : "opacity-40"}`}>
          <GripVertical className="w-3.5 h-3.5 text-slate-500" />
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">{meta.label}</span>
        </div>
        <div className={`flex items-center gap-1 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
          {/* Level Adapter */}
          <div className="relative">
            <button
              onClick={() => setShowLevelPicker((s) => !s)}
              disabled={adaptingLevel}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition-colors disabled:opacity-50"
              title="Adaptar nível CEFR"
            >
              {adaptingLevel ? <Loader2 className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
              CEFR
            </button>
            {showLevelPicker && !adaptingLevel && (
              <LevelAdapterPopover
                onAdapt={onAdaptLevel}
                onClose={() => setShowLevelPicker(false)}
              />
            )}
          </div>
          {/* Move / Duplicate / Delete */}
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDuplicate} className="p-1 rounded text-slate-500 hover:text-indigo-400 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="p-4">{renderEditor()}</div>
    </div>
  );
}

// ─── Add Block Menu ────────────────────────────────────────────────────────────

function AddBlockMenu({
  onAdd, onClose,
}: {
  onAdd: (type: BlockType) => void;
  onClose: () => void;
}) {
  const entries = Object.entries(BLOCK_META) as [BlockType, (typeof BLOCK_META)[BlockType]][];
  return (
    <div className="bg-slate-800 border border-slate-600/60 rounded-2xl shadow-2xl p-3 w-72">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Tipo de bloco</p>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([type, meta]) => {
          const Icon = meta.icon;
          return (
            <button
              key={type}
              onClick={() => { onAdd(type); onClose(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors border border-transparent hover:border-indigo-500/30"
            >
              <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  /** Called with the block id, the text content of the block, and target CEFR level.
      Should return the adapted text to replace the block's content. */
  onAdaptBlock?: (blockId: string, text: string, targetLevel: string) => Promise<string>;
  language?: string;
}

export function BlockEditor({
  blocks, onChange, onAdaptBlock, language,
}: BlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [adaptingBlockId, setAdaptingBlockId] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  const addBlock = useCallback(
    (type: BlockType) => {
      onChange([...blocks, createBlock(type)]);
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (id: string, data: AnyBlockData) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
    },
    [blocks, onChange]
  );

  const moveBlock = useCallback(
    (id: string, dir: "up" | "down") => {
      const idx = blocks.findIndex((b) => b.id === id);
      if ((dir === "up" && idx === 0) || (dir === "down" && idx === blocks.length - 1)) return;
      const newBlocks = [...blocks];
      const target = dir === "up" ? idx - 1 : idx + 1;
      [newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]];
      onChange(newBlocks);
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (id: string) => onChange(blocks.filter((b) => b.id !== id)),
    [blocks, onChange]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const idx = blocks.findIndex((b) => b.id === id);
      const clone: Block = { ...blocks[idx], id: newId(), data: JSON.parse(JSON.stringify(blocks[idx].data)) };
      const newBlocks = [...blocks];
      newBlocks.splice(idx + 1, 0, clone);
      onChange(newBlocks);
    },
    [blocks, onChange]
  );

  const adaptLevel = useCallback(
    async (blockId: string, targetLevel: string) => {
      if (!onAdaptBlock) return;
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      // Extract text content from any block type
      let text = "";
      switch (block.type) {
        case "paragraph": text = (block.data as ParagraphData).text; break;
        case "dialogue": text = (block.data as DialogueData).text; break;
        case "accordion": text = (block.data as AccordionData).content; break;
        case "vocab-card": text = (block.data as VocabCardData).definition + " " + (block.data as VocabCardData).example; break;
        default: return;
      }
      if (!text.trim()) return;

      setAdaptingBlockId(blockId);
      try {
        const adapted = await onAdaptBlock(blockId, text, targetLevel);
        // Apply adapted text back to the block
        onChange(blocks.map((b) => {
          if (b.id !== blockId) return b;
          switch (b.type) {
            case "paragraph": return { ...b, data: { ...(b.data as ParagraphData), text: adapted } };
            case "dialogue": return { ...b, data: { ...(b.data as DialogueData), text: adapted } };
            case "accordion": return { ...b, data: { ...(b.data as AccordionData), content: adapted } };
            case "vocab-card": {
              const parts = adapted.split(/\s*\.\s*/);
              return { ...b, data: { ...(b.data as VocabCardData), definition: parts[0] ?? adapted, example: parts[1] ?? (b.data as VocabCardData).example } };
            }
            default: return b;
          }
        }));
      } catch {
        // swallow — parent shows toast
      } finally {
        setAdaptingBlockId(null);
      }
    },
    [blocks, onChange, onAdaptBlock]
  );

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-slate-700/50 rounded-2xl">
        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
          <AlignLeft className="w-7 h-7 text-slate-500" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-bold">Editor de blocos vazio</p>
          <p className="text-slate-500 text-sm mt-1">Adicione um bloco para começar</p>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar bloco
          </button>
          {showAddMenu && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40">
              <AddBlockMenu onAdd={addBlock} onClose={() => setShowAddMenu(false)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <BlockShell
            block={block}
            index={index}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            onUpdate={(data) => updateBlock(block.id, data)}
            onMoveUp={() => moveBlock(block.id, "up")}
            onMoveDown={() => moveBlock(block.id, "down")}
            onDelete={() => deleteBlock(block.id)}
            onDuplicate={() => duplicateBlock(block.id)}
            onAdaptLevel={(level) => adaptLevel(block.id, level)}
            adaptingLevel={adaptingBlockId === block.id}
          />
        </React.Fragment>
      ))}

      {/* Add block button */}
      <div className="relative" ref={addMenuRef}>
        <button
          onClick={() => setShowAddMenu((s) => !s)}
          className="flex items-center gap-2 w-full justify-center px-4 py-3 border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Adicionar bloco
        </button>
        {showAddMenu && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40" ref={addMenuRef}>
            <AddBlockMenu onAdd={addBlock} onClose={() => setShowAddMenu(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
