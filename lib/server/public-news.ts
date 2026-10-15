import "server-only";
import { unstable_cache } from "next/cache";
import { articles } from "../preview-content";
import { articleSections } from "../article-sections";
import type { NewsView } from "../news-types";
import type { NewsBlock } from "../news-validation";
import { isDatabaseConfigured } from "./database";
import { getNewsService } from "./news";

const examples: NewsView[] = articles.map(article => ({ ...article, example: true, blocks: [{ type: "paragraph", text: article.body }, ...articleSections[article.id].flatMap(section => [{ type: "heading", text: section.heading }, ...section.paragraphs.map(text => ({ type: "paragraph", text }))])] as NewsBlock[] }));
type PublishedRow = { slug: string; title: string; excerpt: string; category: string; image: string; alt: string; blocks?: NewsBlock[]; published_at: Date };
const view = (row: PublishedRow): NewsView => ({ id: row.slug, title: row.title, excerpt: row.excerpt, category: row.category, image: row.image, alt: row.alt, blocks: row.blocks || [], example: false, publishedAt: new Date(row.published_at).toISOString() });
const databaseKey = `${process.env.DATABASE_HOST || "127.0.0.1"}:${process.env.DATABASE_PORT || "3307"}/${process.env.DATABASE_NAME || "preview"}/${process.env.ANNUR_TEST_RUN_ID||""}`;
const published = unstable_cache(async () => (await getNewsService().listPublic()).map(view), ["annur-published-news", databaseKey], { tags: ["school-news"], revalidate: 300 });
const bySlug = unstable_cache(async (slug: string) => { const row = await getNewsService().publicBySlug(slug); return row ? view(row) : null; }, ["annur-published-detail", databaseKey], { tags: ["school-news"], revalidate: 300 });

export function getPublicNews(): Promise<NewsView[]> { return isDatabaseConfigured() ? published() : Promise.resolve(examples); }
export function getPublicNewsBySlug(slug: string): Promise<NewsView | null> { return isDatabaseConfigured() ? bySlug(slug) : Promise.resolve(examples.find(article => article.id === slug) || null); }
export const isNewsPreview = () => !isDatabaseConfigured();
