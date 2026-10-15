import {imageUrl} from "@/lib/cms-validation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import type { NewsView } from "@/lib/news-types";

export function NewsCards({ articles, heading = "h3" }: { articles: NewsView[]; heading?: "h2" | "h3" }) {
  const Heading = heading;
  if (!articles.length) return <p className="topic-prose">Belum ada berita yang diterbitkan.</p>;
  return <div className="news-grid">{articles.map((article, index) => <article id={article.id} className="news-card section-anchor" key={article.id} data-reveal data-delay={(index % 3) * 0.14}>
    <Link href={`/informasi/berita/${article.id}`} prefetch={false} tabIndex={-1} aria-hidden="true" className="news-card-image" data-photo-reveal><span className="photo-depth"><Image src={imageUrl(article.image)} unoptimized={article.image.startsWith("/media/")} alt="" fill sizes="(max-width: 767px) 92vw, 380px" className="object-cover" /></span></Link>
    <div className="news-card-content"><span className="news-category"><Newspaper size={14} aria-hidden="true" />{article.category}</span><Heading><Link href={`/informasi/berita/${article.id}`} prefetch={false}>{article.title}</Link></Heading><p>{article.excerpt}</p><Link href={`/informasi/berita/${article.id}`} prefetch={false} className="text-link">Baca artikel<ArrowRight size={15} aria-hidden="true" /><span className="sr-only">: {article.title}</span></Link><span className="content-note">{article.example ? "Konten contoh · " : ""}{article.image === "study-illustration.jpg" ? <>Foto ilustrasi: <a href="https://www.pexels.com/photo/students-studying-in-the-library-9572464/" target="_blank" rel="noopener noreferrer">Tima Miroshnichenko / Pexels</a></> : "Foto lingkungan madrasah"}</span></div>
  </article>)}</div>;
}
