import "server-only";
import { createNewsService } from "./news-core.mjs";
import { getPool } from "./database";
import { getAuth } from "./auth";
export function getNewsService() { return createNewsService(getPool(), getAuth()); }
