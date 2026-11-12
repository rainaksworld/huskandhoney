import "server-only";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * Database access.
 *
 * - Production (Docker / VPS): `DATABASE_URL=postgres://…` → postgres.js.
 * - Local development and tests: no `DATABASE_URL` (or `pglite:<dir>`) →
 *   PGlite, an in-process Postgres stored on disk. Same SQL, same schema,
 *   no database server to install.
 */
export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __hhDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL ?? "";
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 10 });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
    return db as unknown as DB;
  }

  const dir = url.startsWith("pglite:") ? url.slice("pglite:".length) : ".data/pglite";
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (dir !== "memory") (await import("node:fs")).mkdirSync(path.resolve(dir), { recursive: true });
  const client = dir === "memory" ? new PGlite() : new PGlite(path.resolve(dir));
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as DB;
}

/** Lazily connects (and applies migrations) once per server process. */
export function getDb(): Promise<DB> {
  globalForDb.__hhDb ??= connect().catch((err) => {
    globalForDb.__hhDb = undefined;
    throw err;
  });
  return globalForDb.__hhDb;
}

export { schema };
