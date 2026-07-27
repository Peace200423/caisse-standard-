import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canManageMembers } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, nom: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canManageMembers(session.role)) {
    return NextResponse.json({ error: "Seul un administrateur peut ajouter des membres." }, { status: 403 });
  }

  const { nom, email, role, code } = await req.json();
  if (!nom || !email || !code || !["admin", "superviseur", "agent"].includes(role)) {
    return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  }
  if (code.length < 4) {
    return NextResponse.json({ error: "Le code doit faire au moins 4 caractères." }, { status: 400 });
  }

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte." }, { status: 409 });
  }

  const codeHash = await bcrypt.hash(code, 10);
  const member = await prisma.member.create({
    data: { nom, email, role, codeHash, organizationId: session.organizationId },
    select: { id: true, nom: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ member });
}
