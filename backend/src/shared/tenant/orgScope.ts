import type { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Raised when a request reaches tenant-scoped logic without an organization.
 *
 * This exists because the previous pattern — `req.user!.organizationId as string`
 * — fails *open*. Mongoose deletes `undefined` values from a filter, so
 * `find({ organizationId: undefined })` silently becomes `find({})` and returns
 * every tenant's documents. Throwing makes the missing scope fail closed.
 */
export class MissingTenantScopeError extends Error {
  constructor() {
    super('Request is missing organization scope');
    this.name = 'MissingTenantScopeError';
  }
}

/**
 * The caller's organization id, guaranteed non-empty.
 *
 * `requireOrg` should already have rejected these requests at the route layer;
 * this is the second line of defence for any route that misses the middleware.
 */
export const orgIdOf = (req: AuthRequest): string => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new MissingTenantScopeError();
  }

  return organizationId;
};
