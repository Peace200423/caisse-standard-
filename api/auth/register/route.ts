import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const { orgName, adminNom, adminEmail, adminCode } = body;

    if (!orgName || !adminNom || !adminEmail || !adminCode) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }
    if (adminCode.length < 4) {
      return NextResponse.json({ error: "Le code d'accès doit faire au moins 4 caractères." }, { status: 400 });
    }

    const existing = await prisma.member.findUnique({ where: { email: adminEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà associé à un compte. Connectez-vous plutôt." },
        { status: 409 }
      );
    }

    const slug = `${slugify(orgName)}-${randomSuffix()}`;
    const codeHash = await bcrypt.hash(adminCode, 10);

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        members: {
          create: { nom: adminNom, email: adminEmail, role: "admin", codeHash },
        },
      },
      include: { members: true },
    });

    const admin = org.members[0];
    const token = await createSessionToken({
      organizationId: org.id,
      memberId: admin.id,
      role: "admin",
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });
    return res;
  } catch (e: any) {
    console.error("Erreur /api/auth/register", e);
    const message =
      e?.code === "P2002"
        ? "Ce nom d'association ou cet email est déjà utilisé."
        : "Erreur serveur. Vérifiez que DATABASE_URL / DIRECT_URL sont bien configurées et que `npx prisma db push` a été exécuté sur la base de production.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
