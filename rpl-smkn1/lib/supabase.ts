import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;
let publicClient: SupabaseClient | undefined;

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL;
  if (!value) throw new Error("SUPABASE_URL belum dikonfigurasi.");
  return value;
}

export function getAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
  adminClient ??= createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export function getPublicSupabase() {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY belum dikonfigurasi.");
  publicClient ??= createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return publicClient;
}

export function isPublicSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function isAdminSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
