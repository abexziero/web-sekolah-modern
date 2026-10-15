import { defaultHome } from "./cms-defaults.ts";
import { navigation, schoolPages } from "./school-pages.ts";
import { topicCopy } from "./preview-content.ts";
import {agenda} from "./preview-content.ts";
import {faqs,gallery} from "./school-content.ts";
import { cmsSchemas, type CmsPayload } from "./cms-validation.ts";
export const defaultSettings = { name: "Madrasah Aliyah Annur Samarinda", shortName: "MA ANNUR", caption: "MADRASAH ALIYAH · SAMARINDA", address: "Jl. Kebun Raya, RT 08, Tanah Merah, Samarinda Utara, Kalimantan Timur", location: "Tanah Merah, Samarinda Utara", phone: "0852-5057-3799", email: "ma.annur.samarinda@gmail.com", whatsapp: "https://wa.me/6285250573799?text=Halo%20Admin", map: "", logo: "logo.png", footerNote: "Pratinjau desain · Materi belum disahkan sekolah", social: [], footerLinks: [{ group: "quick", label: "Beranda", href: "/#beranda" }, { group: "quick", label: "Profil Madrasah", href: "/profil/madrasah" }, { group: "quick", label: "Fasilitas Madrasah", href: "/#fasilitas" }, { group: "quick", label: "Galeri Madrasah", href: "/informasi/galeri" }, { group: "quick", label: "Berita Terbaru", href: "/informasi/berita" }, { group: "info", label: "Agenda", href: "/informasi/agenda" }, { group: "info", label: "Pusat Unduhan", href: "/layanan/unduhan" }, { group: "info", label: "Pertanyaan Umum", href: "/layanan/faq" }, { group: "info", label: "Kontak Sekolah", href: "/#kontak" }], example: true };
export const defaultNavigation = { items: navigation.map(item => ({ ...item, href: item.href || "", area: item.area || "", visible: true, children: schoolPages.filter(page => page.area === item.area).map(page => ({ label: page.title, href: `/${page.area}/${page.slug}`, group: page.group || "", visible: true })) })), example: true };
export function cmsExamples(): {
    type: string;
    key: string;
    payload: CmsPayload;
}[] {
    return [
        { type: "home", key: "main", payload: defaultHome },
        { type: "settings", key: "main", payload: defaultSettings },
        { type: "navigation", key: "main", payload: defaultNavigation },
        ...schoolPages.filter(page => !(page.area === "informasi" && page.slug === "berita")).map(page => ({ type: "page", key: `${page.area}/${page.slug}`, payload: { title: page.title, description: page.description, image: page.image || "", alt: page.title, example: true, blocks: (topicCopy[`${page.area}/${page.slug}`] || []).flatMap(s => [{ type: "heading", text: s.heading }, ...s.paragraphs.map(text => ({ type: "paragraph", text })), ...(s.items || []).map(text => ({ type: "paragraph", text: `• ${text}` }))]) } })),
        ...faqs.map((faq,index)=>({type:"faq",key:`contoh-faq-${index+1}`,payload:{...faq,order:index,example:true}})),
        ...agenda.map((event,index)=>({type:"event",key:`contoh-agenda-${index+1}`,payload:{title:event.title,description:`${event.description} Jadwal ini contoh, bukan jadwal resmi sekolah.`,startsAt:`2026-10-${String(16+index).padStart(2,"0")}T00:00:00Z`,endsAt:"",location:"Madrasah (contoh)",example:true}})),
        ...["Pendidik Keagamaan","Pendidik Akademik","Tenaga Administrasi"].map((role,index)=>({type:"teacher",key:`contoh-pendidik-${index+1}`,payload:{name:`Profil contoh ${index+1}`,role,description:"Profil ilustrasi pendamping belajar dan layanan madrasah. Bukan identitas pegawai sebenarnya.",image:"teacher-placeholder.svg",alt:"Avatar contoh, bukan foto pegawai",order:index,example:true}})),
        {type:"album",key:"contoh-lingkungan",payload:{title:"Lingkungan madrasah",items:gallery.map(item=>({image:item.img.replace("/images/",""),alt:item.alt,caption:item.title,credit:"Website madrasah sebelumnya"})),example:true}},
        {type:"announcement",key:"contoh-pengumuman",payload:{title:"Informasi madrasah",description:"Contoh pengumuman untuk ditinjau sekolah.",pinned:false,expiresAt:"",blocks:[{type:"paragraph",text:"Jadwal dan ketentuan resmi akan diperbarui setelah dikonfirmasi pihak madrasah."}],example:true}}
    ].filter(entry => !!cmsSchemas[entry.type]);
}
