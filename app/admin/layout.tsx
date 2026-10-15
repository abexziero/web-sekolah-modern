import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import "./admin.css";

export const metadata: Metadata = { title: "Ruang Operator — MA Annur", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell"><a className="skip-link" href="#konten">Lewati ke isi</a><header className="admin-header"><Link href="/admin/berita" className="admin-brand"><Image src="/images/logo.png" alt="" width={42} height={46} className="admin-logo" /><span>MA Annur<small>Ruang operator</small></span></Link><Link className="text-link" href="/">Lihat website</Link></header><main id="konten" tabIndex={-1} className="admin-main">{children}</main></div>;
}
