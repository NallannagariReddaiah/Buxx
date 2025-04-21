import express from 'express';
import multer from 'multer';

import taxAuthoriteeProtectRoute from '../middleware/taxAuthoriteeProtectRoute.js';
import {viewAllTransactions,viewTransactionsByType,viewTransactionsByDate,viewTransactionsByDepartmentName, generateTaxSummaryReport,addTaxTransaction, updateProfile, updateProfileImage, getMe, createNotification, getNotificationsForRole, resolveNotification, getAllDepartments} from '../controller/taxAuthoritee/taxAuthoritee.controller.js';

const router  = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.post('/message',taxAuthoriteeProtectRoute,createNotification);
router.get('/get-notifications',taxAuthoriteeProtectRoute,getNotificationsForRole);
router.put('/resolved-notification',taxAuthoriteeProtectRoute,resolveNotification);
router.get('/getMe',taxAuthoriteeProtectRoute,getMe);
router.put('/update-profile',taxAuthoriteeProtectRoute,updateProfile);
router.put('/update-profile-image',taxAuthoriteeProtectRoute,upload.single('profileImg'),updateProfileImage);
router.get('/view-transactions',taxAuthoriteeProtectRoute,viewAllTransactions);
router.get('/view-transactions-by-type',taxAuthoriteeProtectRoute,viewTransactionsByType);
router.get('/view-transactions-by-date',taxAuthoriteeProtectRoute,viewTransactionsByDate);
router.get('/view-transactions-by-department/:deptId',taxAuthoriteeProtectRoute,viewTransactionsByDepartmentName);
router.get('/generate-tax-reports',taxAuthoriteeProtectRoute, generateTaxSummaryReport);
router.post('/add-tax-transaction',taxAuthoriteeProtectRoute,addTaxTransaction)
router.get('/get-all-dept',taxAuthoriteeProtectRoute,getAllDepartments);

export default router;