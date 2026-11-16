import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { makeStaffToken } from "@/lib/disiplin/auth";
import { parseJSON } from "@/lib/disiplin/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseJSON(request);
    if (!body) {
      return NextResponse.json(
        { error: "Badan permintaan tidak sah." },
        { status: 400 }
      );
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nama pengguna dan kata laluan diperlukan." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user || !user.aktif) {
      return NextResponse.json(
        { error: "Nama pengguna atau kata laluan tidak sah." },
        { status: 401 }
      );
    }

    if (user.passwordHash !== password) {
      return NextResponse.json(
        { error: "Nama pengguna atau kata laluan tidak sah." },
        { status: 401 }
      );
    }

    const token = makeStaffToken(user.username, user.passwordHash);
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        peranan: user.peranan,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Ralat pelayan.", detail: String(e) },
      { status: 500 }
    );
  }
}
