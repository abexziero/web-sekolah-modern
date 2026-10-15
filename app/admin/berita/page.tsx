import Link from "next/link";
import { headers } from "next/headers";
import { requireOperator } from "@/lib/server/auth";
import { getNewsService } from "@/lib/server/news";
import { OperatorBar } from "@/components/admin/operator-bar";
import { ContentList } from "@/components/admin/content-list";
export default async function NewsDashboard({ searchParams }: { searchParams: Promise<{ trash?: string;q?:string;status?:string;page?:string }> }) {
  const user = await requireOperator(),params=await searchParams,trash=params.trash === "1",result=await getNewsService().search(await headers(),{...params,trash}),articles=result.rows;
  return <>
    <OperatorBar user={user} />
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow">Publikasi madrasah</p>
        <h1>Kelola berita{trash ? " · Sampah" : ""}.</h1>
        <p className="admin-lead">Mulai dari draft, ajukan tinjauan, lalu terbitkan setelah disetujui.</p>
      </div>
      <Link className="button" href="/admin/berita/baru">Tulis berita</Link>
    </header>
    <div className="admin-tabs">
      <Link href="/admin/berita" aria-current={!trash ? "page" : undefined}>Daftar aktif</Link>
      {user.role === "super_admin" && <Link href="/admin/berita?trash=1" aria-current={trash ? "page" : undefined}>Sampah</Link>}
    </div>
    <ContentList key={JSON.stringify(params)} kind="news" result={result} values={trash?{trash:"1"}:{}} trash={trash} canDelete={user.role === "super_admin"} rows={articles.map((a: Record<string, any>) => ({ id: a.id, title: a.title, key: a.slug, status: a.status, live:!!a.published_revision_id, version: a.version, image: a.image, updated: new Date(a.updated_at).toISOString() }))} />
  </>;
}
