import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

console.log("[db.ts] Checking environment variables...");
console.log("[db.ts] process.env.DATABASE_URL:", process.env.DATABASE_URL);
console.log("[db.ts] process.env.NODE_ENV:", process.env.NODE_ENV); // From cross-env

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });