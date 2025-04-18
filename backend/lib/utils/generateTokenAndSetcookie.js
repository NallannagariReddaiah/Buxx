import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, role, res) => {
    if (!process.env.JWT_SECRET) {
        console.error("Error: JWT_SECRET is not defined in environment variables.");
        throw new Error("JWT_SECRET is missing. Please check your environment variables.");
    }

    try {
        const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15d' });

        
        res.cookie('jwt', token, {
            maxAge: 15 * 24 * 60 * 60 * 1000, 
            httpOnly: false,                   
            sameSite: 'Lax',                   
            secure: process.env.NODE_ENV === 'production',
        });

        return token;
    } catch (err) {
        console.error("Error generating token:", err);
        throw new Error("Token generation failed.");
    }
};

export default generateTokenAndSetCookie;