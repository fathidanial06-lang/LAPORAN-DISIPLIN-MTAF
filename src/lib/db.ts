import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";

// Normalize DATABASE_URL to an absolute path so the SQLite file resolves
// correctly in both `next dev` (cwd = project root) and the standalone
// production server (cwd = .next/standalone). Prisma resolves relative
// `file:` paths relative to its engine location, which breaks in the
// standalone bundle — resolving to an absolute path here fixes that.
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || "file:./db/custom.db";
  if (url.startsWith("file:")) {
    const p = url.slice("file:".length);
    // keep query params (e.g. ?schema=...) if present
    const [path, query = ""] = p.split("?");
    const abs = resolve(process.cwd(), path);
    return query ? `file:${abs}?${query}` : `file:${abs}`;
  }
  return url;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
