import type { NewsView } from "@/lib/news-types";
import { articleParts } from "@/lib/news-types";

export function ArticleContent({ article, motion = true }: { article: NewsView; motion?: boolean }) {
  const { intro, sections } = articleParts(article.blocks);
  return <article className="article-body topic-prose">
    <p className="article-category">{article.category}{article.example ? " · Artikel edukasi contoh" : article.publishedAt ? <> · <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" }).format(new Date(article.publishedAt))}</time></> : ""}</p>
    {intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {sections.map(section => <section key={section.id} id={section.id} tabIndex={-1} className="article-section section-anchor" data-reveal={motion || undefined}><h2 data-split={motion || undefined}>{section.heading}</h2>{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>)}
  </article>;
}
