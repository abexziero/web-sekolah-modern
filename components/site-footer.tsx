"use client";
import {useSiteConfig} from "./site-config";
import {imageUrl} from "@/lib/cms-validation";
import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  const {settings}=useSiteConfig();
  return (
      <footer className="site-footer">
        <div className="container-wrap">
          <div className="footer-grid">
            <div data-reveal><a href="/#beranda" className="brand"><Image unoptimized src={imageUrl(settings?.logo||"logo.png")} alt="" width={552} height={432} sizes="60px" className="h-12 w-15 object-contain" /><span className="flex flex-col gap-0.5"><strong>{settings?.shortName||"MA ANNUR"}</strong><span className="brand-caption">{settings?.caption||"MADRASAH ALIYAH · SAMARINDA"}</span></span></a><p className="footer-address">{settings?.address||<>Jl. Kebun Raya, RT 08, Tanah Merah<br />Samarinda Utara, Kalimantan Timur</>}</p>{settings?.phone!==""&&(<a href={`tel:${settings?.phone??"+6285250573799"}`} className="footer-contact">{settings?.phone??"0852-5057-3799"}</a>)}{settings?.email!==""&&(<a href={`mailto:${settings?.email??"ma.annur.samarinda@gmail.com"}`} className="footer-contact">{settings?.email??"ma.annur.samarinda@gmail.com"}</a>)}</div>
            {settings?.footerLinks ? <nav aria-label="Akses cepat" data-reveal><h3>Akses cepat</h3>{settings.footerLinks.filter((item:{group:string})=>item.group==="quick").map((item:{label:string;href:string})=><Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>)}</nav> : <nav aria-label="Akses cepat" data-reveal data-delay="0.08"><h3>Akses Cepat</h3><a href="/#beranda">Beranda</a><Link href="/profil/madrasah" prefetch={false}>Profil Madrasah</Link><a href="/#fasilitas">Fasilitas Madrasah</a><Link href="/informasi/galeri" prefetch={false}>Galeri Madrasah</Link><Link href="/informasi/berita" prefetch={false}>Berita Terbaru</Link></nav>}
            {settings?.footerLinks ? <nav aria-label="Informasi madrasah" data-reveal><h3>Informasi madrasah</h3>{settings.footerLinks.filter((item:{group:string})=>item.group==="info").map((item:{label:string;href:string})=><Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>)}</nav> : <nav aria-label="Informasi madrasah" data-reveal data-delay="0.16"><h3>Informasi Madrasah</h3><Link href="/informasi/agenda" prefetch={false}>Agenda</Link><Link href="/layanan/unduhan" prefetch={false}>Pusat Unduhan</Link><Link href="/layanan/faq" prefetch={false}>Pertanyaan Umum</Link><a href="/#kontak">Kontak Sekolah</a></nav>}
          </div>
          <div>{settings?.map&&<a href={settings.map} target="_blank" rel="noopener noreferrer" className="footer-contact">Lihat peta madrasah</a>}{settings?.social?.map((item:{label:string;url:string})=><a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="footer-contact">{item.label}</a>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings?.name||"Madrasah Aliyah Annur Samarinda"}</span><span>{settings?.footerNote??"Pratinjau desain · Materi belum disahkan sekolah"}</span></div>
        </div>
      </footer>
  );
}
