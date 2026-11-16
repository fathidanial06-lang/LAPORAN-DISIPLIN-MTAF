import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";

export async function GET(request: Request) {
  try {
    const session = await requireStaff(request);
    if (!session) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(
      1000,
      Math.max(1, Number(url.searchParams.get("limit") || 100))
    );

    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.userName,
        tindakan: l.tindakan,
        entiti: l.entiti,
        entitiId: l.entitiId,
        nilaiLama: l.nilaiLama,
        nilaiBaru: l.nilaiBaru,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
