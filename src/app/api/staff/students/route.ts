import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import {
  loadConfig,
  parseJSON,
} from "@/lib/disiplin/api-helpers";
import {
  computeMeritTotals,
  computeAttendanceStats,
} from "@/lib/disiplin/domain";
import { logAudit } from "@/lib/disiplin/audit";

// GET — list students with totals and attendance %
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
    const kelas = url.searchParams.get("kelas") || undefined;
    const q = url.searchParams.get("q") || undefined;

    const where: any = {};
    if (kelas) where.kelas = kelas;
    if (q) {
      const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
      where.nama = { contains: pattern, escape: true };
    }

    const students = await db.student.findMany({
      where,
      include: {
        attendance: true,
        meritRecords: { where: { status: "DILULUSKAN" } },
      },
      orderBy: { id: "asc" },
    });

    const config = await loadConfig();

    const mapped = students.map((s) => {
      const totals = computeMeritTotals(
        s.meritRecords.map((r) => ({ mata: r.mata, status: r.status })),
        config.ambangDisiplin
      );
      const stats = computeAttendanceStats(
        s.attendance.map((a) => ({ status: a.status as any })),
        config.ambangKehadiran
      );
      let penjaga: any = null;
      try {
        penjaga = JSON.parse(s.penjaga);
      } catch {
        penjaga = null;
      }
      return {
        id: s.id,
        nama: s.nama,
        ic: s.ic,
        jantina: s.jantina,
        kelas: s.kelas,
        tahun: s.tahun,
        asrama: s.asrama,
        aktif: s.aktif,
        penjaga,
        totals,
        peratusKehadiran: stats.peratus,
      };
    });

    return NextResponse.json({ students: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}

// POST — create a new student
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

    const nama = String(body.nama || "").trim();
    const ic = String(body.ic || "").replace(/\D/g, "");
    const jantina = String(body.jantina || "").trim();
    const kelas = String(body.kelas || "").trim();
    const tahun = Number(body.tahun);
    const asrama = !!body.asrama;
    const penjaga = body.penjaga || {};
    const id = String(body.id || "").trim() || undefined;

    if (!nama || !ic || !jantina || !kelas || !tahun) {
      return NextResponse.json(
        { error: "Nama, IC, jantina, kelas dan tahun diperlukan." },
        { status: 400 }
      );
    }
    if (ic.length !== 12) {
      return NextResponse.json(
        { error: "No. IC mesti 12 digit." },
        { status: 400 }
      );
    }

    const existing = await db.student.findUnique({ where: { ic } });
    if (existing) {
      return NextResponse.json(
        { error: "No. IC telah didaftarkan." },
        { status: 409 }
      );
    }

    let studentId = id;
    if (!studentId) {
      const all = await db.student.findMany({ select: { id: true } });
      let maxNum = 0;
      for (const s of all) {
        const m = /^S(\d+)$/.exec(s.id);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      studentId = `S${String(maxNum + 1).padStart(3, "0")}`;
    }

    const student = await db.student.create({
      data: {
        id: studentId,
        ic,
        nama: nama.toUpperCase(),
        jantina,
        kelas,
        tahun,
        asrama,
        penjaga: JSON.stringify(penjaga),
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "CIPTA",
      entiti: "Student",
      entitiId: student.id,
      nilaiBaru: { id: student.id, nama: student.nama, ic: student.ic, kelas: student.kelas },
    });

    return NextResponse.json({ student });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
