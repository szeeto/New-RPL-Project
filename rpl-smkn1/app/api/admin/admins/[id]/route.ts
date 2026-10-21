import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

const idSchema = z.string().uuid();
const updateSchema = z.object({
  full_name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  role: z.enum(["admin", "superadmin"]),
  enabled: z.boolean(),
}).strict();
const safeColumns = "id, full_name, email, username, role, enabled, created_at, updated_at";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Akses khusus superadmin." }, { status: 403 });
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Akun admin tidak ditemukan." }, { status: 404 });
    const { data, error } = await getAdminSupabase().from("admins").select(safeColumns).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Akun admin tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Admin account detail error", error);
    return NextResponse.json({ error: "Detail akun admin gagal dimuat." }, { status: 503 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Akses khusus superadmin." }, { status: 403 });
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Akun admin tidak ditemukan." }, { status: 404 });
    if (id === session.id) return NextResponse.json({ error: "Akun sendiri tidak dapat diubah dari menu ini." }, { status: 403 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data akun tidak valid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { error } = await getAdminSupabase().rpc("update_admin_account", {
      p_admin_id: id,
      p_full_name: parsed.data.full_name,
      p_email: parsed.data.email.toLowerCase(),
      p_username: parsed.data.username,
      p_role: parsed.data.role,
      p_enabled: parsed.data.enabled,
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Email atau username sudah digunakan." }, { status: 409 });
      if (error.message.includes("At least one active superadmin")) {
        return NextResponse.json({ error: "Superadmin aktif terakhir tidak dapat dinonaktifkan atau diturunkan rolenya." }, { status: 409 });
      }
      if (error.message.includes("Admin account not found")) return NextResponse.json({ error: "Akun admin tidak ditemukan." }, { status: 404 });
      throw error;
    }
    const { data, error: readError } = await getAdminSupabase().from("admins").select(safeColumns).eq("id", id).single();
    if (readError) throw readError;
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Admin account update error", error);
    return NextResponse.json({ error: "Akun admin gagal diperbarui." }, { status: 503 });
  }
}
