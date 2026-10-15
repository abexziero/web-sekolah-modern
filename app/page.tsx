export const dynamic = "force-dynamic";
import { HomeContent } from "@/components/home-content";
import { getPublicNews, isNewsPreview } from "@/lib/server/public-news";
import { getPublicCms, getPublicCmsList } from "@/lib/server/public-cms";
import {getSitePresentation} from "@/lib/server/site-presentation";
export default async function HomePage() {
    const types = ["teacher", "album", "document", "faq", "event", "announcement"];
    const [news, home, presentation, ...lists] = await Promise.all([getPublicNews(), getPublicCms("home"), getSitePresentation(), ...types.map(getPublicCmsList)]);
    // Draft pertama tidak mengganti desain awal; isi draft hanya tersedia di pratinjau privat.
    const collections = home ? Object.fromEntries(types.map((type, i) => [type, lists[i]])) : {};
    return <HomeContent news={news} home={home?.payload} settings={presentation.settings} collections={collections} preview={isNewsPreview() || !home || home.payload.example}/>;
}
