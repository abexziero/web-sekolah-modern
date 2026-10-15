import { randomUUID } from "node:crypto";
import {readAdminPage} from "./admin-search.mjs";
import { readOperator } from "./auth-core.mjs";
import { validateMedia } from "./media-validation.mjs";
export class MediaError extends Error {
}
export async function linkRevisionMedia(db, { revisionId, payload, article = false, user }) {
    const found = new Map();
    function scan(value, key = "") {
        if (typeof value === "string") {
            const id = key === "mediaId" ? value : /^\/media\/([a-f0-9-]{36})$/.exec(value)?.[1];
            if (id)
                found.set(id, key === "mediaId" ? "application/pdf" : "image/");
        }
        else if (Array.isArray(value))
            value.forEach(v => scan(v));
        else if (value && typeof value === "object")
            for (const [k, v] of Object.entries(value))
                scan(v, k);
    }
    scan(payload);
    for (const [id, mime] of found) {
        const [[row]] = await db.execute("SELECT id,mime FROM media WHERE id=? AND deleted_at IS NULL FOR UPDATE", [id]);
        if (!row || !row.mime.startsWith(mime))
            throw new MediaError("Media tidak ditemukan atau format tidak sesuai.");
        if (user.role !== "super_admin" && !await isPublicMedia(db, id))
            throw new MediaError("Media belum tersedia untuk editor.");
        await db.execute(`INSERT INTO ${article ? "article_revision_media" : "cms_revision_media"}(revision_id,media_id) VALUES(?,?)`, [revisionId, id]);
    }
}
export async function isPublicMedia(db, id) {
    const [[row]] = await db.execute("SELECT (EXISTS(SELECT 1 FROM cms_revision_media m JOIN cms_entries e ON e.published_revision_id=m.revision_id WHERE m.media_id=? AND e.status<>'archived') OR EXISTS(SELECT 1 FROM article_revision_media m JOIN articles a ON a.published_revision_id=m.revision_id WHERE m.media_id=? AND a.status<>'archived')) AS available", [id, id]);
    return !!row.available;
}
export function createMediaService(pool, auth, storage) {
    async function operator(headers) {
        const user = await readOperator(auth, pool, headers);
        if (user.role !== "super_admin")
            throw new MediaError("Hanya Super Admin dapat mengelola media.");
        return user;
    }
    return { operator,
        async search(headers,input={}){await operator(headers);return readAdminPage(pool,"media",input);},
        async list(headers, trash = false) {
            await operator(headers);
            const [rows] = await pool.query(`SELECT id,mime,size,width,height,alt,caption,credit,created_at,deleted_at FROM media WHERE deleted_at IS ${trash ? "NOT NULL" : "NULL"} ORDER BY created_at DESC LIMIT 500`);
            return rows;
        },
        async upload(headers, { bytes, filename, contentType, alt, caption = "", credit = "" }) {
            const user = await operator(headers);
            if (typeof alt !== "string" || !alt.trim() || alt.length > 250 || typeof caption !== "string" || caption.length > 400 || typeof credit !== "string" || credit.length > 250)
                throw new MediaError("Isi teks alternatif (maksimal250karakter), caption/kredit sesuai batas.");
            let validated;
            try {
                validated = await validateMedia(bytes, { filename, contentType });
            }
            catch (e) {
                throw new MediaError(e.message);
            }
            const id = randomUUID();
            const db = await pool.getConnection();
            try {
                await storage.put(id, validated.bytes);
                await db.beginTransaction();
                await db.execute("INSERT INTO media(id,storage_key,mime,size,width,height,alt,caption,credit,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?,?)", [id, id, validated.mime, validated.size, validated.width || null, validated.height || null, alt.trim(), caption, credit, user.id]);
                await db.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,'media.upload',?)", [randomUUID(), user.id, id]);
                await db.commit();
            }
            catch (e) {
                await db.rollback();
                await storage.remove(id).catch(() => {
                });
                throw e;
            }
            finally {
                db.release();
            }
            return id;
        },
        async read(headers, id) {
            if (!/^[a-f0-9-]{36}$/.test(id))
                throw new MediaError("File tidak ditemukan.");
            const [[row]] = await pool.execute("SELECT * FROM media WHERE id=? AND deleted_at IS NULL", [id]);
            if (!row)
                throw new MediaError("File tidak ditemukan.");
            if (!await isPublicMedia(pool, id))
                await operator(headers);
            return { bytes: await storage.read(row.storage_key), mime: row.mime, alt: row.alt };
        },
        async remove(headers, id) {
            const user = await operator(headers), db = await pool.getConnection();
            try {
                await db.beginTransaction();
                const [[row]] = await db.execute("SELECT storage_key FROM media WHERE id=? AND deleted_at IS NULL FOR UPDATE", [id]);
                if (!row)
                    throw new MediaError("File tidak ditemukan.");
                const [[{ used }]] = await db.execute("SELECT (EXISTS(SELECT 1 FROM cms_revision_media WHERE media_id=?) OR EXISTS(SELECT 1 FROM article_revision_media WHERE media_id=?)) AS used", [id, id]);
                if (used)
                    throw new MediaError("File masih dipakai konten atau riwayat revisi.");
                await db.execute("UPDATE media SET deleted_at=UTC_TIMESTAMP(3) WHERE id=?", [id]);
                await db.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,'media.remove',?)", [randomUUID(), user.id, id]);
                await db.commit();
            }
            catch (e) {
                await db.rollback();
                throw e;
            }
            finally {
                db.release();
            }
        },
        async restore(headers,id) {
            const user = await operator(headers), db = await pool.getConnection();
            try {
                await db.beginTransaction();
                const [result] = await db.execute("UPDATE media SET deleted_at=NULL WHERE id=? AND deleted_at IS NOT NULL",[id]);
                if(!result.affectedRows) throw new MediaError("File tidak ditemukan di Sampah.");
                await db.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,'media.restore',?)",[randomUUID(),user.id,id]);
                await db.commit();
            } catch(error) {await db.rollback();throw error;} finally {db.release();}
        },
        async update(headers,{id,alt,caption="",credit=""}) {
            const user=await operator(headers);
            if(typeof alt!=="string"||!alt.trim()||alt.length>250||typeof caption!=="string"||caption.length>400||typeof credit!=="string"||credit.length>250) throw new MediaError("Deskripsi media tidak valid.");
            const db=await pool.getConnection();
            try {
                await db.beginTransaction();
                const [[row]]=await db.execute("SELECT id FROM media WHERE id=? AND deleted_at IS NULL FOR UPDATE",[id]);
                if(!row) throw new MediaError("File tidak ditemukan.");
                await db.execute("UPDATE media SET alt=?,caption=?,credit=? WHERE id=?",[alt.trim(),caption,credit,id]);
                await db.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,'media.update',?)",[randomUUID(),user.id,id]);
                await db.commit();
            } catch(error) {await db.rollback();throw error;} finally {db.release();}
        }
    };
}
