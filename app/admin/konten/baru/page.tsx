import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { OperatorBar } from "@/components/admin/operator-bar";
import { CmsForm } from "@/components/admin/cms-form";
import {cmsSchemas} from "@/lib/cms-validation";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCmsService} from "@/lib/server/cms";
export default async function NewCmsPage({searchParams}:{searchParams:Promise<{type?:string}>}) {
    const user = await requireOperator();
    if (user.role !== "super_admin")
        notFound();
    const type=(await searchParams).type;if(type&&!cmsSchemas[type])notFound();
    if(type&&["home","navigation","settings"].includes(type)){const existing=(await getCmsService().search(await headers(),{type})).rows[0];if(existing)redirect(`/admin/konten/${existing.id}`);}
    const pages=await getCmsService().pageChoices(await headers());
    return <><OperatorBar user={user} type={type}/><header className="admin-page-heading"><h1>Tambah {type?cmsSchemas[type].label:"konten"}.</h1></header><CmsForm key={type||"page"} initialType={type} operatorId={user.id} pages={pages}/></>;
}
