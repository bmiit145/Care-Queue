import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../modules/users/user.model';

/**
 * Extends Express Request with the authenticated user context.
 * organizationId is extracted from the JWT and auto-scopes all queries.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    organizationId?: string;
  };
}

interface JwtPayload {
  id: string;
  role: UserRole;
  organizationId?: string;
}

/**
 * protect — verifies the Bearer JWT and attaches req.user.
 * organizationId is embedded in the token at login time so every
 * downstream controller can use it for tenant-scoped queries without
 * hitting the database again.
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'changeme_in_production'
    ) as JwtPayload;

    // Re-verify the user still exists and is active
    const user = await User.findById(decoded.id).select('-passwordHash').lean();
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Not authorized — user not found or deactivated' });
      return;
    }

    req.user = {
      id:             decoded.id,
      role:           decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Not authorized — token invalid or expired' });
  }
};

/**
 * authorize — role-based access control guard.
 * Usage: authorize('ORG_ADMIN', 'RECEPTIONIST')
 *
 * Roles per docs/phase-1-architecture.md § 13:
 *   PLATFORM_ADMIN | ORG_ADMIN | RECEPTIONIST | PRACTITIONER | STAFF | PATIENT
 */
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

/**
 * requireOrg — ensures the authenticated user belongs to an organization.
 * Must be used after protect() on all org-scoped routes.
 */
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
