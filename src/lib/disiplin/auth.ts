// Auth helpers for the Laporan Disiplin Murid backend.
// Dummy token scheme (base64) — prototype only, NOT production secure.
import { db } from "@/lib/db";
import { normalizeIC } from "@/lib/disiplin/domain";

export interface StaffUser {
  id: string;
  nama: string;
  username: string;
  peranan: "GURU" | "HEM" | "PENTADBIR";
  passwordHash: string;
  aktif: boolean;
}

export interface StaffSession {
  user: StaffUser;
  token: string;
}

// ---------- token (de)coders ----------
function encodeB64(s: string): string {
  try {
    return Buffer.from(s, "utf-8").toString("base64");
  } catch {
    return btoa(s);
  }
}

function decodeB64(s: string): string {
  try {
    return Buffer.from(s, "base64").toString("utf-8");
  } catch {
    return atob(s);
  }
}

export function makeParentToken(studentId: string, ic: string): string {
  return encodeB64(`${studentId}|${normalizeIC(ic)}`);
}

export function makeStaffToken(username: string, passwordHash: string): string {
  return encodeB64(`${username}|${passwordHash}`);
}

// ---------- header extraction ----------
function header(request: Request, name: string): string | null {
  const v = request.headers.get(name);
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

// ---------- staff auth ----------
export async function parseStaffToken(
  request: Request
): Promise<StaffSession | null> {
  const token = header(request, "x-staff-token");
  if (!token) return null;

  let decoded: string;
  try {
    decoded = decodeB64(token);
  } catch {
    return null;
  }

  const sep = decoded.indexOf("|");
  if (sep < 0) return null;
  const username = decoded.slice(0, sep);
  const passwordHash = decoded.slice(sep + 1);
  if (!username || !passwordHash) return null;

  try {
    const user = await db.user.findUnique({ where: { username } });
    if (!user || !user.aktif) return null;
    if (user.passwordHash !== passwordHash) return null;
    return {
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        peranan: user.peranan as StaffUser["peranan"],
        passwordHash: user.passwordHash,
        aktif: user.aktif,
      },
      token,
    };
  } catch {
    return null;
  }
}

export async function requireStaff(
  request: Request,
  peranan?: string[]
): Promise<StaffSession | null> {
  const session = await parseStaffToken(request);
  if (!session) return null;
  if (peranan && !peranan.includes(session.user.peranan)) return null;
  return session;
}

// ---------- parent auth ----------
export async function parseParentToken(
  request: Request,
  studentId: string
): Promise<boolean> {
  const token = header(request, "x-student-token");
  if (!token) return false;

  let decoded: string;
  try {
    decoded = decodeB64(token);
  } catch {
    return false;
  }

  const sep = decoded.indexOf("|");
  if (sep < 0) return false;
  const sid = decoded.slice(0, sep);
  const ic = decoded.slice(sep + 1);
  if (sid !== studentId) return false;

  try {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return false;
    return normalizeIC(ic) === normalizeIC(student.ic);
  } catch {
    return false;
  }
}
