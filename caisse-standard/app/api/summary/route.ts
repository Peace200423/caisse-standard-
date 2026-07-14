import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const ventesJour = await sql`
    SELECT mode_paiement, COALESCE(SUM(montant), 0) as total, COUNT(*) as nombre
    FROM ventes
    WHERE tenant_id = ${session.tenantId} AND created_at >= date_trunc('day', now())
    GROUP BY mode_paiement
  `;

  const mouvementsJour = await sql`
    SELECT type, COALESCE(SUM(montant), 0) as total
    FROM mouvements_caisse
    WHERE tenant_id = ${session.tenantId} AND created_at >= date_trunc('day', now())
    GROUP BY type
  `;

  const [creditTotal] = await sql`
    SELECT COALESCE(SUM(solde_du), 0) as total FROM clients_credit WHERE tenant_id = ${session.tenantId}
  `;

  const totalVentes = ventesJour.reduce((acc: number, r: any) => acc + Number(r.total), 0);
  const totalCash = ventesJour.find((r: any) => r.mode_paiement === 'cash')?.total || 0;
  const entrees = mouvementsJour.find((r: any) => r.type === 'entree')?.total || 0;
  const sorties = mouvementsJour.find((r: any) => r.type === 'sortie')?.total || 0;

  return NextResponse.json({
    ventesParMode: ventesJour,
    totalVentesJour: totalVentes,
    caisseEspecesEstimee: Number(totalCash) + Number(entrees) - Number(sorties),
    creditTotalDu: Number(creditTotal.total),
  });
}
