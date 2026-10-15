import Image from "next/image";
import { imageUrl, type CmsPayload } from "@/lib/cms-validation";
import Masonry from "./masonry";
export function CmsCollection({ type, entries, preview = false }: {
    type: string;
    entries: CmsPayload[];
    preview?: boolean;
}) {
    const items = entries.map(entry => ({ ...entry.payload, id: entry.id || entry.entry_key })).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!items.length)
        return <p className="content-note">Belum ada informasi yang diterbitkan.</p>;
    if (type === "album")
        return <>{items.map(album => <div key={album.id}>{album.example && <p className="content-note">Konten contoh · Belum disahkan sekolah.</p>}<h3>{album.title}</h3><Masonry items={album.items.map((item: CmsPayload, i: number) => ({ id: `${album.id}-${i}`, img: imageUrl(item.image), title: item.caption || album.title, alt: item.alt, height: 500 }))}/>{album.items.map((item: CmsPayload, i: number) => item.credit && <p className="content-note" key={i}>{item.caption} · {item.credit}</p>)}</div>)}</>;
    return <div className={type === "teacher" ? "teacher-grid" : type === "faq" ? "faq-list" : "topic-sections"}>{items.map(item => <article className={type === "teacher" ? "teacher-card" : "topic-prose"} key={item.id} data-reveal>{item.example && <p className="content-note">Konten contoh · Belum disahkan sekolah.</p>}{type === "faq" ? <details><summary>{item.question}</summary><p>{item.answer}</p></details> : type === "teacher" ? <><div className="teacher-photo"><Image unoptimized src={imageUrl(item.image || "teacher-placeholder.svg")} alt={item.alt || item.name} fill sizes="(max-width:767px) 92vw,380px" className="object-cover"/></div><div className="teacher-content"><h3>{item.name}</h3><strong>{item.role}</strong><p>{item.description}</p></div></> : <><h3>{item.title}</h3><p>{item.description}</p>{type === "event" && <p>{new Date(item.startsAt).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })} WITA · {item.location}</p>}{type === "announcement" && <>{item.expiresAt && Date.parse(item.expiresAt) <= Date.now() && <p className="content-note">Pengumuman telah berakhir.</p>}{item.blocks.map((b: CmsPayload, i: number) => <p key={i}>{b.text}</p>)}</>}{type === "document" && <a href={`/media/${item.mediaId}`} className="text-link" download>Unduh PDF{preview ? " (preview privat)" : ""}</a>}</>}</article>)}</div>;
}
