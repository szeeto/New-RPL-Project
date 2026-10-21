import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminSupabase, isAdminSupabaseConfigured } from "./supabase";

export const SESSION_COOKIE = "rpl_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 12;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_AGE_SECONDS * 1000).toISOString();
  const { error } = await getAdminSupabase().from("admin_sessions").insert({
    admin_id: adminId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });
  if (error) throw new Error(`Gagal membuat sesi admin: ${error.message}`);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export async function getAdminSession() {
  if (!isAdminSupabaseConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const { data, error } = await getAdminSupabase()
    .from("admin_sessions")
    .select("id, expires_at, admins!inner(id, email, username, enabled)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`Gagal memeriksa sesi admin: ${error.message}`);
  const admin = Array.isArray(data?.admins) ? data.admins[0] : data?.admins;
  if (!admin || !admin.enabled) return null;

  return {
    id: admin.id as string,
    email: admin.email as string,
    username: admin.username as string,
  };
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && token.length <= 100) {
    const { error } = await getAdminSupabase()
      .from("admin_sessions")
      .delete()
      .eq("token_hash", hashToken(token));
    if (error) throw new Error(`Gagal menghapus sesi admin: ${error.message}`);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function verifyRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
