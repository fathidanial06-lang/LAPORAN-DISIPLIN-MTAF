// Shared helpers for API routes: config parsing, rate limit, response helpers.
import { db } from "@/lib/db";
import type {
  AmbangKehadiran,
  AmbangDisiplin,
} from "@/lib/disiplin/domain";

export interface ParsedConfig {
  ambangKehadiran: AmbangKehadiran;
  ambangDisiplin: AmbangDisiplin;
  pengesahanIbuBapa: boolean;
  hariCuti: string[];
  penggalAktif: string;
}

export async function loadConfig(): Promise<ParsedConfig> {
  const row = await db.config.findUnique({ where: { id: "singleton" } });
  if (!row) {
    return {
      ambangKehadiran: { CEMERLANG: 95, BAIK: 90, PERLU_PERHATIAN: 80 },
      ambangDisiplin: {
        CEMERLANG: { max: 5 },
        BAIK: { max: 15 },
        PERLU_PERHATIAN: { max: 30 },
        AMARAN_SERIUS: { max: 50 },
        KRITIKAL: { min: 51 },
      },
      pengesahanIbuBapa: false,
      hariCuti: [],
      penggalAktif: "Penggal 1 2026",
    };
  }
  return {
    ambangKehadiran: safeParse(row.ambangKehadiran, {
      CEMERLANG: 95,
      BAIK: 90,
      PERLU_PERHATIAN: 80,
    }) as AmbangKehadiran,
    ambangDisiplin: safeParse(row.ambangDisiplin, {
      CEMERLANG: { max: 5 },
      BAIK: { max: 15 },
      PERLU_PERHATIAN: { max: 30 },
      AMARAN_SERIUS: { max: 50 },
      KRITIKAL: { min: 51 },
    }) as AmbangDisiplin,
    pengesahanIbuBapa: row.pengesahanIbuBapa,
    hariCuti: safeParse(row.hariCuti, []) as string[],
    penggalAktif: row.penggalAktif,
  };
}

function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

// ---------- rate limit (in-memory, per-IP) ----------
interface RateState {
  count: number;
  firstAt: number;
}
const rateBuckets = new Map<string, RateState>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;

// Periodic cleanup of stale buckets to keep memory bounded.
function cleanupRateBuckets(now: number) {
  for (const [k, v] of rateBuckets) {
    if (now - v.firstAt > RATE_WINDOW_MS) rateBuckets.delete(k);
  }
}

export function rateLimitCheck(ip: string): { ok: true } | { ok: false } {
  const now = Date.now();
  cleanupRateBuckets(now);
  const state = rateBuckets.get(ip);
  if (!state) {
    rateBuckets.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (now - state.firstAt > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  state.count += 1;
  if (state.count > RATE_MAX) return { ok: false };
  return { ok: true };
}

export function rateLimitReset(ip: string) {
  rateBuckets.delete(ip);
}

export function clientIP(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || "unknown";
}

// Parse a JSON body, returning null on failure.
export async function parseJSON(request: Request): Promise<any | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Default date range: last 3 months from today (YYYY-MM-DD).
export function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
