import express from "express";

import { loginAdmin,logoutAdmin } from "../controller/admin/admin.auth.controller.js";
const router=express.Router();


router.post('/login',loginAdmin);
router.get('/logout',logoutAdmin);

export default router;