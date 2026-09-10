import crypto from "crypto";
import { getStripeClient } from "../../config/stripe";
import { appBaseUrl, ENABLE_SANDBOX_FALLBACK } from "../../config/env";
import { safeAddDoc, safeSetDoc, safeGetDoc, safeQueryDocs } from "../firestoreSafe.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EbookListing {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  language: string;
  cefrLevel: string;
  coverColor?: string;
  priceUsd: number;
  authorId: string;
  authorName?: string;
  status: string;
  chapterCount: number;
  totalWords: number;
  createdAt?: number;
}

export interface SaleRecord {
  ebookId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  purchaseId: string;
  amountUsd: number;
  currency: string;
  licenseKey: string;
  stripeSessionId?: string;
  paidAt: number;
}

export interface AuthorStats {
  totalRevenue: number;
  totalSales: number;
  uniqueBuyers: number;
  ebookStats: Array<{
    ebookId: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  recentSales: SaleRecord[];
}

// ─── License key helpers ──────────────────────────────────────────────────────

export function generateLicenseKey(ebookId: string, buyerEmail: string): string {
  const seed = `${ebookId}:${buyerEmail}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  // Format: LINGO-XXXX-XXXX-XXXX-XXXX (24 hex chars in 4 groups)
  return `LINGO-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}-${hash.slice(8, 12).toUpperCase()}-${hash.slice(12, 16).toUpperCase()}`;
}

// ─── Stripe checkout ──────────────────────────────────────────────────────────

export async function createEbookCheckoutSession(
  ebookId: string,
  ebookTitle: string,
  priceUsd: number,
  buyerId: string,
  buyerEmail: string,
  buyerName: string
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    if (!ENABLE_SANDBOX_FALLBACK) {
      throw new Error("Stripe checkout is unavailable: payment sandbox fallback is disabled");
    }

    // Explicit sandbox-only fallback. ENABLE_SANDBOX_FALLBACK is always false
    // in production, even when the environment variable is accidentally set.
    const fakeSessionId = `cs_sandbox_${crypto.randomUUID()}`;
    const licenseKey = generateLicenseKey(ebookId, buyerEmail);
    await recordSale({
      ebookId,
      buyerId,
      buyerEmail,
      buyerName,
      purchaseId: fakeSessionId,
      amountUsd: priceUsd,
      currency: "usd",
      licenseKey,
      stripeSessionId: fakeSessionId,
      paidAt: Date.now(),
    });
    return {
      sessionId: fakeSessionId,
      url: `${appBaseUrl}/ebook/library?purchase=success&session=${fakeSessionId}`,
    };
  }

  const licenseKey = generateLicenseKey(ebookId, buyerEmail);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    client_reference_id: buyerId,
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: ebookTitle,
            description: `E-book digital — acesso vitalício com chave de licença`,
          },
          unit_amount: Math.round(priceUsd * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appBaseUrl}/ebook/library?purchase=success&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/ebook/marketplace`,
    metadata: {
      ebookId,
      buyerId,
      buyerEmail,
      buyerName,
      licenseKey,
    },
  });

  return { url: session.url!, sessionId: session.id };
}

export async function fulfillEbookPurchase(stripeSessionId: string): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) return;

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  if (session.payment_status !== "paid") return;

  const { ebookId, buyerId, buyerEmail, buyerName, licenseKey } = session.metadata ?? {};
  if (!ebookId || !buyerId) return;

  const amountUsd = (session.amount_total ?? 0) / 100;

  await recordSale({
    ebookId,
    buyerId,
    buyerEmail: buyerEmail ?? session.customer_email ?? "",
    buyerName: buyerName ?? "",
    purchaseId: stripeSessionId,
    amountUsd,
    currency: session.currency ?? "usd",
    licenseKey: licenseKey ?? generateLicenseKey(ebookId, buyerEmail ?? ""),
    stripeSessionId,
    paidAt: Date.now(),
  });
}

// ─── Sales records ────────────────────────────────────────────────────────────

