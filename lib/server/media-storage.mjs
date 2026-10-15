import { mkdir, writeFile, readFile, unlink, rename } from "node:fs/promises";
import { resolve, join } from "node:path";
export function createLocalMediaStorage(root = resolve(".local-data/media")) {
    const path = key => {
        if (!/^[a-f0-9-]{36}$/.test(key))
            throw new Error("Kunci file tidak valid.");
        return join(/*turbopackIgnore: true*/ root, key);
    };
    return { async put(key, bytes) {
            await mkdir(root, { recursive: true });
            const file = path(key);
            await writeFile(`${file}.tmp`, bytes, { flag: "wx" });
            try {
                await rename(`${file}.tmp`, file);
            }
            catch (e) {
                await unlink(`${file}.tmp`).catch(() => {
                });
                throw e;
            }
        }, read: key => readFile(/*turbopackIgnore: true*/ path(key)), remove: key => unlink(path(key)) };
}
