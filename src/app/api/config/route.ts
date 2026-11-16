import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/disiplin/api-helpers";

export async function GET() {
  try {
    const config = await loadConfig();
    return NextResponse.json({
      ambangKehadiran: config.ambangKehadiran,
      ambangDisiplin: config.ambangDisiplin,
      pengesahanIbuBapa: config.pengesahanIbuBapa,
      hariCuti: config.hariCuti,
      penggalAktif: config.penggalAktif,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
