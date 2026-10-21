"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Image as ImageIcon,
  LoaderCircle,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticleItem, CmsCollection, CmsItem, FaqItem, GalleryItem } from "@/lib/cms-types";

type FieldValue = string | number | boolean | null;
type FormState = Record<string, FieldValue>;
type Listing = { items: CmsItem[]; total: number; categories: string[]; page: number; pageSize: number };

const PAGE_SIZE = 10;

const titles: Record<CmsCollection, { title: string; eyebrow: string; description: string; singular: string }> = {
  gallery: { title: "Kelola galeri", eyebrow: "MEDIA & KEGIATAN", description: "Unggah dokumentasi kegiatan dan karya program RPL.", singular: "foto galeri" },
  faq: { title: "Kelola FAQ", eyebrow: "INFORMASI PUBLIK", description: "Atur pertanyaan yang sering ditanyakan dan urutan tampilnya.", singular: "FAQ" },
  articles: { title: "Kelola artikel", eyebrow: "CERITA & KABAR", description: "Tulis artikel, simpan sebagai draft, dan publikasikan ke situs.", singular: "artikel" },
};

function initialValues(collection: CmsCollection, item?: CmsItem): FormState {
  if (item && collection === "gallery") {
    const gallery = item as GalleryItem;
    return {
      title: gallery.title,
      description: gallery.description,
      category: gallery.category,
      image_url: gallery.image_url,
      image_path: gallery.image_path,
      alt_text: gallery.alt_text,
      sort_order: gallery.sort_order,
      published: gallery.published,
    };
  }
  if (item && collection === "faq") {
    const faq = item as FaqItem;
    return {
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      published: faq.published,
    };
  }
  if (item && collection === "articles") {
    const article = item as ArticleItem;
    return {
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      category: article.category,
      author: article.author,
      cover_url: article.cover_url,
      cover_path: article.cover_path,
      published: article.published,
      published_at: article.published_at,
    };
  }
  if (collection === "gallery") return {
    title: "", description: "", category: "", image_url: "", image_path: "", alt_text: "",
    sort_order: 0, published: false,
  };
  if (collection === "faq") return { question: "", answer: "", sort_order: 0, published: false };
  return {
    title: "", slug: "", summary: "", content: "", category: "", author: "",
    cover_url: "", cover_path: "", published: false, published_at: null,
  };
}

function itemTitle(collection: CmsCollection, item: CmsItem) {
  return collection === "faq"
    ? (item as FaqItem).question
    : (item as GalleryItem | ArticleItem).title;
}

function itemSubtitle(collection: CmsCollection, item: CmsItem) {
  if (collection === "gallery") return (item as GalleryItem).category;
  if (collection === "articles") return `/${(item as ArticleItem).slug}`;
  const answer = (item as FaqItem).answer;
  return answer.length > 95 ? `${answer.slice(0, 95)}…` : answer;
}

