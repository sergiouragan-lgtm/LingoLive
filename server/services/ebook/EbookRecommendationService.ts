import { safeQueryDocs, safeListDocs, safeGetDoc } from "../firestoreSafe.service";
import { ai } from "../../config/gemini";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

function cefrDistance(a: string, b: string): number {
  return Math.abs(CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
}

export interface EbookRecommendation {
  ebookId: string;
  title: string;
  subtitle: string;
  language: string;
  cefrLevel: string;
  coverColor: string;
  reason: string;
  score: number;
}

export async function getRecommendations(
  studentId: string,
  limit = 6
): Promise<EbookRecommendation[]> {
  const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);

  const enrolledIds = new Set<string>();
  let cefrLevel = "A1";
  const completedLanguages: Record<string, number> = {};

  for (const data of enrollments) {
    enrolledIds.add(data.ebookId);
    if (data.cefrLevel) cefrLevel = data.cefrLevel;
    if ((data.completionPercent ?? 0) >= 100 && data.language) {
      completedLanguages[data.language] = (completedLanguages[data.language] ?? 0) + 1;
    }
  }

  const allEbooks = await safeListDocs("ebooks");
  const published = allEbooks.filter((e: any) => e.status === "published");

  const candidates: EbookRecommendation[] = [];

  for (const data of published) {
    const eid: string = data.id;
    if (enrolledIds.has(eid)) continue;
    const bookCefr: string = data.cefrLevel ?? "A1";
    const dist = cefrDistance(cefrLevel, bookCefr);

    const popularityBonus = Math.min((data.enrolledCount ?? 0) / 100, 1);
    const ratingBonus = ((data.averageRating ?? 3) - 3) / 2;
    const languageBonus = completedLanguages[data.language ?? ""] ? 0.3 : 0;
    const score = Math.max(0, 3 - dist) + popularityBonus + ratingBonus + languageBonus;

    const reason = dist === 0
      ? `Perfeito para o seu nível ${cefrLevel}`
      : dist === 1
        ? `Ligeiramente acima do seu nível — um bom desafio`
        : `Recomendado com base no seu histórico`;

    candidates.push({
      ebookId: eid,
      title: data.title ?? "E-book",
      subtitle: data.subtitle ?? "",
      language: data.language ?? "en",
      cefrLevel: bookCefr,
      coverColor: data.coverColor ?? "#6366f1",
      reason,
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, limit);

  // Enrich top reasons with AI (best-effort)
  try {
    if (top.length > 0) {
      const prompt = [
        `A student is learning languages at CEFR level ${cefrLevel}.`,
        `They have completed e-books in: ${Object.keys(completedLanguages).join(", ") || "none yet"}.`,
        `For each of the following recommended e-books, write ONE short sentence (max 12 words) explaining why it's a great next read.`,
        `Return ONLY a JSON array of strings, one per book in order.`,
        `Books: ${top.map((b) => `"${b.title}" (${b.cefrLevel})`).join(", ")}`,
      ].join(" ");

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = result.text?.trim() ?? "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const reasons: string[] = JSON.parse(jsonMatch[0]);
        reasons.forEach((r, i) => { if (top[i] && r) top[i].reason = r; });
      }
    }
  } catch {
    // Best-effort — keep algorithmic reason on failure
  }

  return top;
}

export async function getSimilarEbooks(
  ebookId: string,
  limit = 4
): Promise<EbookRecommendation[]> {
  const sourceDoc = await safeGetDoc("ebooks", ebookId);
  if (!sourceDoc.exists) return [];

  const source = sourceDoc.data() as any;
  const sourceCefr = source.cefrLevel ?? "A1";
  const sourceLang = source.language ?? "en";

  const allEbooks = await safeListDocs("ebooks");
  const similar: EbookRecommendation[] = [];

  for (const data of allEbooks) {
    if (data.id === ebookId || data.status !== "published") continue;
    const dist = cefrDistance(sourceCefr, data.cefrLevel ?? "A1");
    const langMatch = data.language === sourceLang ? 1 : 0;
    const score = langMatch * 2 + Math.max(0, 3 - dist);

    similar.push({
      ebookId: data.id,
      title: data.title ?? "E-book",
      subtitle: data.subtitle ?? "",
      language: data.language ?? "en",
      cefrLevel: data.cefrLevel ?? "A1",
      coverColor: data.coverColor ?? "#6366f1",
      reason: langMatch ? "Mesmo idioma, nível semelhante" : "Nível semelhante",
      score,
    });
  }

  return similar.sort((a, b) => b.score - a.score).slice(0, limit);
}
