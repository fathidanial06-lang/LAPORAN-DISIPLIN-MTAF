import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { logAudit } from "@/lib/disiplin/audit";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Shared setup logic: reads supabase_setup.sql and executes all statements.
export async function runDatabaseSetup(): Promise<{
  ok: boolean;
  executed: number;
  studentCount: number;
  errors: string[];
}> {
  // Read the SQL setup file
  let sql: string;
  const tryPaths = [
    join(process.cwd(), "supabase_setup.sql"),
    join(process.cwd(), "..", "supabase_setup.sql"),
  ];
  let found = false;
  for (const p of tryPaths) {
    try {
      sql = readFileSync(p, "utf8");
      found = true;
      break;
    } catch {
      // try next
    }
  }
  if (!found) {
    return { ok: false, executed: 0, studentCount: 0, errors: ["supabase_setup.sql not found"] };
  }

  const statements = sql!
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let executed = 0;
  const errors: string[] = [];

  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt);
      executed++;
    } catch (e: any) {
      const msg = String(e.message || "");
      if (
        msg.includes("already exists") ||
        msg.includes("does not exist") ||
        msg.includes("duplicate key")
      ) {
        // skip
      } else {
        errors.push(`${stmt.slice(0, 50)}... → ${msg.slice(0, 80)}`);
      }
    }
  }

  let studentCount = 0;
  try {
    const result = await db.$queryRaw`SELECT COUNT(*)::int as count FROM "Student"` as any[];
    studentCount = result[0]?.count ?? 0;
  } catch {
    // ignore
  }

  return { ok: true, executed, studentCount, errors: errors.slice(0, 5) };
}

export async function POST(request: Request) {
  try {
    const session = await requireStaff(request, ["HEM", "PENTADBIR"]);
    if (!session) {
      return NextResponse.json(
        {
          error:
            "Token tidak sah, telah tamat tempoh, atau anda tidak mempunyai kebenaran.",
        },
        { status: 403 }
      );
    }

    const result = await runDatabaseSetup();

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "RESET_DB",
      entiti: "System",
      entitiId: "setup",
    });

    if (result.studentCount > 0) {
      return NextResponse.json({
        ok: true,
        message: `Data berjaya ditetapkan semula. ${result.studentCount} murid dimuatkan.`,
      });
    }
    return NextResponse.json(
      { error: "Reset selesai tetapi tiada murid dikesan.", errors: result.errors },
      { status: 500 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
