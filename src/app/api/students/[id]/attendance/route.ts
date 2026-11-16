import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseParentToken } from "@/lib/disiplin/auth";
import {
  loadConfig,
  defaultRange,
} from "@/lib/disiplin/api-helpers";
import { computeAttendanceStats } from "@/lib/disiplin/domain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ok = await parseParentToken(request, id);
    if (!ok) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const dr = defaultRange();
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const where: any = { studentId: id };
    if (from || to) {
      where.tarikh = {};
      if (from) where.tarikh.gte = from;
      if (to) where.tarikh.lte = to;
    }

    const records = await db.attendance.findMany({
      where,
      orderBy: { tarikh: "asc" },
    });

    const config = await loadConfig();
    const stats = computeAttendanceStats(
      records.map((r) => ({ status: r.status as any })),
      config.ambangKehadiran
    );

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        tarikh: r.tarikh,
        status: r.status,
        catatan: r.catatan,
      })),
      stats,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
