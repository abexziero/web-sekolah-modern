import {publicMetadata} from "@/lib/server/public-metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicNewsBySlug } from "@/lib/server/public-news";
import { articleParts } from "@/lib/news-types";
import { ArticleContent } from "@/components/article-content";
import { TopicLayout } from "@/components/topic-layout";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);
  return article ? publicMetadata({title:`${article.title} - MA Annur Samarinda`,description:article.excerpt,path:`/informasi/berita/${slug}`,image:article.image,example:article.example}) : {};
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);
  if (!article) notFound();
  const contents = articleParts(article.blocks).sections.map(section => ({ id: section.id, title: section.heading }));

  return <TopicLayout title={article.title} description={article.excerpt} category="Informasi" section="informasi" image={article.image} imageAlt={article.alt} example={article.example} parent={{ title: "Berita Terbaru", href: "/informasi/berita" }} contents={contents}>
    <ArticleContent article={article} />
  </TopicLayout>;
}
