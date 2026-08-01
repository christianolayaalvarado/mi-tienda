"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Blog</h1>
      <p className="text-gray-500 text-sm mb-6">Guías, consejos y novedades de Mi Tienda</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-xl border h-64" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p>Próximamente publicaremos artículos útiles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition group">
                {post.coverImage && <div className="h-40 overflow-hidden"><img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition" /></div>}
                <div className="p-4">
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium uppercase">{post.category}</span>
                  <h2 className="font-semibold text-gray-900 mt-2 line-clamp-2 group-hover:text-green-600 transition">{post.title}</h2>
                  {post.excerpt && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <span>{post.author?.name || "Admin"}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString("es-PE")}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
