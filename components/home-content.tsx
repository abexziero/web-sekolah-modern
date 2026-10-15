import Image from "next/image";
import Link from "next/link";
import { gallery, faqs } from "@/lib/school-content";
import { agenda } from "@/lib/preview-content";
import { DownloadList } from "@/components/download-list";
import { NewsCards } from "@/components/news-cards";
import type { NewsView } from "@/lib/news-types";
import {CmsCollection} from "./cms-collection";
import {defaultSettings} from "@/lib/cms-seed";
import { defaultHome } from "@/lib/cms-defaults";
import { HomeSections } from "./home-sections";
import { imageUrl, type CmsPayload } from "@/lib/cms-validation";
import { SiteFooter } from "@/components/site-footer";
import { TeacherCards } from "@/components/teacher-cards";
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, Mail, MapPin, MessageCircle, Monitor, Newspaper, Phone, Trophy } from "lucide-react";
import { PageMotion } from "@/components/page-motion";
import { SiteHeader } from "@/components/site-header";
import SpotlightCard from "@/components/spotlight-card";
import Masonry from "@/components/masonry";
const defaultSummaries = [
  { label: "Profil madrasah", href: "#profil", icon: BookOpen },
  { label: "Fasilitas madrasah", href: "#fasilitas", icon: Monitor },
  { label: "Informasi sekolah", href: "#informasi", icon: Newspaper },
  { label: "Kontak madrasah", href: "#kontak", icon: MapPin }
];

