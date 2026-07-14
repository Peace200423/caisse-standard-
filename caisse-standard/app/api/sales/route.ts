import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json();
  const {
    libelle,
    montant,
    quantite = 1,
    articleId = null,
    modePaiement = 'cash',
    clientCreditId = null,
    clientUuid, // généré côté appareil, permet d'éviter les doublons si la sync rejoue une requête
  } = body;

  if (!libelle || montant === undefined || montant === null || Number(montant) <= 0) {
    return NextResponse.json({ error: 'Libellé et montant valides requis.' }, { status: 400 });
  }
  if (modePaiement === 'credit' && !clientCreditId) {
    return NextResponse.json({ error: 'Client requis pour une vente à crédit.' }, { status: 400 });
  }

  // Idempotence: si ce clientUuid existe déjà pour ce tenant, on renvoie la vente existante
  if (clientUuid) {
    const existing = await sql`
      SELECT * FROM ventes WHERE tenant_id = ${session.tenantId} AND client_uuid = ${clientUuid}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ vente: existing[0], deduped: true });
    }
  }

  const [vente] = await sql`
    INSERT INTO ventes (tenant_id, user_id, article_id, libelle, montant, quantite, mode_paiement, client_credit_id, client_uuid)
    VALUES (${session.tenantId}, ${session.userId}, ${articleId}, ${libelle}, ${montant}, ${quantite}, ${modePaiement}, ${clientCreditId}, ${clientUuid || null})
    RETURNING *
  `;

  // Vente à crédit -> on augmente le solde dû du client
  if (modePaiement === 'credit' && clientCreditId) {
    await sql`
      UPDATE clients_credit SET solde_du = solde_du + ${montant} WHERE id = ${clientCreditId} AND tenant_id = ${session.tenantId}
    `;
  }

  // Décrément de stock si l'article en suit un
  if (articleId) {
    await sql`
      UPDATE articles SET stock = stock - ${quantite}
      WHERE id = ${articleId} AND tenant_id = ${session.tenantId} AND stock IS NOT NULL
    `;
  }

  return NextResponse.json({ vente });
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

  const ventes = await sql`
    SELECT v.*, u.nom as vendeur_nom
    FROM ventes v
    LEFT JOIN users u ON u.id = v.user_id
    WHERE v.tenant_id = ${session.tenantId}
    ORDER BY v.created_at DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({ ventes });
}
