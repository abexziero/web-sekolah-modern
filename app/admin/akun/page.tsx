import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getOperatorManagement } from "@/lib/server/operator-management";
import { OperatorBar } from "@/components/admin/operator-bar";
import {AccountList} from "@/components/admin/account-list";
import Link from "next/link";
export default async function AccountsPage({searchParams}:{searchParams:Promise<{trash?:string}>}) {
    const user = await requireOperator();
    if (user.role !== "super_admin")
        notFound();
    const h = await headers(), service = getOperatorManagement();
    const trash=(await searchParams).trash==="1";
    const [accounts, audit] = await Promise.all([service.list(h,trash), service.audit(h)]);
    return <><OperatorBar user={user}/><header className="admin-page-heading"><div><h1>Akun operator.</h1><p className="admin-lead">Super Admin mengelola seluruh website; editor hanya berita sendiri.</p></div></header><div className="admin-tabs"><Link href="/admin/akun" aria-current={!trash?"page":undefined}>Daftar aktif</Link><Link href="/admin/akun?trash=1" aria-current={trash?"page":undefined}>Sampah</Link></div><AccountList accounts={accounts} trash={trash}/><details className="admin-panel"><summary>Aktivitas operator terbaru (100)</summary><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Waktu WITA</th><th>Pelaku</th><th>Aktivitas</th><th>Objek</th></tr></thead><tbody>{audit.map((item: Record<string, any>, i: number) => <tr key={i}><td>{new Date(item.created_at).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })}</td><td>{item.actor || "Operator lokal"}</td><td>{item.action}</td><td>{item.object_id}</td></tr>)}</tbody></table></div></details></>;
}
