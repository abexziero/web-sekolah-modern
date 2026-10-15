import "server-only";
import { createCmsService } from "./cms-core.mjs";
import { getPool } from "./database";
import { getAuth } from "./auth";
export const getCmsService = () => createCmsService(getPool(), getAuth());
