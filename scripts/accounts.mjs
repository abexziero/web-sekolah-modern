import { createInterface } from "node:readline/promises";
import { createDatabasePool } from "../lib/server/database-config.mjs";
import { createSchoolAuth } from "../lib/server/auth-core.mjs";
import { createOperator, assertOperatorPassword, manageOperator } from "../lib/server/accounts.mjs";

async function hiddenPassword() {
  if (!process.stdin.isTTY) throw new Error("Jalankan dari terminal interaktif untuk memasukkan password tersembunyi.");
  process.stdout.write("Password baru (16–128 karakter): ");
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    function finish(error) {
      process.stdin.off("data", listener); process.stdin.setRawMode(!!wasRaw); process.stdin.pause(); process.stdout.write("\n");
      if (error) reject(error); else resolve(value);
    }
    function listener(chunk) {
      for (const character of chunk) {
        if (character === "\u0003") return finish(new Error("Dibatalkan."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " " && value.length < 129) value += character;
      }
    }
    process.stdin.on("data", listener);
  });
}

const action = process.argv[2];
let pool;
let prompts;
try {
  if (!["create", "role", "disable", "enable", "revoke", "recover"].includes(action)) throw new Error("Gunakan npm.cmd run accounts -- create|role|disable|enable|revoke|recover.");
  if (process.argv.length > 3) throw new Error("Jangan memasukkan kredensial lewat argumen command line.");
  prompts = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await prompts.question("Email operator: ")).trim().toLowerCase();
  let name, role;
  if (action === "create") name = (await prompts.question("Nama operator: ")).trim();
  if (["create", "role"].includes(action)) { role = (await prompts.question("Peran (super_admin/editor): ")).trim(); if (!["super_admin", "editor"].includes(role)) throw new Error("Peran tidak valid."); }
  if (action === "recover" && (await prompts.question("Ketik PULIHKAN untuk mereset faktor dan mencabut semua sesi: ")) !== "PULIHKAN") throw new Error("Dibatalkan.");
  prompts.close(); prompts = undefined;
  const password = ["create", "recover"].includes(action) ? await hiddenPassword() : undefined;
  if (["create", "recover"].includes(action)) assertOperatorPassword(password);
  pool = createDatabasePool();
  const auth = createSchoolAuth(pool);
  if (action === "create") {
    const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM `user` WHERE role = 'super_admin' AND active = true");
    if (!Number(count) && role !== "super_admin") throw new Error("Akun pertama harus super_admin.");
    await createOperator(auth, pool, { email, name, password, role });
  } else await manageOperator(auth, pool, { action, email, role, password });
  console.log("Operasi akun selesai; rahasia tidak ditampilkan. MFA wajib disiapkan saat login pertama atau setelah pemulihan.");
} catch (error) {
  const safe = /^(Gunakan|Jangan|Jalankan|Dibatalkan|Peran|Password|Nama,|Akun|Super Admin|Konfigurasi)/.test(error.message);
  console.error(safe ? error.message : "Operasi akun gagal. Periksa koneksi, skema, dan email duplikat secara lokal; rahasia tidak ditampilkan.");
  process.exitCode = 1;
} finally { prompts?.close(); await pool?.end(); }
