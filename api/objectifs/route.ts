import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canEditStructure } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: {
      objectifs: {
        include: { indicateurs: { include: { valeurs: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org) return NextResponse.json({ error: "Espace introuvable" }, { status: 404 });
  return NextResponse.json({ organization: org, role: session.role });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canEditStructure(session.role)) {
    return NextResponse.json({ error: "Seuls les administrateurs et superviseurs peuvent modifier la structure." }, { status: 403 });
  }

  const { titre, niveau, parentId } = await req.json();
  if (!titre) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  const niveauValide = ["IMPACT", "EFFET", "EXTRANT", "ACTIVITE"].includes(niveau) ? niveau : "EXTRANT";

  if (parentId) {
    const parent = await prisma.objectif.findUnique({ where: { id: parentId } });
    if (!parent || parent.organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Objectif parent invalide" }, { status: 400 });
    }
  }

  const objectif = await prisma.objectif.create({
    data: {
      titre,
      niveau: niveauValide,
      parentId: parentId || null,
      organizationId: session.organizationId,
    },
  });

  return NextResponse.json({ objectif });
}
