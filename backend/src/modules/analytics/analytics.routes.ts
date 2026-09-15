import { Router } from 'express';
import { getDashboardOverview } from './analytics.controller';
import { protect } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(protect); // Require auth

router.get('/overview', getDashboardOverview);

export default router;