export function HomeContent({ home = defaultHome, news, preview = true, settings = defaultSettings, collections = {} }: {home?: CmsPayload; news: NewsView[]; preview?: boolean; settings?:CmsPayload; collections?:Record<string,CmsPayload[]>}) {
  const copy = (id: string) => home.copy.find((item: {id:string;text:string}) => item.id === id)?.text ?? defaultHome.copy.find(item => item.id === id)?.text ?? "";
  const quickLinks:{label:string;href:string}[]=home.quickLinks||defaultHome.quickLinks;
  const summaries=quickLinks.map((v:{label:string;href:string},i:number)=>({...v,icon:defaultSummaries[i]?.icon||BookOpen}));
  const cards:{id:string;title:string;description:string;image:string;alt:string;href:string;section:string}[]=home.cards||defaultHome.cards;
  const experiences=cards.filter(v=>v.section==="facility").map(v=>({...v,icon:Monitor}));
  const services=cards.filter(v=>v.section==="service");
  const achievements=cards.filter(v=>v.section==="achievement");
  return (
    <>
      <SiteHeader />
      <main id="konten" tabIndex={-1}><HomeSections sections={home.sections}>
        <section id="beranda" className="hero section-anchor" aria-labelledby="hero-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true">
          <div className="hero-image">
            <Image unoptimized src={imageUrl(home.images.find((v: {id:string}) => v.id === "hero")?.image || "school.jpg")} alt={home.images.find((v: {id:string}) => v.id === "hero")?.alt || ""} style={{objectPosition:`${home.images.find((v:{id:string})=>v.id==="hero")?.focalX ?? 50}% ${home.images.find((v:{id:string})=>v.id==="hero")?.focalY ?? 50}%`}} fill sizes="100vw" preload className="object-cover" />
          </div>
            </div>
          <div className="container-wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow mb-5" data-reveal>{copy("text-1")}</p>
              <h1 id="hero-heading" data-split>{copy("text-2")}<br />{" "}{copy("text-3")}</h1>
              <p className="hero-description" data-reveal>{copy("text-4")}</p>
              <div className="mt-7 flex flex-wrap gap-3" data-reveal>
                <a href="#profil" className="button">{copy("text-5")}<ArrowRight size={17} aria-hidden="true" /></a>
                <a href="#kontak" className="button button-outline">{copy("text-6")}</a>
              </div>
            </div>
            <aside className="hero-summary" aria-labelledby="summary-heading" data-reveal>
              <h2 id="summary-heading">{copy("text-7")}</h2>
              <div className="hero-summary-grid">
                {summaries.map(({ label, href, icon: Icon }) => (
                  <a href={href} key={href}><span><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span><strong>{label}</strong></a>
                ))}
              </div>
            </aside>
          </div>
          <div className="hero-strip"><div className="container-wrap">
            {settings.phone&&(<a href={`tel:${settings.phone}`}><Phone size={16} aria-hidden="true" />{settings.phone}</a>)}
            <span><MapPin size={16} aria-hidden="true" />{settings.location}</span>
          </div></div>
          </div>
        </section>

        <section id="pengumuman" className="section-anchor" aria-label="Pengumuman penting">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap announcement" data-reveal>
            {collections.announcement?.length ? <CmsCollection type="announcement" entries={collections.announcement.filter(entry=>entry.payload.pinned&&(!entry.payload.expiresAt||Date.parse(entry.payload.expiresAt)>Date.now()))}/> : null}<MessageCircle size={20} aria-hidden="true" /><strong>{copy("text-10")}</strong>
            <p>{copy("text-11")}</p>
            <Link href="/informasi/pengumuman" prefetch={false} className="text-link">{copy("text-12")}<ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          </div>
        </section>

        <section id="profil" className="profile-section section-space section-anchor" tabIndex={-1} aria-labelledby="profile-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <div className="section-heading">
              <h2 id="profile-heading" className="section-title" data-split>{copy("text-13")}</h2>
              <p className="section-description" data-reveal>{copy("text-14")}</p>
            </div>
            <div className="profile-grid">
              <article className="profile-item" data-reveal>
                <span className="profile-icon"><MapPin size={25} aria-hidden="true" /></span>
                <h3>{copy("text-15")}</h3>
                <p>{copy("text-16")}</p>
                <Link href="/profil/madrasah" prefetch={false} className="text-link">{copy("text-17")}<ArrowRight size={15} aria-hidden="true" /></Link>
              </article>
              <article id="visi-misi" tabIndex={-1} className="profile-item section-anchor" data-reveal data-delay="0.08">
                <span className="profile-icon"><BookOpen size={25} aria-hidden="true" /></span>
                <h3>{copy("text-18")}</h3>
                <p>{copy("text-19")}</p>
                <Link href="/profil/visi-misi" prefetch={false} className="text-link">{copy("text-20")}<ArrowRight size={15} aria-hidden="true" /></Link>
                <span className="content-note">{copy("text-21")}</span>
              </article>
              <article className="profile-item" data-reveal data-delay="0.16">
                <span className="profile-icon"><Monitor size={25} aria-hidden="true" /></span>
                <h3>{copy("text-22")}</h3>
                <p>{copy("text-23")}</p>
                <Link href="/profil/struktur-organisasi" prefetch={false} className="text-link">{copy("text-24")}<ArrowRight size={15} aria-hidden="true" /></Link>
              </article>
            </div>
            <section id="guru" tabIndex={-1} className="teacher-section section-anchor" aria-labelledby="teacher-heading">
              <div className="section-heading"><h3 id="teacher-heading" className="section-title" data-split>{copy("text-25")}</h3><p className="section-description" data-reveal>{copy("text-26")}</p></div>
              {collections.teacher?<CmsCollection type="teacher" entries={collections.teacher}/>:<TeacherCards heading="h4"/>}
            </section>
            <div className="section-links"><Link href="/profil/sambutan-kepala" prefetch={false} className="text-link">{copy("text-27")}<ArrowRight size={15} aria-hidden="true" /></Link><Link href="/profil/sejarah" prefetch={false} className="text-link">{copy("text-28")}<ArrowRight size={15} aria-hidden="true" /></Link><Link href="/profil/guru-tenaga-kependidikan" prefetch={false} className="text-link">{copy("text-29")}<ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
          </div>
        </section>

        <section id="informasi" className="news-section section-space section-anchor" aria-labelledby="news-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <div className="section-heading"><h2 id="news-heading" className="section-title" data-split>{copy("text-30")}</h2><p className="section-description" data-reveal>{copy("text-31")}</p>{preview && <p className="content-note">{copy("text-32")}</p>}</div>
            <NewsCards articles={news.slice(0, 3)} />
            <div className="section-links"><Link href="/informasi/berita" prefetch={false} className="text-link">{copy("text-33")}<ArrowRight size={15} aria-hidden="true" /></Link><Link href="/informasi/pengumuman" prefetch={false} className="text-link">{copy("text-34")}<ArrowRight size={15} aria-hidden="true" /></Link><Link href="/informasi/agenda" prefetch={false} className="text-link">{copy("text-35")}<ArrowRight size={15} aria-hidden="true" /></Link><Link href="/informasi/galeri" prefetch={false} className="text-link">{copy("text-36")}<ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
          </div>
        </section>

        <section id="fasilitas" className="section-space section-anchor" aria-labelledby="program-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <span id="program" className="section-anchor" aria-hidden="true" />
            <div className="section-heading"><h2 id="program-heading" className="section-title" data-split>{copy("text-37")}</h2><p className="section-description" data-reveal>{copy("text-38")}</p></div>
            <div className="program-grid">
              {experiences.map(({ id, title, description, image, alt, href, icon: Icon }, index) => (
                <SpotlightCard id={id} tabIndex={-1} key={title} role="article" className="experience-card section-anchor" theme="light" spotlightColor="#A8C3AD" intensity={0.26} borderGlow={0.25} proximity={0} flare={false} data-reveal data-delay={index * 0.14}>
                  <div className="experience-image" data-photo-reveal><span className="photo-depth"><Image src={imageUrl(image)} unoptimized={image.startsWith("/media/")} alt={alt} fill sizes="(max-width: 767px) 92vw, 380px" className="object-cover" /></span></div>
                  <div className="experience-content"><Icon size={21} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{description}</p><Link href={href} prefetch={false} className="text-link">{copy("text-39")}<ArrowRight size={15} aria-hidden="true" /><span className="sr-only">{copy("text-40")}{title}</span></Link></div>
                </SpotlightCard>
              ))}
            </div>
          </div>
          </div>
        </section>

        <section id="galeri" tabIndex={-1} className="gallery-section section-space section-anchor" aria-labelledby="gallery-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap"><div className="section-heading"><h2 id="gallery-heading" className="section-title" data-split>{copy("text-41")}</h2><p className="section-description" data-reveal>{copy("text-42")}</p></div>{collections.album?<CmsCollection type="album" entries={collections.album}/>:<Masonry items={gallery}/>}<p className="content-note text-center">{copy("text-43")}</p></div>
          </div>
        </section>

        <section id="agenda" className="agenda-section section-space section-anchor" aria-labelledby="agenda-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <div className="section-heading"><h2 id="agenda-heading" className="section-title" data-split>{copy("text-44")}</h2><p className="section-description" data-reveal>{copy("text-45")}</p></div>
            <p className="content-note text-center">{copy("text-46")}</p>
            <div className="agenda-timeline">{collections.event?<CmsCollection type="event" entries={collections.event}/>:agenda.map((item, index) => <article className="agenda-item" key={item.title} data-reveal data-delay={index * 0.12}><span className="agenda-marker" aria-hidden="true" /><span className="agenda-date"><CalendarDays size={27} strokeWidth={1.4} aria-hidden="true" /></span><div><h3>{item.title}</h3><p>{item.description}</p><span className="content-note">{item.focus}</span><Link href={`/informasi/agenda#kegiatan-${index + 1}`} prefetch={false} className="text-link">{copy("text-47")}<ArrowRight size={15} aria-hidden="true" /></Link></div></article>)}</div>
          </div>
          </div>
        </section>

        <section id="prestasi" tabIndex={-1} className="section-space achievement-section section-anchor" aria-labelledby="achievement-heading">
          <div className="section-scene"><div className="section-backdrop" aria-hidden="true" /><div className="container-wrap">
            <div className="section-heading"><h2 id="achievement-heading" className="section-title" data-split>{copy("text-48")}</h2><p className="section-description" data-reveal>{copy("text-49")}</p><p className="content-note">{copy("text-50")}</p></div>
            <div className="content-card-grid">{achievements.map((item, index) => <article className="profile-item" key={item.href} data-reveal data-delay={index * 0.14}><span className="profile-icon"><Trophy size={25} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href} prefetch={false} className="text-link">{copy("text-51")}<ArrowRight size={15} aria-hidden="true" /></Link></article>)}</div>
          </div></div>
        </section>

        <section id="akses-informasi" className="section-space section-anchor" aria-labelledby="access-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap">
            <div className="section-heading"><h2 id="access-heading" className="section-title" data-split>{copy("text-52")}</h2><p className="section-description" data-reveal>{copy("text-53")}</p><p className="content-note">{copy("text-54")}</p></div>
            <div className="content-card-grid">{services.map((item, index) => <article className="profile-item" key={item.href} data-reveal data-delay={index * 0.14}><span className="profile-icon"><BookOpen size={25} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href} prefetch={false} className="text-link">{copy("text-55")}<ArrowRight size={15} aria-hidden="true" /></Link></article>)}</div>
            <div className="access-grid">
              <div id="unduhan" className="section-anchor" data-reveal><h3>{copy("text-56")}</h3>{collections.document?<CmsCollection type="document" entries={collections.document}/>:<DownloadList/>}<Link href="/layanan/unduhan" prefetch={false} className="text-link">{copy("text-57")}<ArrowRight size={15} aria-hidden="true" /></Link></div>
              <div id="faq" className="faq-list section-anchor" data-reveal><h3>{copy("text-58")}</h3>{collections.faq?<CmsCollection type="faq" entries={collections.faq}/>:faqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
            </div>
          </div>
          </div>
        </section>

        <section id="kontak" className="contact-section section-anchor" tabIndex={-1} aria-labelledby="contact-heading">
          <div className="section-scene">
            <div className="section-backdrop" aria-hidden="true" />
          <div className="container-wrap contact-grid">
            <div><p className="eyebrow mb-4" data-reveal>{copy("text-59")}</p><h2 id="contact-heading" className="section-title" data-split>{copy("text-60")}</h2><p className="section-description mt-5" data-reveal>{copy("text-61")}</p>{settings.whatsapp&&(<a href={settings.whatsapp} target="_blank" rel="noopener noreferrer" className="button mt-6" data-reveal><MessageCircle size={18} aria-hidden="true" />{copy("text-62")}</a>)}</div>
            <address className="contact-details not-italic" data-reveal><div><MapPin size={21} aria-hidden="true" /><div><span>{copy("text-63")}</span><p>{settings.address}</p></div></div><div><Phone size={21} aria-hidden="true" /><div><span>{copy("text-66")}</span>{settings.phone&&(<a href={`tel:${settings.phone}`}>{settings.phone}</a>)}</div></div><div><Mail size={21} aria-hidden="true" /><div><span>{copy("text-68")}</span>{settings.email&&(<a href={`mailto:${settings.email}`}>{settings.email}</a>)}</div></div></address>
          </div>
          </div>
        </section>
      </HomeSections></main>
      <SiteFooter />
      <PageMotion />
    </>
  );
}
