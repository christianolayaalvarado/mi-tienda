"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "tips", label: "Consejos" },
  { value: "guides", label: "Guías" },
  { value: "news", label: "Novedades" },
];

export default function BlogEditor({ existingPosts = [] }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [posts, setPosts] = useState(existingPosts);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("Título y contenido son requeridos", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || null,
          coverImage: coverImage.trim() || null,
          category,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          published,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Artículo creado exitosamente");
        setPosts(prev => [data.post, ...prev]);
        setTitle("");
        setContent("");
        setExcerpt("");
        setCoverImage("");
        setCategory("general");
        setTags("");
        setPublished(false);
      } else {
        showToast(data.error || "Error al guardar", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(post) {
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          category: post.category,
          tags: post.tags,
          published: !post.published,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
        showToast(post.published ? "Despublicado" : "Publicado");
      }
    } catch {
      showToast("Error al actualizar", "error");
    }
  }

  async function deletePost(post) {
    if (!confirm("¿Eliminar este artículo?")) return;
    try {
      const res = await fetch(`/api/blog?slug=${post.slug}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== post.id));
        showToast("Artículo eliminado");
      }
    } catch {
      showToast("Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Nuevo artículo</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Título del artículo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido * (HTML permitido)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono"
            placeholder="<p>Escribe el contenido aquí...</p>"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Resumen breve del artículo"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL imagen de portada</label>
            <input
              type="url"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas (separadas por coma)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="moda, consejos, tendencias"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`relative w-11 h-6 rounded-full transition ${published ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition ${published ? "translate-x-5" : ""}`} />
          </button>
          <span className="text-sm text-gray-700">{published ? "Publicado" : "Borrador"}</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Crear artículo"}
        </button>
      </form>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Artículos ({posts.length})</h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">No hay artículos aún</p>
        ) : (
          <div className="divide-y">
            {posts.map(post => (
              <div key={post.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {post.published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{post.category} • {new Date(post.createdAt).toLocaleDateString("es-PE")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublished(post)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {post.published ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    onClick={() => deletePost(post)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
