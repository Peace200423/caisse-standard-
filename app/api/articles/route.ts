import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const articles = await sql`
    SELECT * FROM articles WHERE tenant_id = ${session.tenantId} AND actif = true ORDER BY nom
  `;
  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { nom, prix, stock = null, seuilAlerte = null } = await req.json();
  if (!nom || prix === undefined || Number(prix) <= 0) {
    return NextResponse.json({ error: 'Nom et prix valides requis.' }, { status: 400 });
  }

  const [article] = await sql`
    INSERT INTO articles (tenant_id, nom, prix, stock, seuil_alerte)
    VALUES (${session.tenantId}, ${nom}, ${prix}, ${stock}, ${seuilAlerte})
    RETURNING *
  `;
  return NextResponse.json({ article });
}
