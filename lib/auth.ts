import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-in-production"
);

export const SESSION_COOKIE = "se_session";

export type Role = "admin" | "superviseur" | "agent";

export type SessionPayload = {
  organizationId: string;
  memberId: string;
  role: Role;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  req: Request
): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.split("=")[1];
  return verifySessionToken(token);
}

export function canManageMembers(role: Role) {
  return role === "admin";
}
export function canValidate(role: Role) {
  return role === "admin" || role === "superviseur";
}
export function canEditStructure(role: Role) {
  return role === "admin" || role === "superviseur";
}
