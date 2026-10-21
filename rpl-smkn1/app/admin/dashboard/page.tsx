import { BookOpenText, Images, MessageCircleQuestion, Plus, ArrowUpRight, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "../shell";
import { getAdminSession } from "@/lib/session";
import { getAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");

  const db = getAdminSupabase();
  const [gallery, faq, articles, teachers] = await Promise.all([
    db.from("gallery").select("id", { count: "exact", head: true }),
    db.from("faq").select("id", { count: "exact", head: true }),
    db.from("articles").select("id", { count: "exact", head: true }),
    db.from("teachers").select("id", { count: "exact", head: true }),
  ]);
  const queryError = gallery.error || faq.error || articles.error;
  if (queryError) console.error("Admin dashboard count query error", queryError);
  const stats = [
    { label: "Galeri", count: gallery.count || 0, description: "foto tersimpan", href: "/admin/gallery", icon: Images },
    { label: "FAQ", count: faq.count || 0, description: "pertanyaan", href: "/admin/faq", icon: MessageCircleQuestion },
    { label: "Artikel", count: articles.count || 0, description: "cerita tersimpan", href: "/admin/articles", icon: BookOpenText },
    ...(!teachers.error
      ? [{ label: "Guru", count: teachers.count || 0, description: "profil pengajar", href: "/admin/teachers", icon: UserRound }]
      : []),
  ];

  return (
    <AdminShell user={user}>
      <div className="admin-page">
        <div className="admin-topline"><span>RPL CMS / Workspace</span><span>Panel pengelolaan konten</span></div>
        <header>
          <span className="admin-eyebrow">RINGKASAN KONTEN</span>
          <h1 className="admin-title">Selamat datang, {user.username}.</h1>
          <p className="admin-subtitle">Kelola konten situs Rekayasa Perangkat Lunak SMK Negeri 1 Bukit Sundi.</p>
        </header>
        {queryError
          ? <div className="admin-alert error" role="alert">Ringkasan gagal dimuat dari database. Periksa migrasi dan konfigurasi Supabase.</div>
          : <div className="admin-stats">
            {stats.map(({ label, count, description, icon: Icon }) => (
              <article className="admin-panel admin-stat" key={label}>
                <div className="admin-stat-top"><span>{label}</span><Icon size={18} /></div>
                <strong className="admin-stat-value">{count}</strong>
                <span className="admin-stat-label">{description}</span>
              </article>
            ))}
          </div>}
        {teachers.error && <div className="admin-alert error" role="alert">Manajemen guru belum siap. Jalankan migrasi `0003_teachers.sql` di Supabase.</div>}
        <div className="admin-nav-label" style={{ paddingLeft: 0, marginTop: 27 }}>Akses cepat</div>
        <div className="admin-shortcuts">
          {stats.map(({ label, description, href, icon: Icon }) => (
            <Link className="admin-panel admin-shortcut" href={href} key={href}>
              <span className="admin-shortcut-icon"><Icon size={18} /></span>
              <span><strong>Kelola {label}</strong><small>Atur {description} di situs</small></span>
              <ArrowUpRight size={15} style={{ marginLeft: "auto", color: "#78928a" }} />
            </Link>
          ))}
        </div>
        <p className="admin-note">Perubahan pada konten yang berstatus <strong>Terbit</strong> akan tampil di situs publik. Konten berstatus <strong>Draft</strong> hanya terlihat di dashboard.</p>
        <Link href="/admin/gallery" className="admin-primary" style={{ marginTop: 17 }}><Plus size={14} /> Tambah konten pertama</Link>
      </div>
    </AdminShell>
  );
}
