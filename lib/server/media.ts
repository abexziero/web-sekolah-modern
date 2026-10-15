import "server-only";
import { createMediaService } from "./media-core.mjs";
import { createLocalMediaStorage } from "./media-storage.mjs";
import { getPool } from "./database";
import { getAuth } from "./auth";
export const getMediaService = () => createMediaService(getPool(), getAuth(), createLocalMediaStorage());
