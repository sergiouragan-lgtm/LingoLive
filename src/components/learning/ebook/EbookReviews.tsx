import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  rating: number;
  comment: string;
  cefrLevel?: string;
  helpful: number;
  createdAt: number;
}

interface RatingAggregate {
  average: number;
  total: number;
  distribution: Record<string, number>;
}

interface Props {
  ebookId: string;
  authorId?: string;
}

export default function EbookReviews({ ebookId, authorId }: Props) {
  const user = getAuth().currentUser;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<RatingAggregate | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  async function fetchReviews() {
    try {
      const token = await user?.getIdToken();
      const [listRes, mineRes] = await Promise.all([
        fetch(`/api/ebook/reviews/${ebookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/ebook/reviews/${ebookId}/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const listData = await listRes.json();
      const mineData = await mineRes.json();
      setReviews(listData.reviews ?? []);
      setAggregate(listData.aggregate ?? null);
      if (mineData.review) {
        setMyReview(mineData.review);
        setFormRating(mineData.review.rating);
        setFormComment(mineData.review.comment);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [ebookId]);

  async function submitReview() {
    if (!formRating || !formComment.trim()) return;
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/ebook/reviews/${ebookId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: formRating, comment: formComment }),
      });
      if (res.ok) {
        setSubmitMsg("Avaliação guardada com sucesso!");
        await fetchReviews();
      } else {
        setSubmitMsg("Erro ao guardar avaliação.");
      }
    } catch {
      setSubmitMsg("Erro de ligação.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markHelpful(reviewId: string) {
    try {
      const token = await user?.getIdToken();
      await fetch(`/api/ebook/reviews/${ebookId}/${reviewId}/helpful`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
      );
    } catch {
      /* silent */
    }
  }

  function renderStars(rating: number, interactive = false) {
    return (
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: interactive ? 28 : 16,
              cursor: interactive ? "pointer" : "default",
              color: star <= (interactive ? hoverRating || formRating : rating) ? "#f59e0b" : "#d1d5db",
              transition: "color 0.1s",
            }}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            onClick={interactive ? () => setFormRating(star) : undefined}
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>A carregar avaliações…</p>;
  }

  const isAuthor = authorId && user?.uid === authorId;


  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <style>{`
        .reviews-aggregate {
          display: flex;
          gap: 24px;
          align-items: center;
          padding: 20px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .reviews-avg-score {
          font-size: 48px;
          font-weight: 800;
          color: var(--text, #111827);
          line-height: 1;
        }
        .reviews-bars { flex: 1; }
        .reviews-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--muted, #6b7280);
          margin-bottom: 3px;
        }
        .reviews-bar-track {
          flex: 1;
          height: 8px;
          border-radius: 99px;
          background: var(--hover-bg, #f3f4f6);
          overflow: hidden;
        }
        .reviews-bar-fill {
          height: 100%;
          background: #f59e0b;
          border-radius: 99px;
          transition: width 0.4s;
        }
        .review-form {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .review-form h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px;
          color: var(--text, #111827);
        }
        .review-form textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--hover-bg, #f9fafb);
          color: var(--text, #111827);
          font-size: 14px;
          resize: vertical;
          min-height: 90px;
          box-sizing: border-box;
        }
        .review-submit-btn {
          margin-top: 12px;
          padding: 10px 24px;
          border-radius: 8px;
          background: var(--accent, #7c3aed);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .review-submit-btn:disabled { opacity: 0.5; cursor: default; }
        .review-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .review-author {
          font-weight: 600;
          font-size: 14px;
          color: var(--text, #111827);
        }
        .review-date {
          font-size: 12px;
          color: var(--muted, #6b7280);
        }
        .review-comment {
          font-size: 14px;
          color: var(--text, #374151);
          line-height: 1.6;
          margin: 8px 0;
        }
        .review-helpful-btn {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 99px;
          border: 1px solid var(--border, #e5e7eb);
          background: transparent;
          color: var(--muted, #6b7280);
          cursor: pointer;
        }
        .review-helpful-btn:hover { border-color: var(--accent, #7c3aed); color: var(--accent, #7c3aed); }
      `}</style>

      {/* Aggregate */}
      {aggregate && aggregate.total > 0 && (
        <div className="reviews-aggregate">
          <div style={{ textAlign: "center" }}>
            <div className="reviews-avg-score">{aggregate.average.toFixed(1)}</div>
            <div style={{ marginTop: 4 }}>{renderStars(Math.round(aggregate.average))}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {aggregate.total} {aggregate.total === 1 ? "avaliação" : "avaliações"}
            </div>
          </div>
          <div className="reviews-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = aggregate.distribution[String(star)] ?? 0;
              const pct = aggregate.total > 0 ? (count / aggregate.total) * 100 : 0;
              return (
                <div key={star} className="reviews-bar-row">
                  <span style={{ width: 12, textAlign: "right" }}>{star}</span>
                  <span>★</span>
                  <div className="reviews-bar-track">
                    <div className="reviews-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ width: 24, textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review form (not shown to author) */}
      {!isAuthor && (
        <div className="review-form">
          <h3>{myReview ? "A sua avaliação" : "Avaliar este e-book"}</h3>
          <div style={{ marginBottom: 14 }}>
            {renderStars(formRating, true)}
            {formRating > 0 && (
              <span style={{ marginLeft: 8, fontSize: 13, color: "var(--muted)" }}>
                {["", "Muito mau", "Mau", "Razoável", "Bom", "Excelente"][formRating]}
              </span>
            )}
          </div>
          <textarea
            placeholder="Partilhe a sua experiência com este e-book (mínimo 10 caracteres)…"
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            maxLength={2000}
          />
          {submitMsg && (
            <p style={{ fontSize: 13, color: submitMsg.includes("sucesso") ? "#22c55e" : "#ef4444", margin: "8px 0 0" }}>
              {submitMsg}
            </p>
          )}
          <button
            className="review-submit-btn"
            onClick={submitReview}
            disabled={submitting || !formRating || formComment.trim().length < 10}
          >
            {submitting ? "A guardar…" : myReview ? "Actualizar avaliação" : "Publicar avaliação"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
          Ainda não há avaliações. Seja o primeiro!
        </p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-card-header">
              <div>
                <div className="review-author">{review.userDisplayName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  {renderStars(review.rating)}
                  {review.cefrLevel && (
                    <span style={{ fontSize: 11, background: "#e9d5ff", color: "#7c3aed", padding: "1px 6px", borderRadius: 99 }}>
                      {review.cefrLevel}
                    </span>
                  )}
                </div>
              </div>
              <div className="review-date">
                {new Date(review.createdAt).toLocaleDateString("pt-PT")}
              </div>
            </div>
            <p className="review-comment">{review.comment}</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="review-helpful-btn" onClick={() => markHelpful(review.id)}>
                👍 Útil ({review.helpful})
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
