import type { Response } from 'express';
import { MissingTenantScopeError } from '../tenant/orgScope';

/**
 * Terminal error response for a controller `catch` block.
 *
 * Two jobs:
 *  - Translate a missing tenant scope into 403 rather than a misleading 500.
 *  - Keep the raw error server-side. Returning the caught object leaked
 *    Mongoose validation internals, stack traces, and driver metadata to
 *    unauthenticated callers.
 */
export const failed = (res: Response, message: string, error: unknown): void => {
  if (error instanceof MissingTenantScopeError) {
    res.status(403).json({
      message: 'Forbidden — this endpoint requires an organization context',
    });
    return;
  }

  console.error(`${message}:`, error);
  res.status(500).json({ message });
};
