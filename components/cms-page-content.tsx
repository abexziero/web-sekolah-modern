import Image from "next/image";
import { imageUrl, type CmsPayload } from "@/lib/cms-validation";
export function CmsPageContent({ page }: {
    page: CmsPayload;
}) {
    return <>{page.example && <p className="sample-notice">Konten contoh · Belum disahkan sekolah.</p>}{page.image && <figure className="topic-figure"><div className="topic-photo" data-photo-reveal><span className="photo-depth"><Image unoptimized src={imageUrl(page.image)} alt={page.alt || page.title} fill sizes="(max-width:767px) 92vw,760px" className="object-cover"/></span></div></figure>}<div className="topic-sections">{page.blocks?.map((block: CmsPayload, index: number) => block.type === "heading" ? <h2 className="topic-prose section-anchor" id={`bagian-${index + 1}`} key={index} data-split>{block.text}</h2> : <p className="topic-prose" key={index} data-reveal>{block.text}</p>)}</div></>;
}
