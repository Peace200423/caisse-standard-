import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canValidate } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canValidate(session.role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs/superviseurs." }, { status: 403 });
  }

  const { statut } = await req.json();
  if (!["valide", "rejete"].includes(statut)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const relevé = await prisma.valeurRelevee.findUnique({
    where: { id: params.id },
    include: { indicateur: { include: { objectif: true } } },
  });
  if (!relevé || relevé.indicateur.objectif.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.valeurRelevee.update({
    where: { id: params.id },
    data: { statut },
  });

  return NextResponse.json({ relevé: updated });
}
