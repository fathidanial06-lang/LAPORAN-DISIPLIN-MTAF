import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { parseJSON } from "@/lib/disiplin/api-helpers";
import { logAudit } from "@/lib/disiplin/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const existing = await db.meritCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kategori tidak ditemui." },
        { status: 404 }
      );
    }

    const data: any = {};
    if (body.nama != null) data.nama = String(body.nama);
    if (body.jenis != null) data.jenis = String(body.jenis);
    if (body.tahap != null) data.tahap = String(body.tahap);
    if (body.mata != null) data.mata = Number(body.mata);
    if (body.aktif != null) data.aktif = !!body.aktif;

    const category = await db.meritCategory.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "KEMASKINI",
      entiti: "MeritCategory",
      entitiId: id,
      nilaiLama: existing,
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
