"use client";

import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (identity.trim().length < 3 || !password) {
      setError("Masukkan username/email dan password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: identity.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login gagal.");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <section className="admin-login-story">
        <Link href="/" className="admin-login-logo">
          <span className="admin-brand-icon"><Image src="/logo.png" alt="" width={54} height={54} priority /></span>
          <span><strong>RPL CMS</strong><small>CONTENT MANAGEMENT SYSTEM</small></span>
        </Link>
        <div className="admin-login-copy">
          <span className="admin-eyebrow">PANEL ADMIN · SMKN 1 BUKIT SUNDI</span>
          <h1>Ruang untuk<br /><em>mengelola cerita.</em></h1>
          <p>Kelola galeri, pertanyaan, dan artikel program Rekayasa Perangkat Lunak dalam satu tempat.</p>
        </div>
        <span className="admin-login-story-foot">Akses khusus pengelola konten · RPL / 01</span>
      </section>
      <section className="admin-login-form-side">
        <div className="admin-login-card">
          <span className="admin-eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Masuk ke dashboard</h2>
          <p>Gunakan akun admin yang telah disiapkan.</p>
          {error && <div className="admin-alert error" role="alert">{error}</div>}
          <form
            className="admin-login-fields"
            method="post"
            action="/api/admin/login"
            onSubmit={submit}
          >
            <div className="admin-field">
              <label htmlFor="admin-identity">Email atau username</label>
              <input
                className="admin-input"
                id="admin-identity"
                name="identity"
                autoComplete="username"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                maxLength={254}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <div className="admin-password-wrap">
                <input
                  className="admin-input"
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  maxLength={72}
                  required
                />
                <button
                  className="admin-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button className="admin-primary admin-login-submit" type="submit" disabled={loading}>
              {loading ? <><LoaderCircle size={16} className="admin-spin" /> Memeriksa akun...</> : <><LockKeyhole size={15} /> Masuk dengan aman</>}
            </button>
          </form>
          <Link href="/" className="admin-login-back"><ArrowLeft size={13} /> Kembali ke halaman utama</Link>
        </div>
      </section>
      <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }.admin-spin { animation: admin-spin .8s linear infinite; }`}</style>
    </div>
  );
}
