import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, canManageMembers } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!canManageMembers(session.role)) {
    return NextResponse.json({ error: "Seul un administrateur peut retirer des membres." }, { status: 403 });
  }
  if (params.id === session.memberId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous retirer vous-même." }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: params.id } });
  if (!member || member.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.member.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
