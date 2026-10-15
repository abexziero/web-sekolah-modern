import Link from "next/link";
import { headers } from "next/headers";
import { requireOperator } from "@/lib/server/auth";
import { getCmsService } from "@/lib/server/cms";
import { getNewsService } from "@/lib/server/news";
import { OperatorBar } from "@/components/admin/operator-bar";
import { ContentList } from "@/components/admin/content-list";
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireOperator(), h = await headers(), params = await searchParams, admin = user.role === "super_admin", cms = getCmsService(), news = getNewsService();
  const [newsCounts, cmsCounts, newsQueue, cmsQueue, configurations] = await Promise.all([news.counts(h), admin ? cms.counts(h) : Promise.resolve<Record<string, number>>({}), news.search(h, params), admin ? cms.search(h, params) : Promise.resolve({ rows: [], total: 0 }), admin ? Promise.all(["home", "settings", "navigation"].map(type => cms.search(h, { type }))) : Promise.resolve([])]);
  const rows = [...newsQueue.rows.map((r: Record<string, any>) => ({ ...r, kind: "news", key: r.slug })), ...cmsQueue.rows.map((r: Record<string, any>) => ({ ...r, kind: "cms", title: r.payload?.title || r.payload?.name || r.payload?.question || r.entry_key, key: r.entry_key }))];
  const configs = configurations.map(result => result.rows[0]);
  const pages=admin?await cms.pageChoices(h):[],profilePages=pages.filter((p:{href:string})=>/^\/(profil|fasilitas)\//.test(p.href)),profileReady=profilePages.some((p:{href:string})=>p.href.startsWith("/profil/"))&&profilePages.some((p:{href:string})=>p.href.startsWith("/fasilitas/"))&&profilePages.every((p:{ready:boolean})=>p.ready);
  const tasks = admin ? [{ label: "Identitas dan logo sekolah", entry: configs[1], href: "/admin/konten/baru?type=settings" }, { label: "Alamat dan kontak resmi", entry: configs[1], href: "/admin/konten/baru?type=settings" }, { label: "Foto gerbang dan judul beranda", entry: configs[0], href: "/admin/konten/baru?type=home" }, { label: "Profil dan fasilitas madrasah", entry: profileReady?{id:null,published_revision_id:true}:null, href: "/admin/konten?type=page" }, { label: "Menu dan halaman tujuan", entry: configs[2], href: "/admin/konten/baru?type=navigation" }] : [];
  return <>
    <OperatorBar user={user} />
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow">Ruang operator</p>
        <h1>Ringkasan website.</h1>
        <p className="admin-lead">Pilih pekerjaan, isi informasi, periksa tampilannya, lalu terbitkan.</p>
      </div>
      <Link className="button" href="/admin/berita/baru">Tulis berita</Link>
    </header>

    <div className="admin-summary-grid">
      {[{ label: "Perlu ditinjau", status: "review" }, { label: "Draft tersimpan", status: "draft" }, { label: "Versi sudah diterbitkan", status: "published" }].map(item => <Link className="admin-panel" key={item.status} href={`/admin?status=${item.status}`}>
        <span>
          {item.label}
        </span>
        <strong>
          {(newsCounts[item.status] || 0) + (cmsCounts[item.status] || 0)}
        </strong>
      </Link>)}
    </div>

    {admin && <details className="admin-panel admin-setup" open={configs.some(entry => !entry?.published_revision_id)}>
      <summary>Panduan persiapan website</summary>
      <p className="content-note">Mulai dari profil/halaman pendukung, lalu beranda, identitas, dan menu. Siapkan informasi resmi; periksa pratinjau sebelum menerbitkan. Draft tetap privat; tampilan bawaan digunakan sampai konfigurasi pertama diterbitkan.</p>
      <ol>
        {tasks.map(task => <li key={task.label}>
          <span className="admin-status">
            {task.entry?.published_revision_id ? "Sudah tayang" : task.entry ? "Perlu diperiksa" : "Perlu disiapkan"}
          </span>
          <Link href={task.entry?.id ? `/admin/konten/${task.entry.id}` : task.href}>
            {task.label}
          </Link>
        </li>)}
      </ol>
      <p className="content-note">Untuk menerbitkan: simpan → ajukan tinjauan → buka pratinjau → centang pemeriksaan → terbitkan. Konten contoh perlu disahkan terlebih dahulu.</p>
    </details>}

    <section className="admin-queue">
      <h2>
        {params.status ? "Konten sesuai status pilihan" : "Pekerjaan terbaru"}
      </h2>
      <p className="content-note">Menampilkan hingga 20 berita dan 20 konten website. Buka daftar lengkap untuk halaman berikutnya.</p>
      <div className="admin-row-actions">
        <Link href={`/admin/berita?status=${params.status || ""}`}>Semua berita ({newsQueue.total})</Link>
        {admin && <Link href={`/admin/konten?status=${params.status || ""}`}>Semua konten website ({cmsQueue.total})</Link>}
      </div>
      <ContentList key={JSON.stringify(params)} kind="cms" canDelete={admin} values={params.status ? { status: params.status } : {}} rows={rows.map(r => ({ id: r.id, title: r.title, key: r.key, kind: r.kind as "news" | "cms", type: r.kind === "news" ? "Berita" : "Konten website", status: r.status, version: r.version, live: !!r.published_revision_id, updated: new Date(r.updated_at).toISOString(), protected: ["home", "settings", "navigation"].includes(r.type) }))} />
    </section>
  </>;
}
