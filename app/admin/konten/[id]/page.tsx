import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getCmsService } from "@/lib/server/cms";
import { OperatorBar } from "@/components/admin/operator-bar";
import { CmsForm } from "@/components/admin/cms-form";
import {editorTitle} from "@/lib/cms-editor";
export default async function EditCmsPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const user = await requireOperator();
    if (user.role !== "super_admin")
        notFound();
    const { id } = await params;
    let entry;
    try {
        entry = await getCmsService().get(await headers(), id);
    }
    catch {
        notFound();
    }
    const pages=await getCmsService().pageChoices(await headers());
    return <><OperatorBar user={user} type={entry.type}/><header className="admin-page-heading"><h1>Ubah {editorTitle(entry.type,entry.payload)}.</h1></header><CmsForm key={`${id}:${entry.version}`} entry={entry} operatorId={user.id} pages={pages}/></>;
}
