import { safeGetDoc, safeSetDoc, safeListDocs } from "../firestoreSafe.service";
import { ai } from "../../config/gemini";

export interface VocabWord {
  word: string;
  definition: string;
  example: string;
  cefrLevel: string;
  translation: string; // Portuguese gloss
}

export interface VocabDeck {
  id: string; // ebookId
  ebookId: string;
  ebookTitle: string;
  language: string;
  words: VocabWord[];
  generatedAt: string;
}

export interface CardProgress {
  word: string;
  interval: number;       // days until next review
  easeFactor: number;     // SM-2 ease factor (starts 2.5)
  repetitions: number;    // consecutive correct reviews
  nextReviewAt: string;   // ISO date
  lastReviewedAt: string | null;
}

export interface StudentDeckProgress {
  studentId: string;
  ebookId: string;
  cards: CardProgress[];
  updatedAt: string;
}

export interface ReviewResult {
  word: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5; // SM-2: 0-2 = fail, 3-5 = pass
}

// SM-2 algorithm
function sm2Update(card: CardProgress, quality: number): CardProgress {
  const q = Math.max(0, Math.min(5, quality));
  let { interval, easeFactor, repetitions } = card;

  if (q >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReviewAt: nextReviewAt.toISOString(),
    lastReviewedAt: new Date().toISOString(),
  };
}

function defaultCard(word: string): CardProgress {
  return {
    word,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: new Date().toISOString(),
    lastReviewedAt: null,
  };
}

export async function getOrGenerateDeck(ebookId: string): Promise<VocabDeck | null> {
  // Return cached deck if fresh (< 7 days)
  const cached = await safeGetDoc("ebook_vocab_decks", ebookId);
  if (cached.exists) {
    const deck = cached.data() as VocabDeck;
    const age = Date.now() - new Date(deck.generatedAt).getTime();
    if (age < 7 * 24 * 60 * 60 * 1000) return deck;
  }

  const ebookDoc = await safeGetDoc("ebooks", ebookId);
  if (!ebookDoc.exists) return null;
  const ebook = ebookDoc.data() as any;

  const chapters = await safeListDocs(`ebooks/${ebookId}/chapters`);
  const sampleText = (chapters as any[])
    .slice(0, 3)
    .map((c) => c.content ?? c.text ?? "")
    .join("\n\n")
    .slice(0, 3000);

  if (!sampleText.trim()) {
    const empty: VocabDeck = {
      id: ebookId,
      ebookId,
      ebookTitle: ebook.title ?? "E-book",
      language: ebook.language ?? "en",
      words: [],
      generatedAt: new Date().toISOString(),
    };
    await safeSetDoc("ebook_vocab_decks", ebookId, empty);
    return empty;
  }

  const cefrLevel = ebook.cefrLevel ?? "B1";
  const language = ebook.language ?? "en";
  const prompt = [
    `Extract the 15 most important vocabulary words from this ${language} text at CEFR level ${cefrLevel}.`,
    `For each word return a JSON object with: word, definition (in English), example (short sentence using it), cefrLevel, translation (Portuguese).`,
    `Return ONLY a JSON array. No markdown, no explanation.`,
    `Text:\n${sampleText}`,
  ].join("\n");

  let words: VocabWord[] = [];
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.text?.trim() ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) words = JSON.parse(match[0]) as VocabWord[];
  } catch {
    // Best-effort — return empty deck on AI failure
  }

  const deck: VocabDeck = {
    id: ebookId,
    ebookId,
    ebookTitle: ebook.title ?? "E-book",
    language,
    words,
    generatedAt: new Date().toISOString(),
  };
  await safeSetDoc("ebook_vocab_decks", ebookId, deck);
  return deck;
}

export async function getStudentProgress(
  studentId: string,
  ebookId: string
): Promise<StudentDeckProgress> {
  const docId = `${studentId}_${ebookId}`;
  const doc = await safeGetDoc("ebook_flashcard_progress", docId);
  if (doc.exists) return doc.data() as StudentDeckProgress;
  return { studentId, ebookId, cards: [], updatedAt: new Date().toISOString() };
}

export async function submitReviews(
  studentId: string,
  ebookId: string,
  results: ReviewResult[]
): Promise<StudentDeckProgress> {
  const docId = `${studentId}_${ebookId}`;
  const progress = await getStudentProgress(studentId, ebookId);

  const cardMap = new Map<string, CardProgress>(progress.cards.map((c) => [c.word, c]));

  for (const r of results) {
    const existing = cardMap.get(r.word) ?? defaultCard(r.word);
    cardMap.set(r.word, sm2Update(existing, r.quality));
  }

  const updated: StudentDeckProgress = {
    studentId,
    ebookId,
    cards: Array.from(cardMap.values()),
    updatedAt: new Date().toISOString(),
  };
  await safeSetDoc("ebook_flashcard_progress", docId, updated);
  return updated;
}

export async function getDueCards(
  studentId: string,
  ebookId: string,
  limit = 20
): Promise<{ word: string; dueCount: number; allCards: CardProgress[] }> {
  const progress = await getStudentProgress(studentId, ebookId);
  const now = new Date();

  const due = progress.cards
    .filter((c) => new Date(c.nextReviewAt) <= now)
    .slice(0, limit);

  return {
    word: due[0]?.word ?? "",
    dueCount: due.length,
    allCards: progress.cards,
  };
}
