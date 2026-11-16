import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/disiplin/auth";
import { parseJSON } from "@/lib/disiplin/api-helpers";
import { logAudit } from "@/lib/disiplin/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const action = String(body.action || "").trim();
    const sebab = body.sebab != null ? String(body.sebab) : null;

    if (action !== "approve" && action !== "cancel") {
      return NextResponse.json(
        { error: "action mesti 'approve' atau 'cancel'." },
        { status: 400 }
      );
    }

    const existing = await db.meritRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Rekod merit tidak ditemui." },
        { status: 404 }
      );
    }

    const nilaiLama = { status: existing.status };

    let data: any;
    if (action === "approve") {
      data = {
        status: "DILULUSKAN",
        diluluskanOleh: session.user.id,
      };
    } else {
      data = {
        status: "DIBATALKAN",
        dibatalkanSebab: sebab,
      };
    }

    const record = await db.meritRecord.update({ where: { id }, data });

    await logAudit({
      userId: session.user.id,
      userName: session.user.nama,
      tindakan: action === "approve" ? "LULUS" : "BATAL",
      entiti: "MeritRecord",
      entitiId: id,
      nilaiLama,
      nilaiBaru: data,
    });

    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
