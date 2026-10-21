import { getPublicSupabase, isPublicSupabaseConfigured } from "./supabase";
import type { ArticleItem, FaqItem, GalleryItem, TeacherItem } from "./cms-types";

export type PublicContent = {
  configured: boolean;
  error: string | null;
  teacherError: string | null;
  gallery: GalleryItem[];
  faq: FaqItem[];
  articles: ArticleItem[];
  teachers: TeacherItem[];
};

export async function getPublicContent(): Promise<PublicContent> {
  if (!isPublicSupabaseConfigured()) {
    return { configured: false, error: null, teacherError: null, gallery: [], faq: [], articles: [], teachers: [] };
  }
  try {
    const db = getPublicSupabase();
    const [gallery, faq, articles, teachers] = await Promise.all([
      db.from("gallery").select("*").eq("published", true).order("sort_order").order("created_at", { ascending: false }).limit(12),
      db.from("faq").select("*").eq("published", true).order("sort_order").order("created_at", { ascending: true }).limit(30),
      db.from("articles").select("*").eq("published", true).order("published_at", { ascending: false }).limit(6),
      db.from("teachers").select("*").eq("published", true).order("full_name").limit(50),
    ]);
    if (gallery.error) throw gallery.error;
    if (faq.error) throw faq.error;
    if (articles.error) throw articles.error;
    if (teachers.error) console.error("Public teacher content read error", teachers.error);
    return {
      configured: true,
      error: null,
      teacherError: teachers.error
        ? "Profil guru belum dapat dimuat. Pastikan migrasi database 0003_teachers.sql sudah dijalankan."
        : null,
      gallery: (gallery.data || []) as GalleryItem[],
      faq: (faq.data || []) as FaqItem[],
      articles: (articles.data || []) as ArticleItem[],
      teachers: (teachers.data || []) as TeacherItem[],
    };
  } catch (error) {
    console.error("Public CMS content read error", error);
    return {
      configured: true,
      error: "Konten belum dapat dimuat saat ini. Silakan coba beberapa saat lagi.",
      teacherError: "Profil guru belum dapat dimuat saat ini.",
      gallery: [],
      faq: [],
      articles: [],
      teachers: [],
    };
  }
}

export function cmsUnavailableText(content: PublicContent) {
  if (content.error) return content.error;
  if (!content.configured) return "CMS belum dikonfigurasi. Konten akan tampil setelah administrator menghubungkan Supabase.";
  return "Belum ada konten yang diterbitkan.";
}
