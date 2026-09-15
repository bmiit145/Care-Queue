import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const getLocations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLocationById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteLocation: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=location.controller.d.ts.map