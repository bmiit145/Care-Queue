/**
 * Practitioner-Department assignment controller.
 *
 * Supports many-to-many:
 *   POST  /api/practitioners/:id/departments        — assign a practitioner to a dept
 *   GET   /api/practitioners/:id/departments        — list depts for a practitioner
 *   DELETE /api/practitioners/:id/departments/:deptId — remove assignment
 *   GET   /api/departments/:deptId/practitioners    — list practitioners in a dept
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const assignDepartment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPractitionerDepartments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const removeDepartmentAssignment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPractitionersInDepartment: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=practitionerDepartment.controller.d.ts.map
