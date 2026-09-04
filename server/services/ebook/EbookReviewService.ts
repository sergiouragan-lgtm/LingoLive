import { safeAddDoc, safeGetDoc, safeQueryDocs, safeSetDoc } from "../firestoreSafe.service";

export interface EbookReview {
  id: string;
  ebookId: string;
  userId: string;
  userDisplayName: string;
  rating: number; // 1-5
  comment: string;
  cefrLevel?: string;
  language?: string;
  createdAt: number;
  updatedAt: number;
  helpful: number;
  deleted?: boolean;
}

export interface RatingAggregate {
  average: number;
  total: number;
  distribution: Record<string, number>; // "1"–"5" → count
}

export async function createOrUpdateReview(
  ebookId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string,
  cefrLevel?: string
): Promise<EbookReview> {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
  if (comment.length > 2000) throw new Error("Comment too long (max 2000 chars)");

  const now = Date.now();

  // Check if user already reviewed this ebook
  const existing = await getUserReview(ebookId, userId);

  if (existing) {
    const updated = {
      ...existing,
      rating,
      comment,
      cefrLevel,
      updatedAt: now,
      deleted: false,
    };
    await safeSetDoc("ebook_reviews", existing.id, updated);
    return updated as EbookReview;
  }

  const reviewData = {
    ebookId,
    userId,
    userDisplayName,
    rating,
    comment,
    cefrLevel: cefrLevel ?? null,
    createdAt: now,
    updatedAt: now,
    helpful: 0,
    deleted: false,
  };

  const docRef = await safeAddDoc("ebook_reviews", reviewData);
  return { id: docRef.id, ...reviewData } as EbookReview;
}

export async function getUserReview(
  ebookId: string,
  userId: string
): Promise<EbookReview | null> {
  const results = await safeQueryDocs("ebook_reviews", "userId", userId);
  const review = results.find((r: any) => r.ebookId === ebookId && !r.deleted);
  return review ? (review as EbookReview) : null;
}

export async function listReviews(
  ebookId: string,
  limit = 20
): Promise<EbookReview[]> {
  const results = await safeQueryDocs("ebook_reviews", "ebookId", ebookId);
  return results
    .filter((r: any) => !r.deleted)
    .sort((a: any, b: any) => b.createdAt - a.createdAt)
    .slice(0, limit) as EbookReview[];
}

export async function getRatingAggregate(ebookId: string): Promise<RatingAggregate> {
  const reviews = await listReviews(ebookId, 1000);
  const total = reviews.length;

  if (total === 0) {
    return { average: 0, total: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } };
  }

  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    const key = String(r.rating);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
    distribution,
  };
}

export async function deleteReview(
  reviewId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> {
  const doc = await safeGetDoc("ebook_reviews", reviewId);
  if (!doc.exists) throw new Error("Review not found");
  const data = doc.data() as EbookReview;
  if (!isAdmin && data.userId !== userId) throw new Error("Access denied");
  await safeSetDoc("ebook_reviews", reviewId, { ...data, deleted: true, deletedAt: Date.now() });
}

export async function markHelpful(reviewId: string): Promise<void> {
  const doc = await safeGetDoc("ebook_reviews", reviewId);
  if (!doc.exists) throw new Error("Review not found");
  const data = doc.data() as EbookReview;
  await safeSetDoc("ebook_reviews", reviewId, { ...data, helpful: (data.helpful ?? 0) + 1 });
}
