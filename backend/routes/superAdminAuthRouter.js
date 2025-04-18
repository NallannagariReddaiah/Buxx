import express from "express";

import {  registerSuperAdmin,loginSuperAdmin,logoutSuperAdmin } from "../controller/superAdmin/superAdmin.auth.controller.js";
const router=express.Router();
router.post('/signup',registerSuperAdmin);
router.post('/login',loginSuperAdmin);
router.get('/logout',logoutSuperAdmin);

export default router;