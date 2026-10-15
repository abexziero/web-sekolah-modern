"use client";
import { useState } from "react";
import { confirmLeavingEditor } from "./use-unsaved-changes";
import { AccountForm, type OperatorAccount } from "./account-form";
export function AccountList({ accounts, trash }: { accounts: OperatorAccount[]; trash: boolean }) {
  const [selected, setSelected] = useState<string | null>(null), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [operation,setOperation]=useState("profile");
  function openAccount(id:string,intent:string){
    if(!confirmLeavingEditor())return;
    setSelected(id);setOperation(intent);
    requestAnimationFrame(()=>document.getElementById("account-editor")?.scrollIntoView({block:"start"}));
  }
  const account = accounts.find(a => a.id === selected), filtered = accounts.filter(a => (!status || (status === "active" ? a.active : !a.active)) && `${a.name} ${a.email}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <section className="admin-panel">
      <div className="admin-list-tools">
        <label>Cari akun<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>Status<select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select></label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table admin-record-table" role="table" aria-label="Daftar akun">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => <tr key={a.id}>
              <th>
                {a.name}
              </th>
              <td data-label="Email">
                {a.email}
              </td>
              <td data-label="Peran">
                {a.role === "super_admin" ? "Super Admin" : "Editor"}
              </td>
              <td data-label="Status">
                {a.active ? "Aktif" : "Nonaktif"}
              </td>
              <td data-label="Aksi">
                <div className="admin-row-actions"><button className="text-link" onClick={()=>openAccount(a.id,trash?"untrash":"profile")}>{trash?"Pulihkan":"Ubah"}</button>{!trash&&<button className="text-link admin-danger" onClick={()=>openAccount(a.id,"trash")}>Hapus</button>}</div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p className="admin-empty">Tidak ada akun yang cocok.</p>}
    </section>
    <section id="account-editor" className="admin-account-editor">
      {account ? <>
        <button className="text-link" onClick={() => { if(confirmLeavingEditor()) setSelected(null); }}>Tutup pengelolaan akun</button>
        <AccountForm key={`${account.id}:${operation}`} account={account} trash={trash} initialAction={operation}/>
      </> : !trash && <AccountForm />}
    </section>
  </>;
}
