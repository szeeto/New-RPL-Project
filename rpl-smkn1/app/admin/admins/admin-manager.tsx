"use client";

import { Eye, LoaderCircle, Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type AdminAccount = {
  id: string;
  full_name: string;
  email: string;
  username: string;
  role: "admin" | "superadmin";
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type AccountForm = {
  full_name: string;
  email: string;
  username: string;
  password: string;
  role: "admin" | "superadmin";
  enabled: boolean;
};

const PAGE_SIZE = 10;
const emptyForm: AccountForm = {
  full_name: "",
  email: "",
  username: "",
  password: "",
  role: "admin",
  enabled: true,
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export default function AdminManager({ currentAdminId }: { currentAdminId: string }) {
  const [items, setItems] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [formAccount, setFormAccount] = useState<AdminAccount | null | "new">(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      search,
      role,
      status,
    });
    try {
      const response = await fetch(`/api/admin/admins?${params}`, { cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Daftar akun gagal dimuat.");
      setItems(result.items);
      setTotal(result.total);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Daftar akun gagal dimuat.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function beginCreate() {
    setFormAccount("new");
    setForm(emptyForm);
    setFormError("");
  }

  async function showDetails(account: AdminAccount) {
    try {
      const response = await fetch(`/api/admin/admins/${account.id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Detail akun gagal dimuat.");
      setSelected(result.item);
    } catch (reason) {
      setNotice({ text: reason instanceof Error ? reason.message : "Detail akun gagal dimuat.", error: true });
    }
  }

  function beginEdit(account: AdminAccount) {
    setFormAccount(account);
    setForm({
      full_name: account.full_name,
      email: account.email,
      username: account.username,
      password: "",
      role: account.role,
      enabled: account.enabled,
    });
    setFormError("");
    setSelected(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = formAccount;
    if (!target) return;
    if (target !== "new" && target.enabled && !form.enabled
      && !window.confirm(`Nonaktifkan akun ${target.full_name || target.email}? Pengguna tersebut akan kehilangan akses.`)) {
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const creating = target === "new";
      const payload = creating ? form : {
        full_name: form.full_name,
        email: form.email,
        username: form.username,
        role: form.role,
        enabled: form.enabled,
      };
      const response = await fetch(
        creating ? "/api/admin/admins" : `/api/admin/admins/${target.id}`,
        {
          method: creating ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        const fieldLabels: Record<string, string> = {
          full_name: "Nama lengkap",
          email: "Email",
          username: "Username",
          password: "Password",
          role: "Role",
        };
        const fieldErrors = result.fields
          ? Object.entries(result.fields as Record<string, string[]>)
            .map(([field, messages]) => `${fieldLabels[field] || field}: ${messages.join(", ")}`)
            .join("; ")
          : "";
        throw new Error(fieldErrors ? `${result.error} ${fieldErrors}` : result.error || "Akun admin gagal disimpan.");
      }
      setFormAccount(null);
      setNotice({ text: creating ? "Akun admin berhasil dibuat." : "Akun admin berhasil diperbarui.", error: false });
      setPage(1);
      await load();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Akun admin gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-page">
      <div className="admin-topline"><span>RPL CMS / Keamanan</span><span>Kelola akses administrator</span></div>
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">AKSES & PENGGUNA</span>
          <h1 className="admin-title">Manajemen Admin</h1>
          <p className="admin-subtitle">Lihat akun administrator dan atur akses secara aman.</p>
        </div>
        <button className="admin-primary" type="button" onClick={beginCreate}><Plus size={15} /> Tambah admin</button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      <div className="admin-panel admin-toolbar">
        <label className="admin-search">
          <Search size={15} aria-hidden="true" />
          <input className="admin-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama, email, atau username..." aria-label="Cari akun admin" />
        </label>
        <select className="admin-select" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} aria-label="Filter role">
          <option value="">Semua role</option><option value="superadmin">Superadmin</option><option value="admin">Admin</option>
        </select>
        <select className="admin-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter status akun">
          <option value="">Semua status</option><option value="active">Aktif</option><option value="disabled">Nonaktif</option>
        </select>
      </div>

      <section className="admin-panel">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="admin-spin" size={20} /><strong>Memuat akun</strong><p>Mengambil data admin dari database.</p></div>
        ) : error ? null : items.length === 0 ? (
          <div className="admin-empty"><UserRound size={23} /><strong>{search || role || status ? "Tidak ada hasil yang cocok" : "Belum ada akun admin"}</strong><p>Ubah pencarian atau filter, lalu coba lagi.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Nama lengkap</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
              <tbody>{items.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.full_name || "—"}</strong></td>
                  <td>{account.email}</td>
                  <td>{account.username}</td>
                  <td><span className={`admin-badge ${account.role === "superadmin" ? "published" : "draft"}`}><i />{account.role === "superadmin" ? "Superadmin" : "Admin"}</span></td>
                  <td><span className={`admin-badge ${account.enabled ? "published" : "draft"}`}><i />{account.enabled ? "Aktif" : "Nonaktif"}</span></td>
                  <td><span className="admin-date">{dateLabel(account.created_at)}</span></td>
                  <td><div className="admin-row-actions">
                    <button className="admin-icon-button" type="button" title="Detail akun" aria-label={`Detail ${account.full_name || account.email}`} onClick={() => void showDetails(account)}><Eye size={14} /></button>
                    {account.id !== currentAdminId && <button className="admin-icon-button" type="button" title="Edit akun" aria-label={`Edit ${account.full_name || account.email}`} onClick={() => beginEdit(account)}><Pencil size={14} /></button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination">
          <span>{total === 0 ? "0 akun" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total} akun`}</span>
          <div className="admin-pagination-controls">
            <button className="admin-secondary" type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
            <button className="admin-secondary" type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
            <div className="admin-modal-header"><div><h2 id="admin-detail-title">Detail akun admin</h2><p>Informasi profil, tanpa data autentikasi rahasia.</p></div><button className="admin-icon-button" type="button" onClick={() => setSelected(null)} aria-label="Tutup detail"><X size={17} /></button></div>
            <div className="admin-form-grid">
              <p><strong>Nama lengkap</strong><br />{selected.full_name || "—"}</p>
              <p><strong>Email</strong><br />{selected.email}</p>
              <p><strong>Username</strong><br />{selected.username}</p>
              <p><strong>Role</strong><br />{selected.role === "superadmin" ? "Superadmin" : "Admin"}</p>
              <p><strong>Status</strong><br />{selected.enabled ? "Aktif" : "Nonaktif"}</p>
              <p><strong>Dibuat</strong><br />{dateLabel(selected.created_at)}</p>
              <p><strong>Terakhir diperbarui</strong><br />{dateLabel(selected.updated_at)}</p>
            </div>
            <div className="admin-modal-footer"><div className="admin-modal-footer-right"><button className="admin-secondary" type="button" onClick={() => setSelected(null)}>Tutup</button>{selected.id !== currentAdminId && <button className="admin-primary" type="button" onClick={() => beginEdit(selected)}><Pencil size={14} /> Edit akun</button>}</div></div>
          </section>
        </div>
      )}

      {formAccount !== null && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormAccount(null); }}>
          <form className="admin-modal" onSubmit={(event) => void save(event)} aria-labelledby="admin-account-form-title">
            <div className="admin-modal-header"><div><h2 id="admin-account-form-title">{formAccount === "new" ? "Tambah admin" : "Edit akun admin"}</h2><p>Password tidak pernah ditampilkan kembali dan disimpan dengan hash bcrypt.</p></div><button className="admin-icon-button" type="button" onClick={() => setFormAccount(null)} disabled={saving} aria-label="Tutup formulir"><X size={17} /></button></div>
            <div className="admin-form-grid">
              <AccountField label="Nama lengkap" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} maxLength={160} required />
              <AccountField label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} maxLength={254} required />
              <AccountField label="Username" hint="3–40 karakter: huruf, angka, titik, garis bawah, atau tanda hubung (tanpa spasi)." value={form.username} onChange={(value) => setForm((current) => ({ ...current, username: value }))} maxLength={40} required />
              {formAccount === "new" && <AccountField label="Password awal (min. 12 karakter)" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} maxLength={72} minLength={12} required />}
              <div className="admin-field"><label htmlFor="admin-role">Role</label><select id="admin-role" className="admin-select" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AccountForm["role"] }))}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></div>
              {formAccount !== "new" && <div className="admin-field"><span className="admin-field-label">Status akun</span><label className="admin-check"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} /> Akun aktif</label></div>}
            </div>
            {formError && <div className="admin-alert error" role="alert">{formError}</div>}
            <div className="admin-modal-footer"><div className="admin-modal-footer-right"><button className="admin-secondary" type="button" disabled={saving} onClick={() => setFormAccount(null)}>Batal</button><button className="admin-primary" type="submit" disabled={saving}>{saving ? <><LoaderCircle size={14} className="admin-spin" /> Menyimpan...</> : "Simpan akun"}</button></div></div>
          </form>
        </div>
      )}
      {notice && <div className={`admin-toast${notice.error ? " error" : ""}`} role="status">{notice.text}</div>}
    </div>
  );
}

function AccountField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  minLength,
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength: number;
  minLength?: number;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <input className="admin-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} minLength={minLength} required={required} />
      {hint && <span className="admin-field-hint">{hint}</span>}
    </div>
  );
}
