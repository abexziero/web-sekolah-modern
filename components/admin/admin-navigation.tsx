"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { contentModules } from "@/lib/admin-content";
import { LayoutDashboard, FileText, Newspaper, Users, CalendarDays, Images, FolderOpen, Settings, Contact, Menu, Library, MessagesSquare, Bell, PanelTop } from "lucide-react";
import { useState } from "react";
const icons: Record<string, typeof FileText> = { home: LayoutDashboard, page: FileText, teacher: Contact, event: CalendarDays, album: Images, document: FolderOpen, announcement: Bell, faq: MessagesSquare, navigation: PanelTop, settings: Settings };
export function AdminNavigation({ admin,activeType }: { admin: boolean;activeType?:string }) {
  const path = usePathname(), params = useSearchParams(), [open, setOpen] = useState(false);
  const links = [{ href: "/admin", label: "Ringkasan", icon: LayoutDashboard }, ...(admin ? contentModules.slice(0, 2).map(m => ({ href: `/admin/konten?type=${m.type}`, label: m.label, icon: icons[m.type] })) : []), { href: "/admin/berita", label: "Berita madrasah", icon: Newspaper }, ...(admin ? [...contentModules.slice(2).map(m => ({ href: `/admin/konten?type=${m.type}`, label: m.label, icon: icons[m.type] })), { href: "/admin/media", label: "Media", icon: Library }, { href: "/admin/akun", label: "Akun", icon: Users }] : [])];
  return <>
    <button type="button" className="admin-menu-toggle" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen(!open)}><Menu size={20} /> Menu pengelolaan</button>
    <nav id="admin-sidebar" className={`admin-sidebar ${open ? "is-open" : ""}`} aria-label="Navigasi operator">
      <p className="eyebrow">Ruang kelola</p>
      {links.filter(link=>!/[?&]type=(settings|navigation)|\/akun/.test(link.href)).map(({ href, label, icon: Icon }) => {
        const [base, query] = href.split("?"), active = base === "/admin/konten" ? path.startsWith(base) && (activeType||params.get("type")) === new URLSearchParams(query).get("type") : base === "/admin" ? path === base : path.startsWith(base);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
          <Icon size={18} aria-hidden="true" />
          {label}
        </Link>;
      })}
      {admin&&<details className="admin-nav-advanced" open={path.startsWith("/admin/akun")||["settings","navigation"].includes(activeType||params.get("type")||"")}><summary>Pengaturan lanjutan</summary>{links.filter(link=>/[?&]type=(settings|navigation)|\/akun/.test(link.href)).map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)}><Icon size={18} aria-hidden="true"/>{label}</Link>)}<Link href="/admin/konten"><FolderOpen size={18} aria-hidden="true"/>Konten website</Link></details>}
    </nav>
  </>;
}
