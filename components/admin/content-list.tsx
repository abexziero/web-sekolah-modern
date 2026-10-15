"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { changeListEntry } from "@/app/admin/list-actions";
import { statusLabels } from "@/lib/admin-content";
import { imageUrl } from "@/lib/cms-validation";
import {ListNavigation,type ListPage} from "./list-navigation";
type Row = { id: string; title: string; type?: string; key: string; status: string; version: number; image?: string; updated: string; protected?: boolean;kind?:"cms"|"news";live?:boolean };
function RowActions({ row, kind, trash, canDelete, onSuccess }: { row: Row; kind: "cms" | "news"; trash: boolean; canDelete: boolean; onSuccess:(message:string)=>void }) {
  const [state, action, pending] = useActionState(async(previous:{error:string;success:string},form:FormData)=>{
    const result=await changeListEntry(previous,form);
    if(result.success)onSuccess(result.success);
    return result;
  }, { error: "", success: "" }), base = kind === "cms" ? "konten" : "berita";
  return <>
    <div className="admin-row-actions">
      {!trash && <>
        <Link href={`/admin/${base}/${row.id}/preview`}>Lihat</Link>
        <Link href={`/admin/${base}/${row.id}`}>Ubah</Link>
      </>}
      {canDelete && !row.protected && <form action={action} onSubmit={e => { if(!trash && !confirm(`Pindahkan “${row.title}” ke Sampah? Konten akan ditarik dari website.`)) e.preventDefault(); }}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="version" value={row.version} />
        <button name="intent" value={trash ? "untrash" : "trash"} disabled={pending} className={trash ? "text-link" : "text-link admin-danger"}>
          {pending ? "Memproses…" : trash ? "Pulihkan" : "Hapus"}
        </button>
      </form>}
    </div>
    {state.error && <p role="alert" className="admin-error">
      {state.error}
    </p>}
    {state.success && <p role="status">
      {state.success}
    </p>}
  </>;
}
export function ContentList({ rows, kind, trash = false, canDelete = true,result,values={} }: { rows: Row[]; kind: "cms" | "news"; trash?: boolean; canDelete?: boolean;result?:ListPage;values?:Record<string,string> }) {
  const [search, setSearch] = useState(result?.q||""), [status, setStatus] = useState(result?.status||values.status||""),[message,setMessage]=useState("");
  const filtered = result?rows:rows.filter(r => (!status || r.status === status) && `${r.title} ${r.type || ""} ${r.key}`.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID")));
  return <section className="admin-panel">
    <form className="admin-list-tools" method="get">
      {Object.entries(values).filter(([key])=>key!=="status").map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}
      <label>Cari konten<input name="q" type="search" placeholder="Judul atau nama…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      {!trash && <label>Status<select name="status" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">Semua status</option>
        {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>
          {label}
        </option>)}
      </select></label>}
      <button className="button button-outline">Cari</button><span>{result?.total??filtered.length} konten</span>
    </form>
    <p role="status" className="admin-feedback">{message}</p>
    <div className="admin-table-wrap">
      <table className="admin-table admin-record-table" role="table">
        <caption className="sr-only">Daftar {kind === "cms" ? "konten" : "berita"}</caption>
        <thead>
          <tr>
            <th>Konten</th>
            <th>Status</th>
            <th>Diperbarui</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(row => <tr key={row.id}>
            <th scope="row">
              <div className="admin-content-title">
                {row.image && <img src={imageUrl(row.image)} alt="" width={64} height={48} loading="lazy" />}
                <div>
                  {trash ? row.title : <Link href={`/admin/${(row.kind||kind) === "cms" ? "konten" : "berita"}/${row.id}`}>
                    {row.title}
                  </Link>}
                  <small>{row.type}</small>
                </div>
              </div>
            </th>
            <td data-label="Status">
              <span className={`admin-status status-${row.status}`}>
                {trash ? "Sampah" : statusLabels[row.status]}
              </span>
              {!trash&&row.live&&row.status!=="published"&&<small>Versi sebelumnya masih tayang</small>}
            </td>
            <td data-label="Diperbarui">
              {new Date(row.updated).toLocaleDateString("id-ID", { timeZone: "Asia/Makassar", dateStyle: "medium" })}
            </td>
            <td data-label="Aksi">
              <RowActions row={row} kind={row.kind||kind} trash={trash} canDelete={canDelete} onSuccess={setMessage}/>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {!filtered.length && <div className="admin-empty">
      <h2>
        {search || status ? "Konten tidak ditemukan." : trash ? "Sampah kosong." : kind === "news" ? "Belum ada berita." : "Belum ada konten."}
      </h2>
      <p>
        {search || status ? "Coba kata pencarian atau status lain." : "Tambahkan konten untuk mulai mengelola website."}
      </p>
    </div>}
    {result&&<ListNavigation base={kind==="cms"?"/admin/konten":"/admin/berita"} result={result} values={values}/>}
    <p className="content-note">Ketik kata lalu pilih Cari untuk mencari seluruh data. Pemulihan tidak langsung menerbitkan konten.</p>
  </section>;
}
