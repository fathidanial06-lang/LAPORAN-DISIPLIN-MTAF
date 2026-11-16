import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseParentToken, parseStaffToken } from "@/lib/disiplin/auth";
import {
  loadConfig,
} from "@/lib/disiplin/api-helpers";
import { computeMeritTotals } from "@/lib/disiplin/domain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Allow either parent or staff token.
    const parentOk = await parseParentToken(request, id);
    const staffSession = parentOk ? null : await parseStaffToken(request);

    if (!parentOk && !staffSession) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;
    let statusFilter = url.searchParams.get("status") || undefined;

    // Parent tokens can only see DILULUSKAN.
    if (parentOk) {
      statusFilter = "DILULUSKAN";
    }

    const where: any = { studentId: id };
    if (from || to) {
      where.tarikh = {};
      if (from) where.tarikh.gte = from;
      if (to) where.tarikh.lte = to;
    }
    if (statusFilter) where.status = statusFilter;

    const records = await db.meritRecord.findMany({
      where,
      orderBy: { tarikh: "desc" },
      include: { category: true },
    });

    const mapped = records.map((r) => ({
      id: r.id,
      tarikh: r.tarikh,
      categoryId: r.categoryId,
      kategoriNama: r.category?.nama || "",
      jenis: r.category?.jenis || "",
      tahap: r.category?.tahap || "",
      mata: r.mata,
      penerangan: r.penerangan,
      status: r.status,
      tindakan: r.tindakan,
      direkodOleh: r.direkodOleh,
    }));

    // Compute totals across DILULUSKAN records within the same range.
    const totalsWhere: any = { studentId: id, status: "DILULUSKAN" };
    if (from || to) {
      totalsWhere.tarikh = {};
      if (from) totalsWhere.tarikh.gte = from;
      if (to) totalsWhere.tarikh.lte = to;
    }
    const totalRecords = await db.meritRecord.findMany({
      where: totalsWhere,
    });
    const config = await loadConfig();
    const totals = computeMeritTotals(
      totalRecords.map((r) => ({ mata: r.mata, status: r.status })),
      config.ambangDisiplin
    );

    return NextResponse.json({ records: mapped, totals });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
