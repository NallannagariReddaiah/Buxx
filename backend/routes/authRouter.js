import express  from 'express';

import superAdminAuthRouter from './superAdminAuthRouter.js'
import adminAuthRouter from './adminAuthRouter.js'
import taxAuthoriteeAuthRouter from './taxAuthoriteeAuthRouter.js'

const router = express.Router();

router.use('/superAdmin',superAdminAuthRouter);
router.use('/admin',adminAuthRouter);
router.use('/tax-authoritee',taxAuthoriteeAuthRouter);

export default router;