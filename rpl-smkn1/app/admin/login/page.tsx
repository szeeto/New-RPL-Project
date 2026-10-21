import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin/dashboard");
  return <LoginForm />;
}
