import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runDatabaseSetup } from "../staff/reset/route";

/**
 * Auto-setup endpoint: creates all tables + seeds dummy data.
 * Called automatically by the frontend on first load if /api/config fails.
 * Safe to call multiple times (drops + recreates).
 */
export async function POST() {
  try {
    const result = await runDatabaseSetup();
    if (result.studentCount > 0) {
      return NextResponse.json({
        ok: true,
        executed: result.executed,
        studentCount: result.studentCount,
        message: `Pangkalan data berjaya disediakan. ${result.studentCount} murid dimuatkan.`,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        executed: result.executed,
        errors: result.errors,
        message: "Setup selesai tetapi tiada murid dikesan.",
      },
      { status: 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Ralat pelayan semasa setup.",
        detail: String(e.message || "").slice(0, 300),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if database is ready (tables exist + has data)
  try {
    const result = await db.$queryRaw`SELECT COUNT(*)::int as count FROM "Student"` as any[];
    const count = result[0]?.count ?? 0;
    return NextResponse.json({
      ready: count > 0,
      studentCount: count,
      message:
        count > 0
          ? "Pangkalan data sedia."
          : "Pangkalan data kosong. POST ke /api/setup untuk initialize.",
    });
  } catch {
    return NextResponse.json({
      ready: false,
      studentCount: 0,
      message: "Jadual belum wujud. POST ke /api/setup untuk cipta.",
    });
  }
}
