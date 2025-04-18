 import express from "express";
 
 import { loginTaxAuthority,logoutTaxAuthority } from "../controller/taxAuthoritee/taxAuthoritee.auth.controller.js";
 const router=express.Router();
 
 
 router.post('/login',loginTaxAuthority);
 router.get('/logout',logoutTaxAuthority);
 
 export default router;