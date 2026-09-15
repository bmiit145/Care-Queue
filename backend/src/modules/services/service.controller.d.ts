import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const getServices: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createService: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getServiceById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateService: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteService: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=service.controller.d.ts.map