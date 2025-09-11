import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('⚠️  Using default JWT_SECRET in development. Set JWT_SECRET environment variable for production.');
  return 'dev-secret-key-change-for-production';
})();

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user still exists in database and validate tenant access
  const dbUser = await storage.getUser(user.id);
  if (!dbUser) {
    return res.status(403).json({ error: 'User no longer exists' });
  }

  // Ensure token data matches database data
  if (dbUser.tenantId !== user.tenantId || dbUser.role !== user.role) {
    return res.status(403).json({ error: 'Token data mismatch, please login again' });
  }

  req.user = user;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireTenantAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const tenantId = req.params.tenantId || req.body.tenantId || req.user?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }

  // Users can only access their own tenant data unless they're super admin
  if (req.user?.role !== 'super_admin' && req.user?.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }

  next();
};