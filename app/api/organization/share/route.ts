import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canManageMembers } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canManageMembers(session.role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 });
  }

  const { enabled } = await req.json();
  const org = await prisma.organization.findUnique({ where: { id: session.organizationId } });
  if (!org) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const token = org.publicShareToken || crypto.randomBytes(16).toString("hex");

  const updated = await prisma.organization.update({
    where: { id: session.organizationId },
    data: { publicShareEnabled: !!enabled, publicShareToken: token },
  });

  return NextResponse.json({
    publicShareEnabled: updated.publicShareEnabled,
    publicShareToken: updated.publicShareToken,
  });
}
