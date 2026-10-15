import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getNewsService } from "@/lib/server/news";
import { NewsError } from "@/lib/server/news-core.mjs";
import { OperatorBar } from "@/components/admin/operator-bar";
import { NewsForm } from "@/components/admin/news-form";
export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOperator();
  const { id } = await params;
  let article;
  try { article = await getNewsService().get(await headers(), id); } catch (error) { if (error instanceof NewsError) notFound(); throw error; }
  return <><OperatorBar user={user} /><header className="admin-page-heading"><div><p className="eyebrow">Penyuntingan berita</p><h1>Rangkai cerita madrasah.</h1><p className="admin-lead">Simpan perubahan sebagai draft. Publikasi selalu melalui tinjauan.</p></div></header><NewsForm key={`${id}:${article.version}`} article={article} role={user.role} operatorId={user.id} /></>;
}
