import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

const reorderSchema = z.object({
  itemId: z.string().uuid(),
  neighborId: z.string().uuid(),
}).strict();

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data urutan FAQ tidak valid." }, { status: 400 });
    }

    const { error } = await getAdminSupabase().rpc("reorder_faq", {
      p_item_id: parsed.data.itemId,
      p_neighbor_id: parsed.data.neighborId,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("FAQ reorder error", error);
    return NextResponse.json({ error: "Urutan FAQ gagal disimpan." }, { status: 503 });
  }
}
