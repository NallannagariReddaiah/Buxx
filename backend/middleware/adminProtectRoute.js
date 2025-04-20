import jwt from 'jsonwebtoken'

import adminSchema from '../models/admin.model.js';
import superAdminSchema from '../models/superAdmin.model.js';

const adminProtectRoute = async (req,res,next) =>{
    try{
        const token = req.cookies?.jwt;
        if(!token){
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role!='Admin'&&decoded.role!=='superAdmin'){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        let admin;
        if(decoded.role=='Admin'){
            admin =await adminSchema.findById(decoded.userId);
        }
        else{
            admin = await superAdminSchema .findById(decoded.userId);
        }
        if(!admin){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        req.user=admin;
        if(decoded.role=='Admin'){
            req.user.role='Admin';
        }
        else{
            req.user.role='superAdmin';
        }
        next();

    }catch(err){
        console.log(`Error occured at admin protect route`);
        return res.status(500).json({err:`- Error occured at admin protect route`})
    }
}
export default adminProtectRoute;