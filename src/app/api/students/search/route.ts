import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  normalizeIC,
  isValidIC,
  maskIC,
} from "@/lib/disiplin/domain";
import {
  clientIP,
  rateLimitCheck,
} from "@/lib/disiplin/api-helpers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Sila masukkan sekurang-kurangnya 2 aksara untuk carian." },
        { status: 400 }
      );
    }

    const ip = clientIP(request);
    const rl = rateLimitCheck(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak cubaan carian. Sila cuba sebentar lagi." },
        { status: 429 }
      );
    }

    const norm = normalizeIC(q);
    let results: any[] = [];

    if (isValidIC(q)) {
      // Exact IC match — return at most 1 with full IC (parent already knows it).
      const student = await db.student.findUnique({
        where: { ic: norm },
      });
      if (student) {
        results = [
          {
            id: student.id,
            nama: student.nama,
            kelas: student.kelas,
            ic: student.ic,
            icMasked: maskIC(student.ic),
          },
        ];
      }
    } else {
      // Name search — case-insensitive contains. IC masked.
      const students = await db.student.findMany({
        where: {
          aktif: true,
          nama: { contains: q },
        },
        take: 12,
        orderBy: { nama: "asc" },
      });
      results = students.map((s) => ({
        id: s.id,
        nama: s.nama,
        kelas: s.kelas,
        ic: maskIC(s.ic),
        icMasked: maskIC(s.ic),
      }));
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
