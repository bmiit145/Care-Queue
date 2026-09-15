import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const registerPatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatients: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientById: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=patient.controller.d.ts.map
