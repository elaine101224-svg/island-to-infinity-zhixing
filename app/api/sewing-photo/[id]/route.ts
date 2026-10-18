import { NextResponse } from "next/server";
import { db, check } from "@/lib/sewing/server";
import { z } from "zod";
export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const id = z
      .string()
      .uuid()
      .parse((await ctx.params).id);
    const f = check(
      await db()
        .from("sewing_files")
        .select("*")
        .eq("id", id)
        .eq("purpose", "public")
        .maybeSingle(),
    );
    if (!f) return new NextResponse(null, { status: 404 });
    const blob = check(
      await db().storage.from("sewing-private").download(f.path),
    );
    return new NextResponse(blob, {
      headers: {
        "Content-Type": f.mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
