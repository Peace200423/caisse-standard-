import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canEditStructure } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canEditStructure(session.role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs/superviseurs." }, { status: 403 });
  }

  const { objectifId, nom, cible, unite, odd } = await req.json();
  if (!objectifId || !nom || cible === undefined) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const objectif = await prisma.objectif.findUnique({ where: { id: objectifId } });
  if (!objectif || objectif.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
  }

  const oddList = Array.isArray(odd) ? odd.filter((n: unknown) => typeof n === "number" && n >= 1 && n <= 17) : [];

  const indicateur = await prisma.indicateur.create({
    data: { objectifId, nom, cible: parseFloat(cible), unite: unite || null, odd: oddList },
  });

  return NextResponse.json({ indicateur });
}
