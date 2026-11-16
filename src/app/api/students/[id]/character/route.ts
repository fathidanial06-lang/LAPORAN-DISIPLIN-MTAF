import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseParentToken } from "@/lib/disiplin/auth";
import { computeCharacterGrade } from "@/lib/disiplin/domain";

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

    const assessments = await db.characterAssessment.findMany({
      where: { studentId: id, status: "DISAHKAN" },
      orderBy: { tempoh: "desc" },
    });

    const mapped = assessments.map((a) => {
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

    return NextResponse.json({ assessments: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
