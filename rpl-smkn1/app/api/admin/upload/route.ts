import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET = "rpl-cms";

function detectImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
    ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))
  ) return "image/avif";
  return null;
}

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE + 64 * 1024) {
      return NextResponse.json({ error: "Ukuran unggahan maksimal 5 MB." }, { status: 413 });
    }
    const form = await request.formData();
    const file = form.get("file");
    const folder = form.get("folder");
    if (!(file instanceof File) || !(folder === "gallery" || folder === "articles")) {
      return NextResponse.json({ error: "Pilih file gambar yang valid." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran gambar harus lebih dari 0 dan maksimal 5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectImage(bytes);
    if (!contentType || file.type !== contentType) {
      return NextResponse.json({ error: "Format gambar tidak valid. Gunakan JPEG, PNG, WebP, atau AVIF." }, { status: 400 });
    }
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
    const path = `${folder}/${randomUUID()}.${extension}`;
    const { error } = await getAdminSupabase().storage.from(BUCKET).upload(path, bytes, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;
    const { data } = getAdminSupabase().storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path, contentType }, { status: 201 });
  } catch (error) {
    console.error("CMS image upload error", error);
    return NextResponse.json({ error: "Gambar gagal diunggah. Periksa konfigurasi Supabase Storage." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    const path = new URL(request.url).searchParams.get("path") || "";
    if (!/^(gallery|articles)\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(path)) {
      return NextResponse.json({ error: "Path gambar tidak valid." }, { status: 400 });
    }
    const { error } = await getAdminSupabase().storage.from(BUCKET).remove([path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CMS image removal error", error);
    return NextResponse.json({ error: "Gambar gagal dihapus dari penyimpanan." }, { status: 503 });
  }
}
