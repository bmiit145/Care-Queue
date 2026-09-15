import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
/**
 * GET /api/users
 * PLATFORM_ADMIN sees all; ORG_ADMIN sees only their org users.
 */
export declare const getUsers: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/users
 * PLATFORM_ADMIN or ORG_ADMIN can create/invite users into the system.
 */
export declare const createUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/users/:id
 */
export declare const getUserById: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * PUT /api/users/:id — update profile / role
 */
export declare const updateUser: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * DELETE /api/users/:id — soft delete
 */
export declare const deleteUser: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map
