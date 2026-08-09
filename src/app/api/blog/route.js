import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 12;
    const skip = (page - 1) * limit;

    if (slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug, published: true },
        include: { author: { select: { name: true, image: true } } },
      });
      if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
      return NextResponse.json({ post });
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where: { published: true } }),
    ]);

    return NextResponse.json({ posts, totalPages: Math.ceil(total / limit), page });
  } catch {
    return NextResponse.json({ posts: [], totalPages: 0 });
  }
}

export async function POST(req) {
  const user = await getAuthUserFromCookie(req);
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 });

  const { title, content, excerpt, coverImage, tags, category, published } = await req.json();
  if (!title || !content) return NextResponse.json({ error: "Título y contenido requeridos" }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

  const post = await prisma.blogPost.create({
    data: { title, slug, content, excerpt: excerpt || content.substring(0, 160).replace(/<[^>]*>/g, ""), coverImage: coverImage || null, tags: tags || [], category: category || "general", authorId: dbUser.id, published: published || false },
  });

  return NextResponse.json({ success: true, post });
}
