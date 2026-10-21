import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase";
import type { ArticleItem } from "@/lib/cms-types";

export const dynamic = "force-dynamic";

async function findArticle(slug: string) {
  const { data, error } = await getPublicSupabase()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) {
    console.error("Public article read error", error);
    throw new Error("Artikel tidak dapat dimuat dari CMS.");
  }
  return data as ArticleItem | null;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();

  return (
    <main className="public-article-page">
      <Link href="/#artikel" className="public-article-back"><ArrowLeft size={15} /> Kembali ke artikel</Link>
      <article className="public-article-detail">
        {article.cover_url && <img className="public-article-cover" src={article.cover_url} alt="" />}
        <div className="public-article-detail-content">
          <span className="public-article-category">{article.category} · {article.author}</span>
          <h1>{article.title}</h1>
          <p className="public-article-summary">{article.summary}</p>
          <time dateTime={article.published_at || article.created_at}>
            {new Date(article.published_at || article.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
          </time>
          <div className="public-article-body">{article.content}</div>
        </div>
      </article>
    </main>
  );
}
