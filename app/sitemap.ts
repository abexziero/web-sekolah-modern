import type { MetadataRoute } from "next";
import { getPublicCmsList } from "@/lib/server/public-cms";
import { getPublicNews } from "@/lib/server/public-news";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = process.env.SITE_URL;
    if (!base)
        return [];
    const [pages, news] = await Promise.all([getPublicCmsList("page"), getPublicNews()]);
    return [{ url: new URL("/", base).href }, ...pages.map((page: {
            entry_key: string;
            published_at: Date;
        }) => ({ url: new URL(`/${page.entry_key}`, base).href, lastModified: new Date(page.published_at) })), ...news.filter(article => !article.example).map(article => ({ url: new URL(`/informasi/berita/${article.id}`, base).href, lastModified: article.publishedAt }))];
}