export async function recordSale(sale: SaleRecord): Promise<void> {
  const docId = sale.purchaseId;
  await safeSetDoc("ebook_sales", docId, {
    ...sale,
    createdAt: Date.now(),
  });

  // Update enrollment so the buyer gets reader access
  const enrollmentId = `${sale.buyerId}_${sale.ebookId}`;
  await safeSetDoc("ebook_enrollments", enrollmentId, {
    ebookId: sale.ebookId,
    studentId: sale.buyerId,
    studentEmail: sale.buyerEmail,
    licenseKey: sale.licenseKey,
    purchaseId: sale.purchaseId,
    enrolledAt: Date.now(),
    progress: {},
    currentCefrLevel: null,
  });
}

export async function validateLicenseKey(
  key: string,
  buyerEmail: string
): Promise<{ valid: boolean; ebookId?: string; enrollmentId?: string }> {
  const sales = await safeQueryDocs("ebook_sales", "licenseKey", key);
  if (!sales.length) return { valid: false };

  const sale = sales[0] as SaleRecord & { id?: string };
  if (sale.buyerEmail !== buyerEmail) return { valid: false };

  return {
    valid: true,
    ebookId: sale.ebookId,
    enrollmentId: `${sale.buyerId}_${sale.ebookId}`,
  };
}

export async function getStudentLibrary(studentId: string): Promise<any[]> {
  const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);
  return enrollments;
}

// ─── Author analytics ─────────────────────────────────────────────────────────

export async function getAuthorStats(authorId: string): Promise<AuthorStats> {
  const ebooks = await safeQueryDocs("ebooks", "authorId", authorId);
  const ebookIds = ebooks.map((e: any) => e.id).filter(Boolean);

  if (ebookIds.length === 0) {
    return { totalRevenue: 0, totalSales: 0, uniqueBuyers: 0, ebookStats: [], recentSales: [] };
  }

  // Collect all sales for author's ebooks
  const allSales: any[] = [];
  for (const ebookId of ebookIds) {
    const sales = await safeQueryDocs("ebook_sales", "ebookId", ebookId);
    allSales.push(...sales);
  }

  const totalRevenue = allSales.reduce((s: number, sale: any) => s + (sale.amountUsd ?? 0), 0);
  const uniqueBuyers = new Set(allSales.map((s: any) => s.buyerId)).size;

  const ebookStatsMap = new Map<string, { title: string; sales: number; revenue: number }>();
  for (const ebook of ebooks as any[]) {
    ebookStatsMap.set(ebook.id, { title: ebook.title ?? "", sales: 0, revenue: 0 });
  }
  for (const sale of allSales as any[]) {
    const entry = ebookStatsMap.get(sale.ebookId);
    if (entry) {
      entry.sales += 1;
      entry.revenue += sale.amountUsd ?? 0;
    }
  }

  const recentSales = [...allSales]
    .sort((a: any, b: any) => (b.paidAt ?? 0) - (a.paidAt ?? 0))
    .slice(0, 10);

  return {
    totalRevenue,
    totalSales: allSales.length,
    uniqueBuyers,
    ebookStats: Array.from(ebookStatsMap.entries()).map(([ebookId, s]) => ({ ebookId, ...s })),
    recentSales,
  };
}

export async function getPublishedEbooks(): Promise<EbookListing[]> {
  const ebooks = await safeQueryDocs("ebooks", "status", "published");
  return (ebooks as any[])
    .filter((e: any) => !e.deleted)
    .map((e: any) => ({
      id: e.id,
      title: e.title,
      subtitle: e.subtitle,
      description: e.description,
      language: e.language,
      cefrLevel: e.cefrLevel,
      coverColor: e.coverColor,
      priceUsd: e.priceUsd ?? 9.99,
      authorId: e.authorId,
      authorName: e.authorName ?? "Autor LingoLive",
      status: e.status,
      chapterCount: (e.chapters ?? []).length,
      totalWords: (e.chapters ?? []).reduce((s: number, c: any) => s + (c.wordCount ?? 0), 0),
      createdAt: e.createdAt,
    }));
}
