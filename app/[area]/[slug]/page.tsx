import {publicMetadata} from "@/lib/server/public-metadata";
export const dynamic="force-dynamic";
import {getPublicCms,getPublicCmsList,hasCmsEntry} from "@/lib/server/public-cms";
import {CmsPageContent} from "@/components/cms-page-content";
import {CmsCollection} from "@/components/cms-collection";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { schoolPages, navigation } from "@/lib/school-pages";
import { gallery, faqs } from "@/lib/school-content";
import { topicCopy } from "@/lib/preview-content";
import { DownloadList } from "@/components/download-list";
import { TopicLayout } from "@/components/topic-layout";
import { NewsCards } from "@/components/news-cards";
import { getPublicNews, isNewsPreview } from "@/lib/server/public-news";
import { TeacherCards } from "@/components/teacher-cards";
import Masonry from "@/components/masonry";

type Props = { params: Promise<{ area: string; slug: string }> };

export function generateStaticParams() {
  return schoolPages.map(({ area, slug }) => ({ area, slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, slug } = await params;
  const page = schoolPages.find(item => item.area === area && item.slug === slug);
  const cms=await getPublicCms("page",`${area}/${slug}`);
  if(cms)return publicMetadata({title:`${cms.payload.title} - MA Annur Samarinda`,description:cms.payload.description,path:`/${area}/${slug}`,image:cms.payload.image,example:cms.payload.example});
  return page ? publicMetadata({title:`${page.title} - MA Annur Samarinda`,description:page.description,path:`/${area}/${slug}`,image:page.image,example:!(area==="informasi"&&slug==="berita")}) : {};
}

export default async function SchoolTopicPage({ params }: Props) {
  const { area, slug } = await params;
  const page = schoolPages.find(item => item.area === area && item.slug === slug);
  const cms=await getPublicCms("page",`${area}/${slug}`);
  if(!cms&&(!page||await hasCmsEntry("page",`${area}/${slug}`)))notFound();
  const collectionType=slug==="guru-tenaga-kependidikan"?"teacher":slug==="galeri"?"album":slug==="faq"?"faq":slug==="unduhan"?"document":slug==="pengumuman"?"announcement":slug==="agenda"?"event":null;
  if(cms) return <TopicLayout title={cms.payload.title} description={cms.payload.description} category={area} section={area} example={false} wide={!!collectionType}><CmsPageContent page={cms.payload}/>{collectionType&&<CmsCollection type={collectionType} entries={await getPublicCmsList(collectionType)}/>}</TopicLayout>;
  if(!page)notFound();
  const menu = navigation.find(item => item.area === area)!;
  const news = area === "informasi" && slug === "berita";
  const articles = news ? await getPublicNews() : [];
  const sections = news ? [] : topicCopy[`${area}/${slug}`];
  const contents = sections.map((section, index) => ({ id: section.id || `bagian-${index + 1}`, title: section.heading }));

  return <TopicLayout title={page.title} description={page.description} category={menu.label} section={menu.section.split(" ")[0]} image={page.image} example={!news || isNewsPreview()} wide={news || page.kind === "gallery" || page.kind === "teachers"}>
    {news ? <NewsCards heading="h2" articles={articles} /> : <div className="topic-sections">{sections.map((section, index) => <article key={section.heading} id={contents[index].id} tabIndex={-1} className="topic-prose section-anchor" data-reveal>
      <h2 data-split>{section.heading}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
    </article>)}</div>}
    {page.kind === "gallery" && <Masonry items={gallery} />}
    {page.kind === "teachers" && <><TeacherCards heading="h2" /><p className="content-note">Avatar dan peran contoh · Bukan identitas pendidik atau pegawai sebenarnya.</p></>}
    {page.kind === "faq" && <div className="faq-list topic-prose">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>}
    {area === "layanan" && slug === "unduhan" && <DownloadList />}
  </TopicLayout>;
}
