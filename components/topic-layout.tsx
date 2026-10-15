import {imageUrl} from "@/lib/cms-validation";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PageMotion } from "./page-motion";

type Props = {
  title: string;
  description: string;
  category: string;
  section: string;
  image?: string;
  imageAlt?: string;
  parent?: { title: string; href: string };
  contents?: { id: string; title: string }[];
  wide?: boolean;
  example?: boolean;
  children: ReactNode;
};

export function TopicLayout({ title, description, category, section, image, imageAlt, parent, contents = [], wide = false, example = true, children }: Props) {
  const portrait = image === "teacher-placeholder.svg";
  const stock = image === "study-illustration.jpg";
  const reading = !contents.length && !wide;
  return <>
    <SiteHeader />
    <main id="konten" tabIndex={-1}>
      <section id={section} className="topic-section" aria-labelledby="topic-heading">
        <div className="section-scene">
          <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <header className={`topic-header${reading ? " topic-header-reading" : ""}`}>
              <nav className="breadcrumbs" aria-label="Jejak halaman"><Link href="/">Beranda</Link><span aria-hidden="true">/</span><span>{category}</span>{parent && <><span aria-hidden="true">/</span><Link href={parent.href}>{parent.title}</Link></>}<span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
              <p className="eyebrow" data-reveal>{category}</p>
              <h1 id="topic-heading" className="topic-title" data-split>{title}</h1>
              <p className="section-description" data-reveal>{description}</p>
            </header>
            <div className={`topic-body topic-layout${contents.length ? "" : " topic-layout-wide"}${reading ? " topic-layout-reading" : ""}`}>
              <div className="topic-main">
                {example && <p className="sample-notice">Konten contoh · Materi pratinjau, belum disahkan sekolah.</p>}
                {image && <figure className={`topic-figure${portrait ? " figure-portrait" : ""}`}>
                  <div className="topic-photo" data-photo-reveal><span className="photo-depth"><Image src={imageUrl(image)} unoptimized={image.startsWith("/media/")} alt={imageAlt || (portrait ? "Avatar dummy kepala madrasah, bukan identitas pejabat" : stock ? "Foto ilustrasi pelajar membaca, bukan dokumentasi MA Annur" : image === "school.jpg" ? "Gerbang pondok An-Nur Samarinda" : title)} fill sizes={portrait ? "180px" : "(max-width: 767px) 92vw, 760px"} preload className="object-cover" /></span></div>
                  <figcaption className="content-note">{portrait ? "Ilustrasi kepala madrasah · Avatar dummy, bukan foto atau identitas pejabat sebenarnya." : stock ? <>Foto ilustrasi, bukan dokumentasi MA Annur · Tima Miroshnichenko / <a href="https://www.pexels.com/photo/students-studying-in-the-library-9572464/" target="_blank" rel="noopener noreferrer">Pexels</a></> : "Dokumentasi dari website madrasah sebelumnya."}</figcaption>
                </figure>}
                {children}
                <div className="topic-actions" data-reveal><Link href={parent?.href || "/"} className="text-link">{parent ? "Kembali ke berita" : "Kembali ke beranda"}<ArrowRight size={17} aria-hidden="true" /></Link></div>
              </div>
              {contents.length > 0 && <aside className="topic-aside"><p className="eyebrow">Pada halaman ini</p><nav aria-label="Daftar isi halaman">{contents.map(item => <a key={item.id} href={`#${item.id}`}>{item.title}<ArrowRight size={15} aria-hidden="true" /></a>)}</nav><p className="content-note">Gunakan daftar isi untuk menuju bagian yang ingin dibaca.</p></aside>}
            </div>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
    <PageMotion />
  </>;
}
