import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseParentToken } from "@/lib/disiplin/auth";
import { loadConfig, defaultRange } from "@/lib/disiplin/api-helpers";
import {
  computeAttendanceStats,
  computeCharacterGrade,
  computeMeritTotals,
} from "@/lib/disiplin/domain";

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
    const from = url.searchParams.get("from") || defaultRange().from;
    const to = url.searchParams.get("to") || defaultRange().to;

    const student = await db.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json(
        { error: "Murid tidak ditemui." },
        { status: 404 }
      );
    }

    const config = await loadConfig();

    // --- attendance in range ---
    const attendanceRecords = await db.attendance.findMany({
      where: { studentId: id, tarikh: { gte: from, lte: to } },
      orderBy: { tarikh: "asc" },
    });
    const stats = computeAttendanceStats(
      attendanceRecords.map((r) => ({ status: r.status as any })),
      config.ambangKehadiran
    );
    const kedatangan = {
      records: attendanceRecords.map((r) => ({
        id: r.id,
        tarikh: r.tarikh,
        status: r.status,
        catatan: r.catatan,
      })),
      stats,
    };

    // --- character (DISAHKAN only) ---
    const assessments = await db.characterAssessment.findMany({
      where: { studentId: id, status: "DISAHKAN" },
      orderBy: { tempoh: "asc" },
    });
    const sahsiahAssessments = assessments.map((a) => {
      const g = computeCharacterGrade({
        akhlak: a.akhlak,
        ibadah: a.ibadah,
        kebersihan: a.kebersihan,
        tanggungjawab: a.tanggungjawab,
        sosial: a.sosial,
      });
      return {
        id: a.id,
        tempoh: a.tempoh,
        akhlak: a.akhlak,
        ibadah: a.ibadah,
        kebersihan: a.kebersihan,
        tanggungjawab: a.tanggungjawab,
        sosial: a.sosial,
        catatan: a.catatan,
        gred: g.gred,
        gredLabel: g.label,
        skor: g.skor,
      };
    });
    const latestAssessment =
      sahsiahAssessments[sahsiahAssessments.length - 1] ?? null;
    const sahsiah = {
      grade: latestAssessment
        ? {
            gred: latestAssessment.gred,
            label: latestAssessment.gredLabel,
            skor: latestAssessment.skor,
          }
        : null,
      latest: latestAssessment,
      assessments: sahsiahAssessments,
      history: sahsiahAssessments.map((a) => ({
        tempoh: a.tempoh,
        gred: a.gred,
        skor: a.skor,
      })),
    };

    // --- merit (DILULUSKAN only for parent view) ---
    const meritRecords = await db.meritRecord.findMany({
      where: {
        studentId: id,
        tarikh: { gte: from, lte: to },
        status: "DILULUSKAN",
      },
      include: { category: true },
      orderBy: { tarikh: "desc" },
    });
    const totals = computeMeritTotals(
      meritRecords.map((r) => ({ mata: r.mata, status: r.status })),
      config.ambangDisiplin
    );
    const merit = {
      totals,
      records: meritRecords.map((r) => ({
        id: r.id,
        tarikh: r.tarikh,
        categoryId: r.categoryId,
        kategoriNama: r.category?.nama,
        jenis: r.category?.jenis,
        tahap: r.category?.tahap,
        mata: r.mata,
        penerangan: r.penerangan,
        status: r.status,
        tindakan: r.tindakan,
      })),
    };

    // totalsByStatus across all records (not just in range) for the student
    const allMerit = await db.meritRecord.findMany({ where: { studentId: id } });
    const totalsByStatus = {
      MENUNGGU: allMerit.filter((r) => r.status === "MENUNGGU").length,
      DILULUSKAN: allMerit.filter((r) => r.status === "DILULUSKAN").length,
      DIBATALKAN: allMerit.filter((r) => r.status === "DIBATALKAN").length,
    };

    let penjaga: any = null;
    try {
      penjaga = JSON.parse(student.penjaga);
    } catch {
      penjaga = {};
    }

    return NextResponse.json({
      murid: {
        id: student.id,
        nama: student.nama,
        kelas: student.kelas,
        tahun: student.tahun,
        jantina: student.jantina,
        asrama: student.asrama,
        penjaga: {
          nama: penjaga?.nama || "",
          hubungan: penjaga?.hubungan || "",
          telefon: penjaga?.telefon || "",
        },
      },
      kedatangan,
      sahsiah,
      merit,
      totalsByStatus,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
