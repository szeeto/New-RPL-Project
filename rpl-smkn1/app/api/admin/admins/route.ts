import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

const createSchema = z.object({
  full_name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(12).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  role: z.enum(["admin", "superadmin"]),
});

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Akses khusus superadmin." }, { status: 403 });

    const url = new URL(request.url);
    const page = Math.max(1, Math.min(10000, Number(url.searchParams.get("page")) || 1));
    const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get("pageSize")) || 10));
    const search = (url.searchParams.get("search") || "").trim().slice(0, 120).replace(/[(),."\\]/g, " ");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    let query = getAdminSupabase()
      .from("admins")
      .select("id, full_name, email, username, role, enabled, created_at, updated_at", { count: "exact" });
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    if (role === "admin" || role === "superadmin") query = query.eq("role", role);
    if (status === "active") query = query.eq("enabled", true);
    if (status === "disabled") query = query.eq("enabled", false);
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return NextResponse.json({ items: data || [], total: count || 0, page, pageSize });
  } catch (error) {
    console.error("Admin account list error", error);
    return NextResponse.json({ error: "Daftar akun admin gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Akses khusus superadmin." }, { status: 403 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data akun tidak valid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { data, error } = await getAdminSupabase().from("admins").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email.toLowerCase(),
      username: parsed.data.username,
      password_hash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role,
      enabled: true,
    }).select("id, full_name, email, username, role, enabled, created_at, updated_at").single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Email atau username sudah digunakan." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Admin account create error", error);
    return NextResponse.json({ error: "Akun admin gagal dibuat." }, { status: 503 });
  }
}
