import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { parseJSON, loadConfig } from "@/lib/disiplin/api-helpers";
import { logAudit } from "@/lib/disiplin/audit";

export async function PUT(request: Request) {
  try {
    const session = await requireStaff(request, ["HEM", "PENTADBIR"]);
    if (!session) {
      return NextResponse.json(
        {
          error:
            "Token tidak sah, telah tamat tempoh, atau anda tidak mempunyai kebenaran.",
        },
        { status: 403 }
      );
    }

    const body = await parseJSON(request);
    if (!body) {
      return NextResponse.json(
        { error: "Badan permintaan tidak sah." },
        { status: 400 }
      );
    }

    const existingRow = await db.config.findUnique({
      where: { id: "singleton" },
    });
    const existing = await loadConfig();

    const data: any = {};
    if (body.ambangKehadiran != null) {
      data.ambangKehadiran = JSON.stringify(body.ambangKehadiran);
    }
    if (body.ambangDisiplin != null) {
      data.ambangDisiplin = JSON.stringify(body.ambangDisiplin);
    }
    if (body.pengesahanIbuBapa != null) {
      data.pengesahanIbuBapa = !!body.pengesahanIbuBapa;
    }
    if (body.hariCuti != null) {
      data.hariCuti = JSON.stringify(body.hariCuti);
    }
    if (body.penggalAktif != null) {
      data.penggalAktif = String(body.penggalAktif);
    }

    if (existingRow) {
      await db.config.update({ where: { id: "singleton" }, data });
    } else {
      await db.config.create({
        data: {
          id: "singleton",
          ambangKehadiran: data.ambangKehadiran ?? JSON.stringify(existing.ambangKehadiran),
          ambangDisiplin: data.ambangDisiplin ?? JSON.stringify(existing.ambangDisiplin),
          pengesahanIbuBapa: data.pengesahanIbuBapa ?? existing.pengesahanIbuBapa,
          hariCuti: data.hariCuti ?? JSON.stringify(existing.hariCuti),
          penggalAktif: data.penggalAktif ?? existing.penggalAktif,
        },
      });
    }

    const config = await loadConfig();

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: "KEMASKINI",
      entiti: "Config",
      entitiId: "singleton",
      nilaiLama: existing,
      nilaiBaru: body,
    });

    return NextResponse.json({ config });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
