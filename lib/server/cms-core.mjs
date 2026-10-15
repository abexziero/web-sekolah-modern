import { linkRevisionMedia } from "./media-core.mjs";
import {readAdminPage} from "./admin-search.mjs";
import { randomUUID } from "node:crypto";
import { readOperator } from "./auth-core.mjs";
import { parseCmsInput, cmsSchemas, sectionIds } from "../cms-validation.ts";
import {defaultHome} from "../cms-defaults.ts";
import {homePageTargets} from "../home-targets.ts";
export class CmsError extends Error {
}
const decode = row => row ? ({ ...row, payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload }) : null;
export function createCmsService(pool, auth) {
    async function operator(headers) {
        const user = await readOperator(auth, pool, headers);
        if (user.role !== "super_admin")
            throw new CmsError("Hanya Super Admin yang dapat mengelola konten ini.");
        return user;
    }
    async function tx(work) {
        const db = await pool.getConnection();
        try {
            await db.beginTransaction();
            const result = await work(db);
            await db.commit();
            return result;
        }
        catch (error) {
            await db.rollback();
            if (error.code === "ER_DUP_ENTRY")
                throw new CmsError("Key konten sudah digunakan.");
            throw error;
        }
        finally {
            db.release();
        }
    }
    async function entry(db, id, version, allowDeleted = false) {
        const [[row]] = await db.execute("SELECT * FROM cms_entries WHERE id=? FOR UPDATE", [id]);
        if (!row)
            throw new CmsError("Konten tidak ditemukan.");
        if (row.deleted_at && !allowDeleted) throw new CmsError("Konten berada di Sampah. Pulihkan terlebih dahulu.");
        if (!Number.isSafeInteger(version) || Number(row.version) !== version)
            throw new CmsError("Konten berubah. Muat ulang sebelum menyimpan.");
        return row;
    }
    async function audit(db, user, action, id) {
        await db.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,?,?)", [randomUUID(), user.id, `cms.${action}`, id]);
    }
    async function revise(db, user, row, payload, next) {
        const id = randomUUID();
        await db.execute("INSERT INTO cms_revisions(id,entry_id,revision_number,payload,saved_by) VALUES(?,?,?,?,?)", [id, row.id, next, JSON.stringify(payload), user.id]);
        await linkRevisionMedia(db, { revisionId: id, payload, user });
        return id;
    }
    async function published(db) {
        const [rows] = await db.query("SELECT e.id,e.type,e.entry_key,r.payload FROM cms_entries e JOIN cms_revisions r ON r.id=e.published_revision_id WHERE e.status<>'archived'");
        return rows.map(decode);
    }
    async function validatePublication(db, target, payload, archive) {
        const rows = (await published(db)).filter(r => r.id !== target.id);
        if (!archive)
            rows.push({ ...target, payload });
        const home = rows.find(r => r.type === "home")?.payload;
        const [[presence]]=await db.query("SELECT EXISTS(SELECT 1 FROM cms_entries WHERE type='home') AS configured");
        const ids = new Set(home ? home.sections.filter(s => s.visible).map(s => s.id) : presence.configured ? [] : sectionIds);
        if (ids.has("profil")) {
            ids.add("guru");
            ids.add("visi-misi");
        }
        if (ids.has("akses-informasi")) {
            ids.add("unduhan");
            ids.add("faq");
        }
        if (ids.has("fasilitas")) {
            ids.add("program");
            for(const card of (home?.cards||defaultHome.cards))if(card.section==="facility")ids.add(card.id);
        }
        const pages = new Set(rows.filter(r => r.type === "page").map(r => `/${r.entry_key}`));
        const nav = rows.find(r => r.type === "navigation")?.payload;
        const settings = rows.find(r => r.type === "settings")?.payload;
        const fixedLinks=home ? home.sections.filter(section=>section.visible).flatMap(section=>homePageTargets[section.id]||[]) : [];
        const links = [...(nav?.items || []).filter(i => i.visible).flatMap(i => [i.href, ...i.children.filter(c => c.visible).map(c => c.href)]), ...(home?.quickLinks || []).map(item => item.href), ...(home?.cards || []).filter(item=>ids.has({facility:"fasilitas",service:"akses-informasi",achievement:"prestasi"}[item.section])).map(item => item.href), ...(settings?.footerLinks || []).map(item => item.href),...fixedLinks].filter(Boolean);
        for (const href of links) {
            const [path, hash] = href.split("#");
            if ((!path || path === "/") && hash && !ids.has(hash))
                throw new CmsError(`Tujuan section ${hash} belum tersedia. Sesuaikan tautan terlebih dahulu.`);
            if (path && path !== "/" && !pages.has(path) && path !== "/informasi/berita")
                throw new CmsError(`Halaman ${path} belum diterbitkan atau masih dipakai tautan publik.`);
            if(path&&path!=="/"&&hash){const page=rows.find(row=>row.type==="page"&&`/${row.entry_key}`===path);const anchors=page?new Set([page.entry_key.split("/")[0],...page.payload.blocks.flatMap((block,index)=>block.type==="heading"?[`bagian-${index+1}`]:[])]):new Set();if(!anchors.has(hash))throw new CmsError(`Anchor ${hash} tidak tersedia pada halaman tujuan.`);}
        }
        if (home && !ids.has("profil"))
            throw new CmsError("Section Profil masih dituju tombol hero. Pertahankan section Profil.");
    }
    return {
        async search(headers,input={}){await operator(headers);return readAdminPage(pool,"cms",input);},
        async counts(headers){await operator(headers);const [rows]=await pool.query("SELECT status,COUNT(*) AS total FROM cms_entries WHERE deleted_at IS NULL GROUP BY status");return Object.fromEntries(rows.map(r=>[r.status,Number(r.total)]));},
        async pageChoices(headers){await operator(headers);const [rows]=await pool.query("SELECT e.entry_key,e.published_revision_id,r.payload FROM cms_entries e JOIN cms_revisions r ON r.id=e.current_revision_id WHERE e.type='page' AND e.deleted_at IS NULL ORDER BY e.entry_key");return rows.map(row=>({label:decode(row).payload.title,href:`/${row.entry_key}`,ready:!!row.published_revision_id}));},
        async list(headers, type, trash = false) {
            await operator(headers);
            const [rows] = await pool.execute(`SELECT e.id,e.type,e.entry_key,e.status,e.version,e.updated_at,e.deleted_at,r.payload FROM cms_entries e LEFT JOIN cms_revisions r ON r.id=e.current_revision_id WHERE (?='' OR e.type=?) AND e.deleted_at IS ${trash ? "NOT NULL" : "NULL"} ORDER BY e.type,e.entry_key LIMIT 500`, [type || "", type || ""]);
            return rows.map(decode);
        },
        async get(headers, id) {
            await operator(headers);
            const [[row]] = await pool.execute("SELECT e.*,r.payload FROM cms_entries e JOIN cms_revisions r ON r.id=e.current_revision_id WHERE e.id=?", [id]);
            if (!row || row.deleted_at)
                throw new CmsError("Konten tidak ditemukan.");
            const [history] = await pool.execute("SELECT r.id,r.revision_number,r.created_at,u.name AS saved_by_name FROM cms_revisions r JOIN `user` u ON u.id=r.saved_by WHERE r.entry_id=? ORDER BY r.revision_number DESC", [id]);
            return { ...decode(row), history };
        },
        async save(headers, { id, type, key, version, payload }) {
            const user = await operator(headers);
            let clean;
            try {
                clean = parseCmsInput(type, payload);
            }
            catch (e) {
                throw new CmsError(e.message);
            }
            if (typeof key !== "string" || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(key) || key.length > 160 || (["home", "settings", "navigation"].includes(type) && key !== "main"))
                throw new CmsError("Key konten tidak valid (gunakan main untuk pengaturan tunggal).");
            if (type === "page" && (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(key) || ["admin", "api", "media"].includes(key.split("/")[0]) || key === "informasi/berita"))
                throw new CmsError("URL halaman tidak valid atau dipakai sistem.");
            return tx(async (db) => {
                const row = id ? await entry(db, id, version) : { id: randomUUID(), version: 0, type, entry_key: key };
                if (row.type !== type || row.entry_key !== key)
                    throw new CmsError("Jenis dan key tidak dapat diubah.");
                if (row.status === "review")
                    throw new CmsError("Kembalikan ke draft sebelum menyunting.");
                if (!id)
                    await db.execute("INSERT INTO cms_entries(id,type,entry_key,owner_id) VALUES(?,?,?,?)", [row.id, type, key, user.id]);
                const revisionId = await revise(db, user, row, clean, Number(row.version) + 1);
                await db.execute("UPDATE cms_entries SET current_revision_id=?,version=version+1,status='draft',updated_at=UTC_TIMESTAMP(3) WHERE id=?", [revisionId, row.id]);
                await audit(db, user, "save", row.id);
                return row.id;
            });
        },
        async transition(headers, { id, version, action }) {
            const user = await operator(headers);
            if (!["submit", "return", "publish", "archive", "trash", "untrash"].includes(action))
                throw new CmsError("Aksi tidak valid.");
            return tx(async (db) => {
                await db.query("SELECT id FROM cms_publication_lock WHERE id=1 FOR UPDATE");
                const row = await entry(db, id, version, action === "untrash");
                if (["trash", "untrash"].includes(action)) {
                    if (["home", "navigation", "settings"].includes(row.type)) throw new CmsError("Pengaturan utama tidak dapat dihapus.");
                    if (action === "untrash" && !row.deleted_at) throw new CmsError("Konten tidak berada di Sampah.");
                    if (action === "trash") await validatePublication(db, row, null, true);
                    await db.execute("UPDATE cms_entries SET deleted_at=?,status='draft',published_revision_id=NULL,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?", [action === "trash" ? new Date() : null, id]);
                    await audit(db,user,action,id);
                    return id;
                }
                if(action==="archive"&&["home","navigation","settings"].includes(row.type))throw new CmsError("Pengaturan utama tidak dapat diarsipkan. Terbitkan revisi pengganti.");
                const [[revision]] = await db.execute("SELECT payload FROM cms_revisions WHERE id=?", [row.current_revision_id]);
                const payload = decode(revision).payload;
                if (action === "submit" && row.status !== "draft")
                    throw new CmsError("Hanya draft yang dapat diajukan.");
                if (["return", "publish"].includes(action) && row.status !== "review")
                    throw new CmsError("Ajukan tinjauan sebelum publikasi.");
                if (["publish", "archive"].includes(action))
                    await validatePublication(db, row, payload, action === "archive");
                const status = { submit: "review", return: "draft", publish: "published", archive: "archived" }[action];
                await db.execute("UPDATE cms_entries SET status=?,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?", [status, id]);
                if (action === "publish")
                    await db.execute("UPDATE cms_entries SET published_revision_id=current_revision_id,published_at=UTC_TIMESTAMP(3) WHERE id=?", [id]);
                if (action === "archive")
                    await db.execute("UPDATE cms_entries SET published_revision_id=NULL WHERE id=?", [id]);
                await audit(db, user, action, id);
                return id;
            });
        },
        async restore(headers, { id, version, revisionId }) {
            const user = await operator(headers);
            return tx(async (db) => {
                const row = await entry(db, id, version);
                if (row.status === "review")
                    throw new CmsError("Kembalikan ke draft terlebih dahulu.");
                const [[revision]] = await db.execute("SELECT payload FROM cms_revisions WHERE entry_id=? AND id=?", [id, revisionId]);
                if (!revision)
                    throw new CmsError("Revisi tidak ditemukan.");
                const payload = parseCmsInput(row.type, decode(revision).payload);
                const next = await revise(db, user, row, payload, Number(row.version) + 1);
                await db.execute("UPDATE cms_entries SET current_revision_id=?,version=version+1,status='draft',updated_at=UTC_TIMESTAMP(3) WHERE id=?", [next, id]);
                await audit(db, user, "restore", id);
                return id;
            });
        },
        async publicByKey(type, key) {
            if (!cmsSchemas[type])
                return null;
            const [[row]] = await pool.execute("SELECT e.type,e.entry_key,e.published_at,r.payload FROM cms_entries e JOIN cms_revisions r ON r.id=e.published_revision_id WHERE e.type=? AND e.entry_key=? AND e.status<>'archived'", [type, key]);
            return decode(row);
        },
        async exists(type, key) {
            const [[row]] = await pool.execute("SELECT id FROM cms_entries WHERE type=? AND entry_key=?", [type, key]);
            return !!row;
        },
        async listPublic(type) {
            if (!cmsSchemas[type])
                return [];
            const [rows] = await pool.execute("SELECT e.id,e.type,e.entry_key,e.published_at,r.payload FROM cms_entries e JOIN cms_revisions r ON r.id=e.published_revision_id WHERE e.type=? AND e.status<>'archived' ORDER BY e.entry_key LIMIT 500", [type]);
            return rows.map(decode);
        }
    };
}
