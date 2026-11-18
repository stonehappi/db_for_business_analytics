import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { queryApp } from '@db-platform/db';

export const AUTH_COOKIE_NAME = 'auth_token';

const secretKey = process.env.JWT_SECRET || 'antigravity-secure-jwt-secret-key-production-2026-business-analytics';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn(
    '[SECURITY WARNING] JWT_SECRET is not set in production environment! Using fallback key. Set JWT_SECRET immediately.'
  );
}

const JWT_SECRET = new TextEncoder().encode(secretKey);

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  role: 'teacher' | 'ta' | 'student';
  fullName: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req: Request) {
  // Check cookie first
  let token: string | null = null;
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  if (match) {
    token = match[1];
  } else {
    // Check Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.sub) return null;

  // Retrieve fresh user from DB
  const userRes = await queryApp(
    `SELECT id, student_id_code, email, full_name, role FROM users WHERE id = $1`,
    [payload.sub]
  );

  if (userRes.rowCount === 0) return null;
  return userRes.rows[0];
}
