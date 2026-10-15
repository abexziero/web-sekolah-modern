import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCmsService } from "@/lib/server/cms";
import { requireOperator } from "@/lib/server/auth";
import { CmsPageContent } from "@/components/cms-page-content";
import { HomeContent } from "@/components/home-content";
import { SiteConfig } from "@/components/site-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CmsCollection } from "@/components/cms-collection";
import {getSitePresentation} from "@/lib/server/site-presentation";
import {getPublicCmsList} from "@/lib/server/public-cms";
import {getPublicNews} from "@/lib/server/public-news";
export default async function PreviewCms({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    await requireOperator();
    const { id } = await params;
    let entry;
    try {
        entry = await getCmsService().get(await headers(), id);
    }
    catch {
        notFound();
    }
    const presentation=await getSitePresentation();
    const types=["teacher","album","document","faq","event","announcement"];
    const [news,...lists]=entry.type==="home"?await Promise.all([getPublicNews(),...types.map(getPublicCmsList)]):[[]];
    return <><p className="admin-unsaved">Preview privat · Versi tersimpan <Link href={`/admin/konten/${id}`}>Kembali menyunting</Link></p>{entry.type === "home" ? <HomeContent home={entry.payload} news={news} settings={presentation.settings} collections={Object.fromEntries(types.map((type,index)=>[type,lists[index]]))} preview/> : ["settings", "navigation"].includes(entry.type) ? <SiteConfig value={{ settings: entry.type === "settings" ? entry.payload : presentation.settings, navigation: entry.type === "navigation" ? entry.payload : presentation.navigation }}><SiteHeader /><div style={{ minHeight: 180 }}/><SiteFooter /></SiteConfig> : <article className="topic-prose"><h1>{entry.payload.title || entry.payload.name || entry.payload.question}</h1>{entry.type === "page" ? <CmsPageContent page={entry.payload}/> : <CmsCollection type={entry.type} entries={[entry]} preview/>}</article>}</>;
}
