"use client";

import { useEffect, useState } from "react";

function StarDisplay({ rating }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, ratingDistribution: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, 5, 4, 3, 2, 1

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews/seller");
      const data = await res.json().catch(() => null);
      if (data) {
        setReviews(data.reviews || []);
        setStats(data.stats || { total: 0, avgRating: 0, ratingDistribution: {} });
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = filter === "all"
    ? reviews
    : reviews.filter((r) => r.rating === Number(filter));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reseñas de mis productos</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-4xl font-bold text-gray-900">{stats.avgRating || 0}</p>
          <StarDisplay rating={Math.round(stats.avgRating || 0)} />
          <p className="text-sm text-gray-500 mt-1">Promedio</p>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-4xl font-bold text-gray-900">{stats.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total de reseñas</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Distribución</p>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution?.[star] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs mb-1">
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

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Todas" },
          { value: "5", label: "5 ★" },
          { value: "4", label: "4 ★" },
          { value: "3", label: "3 ★" },
          { value: "2", label: "2 ★" },
          { value: "1", label: "1 ★" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.value
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de reseñas */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p>No hay reseñas{filter !== "all" ? ` con ${filter} estrella${filter !== "1" ? "s" : ""}` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-semibold text-sm">
                    {(review.user?.name || "A").charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{review.user?.name || "Anónimo"}</p>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Producto */}
                  <div className="mt-2 flex items-center gap-2">
                    {review.product?.images?.[0] && (
                      <img
                        src={review.product.images[0]}
                        alt={review.product.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="text-sm text-gray-600">{review.product?.title || "Producto"}</span>
                  </div>

                  {/* Comentario */}
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
