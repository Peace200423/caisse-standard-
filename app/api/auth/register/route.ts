import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPin, generateTenantCode, signSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nomCommerce, telephone, nomPatron, pin } = body;

  if (!nomCommerce || !nomPatron || !pin || pin.length < 4) {
    return NextResponse.json({ error: 'Champs manquants ou PIN trop court (4 chiffres min).' }, { status: 400 });
  }

  // On génère un code unique — on retente en cas de collision improbable
  let code = generateTenantCode();
  for (let i = 0; i < 5; i++) {
    const existing = await sql`SELECT id FROM tenants WHERE code = ${code}`;
    if (existing.length === 0) break;
    code = generateTenantCode();
  }

  const [tenant] = await sql`
    INSERT INTO tenants (code, nom, telephone)
    VALUES (${code}, ${nomCommerce}, ${telephone || null})
    RETURNING id, code
  `;

  const pinHash = await hashPin(pin);
  const [user] = await sql`
    INSERT INTO users (tenant_id, nom, pin_hash, role)
    VALUES (${tenant.id}, ${nomPatron}, ${pinHash}, 'patron')
    RETURNING id, nom, role
  `;

  const session = signSession({
    tenantId: tenant.id,
    tenantCode: tenant.code,
    userId: user.id,
    userNom: user.nom,
    role: user.role,
  });

  const res = NextResponse.json({ tenantCode: tenant.code });
  res.cookies.set('session', session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
