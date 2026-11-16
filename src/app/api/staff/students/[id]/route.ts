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

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Murid tidak ditemui." },
        { status: 404 }
      );
    }

    const data: any = {};
    if (body.nama != null) data.nama = String(body.nama).trim().toUpperCase();
    if (body.ic != null) {
      const ic = String(body.ic).replace(/\D/g, "");
      if (ic.length !== 12) {
        return NextResponse.json(
          { error: "No. IC mesti 12 digit." },
          { status: 400 }
        );
      }
      // ensure unique
      const dupe = await db.student.findUnique({ where: { ic } });
      if (dupe && dupe.id !== id) {
        return NextResponse.json(
          { error: "No. IC telah didaftarkan." },
          { status: 409 }
        );
      }
      data.ic = ic;
    }
    if (body.jantina != null) data.jantina = String(body.jantina).trim();
    if (body.kelas != null) data.kelas = String(body.kelas).trim();
    if (body.tahun != null) data.tahun = Number(body.tahun);
    if (body.asrama != null) data.asrama = !!body.asrama;
    if (body.aktif != null) data.aktif = !!body.aktif;
    if (body.fotoUrl != null) data.fotoUrl = String(body.fotoUrl);
    if (body.penjaga != null) data.penjaga = JSON.stringify(body.penjaga);

    const student = await db.student.update({ where: { id }, data });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "KEMASKINI",
      entiti: "Student",
      entitiId: id,
      nilaiLama: {
        nama: existing.nama,
        ic: existing.ic,
        kelas: existing.kelas,
        tahun: existing.tahun,
      },
      nilaiBaru: data,
    });

    return NextResponse.json({ student });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Murid tidak ditemui." },
        { status: 404 }
      );
    }

    await db.student.update({
      where: { id },
      data: { aktif: false },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "PADAM",
      entiti: "Student",
      entitiId: id,
      nilaiLama: { nama: existing.nama, ic: existing.ic, kelas: existing.kelas },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
