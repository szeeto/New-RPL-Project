import { NextResponse } from "next/server";
import { deleteAdminSession, verifyRequestOrigin } from "@/lib/session";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  try {
    await deleteAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin logout error", error);
    return NextResponse.json({ error: "Sesi tidak dapat diakhiri. Silakan coba kembali." }, { status: 503 });
  }
}
