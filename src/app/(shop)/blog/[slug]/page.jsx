import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE_URL = "https://mi-tienda-app-theta.vercel.app";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } });
    if (!post) return { title: "Artículo no encontrado" };
    return {
      title: post.title,
      description: post.excerpt || post.title,
      alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    };
  } catch { return { title: "Blog" }; }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { name: true, image: true } } },
  });
  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto px-3 sm:px-6 py-8">
      <Breadcrumbs extraItems={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium uppercase">{post.category}</span>
      <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
        <span>{post.author?.name || "Admin"}</span>
        <span>•</span>
        <span>{new Date(post.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}</span>
        <span>•</span>
        <span>{post.views} vistas</span>
      </div>
      <div className="prose prose-green max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {post.tags.map(tag => <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{tag}</span>)}
        </div>
      )}
      <div className="mt-8 pt-6 border-t">
        <Link href="/blog" className="text-green-600 hover:underline font-medium">← Volver al blog</Link>
      </div>
    </article>
  );
}
