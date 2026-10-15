import { randomUUID } from "node:crypto";

export function assertOperatorPassword(password) {
  if (typeof password !== "string" || password.length < 16 || password.length > 128) throw new Error("Password harus 16–128 karakter.");
}

export async function createOperator(auth, pool, { email, name, password, role, mustChangePassword = false, actorId = null }) {
  assertOperatorPassword(password);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name.trim() || name.length > 100 || !["super_admin", "editor"].includes(role) || password.length < 16 || password.length > 128) throw new Error("Nama, email, peran, atau panjang password tidak valid (16–128 karakter).");
  const context = await auth.$context;
  const hash = await context.password.hash(password);
  const user = await context.internalAdapter.createUser({ email: email.toLowerCase(), name: name.trim(), emailVerified: true, role, active: true, mustChangePassword });
  try {
    await context.internalAdapter.createAccount({ userId: user.id, accountId: user.id, providerId: "credential", password: hash });
    await pool.execute("INSERT INTO audit_logs (id, actor_id, action, object_id) VALUES (?, ?, ?, ?)", [randomUUID(), actorId, `${actorId ? "dashboard" : "local"}.account.create`, user.id]);
    return { id: user.id, email: user.email, role };
  } catch (error) { await context.internalAdapter.deleteUser(user.id); throw error; }
}

export async function manageOperator(auth, pool, { action, email, role, name, password, actorId = null }) {
  if (!["role", "disable", "enable", "revoke", "recover", "trash", "untrash", "profile"].includes(action) || typeof email !== "string") throw new Error("Akun atau operasi tidak valid.");
  if(action === "profile" && (typeof name!=="string"||!name.trim()||name.length>100)) throw new Error("Akun memerlukan nama 1–100 karakter.");
  if (action === "role" && !["super_admin", "editor"].includes(role)) throw new Error("Peran tidak valid.");
  let hash;
  if (action === "recover") { assertOperatorPassword(password); hash = await (await auth.$context).password.hash(password); }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [admins] = await connection.query("SELECT id FROM `user` WHERE role = 'super_admin' AND active = true FOR UPDATE");
    const [[user]] = await connection.execute("SELECT id, role, active, deleted_at FROM `user` WHERE email = ? FOR UPDATE", [email.trim().toLowerCase()]);
    if (!user) throw new Error("Akun tidak ditemukan.");
    if(user.deleted_at && action!=="untrash") throw new Error("Akun berada di Sampah. Pulihkan terlebih dahulu.");
    if(action === "untrash" && !user.deleted_at) throw new Error("Akun tidak berada di Sampah.");
    if (user.role === "super_admin" && user.active && admins.length <= 1 && (["disable","trash"].includes(action) || (action === "role" && role !== "super_admin"))) throw new Error("Super Admin aktif terakhir tidak boleh dinonaktifkan atau diturunkan perannya.");
    if(action === "profile") await connection.execute("UPDATE `user` SET name=? WHERE id=?",[name.trim(),user.id]);
    if(["trash","untrash"].includes(action)) await connection.execute("UPDATE `user` SET deleted_at=?,active=false WHERE id=?",[action === "trash" ? new Date() : null,user.id]);
    if (action === "role") await connection.execute("UPDATE `user` SET role = ? WHERE id = ?", [role, user.id]);
    if (["enable", "disable"].includes(action)) await connection.execute("UPDATE `user` SET active = ? WHERE id = ?", [action === "enable", user.id]);
    if (action === "recover") {
      await connection.execute("UPDATE account SET password = ?, updatedAt = UTC_TIMESTAMP(3) WHERE userId = ? AND providerId = 'credential'", [hash, user.id]);
      await connection.execute("UPDATE `user` SET twoFactorEnabled = false WHERE id = ?", [user.id]);
      await connection.execute("DELETE FROM twoFactor WHERE userId = ?", [user.id]);
      await connection.execute("DELETE FROM auth_totp_used WHERE user_id = ?", [user.id]);
    }
    await connection.execute("DELETE FROM session WHERE userId = ?", [user.id]);
    await connection.execute("DELETE FROM verification WHERE value = ?", [user.id]);
    await connection.execute("INSERT INTO audit_logs (id, actor_id, action, object_id) VALUES (?, ?, ?, ?)", [randomUUID(), actorId, `${actorId ? "dashboard" : "local"}.account.${action}`, user.id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
