import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import { utapi } from "uploadthing/server";

export async function POST(req) {
  const user = await getAuthUserFromCookie();
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No hay archivos" }, { status: 400 });
    }

    const results = await utapi.uploadFiles(files);

    const urls = [];
    for (const result of results) {
      if (result.data?.url) {
        urls.push(result.data.url);
      }
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Error subiendo archivos" }, { status: 500 });
  }
}
