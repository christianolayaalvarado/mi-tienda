"use client";

import { useEffect, useState } from "react";

function StarDisplay({ rating }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        const data = await res.json().catch(() => null);
        if (data) {
          setReviews(data.reviews || []);
          setAvgRating(data.avgRating || 0);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Reseñas</h2>
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Reseñas</h2>

      {total > 0 && (
        <div className="flex items-center gap-4 mb-6 bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
            <StarDisplay rating={Math.round(avgRating)} />
            <p className="text-xs text-gray-500 mt-1">{total} reseña{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-500">{star}</span>
                  <span className="text-yellow-500">★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-gray-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">Aún no hay reseñas para este producto.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-sm">
                    {(review.user?.name || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{review.user?.name || "Anónimo"}</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 ml-11">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
