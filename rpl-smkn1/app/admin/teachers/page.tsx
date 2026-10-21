import { redirect } from "next/navigation";
import ContentManager from "../content-manager";
import AdminShell from "../shell";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return <AdminShell user={user}><ContentManager collection="teachers" /></AdminShell>;
}
