import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeIC } from "@/lib/disiplin/domain";
import { makeParentToken } from "@/lib/disiplin/auth";
import {
  clientIP,
  rateLimitReset,
  parseJSON,
  loadConfig,
} from "@/lib/disiplin/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseJSON(request);
    if (!body) {
      return NextResponse.json(
        { error: "Badan permintaan tidak sah." },
        { status: 400 }
      );
    }

    const id = String(body.id || "").trim();
    const icRaw = String(body.ic || "").trim();
    const pin = body.pin != null ? String(body.pin).trim() : "";

    if (!id || !icRaw) {
      return NextResponse.json(
        { error: "ID murid dan No. IC diperlukan." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json(
        { error: "Murid tidak ditemui." },
        { status: 404 }
      );
    }

    if (normalizeIC(icRaw) !== normalizeIC(student.ic)) {
      return NextResponse.json(
        { error: "No. IC tidak sepadan." },
        { status: 403 }
      );
    }

    const config = await loadConfig();
    if (config.pengesahanIbuBapa) {
      let penjaga: any = null;
      try {
        penjaga = JSON.parse(student.penjaga);
      } catch {
        penjaga = null;
      }
      if (!penjaga || !penjaga.icAkhir4) {
        return NextResponse.json(
          { error: "Pengesahan gagal. 4 digit akhir IC penjaga tidak sepadan." },
          { status: 403 }
        );
      }
      if (pin !== String(penjaga.icAkhir4)) {
        return NextResponse.json(
          { error: "Pengesahan gagal. 4 digit akhir IC penjaga tidak sepadan." },
          { status: 403 }
        );
      }
    }

    // Reset rate limit for this IP on success.
    rateLimitReset(clientIP(request));

    const token = makeParentToken(student.id, student.ic);
    return NextResponse.json({
      token,
      studentId: student.id,
      nama: student.nama,
      kelas: student.kelas,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
