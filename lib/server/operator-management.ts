import "server-only";
import { createOperatorManagement } from "./operator-management.mjs";
import { getAuth } from "./auth";
import { getPool } from "./database";
export const getOperatorManagement = () => createOperatorManagement(getAuth(), getPool());
