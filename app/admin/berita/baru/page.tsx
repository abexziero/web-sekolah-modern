import { requireOperator } from "@/lib/server/auth";
import { OperatorBar } from "@/components/admin/operator-bar";
import { NewsForm } from "@/components/admin/news-form";
export default async function NewNewsPage() {
  const user = await requireOperator();
  return <><OperatorBar user={user} /><header className="admin-page-heading"><div><p className="eyebrow">Cerita baru</p><h1>Tulis berita.</h1><p className="admin-lead">Sampaikan informasi yang akurat, jelas, dan layak dibagikan.</p></div></header><NewsForm role={user.role} operatorId={user.id} /></>;
}
