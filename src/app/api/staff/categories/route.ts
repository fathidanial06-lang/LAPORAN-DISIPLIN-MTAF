import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { parseJSON } from "@/lib/disiplin/api-helpers";
import { logAudit } from "@/lib/disiplin/audit";

export async function GET(request: Request) {
  try {
    const session = await requireStaff(request);
    if (!session) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }

    const categories = await db.meritCategory.findMany({
      orderBy: [{ jenis: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        jenis: c.jenis,
        nama: c.nama,
        tahap: c.tahap,
        mata: c.mata,
        aktif: c.aktif,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}

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

    const id = String(body.id || "").trim();
    const jenis = String(body.jenis || "").trim();
    const nama = String(body.nama || "").trim();
    const tahap = String(body.tahap || "").trim();
    const mata = Number(body.mata);

    if (!id || !jenis || !nama || !tahap || Number.isNaN(mata)) {
      return NextResponse.json(
        {
          error:
            "id, jenis, nama, tahap dan mata diperlukan.",
        },
        { status: 400 }
      );
    }
    if (!["MERIT", "DEMERIT"].includes(jenis)) {
      return NextResponse.json(
        { error: "jenis mesti 'MERIT' atau 'DEMERIT'." },
        { status: 400 }
      );
    }

    const existing = await db.meritCategory.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json(
        { error: "ID kategori telah wujud." },
        { status: 409 }
      );
    }

    const category = await db.meritCategory.create({
      data: { id, jenis, nama, tahap, mata },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "CIPTA",
      entiti: "MeritCategory",
      entitiId: id,
      nilaiBaru: category,
    });

    return NextResponse.json({ category });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
