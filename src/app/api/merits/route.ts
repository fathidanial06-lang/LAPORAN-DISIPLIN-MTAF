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

    const studentId = String(body.studentId || "").trim();
    const categoryId = String(body.categoryId || "").trim();
    const tarikh = String(body.tarikh || "").trim();
    const penerangan = String(body.penerangan || "").trim();

    if (!studentId || !categoryId || !tarikh) {
      return NextResponse.json(
        { error: "studentId, categoryId dan tarikh diperlukan." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { error: "Murid tidak ditemui." },
        { status: 404 }
      );
    }

    const category = await db.meritCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemui." },
        { status: 404 }
      );
    }

    const mata = body.mata != null ? Number(body.mata) : category.mata;

    const berat = ["BERAT", "SANGAT_BERAT"].includes(category.tahap);
    let status: string;
    let diluluskanOleh: string | null;
    if (category.jenis === "DEMERIT" && berat) {
      status = "MENUNGGU";
      diluluskanOleh = null;
    } else {
      status = "DILULUSKAN";
      diluluskanOleh = session.user.id; // auto-approved for non-berat
    }

    const record = await db.meritRecord.create({
      data: {
        studentId,
        categoryId,
        tarikh,
        mata,
        penerangan,
        status,
        direkodOleh: session.user.id,
        diluluskanOleh,
      },
      include: { category: true },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "CIPTA",
      entiti: "MeritRecord",
      entitiId: record.id,
      nilaiBaru: {
        studentId,
        categoryId,
        tarikh,
        mata,
        status,
      },
    });

    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
