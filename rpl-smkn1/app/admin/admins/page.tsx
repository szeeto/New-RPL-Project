import { redirect } from "next/navigation";
import AdminShell from "../shell";
import AdminManager from "./admin-manager";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  if (user.role !== "superadmin") redirect("/admin/dashboard");
  return <AdminShell user={user}><AdminManager currentAdminId={user.id} /></AdminShell>;
}
