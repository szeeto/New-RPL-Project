import { NextResponse } from "next/server";
import { z } from "zod";
import { collectionSchemas } from "@/lib/cms-schemas";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";
import type { CmsCollection } from "@/lib/cms-types";

const tables: CmsCollection[] = ["gallery", "faq", "articles"];
const idSchema = z.string().uuid();

export async function PUT(
  request: Request,
  context: { params: Promise<{ collection: string; id: string }> },
) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const { collection, id } = await context.params;
    if (!tables.includes(collection as CmsCollection) || !idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    const parsed = collectionSchemas[collection as CmsCollection].safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: "Periksa kembali isian formulir.",
        fields: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const { data, error } = await getAdminSupabase()
      .from(collection)
      .update(parsed.data)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Slug tersebut sudah digunakan." }, { status: 409 });
      throw error;
    }
    if (!data) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("CMS update error", error);
    return NextResponse.json({ error: "Konten tidak dapat diperbarui." }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ collection: string; id: string }> },
) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const { collection, id } = await context.params;
    if (!tables.includes(collection as CmsCollection) || !idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    }
    const { data, error } = await getAdminSupabase()
      .from(collection)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CMS delete error", error);
    return NextResponse.json({ error: "Konten tidak dapat dihapus." }, { status: 503 });
  }
}
