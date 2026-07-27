import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    const { email, code } = body;
    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return NextResponse.json({ error: "Aucun compte ne correspond à cet email." }, { status: 404 });
    }

    const valid = await bcrypt.compare(code, member.codeHash);
    if (!valid) {
      return NextResponse.json({ error: "Code d'accès incorrect." }, { status: 401 });
    }

    const token = await createSessionToken({
      organizationId: member.organizationId,
      memberId: member.id,
      role: member.role as "admin" | "superviseur" | "agent",
    });

    const res = NextResponse.json({ ok: true, role: member.role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Erreur /api/auth/login", e);
    return NextResponse.json(
      { error: "Erreur serveur. Vérifiez la configuration de la base de données." },
      { status: 500 }
    );
  }
}
