import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { parseJSON } from "@/lib/disiplin/api-helpers";
import { logAudit } from "@/lib/disiplin/audit";

export async function POST(request: Request) {
  try {
    const session = await requireStaff(request);
    if (!session) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const body = await parseJSON(request);
    if (!body) {
      return NextResponse.json(
        { error: "Badan permintaan tidak sah." },
        { status: 400 }
      );
    }

    const tarikh = String(body.tarikh || "").trim();
    const records: any[] = Array.isArray(body.records) ? body.records : [];

    if (!tarikh) {
      return NextResponse.json(
        { error: "Tarikh diperlukan." },
        { status: 400 }
      );
    }
    if (records.length === 0) {
      return NextResponse.json(
        { error: "Sekurang-kurangnya satu rekod diperlukan." },
        { status: 400 }
      );
    }

    const staffId = session.user.id;

    let count = 0;
    for (const r of records) {
      const studentId = String(r.studentId || "").trim();
      const status = String(r.status || "").trim();
      const catatan = r.catatan != null ? String(r.catatan) : null;
      if (!studentId || !status) continue;

      const existing = await db.attendance.findUnique({
        where: { studentId_tarikh: { studentId, tarikh } },
      });

      if (existing) {
        await db.attendance.update({
          where: { id: existing.id },
          data: { status, catatan, direkodOleh: staffId },
        });
      } else {
        await db.attendance.create({
          data: { studentId, tarikh, status, catatan, direkodOleh: staffId },
        });
      }
      count += 1;
    }

    await logAudit({
      userId: staffId,
      userName: session.user.nama,
      tindakan: "REKOD_KEHADIRAN",
      entiti: "Attendance",
      entitiId: tarikh,
      nilaiBaru: { tarikh, count },
    });

    return NextResponse.json({ count });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
