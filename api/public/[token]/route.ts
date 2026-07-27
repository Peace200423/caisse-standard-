import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const org = await prisma.organization.findUnique({
    where: { publicShareToken: params.token },
    include: {
      objectifs: {
        include: {
          indicateurs: {
            include: { valeurs: { where: { statut: "valide" } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org || !org.publicShareEnabled) {
    return NextResponse.json({ error: "Ce lien n'existe pas ou n'est plus actif." }, { status: 404 });
  }

  return NextResponse.json({
    organization: { id: org.id, name: org.name, objectifs: org.objectifs },
  });
}
