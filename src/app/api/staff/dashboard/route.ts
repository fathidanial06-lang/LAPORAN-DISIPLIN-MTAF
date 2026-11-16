import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import {
  loadConfig,
} from "@/lib/disiplin/api-helpers";
import {
  computeAttendanceStats,
  computeMeritTotals,
} from "@/lib/disiplin/domain";

export async function GET(request: Request) {
  try {
    const session = await requireStaff(request);
    if (!session) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const config = await loadConfig();
    const today = new Date().toISOString().slice(0, 10);

    const [jumlahMurid, todays, menunggu, semuaAktif] = await Promise.all([
      db.student.count({ where: { aktif: true } }),
      db.attendance.findMany({ where: { tarikh: today } }),
      db.meritRecord.count({ where: { status: "MENUNGGU" } }),
      db.student.findMany({
        where: { aktif: true },
        select: { id: true },
      }),
    ]);

    const hadirHariIni = todays.filter((a) => a.status === "HADIR").length;
    const lewatHariIni = todays.filter((a) => a.status === "LEWAT").length;
    const tidakHadirHariIni = todays.filter((a) =>
      ["SAKIT", "KEBENARAN", "TANPA_SEBAB", "PULANG_AWAL"].includes(a.status)
    ).length;
    const belumDirekodHariIni = Math.max(
      0,
      semuaAktif.length - (hadirHariIni + lewatHariIni + tidakHadirHariIni)
    );

    // perluPerhatian: attendance < 80% OR discipline PERLU_PERHATIAN / AMARAN_SERIUS / KRITIKAL
    const students = await db.student.findMany({
      where: { aktif: true },
      include: {
        attendance: true,
        meritRecords: { where: { status: "DILULUSKAN" } },
      },
    });

    const perluPerhatian: any[] = [];
    for (const s of students) {
      const stats = computeAttendanceStats(
        s.attendance.map((a) => ({ status: a.status as any })),
        config.ambangKehadiran
      );
      const merit = computeMeritTotals(
        s.meritRecords.map((r) => ({ mata: r.mata, status: r.status })),
        config.ambangDisiplin
      );
      const lowAttendance = stats.peratus < 80;
      const lowDiscipline = ["PERLU_PERHATIAN", "AMARAN_SERIUS", "KRITIKAL"].includes(
        merit.tahap
      );
      if (lowAttendance || lowDiscipline) {
        perluPerhatian.push({
          id: s.id,
          nama: s.nama,
          kelas: s.kelas,
          peratus: stats.peratus,
          tahap: merit.tahap,
        });
      }
      if (perluPerhatian.length >= 12) break;
    }

    // demeritTerkini: last 10 demerit records (any status)
    const demeritCats = await db.meritCategory.findMany({
      where: { jenis: "DEMERIT" },
      select: { id: true, nama: true },
    });
    const demeritCatIds = demeritCats.map((c) => c.id);

    const recentDemerit = await db.meritRecord.findMany({
      where: { categoryId: { in: demeritCatIds } },
      orderBy: { tarikh: "desc" },
      take: 10,
      include: { student: true, category: true },
    });

    const demeritTerkini = recentDemerit.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      namaMurid: r.student?.nama || "",
      kelas: r.student?.kelas || "",
      tarikh: r.tarikh,
      kategoriNama: r.category?.nama || "",
      mata: r.mata,
      status: r.status,
    }));

    return NextResponse.json({
      stats: {
        jumlahMurid,
        hadirHariIni,
        lewatHariIni,
        tidakHadirHariIni,
        menungguKelulusan: menunggu,
        belumDirekodHariIni,
      },
      perluPerhatian,
      demeritTerkini,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
