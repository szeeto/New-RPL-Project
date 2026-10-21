"use client";

import {
  ArrowLeft,
  BookOpenText,
  Code2,
  Images,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import "./admin.css";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/gallery", label: "Galeri", icon: Images },
  { href: "/admin/faq", label: "FAQ", icon: MessageCircleQuestion },
  { href: "/admin/articles", label: "Artikel", icon: BookOpenText },
];

export default function AdminShell({
  user,
  children,
}: {
  user: { email: string; username: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Logout gagal.");
      router.replace("/admin/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Logout gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin/dashboard" className="admin-brand">
            <span className="admin-brand-icon"><Code2 size={21} /></span>
            <span><strong>RPL CMS</strong><small>SMKN 1 BUKIT SUNDI</small></span>
          </Link>
          <div className="admin-nav-label">Workspace</div>
          <nav className="admin-nav" aria-label="Navigasi admin">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                href={href}
                key={href}
                className={pathname === href ? "active" : ""}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={17} /> {label}
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <div className="admin-user">
              <span className="admin-user-avatar">{user.username.slice(0, 1).toUpperCase()}</span>
              <span><strong>{user.username}</strong><small>{user.email}</small></span>
            </div>
            <div className="admin-sidebar-actions">
              <Link href="/" target="_blank"><ArrowLeft size={15} /> Lihat situs publik</Link>
              <button type="button" onClick={logout} disabled={loading}>
                <LogOut size={15} /> {loading ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </aside>
        <main className="admin-main">
          <div className="admin-mobile-head">
            <span><strong>{user.username}</strong><small>Administrator</small></span>
            <button type="button" onClick={logout} disabled={loading}><LogOut size={14} /> {loading ? "Keluar..." : "Keluar"}</button>
          </div>
          {error && <div className="admin-alert error" role="alert">{error}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
