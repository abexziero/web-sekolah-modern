import {imageUrl} from "@/lib/cms-validation";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireOperator } from "@/lib/server/auth";
import { getNewsService } from "@/lib/server/news";
import { NewsError } from "@/lib/server/news-core.mjs";
import { ArticleContent } from "@/components/article-content";
import { OperatorBar } from "@/components/admin/operator-bar";
export default async function PreviewNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOperator();
  const { id } = await params;
  let article;
  try { article = await getNewsService().get(await headers(), id); } catch (error) { if (error instanceof NewsError) notFound(); throw error; }
  return <><OperatorBar user={user} /><div className="admin-preview"><p className="admin-unsaved">Preview privat · Versi draft tersimpan, belum tentu sama dengan versi publik.</p><Link className="text-link" href={`/admin/berita/${id}`}>Kembali menyunting</Link><p className="eyebrow">{article.category}</p><h1>{article.title}</h1><p className="admin-lead">{article.excerpt}</p><Image src={imageUrl(article.image)} unoptimized={article.image.startsWith("/media/")} alt={article.alt} width={1200} height={700} className="admin-preview-image" />{article.image === "study-illustration.jpg" && <p className="content-note">Foto ilustrasi · Tima Miroshnichenko / Pexels</p>}<ArticleContent article={{ ...article, example: false }} motion={false} /></div></>;
}
