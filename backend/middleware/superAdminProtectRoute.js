import jwt from 'jsonwebtoken'

import adminSchema from '../models/superAdmin.model.js'
import superAdminModel from '../models/superAdmin.model.js';

const superadminProtectRoute = async (req,res,next) =>{
    try{
        const token = req.cookies?.jwt;
        if(!token){
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role!='superAdmin'){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        const SuperAdmin = await superAdminModel.findById(decoded.userId);
        if(!SuperAdmin){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        req.user=SuperAdmin;
        req.user.role="superAdmin";
        next();
    }catch(err){
        console.log(`Error occured at admin protect route`);
        return res.status(500).json({err:`- Error occured at admin protect route`})
    }
}
export default superadminProtectRoute;