const sources = {
  cms: { from: "cms_entries e LEFT JOIN cms_revisions r ON r.id=e.current_revision_id", select: "e.*,r.payload", text: "CONCAT_WS(' ',e.entry_key,JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.title')),JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.name')),JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.question')))" },
  news: { from: "articles e LEFT JOIN article_revisions r ON r.id=e.current_revision_id", select: "e.*,r.title,r.image", text: "CONCAT_WS(' ',e.slug,r.title,r.category)" },
  media: { from: "media e", select: "e.id,e.mime,e.size,e.width,e.height,e.alt,e.caption,e.credit,e.created_at,e.deleted_at", text: "CONCAT_WS(' ',e.alt,e.caption,e.credit)" },
};
export async function readAdminPage(pool, kind, input = {}) {
  const source = sources[kind]; if (!source) throw new Error("Jenis daftar tidak valid.");
  const q = String(input.q || "").trim().slice(0, 160), status = ["draft", "review", "published", "archived"].includes(input.status) ? input.status : "";
  const where = [`e.deleted_at IS ${input.trash ? "NOT NULL" : "NULL"}`], args = [];
  if (q) { where.push(`LOCATE(LOWER(?),LOWER(${source.text}))>0`); args.push(q); }
  if (status && kind !== "media") { where.push("e.status=?"); args.push(status); }
  if (kind === "cms" && input.type) { where.push("e.type=?"); args.push(input.type); }
  if (kind === "news" && input.ownerId) { where.push("e.author_id=?"); args.push(input.ownerId); }
  if (kind === "media" && ["image", "pdf"].includes(input.format)) { where.push(input.format === "pdf" ? "e.mime='application/pdf'" : "e.mime LIKE 'image/%'"); }
  const filter = where.join(" AND ");
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM ${source.from} WHERE ${filter}`, args);
  const total = Number(count.total), pages = Math.max(1, Math.ceil(total / 20)), requested = Number(input.page), page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, pages)) : 1;
  const [rows] = await pool.execute(`SELECT ${source.select} FROM ${source.from} WHERE ${filter} ORDER BY e.${kind === "media" ? "created_at" : "updated_at"} DESC,e.id LIMIT 20 OFFSET ?`, [...args, (page - 1) * 20]);
  return { rows: kind === "cms" ? rows.map(row => ({ ...row, payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload })) : rows, total, page, pages, q, status };
}
