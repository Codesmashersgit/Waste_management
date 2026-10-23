import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set it in backend/.env before starting the server.");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
