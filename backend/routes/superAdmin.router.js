import express from 'express';

import multer from 'multer';

import  superAdminProtectRoute  from '../middleware/superAdminProtectRoute.js';
import {createDepartment , addEmployee , addTransaction ,  getAllDepartments ,getDepartmentById, searchEmployees,getEmployeeDetailsById, updateDepartment, deleteDepartment, deleteEmployee} from '../controller/admin/admin.controller.js';
import { createOrganization , addAdminBySuperAdmin, addTaxAuthorityBySuperAdmin,getMe,updateProfile,getAllAdmins,getAllTaxAuthorities,deleteAdminByEmail,deleteTaxAuthorityByEmail, updateProfileImage, createNotification, getNotificationsForRole, resolveNotification} from '../controller/superAdmin/superAdmin.controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/message',superAdminProtectRoute,createNotification);
router.get('/get-notifications',superAdminProtectRoute,getNotificationsForRole);
router.put('/resolved-notification',superAdminProtectRoute,resolveNotification);
router.get('/getMe',superAdminProtectRoute,getMe);
router.put('/update-profile',superAdminProtectRoute,updateProfile);
router.put('/update-profile-image',superAdminProtectRoute,upload.single('profileImg'),updateProfileImage);
router.post('/create-dept', superAdminProtectRoute ,createDepartment);
router.post('/add-employee', superAdminProtectRoute ,addEmployee);
router.post('/add-transaction', superAdminProtectRoute ,addTransaction);
router.get('/get-departments', superAdminProtectRoute , getAllDepartments);
router.get('/getDeptById/:deptId', superAdminProtectRoute ,getDepartmentById);
router.get('/search-employees', superAdminProtectRoute ,searchEmployees);
router.get('/getEmpById/:empId', superAdminProtectRoute ,getEmployeeDetailsById);
router.put('/update-department/:deptId', superAdminProtectRoute ,updateDepartment);
router.delete('/delete-dept/:deptId', superAdminProtectRoute ,deleteDepartment);
router.delete('/delete-emp/:empId', superAdminProtectRoute ,deleteEmployee);
router.post('/create-organization',superAdminProtectRoute, createOrganization );
router.post('/add-admin',superAdminProtectRoute,addAdminBySuperAdmin);
router.post('/add-taxAuthoritee',superAdminProtectRoute,addTaxAuthorityBySuperAdmin);
router.get('/get-all-admins',superAdminProtectRoute,getAllAdmins);
router.post('/add-taxAuthoritee',superAdminProtectRoute,addTaxAuthorityBySuperAdmin);
router.get('/get-all-taxAuthoritees',superAdminProtectRoute,getAllTaxAuthorities );
router.delete('/delete-admin',superAdminProtectRoute,deleteAdminByEmail);
router.delete('/delete-taxAuthoritee',superAdminProtectRoute,deleteTaxAuthorityByEmail);


export default router;