import taxAuthoritee from "../models/taxAuthoritee.model.js";
import jwt, { decode } from 'jsonwebtoken';

const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt;
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role!='taxAuthority'){
            return res.status(401).json({unauthorized: `You are not authorized to access taxAuthoritee`})
        }
        const user = await taxAuthoritee.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        req.user = user; 
        next();
    } catch (err) {
        console.error("Error occurred in protectRoute:", err);
        return res.status(500).json({ error: `Error in protectRoute: ${err.message}` });
    }
};

export default protectRoute;