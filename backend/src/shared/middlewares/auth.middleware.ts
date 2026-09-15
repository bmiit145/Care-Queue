import { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { User, USER_ROLES, UserRole } from '../../modules/users/user.model';
import { env } from '../../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    organizationId?: string;
  };
}

interface AccessTokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
  organizationId?: string;
}

const isAccessTokenPayload = (value: string | JwtPayload): value is AccessTokenPayload => {
  if (typeof value === 'string' || typeof value.id !== 'string' || typeof value.role !== 'string') {
    return false;
  }

  return (USER_ROLES as readonly string[]).includes(value.role);
};

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!isAccessTokenPayload(decoded)) {
      res.status(401).json({ message: 'Not authorized — invalid token payload' });
      return;
    }

    const user = await User.findById(decoded.id).select('-passwordHash').lean();
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Not authorized — user not found or deactivated' });
      return;
    }

    if (user.role !== decoded.role) {
      res.status(401).json({ message: 'Not authorized — token role is stale' });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Not authorized — token invalid or expired' });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized — authenticate first' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden — role '${req.user.role}' is not permitted to access this resource`,
        allowedRoles,
      });
      return;
    }

    next();
  };
};

export const requireOrg = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.organizationId) {
    res.status(403).json({
      message: 'Forbidden — this endpoint requires an organization context',
    });
    return;
  }

  next();
};
