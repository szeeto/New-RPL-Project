import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CMS_ADMIN_EMAIL, CMS_ADMIN_USERNAME, CMS_ADMIN_PASSWORD } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}
if (!CMS_ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CMS_ADMIN_EMAIL)) {
  throw new Error("CMS_ADMIN_EMAIL must be a valid email address.");
}
if (!CMS_ADMIN_USERNAME || !/^[a-zA-Z0-9._-]{3,40}$/.test(CMS_ADMIN_USERNAME)) {
  throw new Error("CMS_ADMIN_USERNAME must be 3-40 letters, numbers, dot, dash or underscore.");
}
if (!CMS_ADMIN_PASSWORD || CMS_ADMIN_PASSWORD.length < 12 || Buffer.byteLength(CMS_ADMIN_PASSWORD, "utf8") > 72) {
  throw new Error("CMS_ADMIN_PASSWORD must contain 12-72 characters.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const password_hash = await bcrypt.hash(CMS_ADMIN_PASSWORD, 12);
const { error } = await supabase.from("admins").upsert(
  {
    email: CMS_ADMIN_EMAIL.toLowerCase(),
    username: CMS_ADMIN_USERNAME,
    password_hash,
    enabled: true,
  },
  { onConflict: "email" },
);
if (error) throw new Error(`Admin bootstrap failed: ${error.message}`);
console.info(`Admin account ready: ${CMS_ADMIN_EMAIL.toLowerCase()}`);
