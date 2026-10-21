import { getPublicSupabase, isPublicSupabaseConfigured } from "./supabase";
import type { ArticleItem, FaqItem, GalleryItem } from "./cms-types";

export type PublicContent = {
  configured: boolean;
  error: string | null;
  gallery: GalleryItem[];
  faq: FaqItem[];
  articles: ArticleItem[];
};

export async function getPublicContent(): Promise<PublicContent> {
  if (!isPublicSupabaseConfigured()) {
    return { configured: false, error: null, gallery: [], faq: [], articles: [] };
  }
  try {
    const db = getPublicSupabase();
    const [gallery, faq, articles] = await Promise.all([
      db.from("gallery").select("*").eq("published", true).order("sort_order").order("created_at", { ascending: false }).limit(12),
      db.from("faq").select("*").eq("published", true).order("sort_order").order("created_at", { ascending: true }).limit(30),
      db.from("articles").select("*").eq("published", true).order("published_at", { ascending: false }).limit(6),
    ]);
    if (gallery.error) throw gallery.error;
    if (faq.error) throw faq.error;
    if (articles.error) throw articles.error;
    return {
      configured: true,
      error: null,
      gallery: (gallery.data || []) as GalleryItem[],
      faq: (faq.data || []) as FaqItem[],
      articles: (articles.data || []) as ArticleItem[],
    };
  } catch (error) {
    console.error("Public CMS content read error", error);
    return {
      configured: true,
      error: "Konten belum dapat dimuat saat ini. Silakan coba beberapa saat lagi.",
      gallery: [],
      faq: [],
      articles: [],
    };
  }
}

export function cmsUnavailableText(content: PublicContent) {
  if (content.error) return content.error;
  if (!content.configured) return "CMS belum dikonfigurasi. Konten akan tampil setelah administrator menghubungkan Supabase.";
  return "Belum ada konten yang diterbitkan.";
}
