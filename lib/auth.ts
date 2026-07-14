import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET || 'change-moi-en-production';

export type SessionPayload = {
  tenantId: string;
  tenantCode: string;
  userId: string;
  userNom: string;
  role: 'patron' | 'vendeur';
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// Génère un code tenant court et lisible, ex: BTQ4821
export function generateTenantCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I/O pour éviter confusion avec 1/0
  const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${digits}`;
}
