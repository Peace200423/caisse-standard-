import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const clients = await sql`
    SELECT * FROM clients_credit WHERE tenant_id = ${session.tenantId} ORDER BY solde_du DESC, nom
  `;
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { nom, telephone } = await req.json();
  if (!nom) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 });

  const [client] = await sql`
    INSERT INTO clients_credit (tenant_id, nom, telephone)
    VALUES (${session.tenantId}, ${nom}, ${telephone || null})
    RETURNING *
  `;
  return NextResponse.json({ client });
}

// Enregistrer un remboursement partiel ou total d'un client à crédit
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { clientId, montant } = await req.json();
  if (!clientId || !montant || Number(montant) <= 0) {
    return NextResponse.json({ error: 'clientId et montant valides requis.' }, { status: 400 });
  }

  const [client] = await sql`
    UPDATE clients_credit
    SET solde_du = GREATEST(solde_du - ${montant}, 0)
    WHERE id = ${clientId} AND tenant_id = ${session.tenantId}
    RETURNING *
  `;

  if (!client) return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 });

  await sql`
    INSERT INTO mouvements_caisse (tenant_id, user_id, type, libelle, montant)
    VALUES (${session.tenantId}, ${session.userId}, 'entree', ${'Remboursement crédit - ' + client.nom}, ${montant})
  `;

  return NextResponse.json({ client });
}
