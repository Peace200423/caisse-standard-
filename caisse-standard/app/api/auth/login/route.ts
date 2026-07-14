import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPin, signSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { code, pin } = await req.json();
  if (!code || !pin) {
    return NextResponse.json({ error: 'Code commerce et PIN requis.' }, { status: 400 });
  }

  const [tenant] = await sql`SELECT * FROM tenants WHERE code = ${code.toUpperCase().trim()}`;
  if (!tenant) {
    return NextResponse.json({ error: 'Code commerce introuvable.' }, { status: 404 });
  }

  if (tenant.statut === 'suspendu') {
    return NextResponse.json({ error: 'Abonnement suspendu. Contactez le support pour réactiver.' }, { status: 403 });
  }

  const users = await sql`SELECT * FROM users WHERE tenant_id = ${tenant.id} AND actif = true`;

  let matched = null;
  for (const u of users) {
    if (await verifyPin(pin, u.pin_hash)) {
      matched = u;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'PIN incorrect.' }, { status: 401 });
  }

  const session = signSession({
    tenantId: tenant.id,
    tenantCode: tenant.code,
    userId: matched.id,
    userNom: matched.nom,
    role: matched.role,
  });

  const res = NextResponse.json({
    tenant: { nom: tenant.nom, code: tenant.code, statut: tenant.statut },
    user: { nom: matched.nom, role: matched.role },
  });
  res.cookies.set('session', session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
