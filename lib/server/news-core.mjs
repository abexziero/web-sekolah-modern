import {linkRevisionMedia} from "./media-core.mjs";
import {readAdminPage} from "./admin-search.mjs";
import { randomUUID } from "node:crypto";
import { parseNewsInput } from "../news-validation.ts";
import { readOperator } from "./auth-core.mjs";

export class NewsError extends Error {}
const isId = value => typeof value === "string" && /^[0-9a-f-]{36}$/.test(value);
const validVersion = value => Number.isSafeInteger(value) && value >= 1;
const cardProjection = "r.title, r.excerpt, r.category, r.image, r.image_alt AS alt";
const projection = `${cardProjection}, r.blocks`;
const decode = row => row ? { ...row, blocks: typeof row.blocks === "string" ? JSON.parse(row.blocks) : row.blocks } : null;

export function createNewsService(pool, auth) {
  const operator = headers => readOperator(auth, pool, headers);
  async function transaction(work) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") throw new NewsError("Slug sudah digunakan. Pilih slug lain.");
      throw error;
    } finally { connection.release(); }
  }
  async function articleFor(db, user, id, lock = false, allowDeleted = false) {
    if (!isId(id)) throw new NewsError("Berita tidak ditemukan.");
    const [[article]] = await db.execute(`SELECT * FROM articles WHERE id = ?${lock ? " FOR UPDATE" : ""}`, [id]);
    if (!article || (user.role !== "super_admin" && article.author_id !== user.id)) throw new NewsError("Berita tidak ditemukan.");
    if(article.deleted_at && !allowDeleted) throw new NewsError("Berita berada di Sampah. Pulihkan terlebih dahulu.");
    return article;
  }
  function versionMatches(article, version) {
    if (!validVersion(version) || Number(article.version) !== version) throw new NewsError("Berita telah berubah. Muat ulang sebelum menyimpan.");
  }
  async function audit(db, user, action, id) {
    await db.execute("INSERT INTO audit_logs (id, actor_id, action, object_id) VALUES (?, ?, ?, ?)", [randomUUID(), user.id, `news.${action}`, id]);
  }
  async function revision(db, user, article, input, number) {
    const revisionId = randomUUID();
    await db.execute("INSERT INTO article_revisions (id, article_id, revision_number, title, excerpt, category, image, image_alt, blocks, saved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [revisionId, article.id, number, input.title, input.excerpt, input.category, input.image, input.alt, JSON.stringify(input.blocks), user.id]);
    await linkRevisionMedia(db,{revisionId,payload:input,article:true,user});
    return revisionId;
  }
  return {
    async search(headers,input={}){const user=await operator(headers);return readAdminPage(pool,"news",{...input,ownerId:user.role==="super_admin"?undefined:user.id});},
    async counts(headers){const user=await operator(headers);const [rows]=await pool.execute(`SELECT status,COUNT(*) AS total FROM articles WHERE deleted_at IS NULL${user.role==="super_admin"?"":" AND author_id=?"} GROUP BY status`,user.role==="super_admin"?[]:[user.id]);return Object.fromEntries(rows.map(r=>[r.status,Number(r.total)]));},
    async list(headers, trash = false) {
      const user = await operator(headers);
      const [rows] = await pool.execute(`SELECT a.id, a.slug, a.status, a.version, a.updated_at, a.deleted_at, r.title, r.image FROM articles a LEFT JOIN article_revisions r ON r.id = a.current_revision_id WHERE a.deleted_at IS ${trash ? "NOT NULL" : "NULL"}${user.role === "super_admin" ? "" : " AND a.author_id = ?"} ORDER BY a.updated_at DESC LIMIT 100`, user.role === "super_admin" ? [] : [user.id]);
      return rows;
    },
    async get(headers, id) {
      const user = await operator(headers);
      const article = await articleFor(pool, user, id);
      const [[current]] = await pool.execute(`SELECT ${projection} FROM article_revisions r WHERE r.id = ? AND r.article_id = ?`, [article.current_revision_id, id]);
      const [history] = await pool.execute("SELECT r.id, r.revision_number, r.title, r.created_at, u.name AS saved_by_name FROM article_revisions r JOIN `user` u ON u.id = r.saved_by WHERE r.article_id = ? ORDER BY r.revision_number DESC", [id]);
      return decode({ ...article, ...current, history });
    },
    async save(headers, { id, version, input }) {
      const user = await operator(headers);
      let validated;
      try { validated = parseNewsInput(input); } catch (error) { throw new NewsError(error.message); }
      return transaction(async db => {
        const article = id ? await articleFor(db, user, id, true) : { id: randomUUID(), version: 0 };
        if (id) {
          versionMatches(article, version);
          if (article.status === "review") throw new NewsError("Berita sedang ditinjau. Minta super_admin mengembalikannya ke draft.");
          if (article.published_at && article.slug !== validated.slug) throw new NewsError("Slug artikel yang pernah terbit tidak dapat diubah.");
        } else await db.execute("INSERT INTO articles (id, slug, author_id) VALUES (?, ?, ?)", [article.id, validated.slug, user.id]);
        const next = Number(article.version) + 1;
        const revisionId = await revision(db, user, article, validated, next);
        await db.execute("UPDATE articles SET slug = ?, current_revision_id = ?, version = ?, status = 'draft', updated_at = UTC_TIMESTAMP(3) WHERE id = ?", [validated.slug, revisionId, next, article.id]);
        await audit(db, user, "save", article.id);
        return article.id;
      });
    },
    async transition(headers, { id, version, action }) {
      const user = await operator(headers);
      if (!["submit", "return", "publish", "archive", "trash", "untrash"].includes(action)) throw new NewsError("Aksi tidak valid.");
      if (action !== "submit" && user.role !== "super_admin") throw new NewsError("Hanya super_admin yang dapat melakukan aksi ini.");
      return transaction(async db => {
        const article = await articleFor(db, user, id, true, action === "untrash");
        versionMatches(article, version);
        if (["trash", "untrash"].includes(action)) {
          if(action === "untrash" && !article.deleted_at) throw new NewsError("Berita tidak berada di Sampah.");
          await db.execute("UPDATE articles SET deleted_at=?,status='draft',published_revision_id=NULL,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",[action === "trash" ? new Date() : null,id]);
          await audit(db,user,action,id);return id;
        }
        if (action === "submit" && article.status !== "draft") throw new NewsError("Hanya draft yang dapat diajukan.");
        if (["return", "publish"].includes(action) && article.status !== "review") throw new NewsError("Berita harus melalui tinjauan terlebih dahulu.");
        if (action === "archive" && article.status === "archived") throw new NewsError("Berita sudah diarsipkan.");
        const status = { submit: "review", return: "draft", publish: "published", archive: "archived" }[action];
        await db.execute("UPDATE articles SET status = ?, version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?", [status, id]);
        if (action === "publish") await db.execute("UPDATE articles SET published_revision_id = current_revision_id, published_at = UTC_TIMESTAMP(3) WHERE id = ?", [id]);
        if (action === "archive") await db.execute("UPDATE articles SET published_revision_id = NULL WHERE id = ?", [id]);
        await audit(db, user, action, id);
        return id;
      });
    },
    async restore(headers, { id, version, revisionId }) {
      const user = await operator(headers);
      if (!isId(revisionId)) throw new NewsError("Revisi tidak ditemukan.");
      return transaction(async db => {
        const article = await articleFor(db, user, id, true);
        versionMatches(article, version);
        if (article.status === "review") throw new NewsError("Kembalikan berita ke draft sebelum memulihkan revisi.");
        const [[source]] = await db.execute(`SELECT ${projection} FROM article_revisions r WHERE r.id = ? AND r.article_id = ?`, [revisionId, id]);
        if (!source) throw new NewsError("Revisi tidak ditemukan.");
        const validated = parseNewsInput({ ...decode(source), slug: article.slug });
        const next = Number(article.version) + 1;
        const current = await revision(db, user, article, validated, next);
        await db.execute("UPDATE articles SET current_revision_id = ?, version = ?, status = 'draft', updated_at = UTC_TIMESTAMP(3) WHERE id = ?", [current, next, id]);
        await audit(db, user, "restore", id);
        return id;
      });
    },
    async listPublic() {
      const [rows] = await pool.query(`SELECT a.slug, a.published_at, ${cardProjection} FROM articles a JOIN article_revisions r ON r.id = a.published_revision_id AND r.article_id = a.id WHERE a.published_revision_id IS NOT NULL AND a.status <> 'archived' ORDER BY a.published_at DESC LIMIT 100`);
      return rows;
    },
    async publicBySlug(slug) {
      if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) return null;
      const [[row]] = await pool.execute(`SELECT a.slug, a.published_at, ${projection} FROM articles a JOIN article_revisions r ON r.id = a.published_revision_id AND r.article_id = a.id WHERE a.slug = ? AND a.published_revision_id IS NOT NULL AND a.status <> 'archived'`, [slug]);
      return decode(row);
    }
  };
}
