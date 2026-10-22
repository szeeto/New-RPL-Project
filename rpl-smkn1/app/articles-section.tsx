import { ArrowUpRight, Braces, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ArticleItem } from "@/lib/cms-types";

export default function ArticlesSection({
  items,
  emptyMessage,
}: {
  items: ArticleItem[];
  emptyMessage: string;
}) {
  return (
    <section className="showcase-panel article-panel" id="artikel" aria-labelledby="articles-title">
      <div className="panel-title">
        <span id="articles-title">
          <Braces size={17} /> Blog & Artikel
        </span>
        <span className="panel-index">
          02 — {String(items.length).padStart(2, "0")}
        </span>
      </div>
      {items.length ? (
        <div className="public-article-list">
          {items.map((article) => (
            <Link className="public-article-card" href={`/artikel/${encodeURIComponent(article.slug)}`} key={article.id}>
              {article.cover_url && <img src={article.cover_url} alt="" loading="lazy" />}
              <span className="article-card-copy">
                <small>{article.category}{article.author ? ` · ${article.author}` : ""}</small>
                <strong>{article.title}</strong>
                <span className="article-summary">{article.summary}</span>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="showcase-empty">
          <div className="empty-icon" aria-hidden="true"><Braces size={22} /></div>
          <div>
            <h3>Belum ada artikel</h3>
            <p>{emptyMessage}</p>
          </div>
        </div>
      )}
      <div className="article-panel-link">
        <a href="https://smkn1bukitsundi.sch.id" target="_blank" rel="noreferrer">
          Kunjungi situs sekolah <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
