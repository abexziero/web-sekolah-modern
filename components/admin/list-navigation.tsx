import Link from "next/link";
export type ListPage = { q: string; status: string; page: number; pages: number; total: number };
export function ListNavigation({ base, result, values = {} }: { base: string; result: ListPage; values?: Record<string, string> }) {
  function href(page: number) { const query = new URLSearchParams({ ...values, q: result.q, status: result.status, page: String(page) }); return `${base}?${query}`; }
  return <div className="admin-pagination">
    <p>{result.total} hasil · Halaman {result.page} dari {result.pages}</p>
    <nav aria-label="Halaman daftar">
      {result.page > 1 && <Link className="button button-outline" href={href(result.page - 1)}>Sebelumnya</Link>}
      {result.page < result.pages && <Link className="button button-outline" href={href(result.page + 1)}>Berikutnya</Link>}
    </nav>
  </div>;
}
