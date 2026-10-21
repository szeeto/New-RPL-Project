import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyRequestOrigin } from "@/lib/session";
import { getAdminSupabase, isAdminSupabaseConfigured } from "@/lib/supabase";

const loginSchema = z.object({
  identity: z.string().trim().min(3).max(254),
  password: z.string().min(1).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});
const dummyHash = bcrypt.hashSync("not-a-real-admin-password", 12);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Masukkan username/email dan password yang valid." }, { status: 400 });
  }
  if (!isAdminSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Layanan login belum dikonfigurasi. Hubungkan Supabase terlebih dahulu." },
      { status: 503 },
    );
  }

  const identity = parsed.data.identity.toLowerCase();
  const ip = request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const attemptKey = { email_hash: digest(identity), ip_hash: digest(ip) };

  try {
    const key = getAdminSupabase();
    const { data: attempt, error: attemptError } = await key
      .from("admin_login_attempts")
      .select("failures, locked_until")
      .match(attemptKey)
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
        { status: 429 },
      );
    }

    const query = key.from("admins").select("id, email, username, password_hash, enabled");
    const { data: admin, error } = EMAIL_PATTERN.test(identity)
      ? await query.eq("email", identity).maybeSingle()
      : await query.eq("username", parsed.data.identity).maybeSingle();
    if (error) throw error;

    const passwordMatches = await bcrypt.compare(parsed.data.password, admin?.password_hash || dummyHash);
    if (!admin || !admin.enabled || !passwordMatches) {
      const failures = (attempt?.failures || 0) + 1;
      const lockedUntil = failures >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
      const { error: saveError } = await key.from("admin_login_attempts").upsert({
        ...attemptKey,
        failures,
        locked_until: lockedUntil,
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      return NextResponse.json({ error: "Username/email atau password salah." }, { status: 401 });
    }

    const { error: clearError } = await key.from("admin_login_attempts").delete().match(attemptKey);
    if (clearError) throw clearError;
    await createAdminSession(admin.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin login service error", error);
    return NextResponse.json({ error: "Layanan login sedang bermasalah. Silakan coba kembali." }, { status: 503 });
  }
}
