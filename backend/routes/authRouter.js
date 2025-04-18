import express  from 'express';

import superAdminAuthRouter from './superAdminAuthRouter.js'
import adminAuthRouter from './adminAuthRoutes.js'
import taxAuthoriteeAuthRouter from './attendeeAuthRouter.js'

const router = express.Router();

router.use('/superAdmin',superAdminAuthRouter);
router.use('/admin',adminAuthRouter);
router.use('/tax-authoritee',taxAuthoriteeAuthRouter);

export default router;