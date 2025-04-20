import express from 'express';

import multer from 'multer';

import adminProtectRoute from '../middleware/adminProtectRoute.js';


import {createDepartment , addEmployee , addTransaction ,  getAllDepartments ,getDepartmentById, searchEmployees,getEmployeeDetailsById, updateDepartment, deleteDepartment, deleteEmployee, getMe, updateProfile, updateProfileImage, createNotification, getNotificationsForRole, resolveNotification, getAllTransactions, getTotalEmployees, getTotalDepartments, getDepartmentSpending, getMonthlyRevenue, getMonthlyEarnings, getMonthlyRevenueAndExpenses, getWeeklyRevenue, getMonthlySpendAndSales} from '../controller/admin/admin.controller.js';


const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/message',adminProtectRoute,createNotification);
router.get('/get-notifications',adminProtectRoute,getNotificationsForRole);
router.put('/resolved-notification',adminProtectRoute,resolveNotification);
router.get('/getMe',adminProtectRoute,getMe);
router.put('/update-profile',adminProtectRoute,updateProfile);
router.put('/update-profile-image',adminProtectRoute,upload.single('profileImg'),updateProfileImage)
router.post('/create-dept',adminProtectRoute,createDepartment);
router.post('/add-employee/:deptId',adminProtectRoute,addEmployee);
router.post('/add-transaction',adminProtectRoute,addTransaction);
router.get('/get-transactions',adminProtectRoute,getAllTransactions);
router.get('/get-departments',adminProtectRoute, getAllDepartments);
router.get('/getDeptById/:deptId',adminProtectRoute,getDepartmentById);
router.get('/search-employees',adminProtectRoute,searchEmployees);
router.get('/getEmpById/:empId',adminProtectRoute,getEmployeeDetailsById);
router.put('/update-department/:deptId',adminProtectRoute,updateDepartment);
router.delete('/delete-dept/:deptId',adminProtectRoute,deleteDepartment);
router.delete('/delete-emp/:empId',adminProtectRoute,deleteEmployee);
router.get('/get-emp-count',adminProtectRoute,getTotalEmployees);
router.get('/get-dept-count',adminProtectRoute,getTotalDepartments);
router.get('/dept-spending',adminProtectRoute,getDepartmentSpending);
router.get('/get-monthly-revenue',adminProtectRoute,getMonthlyRevenue);
router.get('/get-monthly-earnings',adminProtectRoute,getMonthlyEarnings);
router.get('/get-monthly-revenue-and-expenses',adminProtectRoute,getMonthlyRevenueAndExpenses);
router.get('/get-weekly-revenue',adminProtectRoute,getWeeklyRevenue);
router.get('/get-monthly-spend-and-sales',adminProtectRoute,getMonthlySpendAndSales);

export default router;