function imageDetails(collection: CmsCollection, item: CmsItem) {
  if (collection === "gallery") {
    const gallery = item as GalleryItem;
    return { url: gallery.image_url, alt: gallery.alt_text };
  }
  if (collection === "articles") {
    const article = item as ArticleItem;
    return { url: article.cover_url, alt: article.title };
  }
  return { url: "", alt: "" };
}

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ContentManager({ collection }: { collection: CmsCollection }) {
  const config = titles[collection];
  const [listing, setListing] = useState<Listing>({ items: [], total: 0, categories: [], page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState(collection === "faq" ? "order" : "newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [editing, setEditing] = useState<CmsItem | null | "new">(null);
  const [values, setValues] = useState<FormState>(() => initialValues(collection));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  const [saving, setSaving] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      search,
      category,
      status,
      sort,
    });
    try {
      const response = await fetch(`/api/admin/${collection}?${params}`, { signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Konten gagal dimuat.");
      setListing(result);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Konten gagal dimuat.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [category, collection, page, search, sort, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 220);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(listing.total / PAGE_SIZE));
  const visibleItems = listing.items;
  const currentIsNew = editing === "new";
  const currentItem = editing && editing !== "new" ? editing : null;
  const currentImageUrl = collection === "gallery"
    ? String(values.image_url || "")
    : String(values.cover_url || "");
  const displayedImageUrl = previewUrl || currentImageUrl;

  function updateField(name: string, value: FieldValue) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function selectFile(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : "";
    setPreviewUrl(previewUrlRef.current);
    setSelectedFile(file);
  }

  function startCreate() {
    setEditing("new");
    setValues(initialValues(collection));
    selectFile(null);
    setFormError("");
  }

  function startEdit(item: CmsItem) {
    setEditing(item);
    setValues(initialValues(collection, item));
    selectFile(null);
    setFormError("");
  }

  function closeForm() {
    setEditing(null);
    selectFile(null);
    setFormError("");
  }

  function onTitleChange(title: string) {
    updateField("title", title);
    if (collection === "articles" && (currentIsNew || !values.slug)) {
      const slug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
      updateField("slug", slug);
    }
  }

  async function uploadFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      throw new Error("Format gambar harus JPEG, PNG, WebP, atau AVIF.");
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      throw new Error("Ukuran gambar maksimal 5 MB.");
    }
    const form = new FormData();
    form.set("file", file);
    form.set("folder", collection === "gallery" ? "gallery" : "articles");
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gambar gagal diunggah.");
    return result as { url: string; path: string };
  }

  async function save(publish?: boolean) {
    if (!formRef.current?.reportValidity()) return;
    setFormError("");
    setSaving(true);
    let uploaded: { url: string; path: string } | null = null;
    try {
      const nextValues: FormState = { ...values };
      if (selectedFile && (collection === "gallery" || collection === "articles")) {
        uploaded = await uploadFile(selectedFile);
        if (collection === "gallery") {
          nextValues.image_url = uploaded.url;
          nextValues.image_path = uploaded.path;
        } else {
          nextValues.cover_url = uploaded.url;
          nextValues.cover_path = uploaded.path;
        }
      }
      if (publish !== undefined) {
        nextValues.published = publish;
        if (collection === "articles") {
          nextValues.published_at = publish
            ? (values.published_at || new Date().toISOString())
            : null;
        }
      }
      const isPublished = Boolean(nextValues.published);
      if ((collection === "gallery" && !nextValues.image_url) ||
          (collection === "articles" && isPublished && !nextValues.cover_url)) {
        throw new Error(collection === "gallery" ? "Unggah gambar sebelum menyimpan." : "Tambahkan gambar cover sebelum artikel diterbitkan.");
      }
      const endpoint = currentItem
        ? `/api/admin/${collection}/${currentItem.id}`
        : `/api/admin/${collection}`;
      const response = await fetch(endpoint, {
        method: currentItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextValues),
      });
      const result = await response.json();
      if (!response.ok) {
        const fieldErrors = result.fields
          ? Object.entries(result.fields as Record<string, string[]>).map(([field, messages]) => `${field}: ${messages.join(", ")}`).join("; ")
          : "";
        throw new Error(fieldErrors ? `${result.error} ${fieldErrors}` : result.error || "Konten gagal disimpan.");
      }
      closeForm();
      setToast({ text: currentItem ? "Perubahan berhasil disimpan." : `${config.singular} berhasil ditambahkan.`, error: false });
      setPage(1);
      await load();
      if (currentItem && uploaded) {
        const oldPath = collection === "gallery"
          ? (currentItem as GalleryItem).image_path
          : (currentItem as ArticleItem).cover_path;
        if (oldPath && oldPath !== uploaded.path) {
          const removed = await fetch(`/api/admin/upload?path=${encodeURIComponent(oldPath)}`, { method: "DELETE" });
          if (!removed.ok) setToast({ text: "Konten tersimpan, tetapi gambar lama gagal dibersihkan dari Storage.", error: true });
        }
      }
    } catch (reason) {
      if (uploaded) {
        await fetch(`/api/admin/upload?path=${encodeURIComponent(uploaded.path)}`, { method: "DELETE" }).catch(() => undefined);
      }
      setFormError(reason instanceof Error ? reason.message : "Konten gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: CmsItem) {
    if (!window.confirm(`Hapus ${config.singular} "${itemTitle(collection, item)}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const response = await fetch(`/api/admin/${collection}/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Konten gagal dihapus.");
      let imageWarning = "";
      const image = imageDetails(collection, item);
      if (image.url && "image_path" in item && item.image_path) {
        const removed = await fetch(`/api/admin/upload?path=${encodeURIComponent(item.image_path)}`, { method: "DELETE" });
        if (!removed.ok) imageWarning = " Data terhapus, tetapi file gambar belum terhapus dari Storage.";
      } else if (image.url && "cover_path" in item && item.cover_path) {
        const removed = await fetch(`/api/admin/upload?path=${encodeURIComponent(item.cover_path)}`, { method: "DELETE" });
        if (!removed.ok) imageWarning = " Data terhapus, tetapi file gambar belum terhapus dari Storage.";
      }
      setToast({ text: `Konten berhasil dihapus.${imageWarning}`, error: Boolean(imageWarning) });
      if (visibleItems.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (reason) {
      setToast({ text: reason instanceof Error ? reason.message : "Konten gagal dihapus.", error: true });
    }
  }

  async function togglePublish(item: CmsItem) {
    const next = !item.published;
    if (collection === "articles" && next && !(item as ArticleItem).cover_url) {
      setToast({ text: "Tambahkan gambar cover sebelum menerbitkan artikel.", error: true });
      return;
    }
    const values = initialValues(collection, item);
    values.published = next;
    if (collection === "articles") {
      values.published_at = next
        ? (((item as ArticleItem).published_at) || new Date().toISOString())
        : null;
    }
    try {
      const response = await fetch(`/api/admin/${collection}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Status publikasi gagal diperbarui.");
      setToast({ text: next ? "Konten berhasil diterbitkan." : "Konten kembali menjadi draft.", error: false });
      await load();
    } catch (reason) {
      setToast({ text: reason instanceof Error ? reason.message : "Status gagal diperbarui.", error: true });
    }
  }

  async function reorder(item: FaqItem, direction: -1 | 1) {
    const index = visibleItems.findIndex((entry) => entry.id === item.id);
    const neighbor = visibleItems[index + direction] as FaqItem | undefined;
    if (!neighbor) return;
    try {
      const response = await fetch("/api/admin/faq/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, neighborId: neighbor.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Urutan FAQ gagal disimpan.");
      setToast({ text: "Urutan FAQ diperbarui.", error: false });
      await load();
    } catch (reason) {
      setToast({ text: reason instanceof Error ? reason.message : "Urutan FAQ gagal diperbarui.", error: true });
      await load();
    }
  }

  const rows = visibleItems.map((item, index) => {
    const image = imageDetails(collection, item);
    const isPublished = item.published;
    return (
      <tr key={item.id}>
        <td>{collection === "faq" ? <span className="admin-order-number">{(page - 1) * PAGE_SIZE + index + 1}</span> : <span className="admin-date">{new Date(item.created_at).toLocaleDateString("id-ID")}</span>}</td>
        <td>
          <div className="admin-table-title">
            {collection === "gallery" || collection === "articles"
              ? image.url
                ? <img className="admin-thumb" src={image.url} alt={image.alt} />
                : <span className="admin-thumb-empty"><ImageIcon size={15} /></span>
              : <span className="admin-thumb-empty"><MessageCircleQuestion size={15} /></span>}
            <span>
              <strong>{itemTitle(collection, item)}</strong>
              <small>{itemSubtitle(collection, item)}</small>
            </span>
          </div>
        </td>
        {collection !== "faq" && <td>{(item as GalleryItem | ArticleItem).category}</td>}
        <td><span className={`admin-badge ${isPublished ? "published" : "draft"}`}><i />{isPublished ? "Terbit" : "Draft"}</span></td>
        {collection === "faq" && (
          <td><div className="admin-row-actions">
            <button className="admin-icon-button" title="Naikkan urutan" aria-label="Naikkan urutan" disabled={index === 0} onClick={() => void reorder(item as FaqItem, -1)}><ArrowUp size={14} /></button>
            <button className="admin-icon-button" title="Turunkan urutan" aria-label="Turunkan urutan" disabled={index === visibleItems.length - 1} onClick={() => void reorder(item as FaqItem, 1)}><ArrowDown size={14} /></button>
          </div></td>
        )}
        <td>
          <div className="admin-row-actions">
            <button className="admin-icon-button" title={isPublished ? "Jadikan draft" : "Terbitkan"} aria-label={isPublished ? "Jadikan draft" : "Terbitkan"} onClick={() => void togglePublish(item)}><Check size={14} /></button>
            <button className="admin-icon-button" title="Edit" aria-label="Edit" onClick={() => startEdit(item)}><Pencil size={14} /></button>
            <button className="admin-icon-button delete" title="Hapus" aria-label="Hapus" onClick={() => void deleteItem(item)}><Trash2 size={14} /></button>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-topline"><span>RPL CMS / Konten</span><a href="/" target="_blank">Lihat situs publik <ArrowUp size={12} /></a></div>
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">{config.eyebrow}</span>
          <h1 className="admin-title">{config.title}</h1>
          <p className="admin-subtitle">{config.description}</p>
        </div>
        <button className="admin-primary" type="button" onClick={startCreate}><Plus size={15} /> Tambah {config.singular}</button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      <div className="admin-panel admin-toolbar">
        <label className="admin-search">
          <Search size={15} aria-hidden="true" />
          <input className="admin-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari judul atau isi..." aria-label="Cari konten" />
        </label>
        {collection !== "faq" && (
          <select className="admin-select" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            {listing.categories.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        )}
        <select className="admin-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter status">
          <option value="all">Semua status</option><option value="published">Terbit</option><option value="draft">Draft</option>
        </select>
        <select className="admin-select" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Urutkan konten">
          {collection === "faq" && <option value="order">Urutan tampilan</option>}
          <option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="title">Judul A–Z</option>
        </select>
      </div>

      <section className="admin-panel">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="admin-spin" size={20} /><strong>Memuat konten</strong><p>Mengambil data dari CMS.</p></div>
        ) : visibleItems.length === 0 ? (
          <div className="admin-empty"><FilePlus2 size={23} /><strong>{search || category || status !== "all" ? "Tidak ada hasil yang cocok" : `Belum ada ${config.singular}`}</strong><p>{search || category || status !== "all" ? "Ubah pencarian atau filter, lalu coba lagi." : "Tambahkan konten pertama untuk ditampilkan di situs."}</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>
                <th>{collection === "faq" ? "Urutan" : "Dibuat"}</th><th>Konten</th>
                {collection !== "faq" && <th>Kategori</th>}
                <th>Status</th>{collection === "faq" && <th>Atur urutan</th>}<th>Aksi</th>
              </tr></thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination">
          <span>{listing.total === 0 ? "0 konten" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, listing.total)} dari ${listing.total} konten`}</span>
          <div className="admin-pagination-controls">
            <button className="admin-secondary" type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={14} /> Sebelumnya</button>
            <button className="admin-secondary" type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Berikutnya <ChevronRight size={14} /></button>
          </div>
        </div>
      </section>

      {editing !== null && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) closeForm(); }}>
          <form ref={formRef} className="admin-modal" onSubmit={(event) => { event.preventDefault(); void save(); }} aria-labelledby="admin-form-title">
            <div className="admin-modal-header">
              <div><h2 id="admin-form-title">{currentIsNew ? `Tambah ${config.singular}` : `Edit ${config.singular}`}</h2><p>Perubahan akan tersimpan ke database CMS.</p></div>
              <button className="admin-icon-button" type="button" onClick={closeForm} disabled={saving} aria-label="Tutup formulir"><X size={17} /></button>
            </div>
            <div className="admin-modal-body">
              {formError && <div className="admin-alert error" role="alert">{formError}</div>}
              <FormFields
                collection={collection}
                values={values}
                updateField={updateField}
                onTitleChange={onTitleChange}
                file={selectedFile}
                previewUrl={displayedImageUrl}
                onFile={(file) => { selectFile(file); setFormError(""); }}
              />
            </div>
            <div className="admin-modal-footer">
              {collection === "articles" && <button className="admin-secondary" type="button" onClick={() => setPreviewArticle(values)}><Eye size={14} /> Pratinjau</button>}
              <div className="admin-modal-footer-right">
                <button className="admin-secondary" type="button" disabled={saving} onClick={closeForm}>Batal</button>
                {collection === "articles" ? (
                  <>
                    <button className="admin-secondary" type="button" disabled={saving} onClick={() => void save(false)}>Simpan draft</button>
                    <button className="admin-primary" type="button" disabled={saving} onClick={() => void save(true)}>{saving ? "Menyimpan..." : "Terbitkan"}</button>
                  </>
                ) : (
                  <button className="admin-primary" type="submit" disabled={saving}>{saving ? <><LoaderCircle size={14} className="admin-spin" /> Menyimpan</> : "Simpan perubahan"}</button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {previewArticle && collection === "articles" && (
        <div className="admin-article-preview" role="dialog" aria-modal="true" aria-label="Pratinjau artikel">
          <article className="admin-preview-card">
            <div className="admin-modal-footer" style={{ padding: "0 0 13px", background: "transparent", border: 0 }}>
              <span className="admin-badge draft">Pratinjau · belum diterbitkan</span>
              <button className="admin-icon-button" type="button" onClick={() => setPreviewArticle(null)} aria-label="Tutup pratinjau"><X size={17} /></button>
            </div>
            {String(previewArticle.cover_url || displayedImageUrl) && <img src={String(previewArticle.cover_url || displayedImageUrl)} alt="" />}
            <span className="admin-eyebrow">{String(previewArticle.category || "ARTIKEL")} · {String(previewArticle.author || "Penulis")}</span>
            <h2>{String(previewArticle.title || "Judul artikel")}</h2>
            <p><strong>{String(previewArticle.summary || "Ringkasan artikel")}</strong></p>
            <p>{String(previewArticle.content || "Isi artikel akan tampil di sini.")}</p>
          </article>
        </div>
      )}
      {toast && <div className={`admin-toast${toast.error ? " error" : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}

function FormFields({
  collection,
  values,
  updateField,
  onTitleChange,
  file,
  previewUrl,
  onFile,
}: {
  collection: CmsCollection;
  values: FormState;
  updateField: (name: string, value: FieldValue) => void;
  onTitleChange: (title: string) => void;
  file: File | null;
  previewUrl: string;
  onFile: (file: File | null) => void;
}) {
  const imageInput = collection === "gallery" ? "image" : "cover";
  return (
    <div className="admin-form-grid">
      {collection === "faq" ? (
        <>
          <Field name="question" label="Pertanyaan" value={String(values.question || "")} onChange={(value) => updateField("question", value)} required maxLength={250} full />
          <TextArea name="answer" label="Jawaban" value={String(values.answer || "")} onChange={(value) => updateField("answer", value)} required maxLength={5000} full />
          <NumberField name="sort_order" label="Urutan tampil" value={Number(values.sort_order || 0)} onChange={(value) => updateField("sort_order", value)} />
          <PublishField value={Boolean(values.published)} onChange={(value) => updateField("published", value)} />
        </>
      ) : collection === "gallery" ? (
        <>
          <Field name="title" label="Judul foto" value={String(values.title || "")} onChange={(value) => updateField("title", value)} required maxLength={120} full />
          <TextArea name="description" label="Deskripsi" value={String(values.description || "")} onChange={(value) => updateField("description", value)} maxLength={2000} full />
          <Field name="category" label="Kategori" value={String(values.category || "")} onChange={(value) => updateField("category", value)} required maxLength={80} />
          <Field name="alt_text" label="Alt text gambar" value={String(values.alt_text || "")} onChange={(value) => updateField("alt_text", value)} required maxLength={180} />
          <ImageUpload label="Gambar galeri" previewUrl={previewUrl} file={file} onFile={onFile} inputName={imageInput} />
          <NumberField name="sort_order" label="Urutan tampil" value={Number(values.sort_order || 0)} onChange={(value) => updateField("sort_order", value)} />
          <PublishField value={Boolean(values.published)} onChange={(value) => updateField("published", value)} />
        </>
      ) : (
        <>
          <Field name="title" label="Judul artikel" value={String(values.title || "")} onChange={onTitleChange} required maxLength={180} full />
          <Field name="slug" label="Slug URL" value={String(values.slug || "")} onChange={(value) => updateField("slug", value.toLowerCase())} required maxLength={180} hint={`URL: /artikel/${String(values.slug || "slug-artikel")}`} full />
          <TextArea name="summary" label="Ringkasan" value={String(values.summary || "")} onChange={(value) => updateField("summary", value)} required maxLength={500} full />
          <Field name="category" label="Kategori" value={String(values.category || "")} onChange={(value) => updateField("category", value)} required maxLength={80} />
          <Field name="author" label="Nama penulis" value={String(values.author || "")} onChange={(value) => updateField("author", value)} required maxLength={120} />
          <ImageUpload label="Gambar cover" previewUrl={previewUrl} file={file} onFile={onFile} inputName={imageInput} />
          <div className="admin-field">
            <label htmlFor="field-published_at">Tanggal publikasi</label>
            <input
              className="admin-input"
              id="field-published_at"
              type="datetime-local"
              value={localDateTime(typeof values.published_at === "string" ? values.published_at : null)}
              onChange={(event) => updateField(
                "published_at",
                event.target.value ? new Date(event.target.value).toISOString() : null,
              )}
            />
            <span className="admin-field-hint">Jika kosong, waktu saat artikel diterbitkan akan digunakan.</span>
          </div>
          <TextArea name="content" label="Isi artikel" value={String(values.content || "")} onChange={(value) => updateField("content", value)} required maxLength={30000} full content />
          <PublishField value={Boolean(values.published)} onChange={(value) => updateField("published", value)} label="Terbitkan sekarang" />
        </>
      )}
    </div>
  );
}

function Field({ name, label, value, onChange, required, maxLength, hint, full }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  required?: boolean; maxLength: number; hint?: string; full?: boolean;
}) {
  return (
    <div className={`admin-field${full ? " full" : ""}`}>
      <label htmlFor={`field-${name}`}>{label}{required ? " *" : ""}</label>
      <input className="admin-input" id={`field-${name}`} name={name} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} required={required} />
      {hint && <span className="admin-field-hint">{hint}</span>}
    </div>
  );
}

function TextArea({ name, label, value, onChange, required, maxLength, full, content }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  required?: boolean; maxLength: number; full?: boolean; content?: boolean;
}) {
  return (
    <div className={`admin-field${full ? " full" : ""}`}>
      <label htmlFor={`field-${name}`}>{label}{required ? " *" : ""}</label>
      <textarea className={`admin-textarea${content ? " content-editor" : ""}`} id={`field-${name}`} name={name} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} required={required} />
      <span className="admin-field-hint">{value.length}/{maxLength} karakter{content ? " · editor teks sederhana, HTML tidak dirender" : ""}</span>
    </div>
  );
}

function NumberField({ name, label, value, onChange }: { name: string; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="admin-field">
      <label htmlFor={`field-${name}`}>{label}</label>
      <input className="admin-input" id={`field-${name}`} type="number" min={0} max={100000} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

function PublishField({ value, onChange, label = "Tampilkan pada situs publik" }: { value: boolean; onChange: (value: boolean) => void; label?: string }) {
  return <div className="admin-field"><span className="admin-field-label">Publikasi</span><label className="admin-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /> {label}</label></div>;
}

function ImageUpload({ label, previewUrl, file, onFile, inputName }: {
  label: string; previewUrl: string; file: File | null; onFile: (file: File | null) => void; inputName: string;
}) {
  return (
    <div className="admin-field full">
      <label htmlFor={`field-${inputName}`}>{label} {inputName === "image" ? "*" : ""}</label>
      <div className="admin-upload">
        {previewUrl && <img className="admin-upload-preview" src={previewUrl} alt="Pratinjau gambar yang dipilih" />}
        <div className="admin-upload-controls">
          <input
            className="admin-input"
            id={`field-${inputName}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => onFile(event.target.files?.[0] || null)}
            required={inputName === "image" && !previewUrl}
          />
          {file && <button className="admin-secondary" type="button" onClick={() => onFile(null)}>Batalkan pilihan</button>}
        </div>
        <span className="admin-field-hint">JPEG, PNG, WebP, atau AVIF · maksimal 5 MB. Gambar diunggah ke Supabase Storage saat disimpan.</span>
      </div>
    </div>
  );
}
