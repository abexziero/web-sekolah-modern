import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const destination = fileURLToPath(new URL("../.env.local", import.meta.url));
try {
  await access(destination);
  console.error(".env.local sudah ada; konfigurasi dipertahankan. Tidak ada file yang ditimpa.");
  process.exitCode = 1;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const secret = () => randomBytes(32).toString("hex");
  await writeFile(destination, `DATABASE_HOST=127.0.0.1\nDATABASE_PORT=3307\nDATABASE_NAME=annur\nDATABASE_USER=annur\nDATABASE_PASSWORD=${secret()}\nDATABASE_SSL=disabled\nMARIADB_ROOT_PASSWORD=${secret()}\nBETTER_AUTH_SECRET=${secret()}\nBETTER_AUTH_URL=http://127.0.0.1:3000\n`, { flag: "wx", mode: 0o600 });
  console.log(".env.local dibuat dengan secret acak; nilai rahasia tidak ditampilkan. Jangan membagikan file ini.");
}
