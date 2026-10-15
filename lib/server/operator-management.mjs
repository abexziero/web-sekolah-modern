import { createHmac, randomUUID } from "node:crypto";
import { readOperator, reserveAttempt } from "./auth-core.mjs";
import { createOperator, manageOperator, assertOperatorPassword } from "./accounts.mjs";
export class AccountError extends Error {
}
export function createOperatorManagement(auth, pool, env = process.env) {
    async function admin(headers) {
        const user = await readOperator(auth, pool, headers);
        if (user.role !== "super_admin")
            throw new AccountError("Hanya Super Admin dapat mengelola akun.");
        return user;
    }
    async function verify(headers, user, password) {
        const key = createHmac("sha256", env.BETTER_AUTH_SECRET).update(`reauth:${user.id}`).digest("hex");
        if (!await reserveAttempt(pool, key, 300, 5))
            throw new AccountError("Terlalu banyak percobaan. Tunggu5menit.");
        try {
            await auth.api.verifyPassword({ headers, body: { password } });
            await pool.execute("DELETE FROM auth_throttle WHERE `key`=?",[key]);
        }
        catch {
            throw new AccountError("Konfirmasi password gagal.");
        }
    }
    return {
        async audit(headers) {
            await admin(headers);
            const [rows] = await pool.query("SELECT a.action,a.object_id,a.created_at,u.name AS actor FROM audit_logs a LEFT JOIN `user` u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100");
            return rows;
        },
        async list(headers, trash = false) {
            await admin(headers);
            const [rows] = await pool.query(`SELECT id,name,email,role,active FROM \`user\` WHERE deleted_at IS ${trash ? "NOT NULL" : "NULL"} ORDER BY name LIMIT 500`);
            return rows;
        },
        async create(headers, { email, name, password, role, reauth }) {
            const user = await admin(headers);
            await verify(headers, user, reauth);
            if (!["super_admin", "editor"].includes(role))
                throw new AccountError("Peran tidak valid.");
            try {
                return await createOperator(auth, pool, { email, name, password, role, mustChangePassword: true, actorId: user.id });
            }
            catch {
                throw new AccountError("Akun gagal dibuat. Periksa nama, email, peran dan password16–128karakter.");
            }
        },
        async change(headers, { action, email, role, name, reauth }) {
            const user = await admin(headers);
            if (!["role", "enable", "disable", "revoke", "trash", "untrash", "profile"].includes(action))
                throw new AccountError("Operasi tidak valid.");
            await verify(headers, user, reauth);
            try {
                await manageOperator(auth, pool, { action, email, role, name, password: undefined, actorId: user.id });
            }
            catch (error) {
                throw new AccountError(/^(Super Admin|Akun|Peran)/.test(error.message) ? error.message : "Perubahan akun gagal.");
            }
        },
        async changeInitialPassword(headers, { currentPassword, newPassword }) {
            const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
            if (!session)
                throw new AccountError("Login diperlukan.");
            const [[user]] = await pool.execute("SELECT id,active,mustChangePassword FROM `user` WHERE id=?", [session.user.id]);
            if (!user?.active || !user.mustChangePassword)
                throw new AccountError("Perubahan password awal tidak tersedia.");
            await verify(headers, user, currentPassword);
            try {
                assertOperatorPassword(newPassword);
                if (newPassword === currentPassword)
                    throw new Error();
                await auth.api.changePassword({ headers, body: { currentPassword, newPassword, revokeOtherSessions: false } });
            }
            catch {
                throw new AccountError("Gunakan password baru berbeda sepanjang16–128karakter.");
            }
            await pool.execute("UPDATE `user` SET mustChangePassword=false WHERE id=?", [user.id]);
            await pool.execute("DELETE FROM session WHERE userId=? AND id<>?", [user.id, session.session.id]);
            await pool.execute("INSERT INTO audit_logs(id,actor_id,action,object_id) VALUES(?,?,'account.initial_password_change',?)", [randomUUID(), user.id, user.id]);
        }
    };
}
