import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Protection simple par clé secrète dans l'en-tête — suffisant tant que c'est toi seul
// qui gères les activations. Passe la clé via le header "x-admin-key".
function checkAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const tenants = await sql`
    SELECT id, code, nom, telephone, ville, statut, essai_fin, abonnement_fin, created_at
    FROM tenants ORDER BY created_at DESC
  `;
  return NextResponse.json({ tenants });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { tenantId, statut, moisPayes = 1 } = await req.json();
  if (!tenantId || !['actif', 'suspendu', 'essai'].includes(statut)) {
    return NextResponse.json({ error: 'tenantId et statut (actif/suspendu/essai) requis.' }, { status: 400 });
  }

  const [tenant] = statut === 'actif'
    ? await sql`
        UPDATE tenants
        SET statut = 'actif', abonnement_fin = GREATEST(COALESCE(abonnement_fin, now()), now()) + (${moisPayes} || ' months')::interval
        WHERE id = ${tenantId}
        RETURNING *
      `
    : await sql`
        UPDATE tenants SET statut = ${statut} WHERE id = ${tenantId} RETURNING *
      `;

  if (!tenant) return NextResponse.json({ error: 'Commerce introuvable.' }, { status: 404 });
  return NextResponse.json({ tenant });
}
