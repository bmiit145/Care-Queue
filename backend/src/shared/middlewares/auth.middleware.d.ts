import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../modules/users/user.model';
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
/**
 * protect — verifies the Bearer JWT and attaches req.user.
 * organizationId is embedded in the token at login time so every
 * downstream controller can use it for tenant-scoped queries without
 * hitting the database again.
 */
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * authorize — role-based access control guard.
 * Usage: authorize('ORG_ADMIN', 'RECEPTIONIST')
 *
 * Roles per docs/phase-1-architecture.md § 13:
 *   PLATFORM_ADMIN | ORG_ADMIN | RECEPTIONIST | PRACTITIONER | STAFF | PATIENT
 */
export declare const authorize: (...allowedRoles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * requireOrg — ensures the authenticated user belongs to an organization.
 * Must be used after protect() on all org-scoped routes.
 */
export declare const requireOrg: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map