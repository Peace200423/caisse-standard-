import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { type, libelle, montant } = await req.json();
  if (!['entree', 'sortie'].includes(type) || !libelle || !montant || Number(montant) <= 0) {
    return NextResponse.json({ error: 'type (entree/sortie), libelle et montant valides requis.' }, { status: 400 });
  }

  const [mouvement] = await sql`
    INSERT INTO mouvements_caisse (tenant_id, user_id, type, libelle, montant)
    VALUES (${session.tenantId}, ${session.userId}, ${type}, ${libelle}, ${montant})
    RETURNING *
  `;
  return NextResponse.json({ mouvement });
}
