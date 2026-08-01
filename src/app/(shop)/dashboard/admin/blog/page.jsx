import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import BlogEditor from "@/components/BlogEditor";

export default async function AdminBlogPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "admin") redirect("/dashboard");

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog Admin</h1>
      <BlogEditor existingPosts={posts} />
    </div>
  );
}
