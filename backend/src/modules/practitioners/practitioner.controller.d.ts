import type { Response } from 'express';
import type { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const getPractitioners: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPractitioner: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPractitionerById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePractitioner: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePractitioner: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=practitioner.controller.d.ts.map
