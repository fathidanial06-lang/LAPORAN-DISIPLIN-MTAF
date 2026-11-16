import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { requireStaff } from "@/lib/disiplin/auth";
import { logAudit } from "@/lib/disiplin/audit";

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

    // Re-run the seed script (it resets & re-seeds the DB).
    let stderr = "";
    try {
      execSync("bun run prisma/seed.ts", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 120_000,
      });
    } catch (e: any) {
      stderr = String(e?.stderr || e?.message || "");
      return NextResponse.json(
        {
          error: "Gagal menjalankan semula seed data.",
          detail: stderr,
        },
        { status: 500 }
      );
    }

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "RESET_DB",
      entiti: "System",
      entitiId: "seed",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
