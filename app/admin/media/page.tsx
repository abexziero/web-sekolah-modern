import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getMediaService } from "@/lib/server/media";
import { OperatorBar } from "@/components/admin/operator-bar";
import { MediaManager } from "@/components/admin/media-manager";
export default async function MediaPage() {
    const user = await requireOperator();
    if (user.role !== "super_admin")
        notFound();
    const result = await getMediaService().search(await headers());
    return <><OperatorBar user={user}/><header className="admin-page-heading"><div><h1>Foto dan dokumen.</h1><p className="admin-lead">Unggah foto sekolah atau PDF, lalu pilih saat mengisi halaman. File tetap privat sebelum konten diterbitkan.</p></div></header><MediaManager initial={result.rows} initialPage={result}/></>;
}
