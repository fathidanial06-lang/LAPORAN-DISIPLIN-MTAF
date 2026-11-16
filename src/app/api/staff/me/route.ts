import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/disiplin/auth";

export async function GET(request: Request) {
  try {
    const session = await requireStaff(request);
    if (!session) {
      return NextResponse.json(
        { error: "Token tidak sah atau telah tamat tempoh." },
        { status: 401 }
      );
    }
    return NextResponse.json({
      user: {
        id: session.user.id,
        nama: session.user.nama,
        username: session.user.username,
        peranan: session.user.peranan,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
