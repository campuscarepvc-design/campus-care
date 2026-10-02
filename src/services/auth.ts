import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, User } from '../types';
import { DbUser } from '../db/schema';

// Secret from environment or development fallback
export const JWT_SECRET =
  process.env.JWT_SECRET || 'campuscare-dev-secret-replace-in-env';

// In-memory revoked token registry for immediate session invalidation on logout
const revokedTokens = new Set<string>();

// Hash password securely with bcrypt
export function hashPasswordSync(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with stored hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

export function comparePasswordSync(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}

// Generate signed JWT token
export function generateAuthToken(user: {
  id: string;
  role: UserRole;
  name: string;
  department?: string;
}): string {
  const payload = {
    userId: user.id,
    role: user.role,
    name: user.name,
    department: user.department,
    issuedAt: Date.now(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Verify JWT token and check revocation
export function verifyAuthToken(token: string): {
  userId: string;
  role: UserRole;
  name: string;
  department?: string;
} | null {
  if (!token || revokedTokens.has(token)) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        role: decoded.role,
        name: decoded.name,
        department: decoded.department,
      };
    }
  } catch (err) {
    // Token expired or invalid signature
    return null;
  }

  return null;
}

// Invalidate token on logout
export function revokeAuthToken(token: string): void {
  if (token) {
    revokedTokens.add(token);
    // Keep set bounded: clean up tokens older than 7 days
    if (revokedTokens.size > 10000) {
      revokedTokens.clear();
    }
  }
}

// Sanitize user object before sending to frontend (strip passwordHash, resetToken, etc.)
export function sanitizeUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    department: dbUser.department,
    avatar: dbUser.avatarUrl,
    phone: dbUser.phone,
    mustChangePassword: dbUser.mustChangePassword ?? false,
  };
}
