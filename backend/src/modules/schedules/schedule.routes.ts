import { Router } from 'express';
import { createSchedule, getPractitionerSchedule } from './schedule.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(protect); // Require auth for all route operations

router.post('/', authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), createSchedule);
router.get('/practitioner/:practitionerId', getPractitionerSchedule);

export default router;
