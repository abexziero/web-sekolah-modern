import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getCmsService } from "@/lib/server/cms";
import { cmsSchemas } from "@/lib/cms-validation";
import { contentModules } from "@/lib/admin-content";
import { OperatorBar } from "@/components/admin/operator-bar";
import { ContentList } from "@/components/admin/content-list";
import { importCmsExamples } from "./actions";
export default async function CmsDashboard({ searchParams }: { searchParams: Promise<{ type?: string; trash?: string;q?:string;status?:string;page?:string }> }) {
  const user = await requireOperator(); if(user.role !== "super_admin") notFound();
  const params = await searchParams, type = params.type, trash = params.trash === "1"; if(type && !cmsSchemas[type]) notFound();
  const result=await getCmsService().search(await headers(),{...params,trash}),entries=result.rows,label=contentModules.find(m=>m.type===type)?.label||"Konten madrasah";
  const single=["home","navigation","settings"].includes(type||""),existing=single?entries[0]:null;
  const base = `/admin/konten${type ? `?type=${type}` : ""}`;
  return <>
    <OperatorBar user={user} type={type}/>
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow">Kelola website</p>
        <h1>{label}{trash ? " · Sampah" : ""}.</h1>
        <p className="admin-lead">Tambah konten, simpan draft, lalu tinjau sebelum diterbitkan.</p>
      </div>
      <Link href={existing?`/admin/konten/${existing.id}`:`/admin/konten/baru${type?`?type=${type}`:""}`} className="button">{single?(existing?`Ubah ${label}`:`Siapkan ${label}`):"Tambah konten"}</Link>
    </header>
    <div className="admin-tabs">
      <Link href={base} aria-current={!trash ? "page" : undefined}>Daftar aktif</Link>
      {!single&&<Link href={`${base}${type ? "&" : "?"}trash=1`} aria-current={trash ? "page" : undefined}>Sampah</Link>}
    </div>
    <ContentList key={JSON.stringify(params)} kind="cms" result={result} values={{...(type?{type}:{}),...(trash?{trash:"1"}:{})}} trash={trash} rows={entries.map((entry: Record<string, any>) => ({ id: entry.id, title: entry.payload?.title || entry.payload?.name || entry.payload?.question || entry.entry_key, key: entry.entry_key, type: cmsSchemas[entry.type]?.label, status: entry.status, live:!!entry.published_revision_id, version: entry.version, image: entry.payload?.image, updated: new Date(entry.updated_at).toISOString(), protected: ["home", "navigation", "settings"].includes(entry.type) }))} />
    {!trash && !type && <details className="admin-panel">
      <summary>Persiapan website pertama kali</summary>
      <form action={importCmsExamples}>
        <p>Siapkan konten contoh sebagai draft. Konten yang sudah ada tetap dipertahankan.</p>
        <button className="button button-outline">Siapkan konten awal sebagai draft</button>
      </form>
    </details>}
  </>;
}
