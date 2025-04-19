
import express from 'express';
import {v2 as cloudinary} from 'cloudinary';
import cookieParser from 'cookie-parser'

import connectMongoDb from './db/connectMongoDb.js';

import authRouter from './routes/authRouter.js';
import adminRouter from './routes/admin.router.js'
import superAdminRouter from './routes/superAdmin.router.js'
import taxAuthorityRouter from './routes/taxAuthoritee.router.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({path:''});


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});
const app = express();

app.listen(process.env.BACKED_SERVER_PORT,()=>{
    connectMongoDb();
    console.log(`Server started at the port with the port number - ${process.env.BACKED_SERVER_PORT}`);
})

app.use(cors({
    origin: 'http://localhost:8080', 
    credentials: true,               
}));




app.use(express.json({ limit: "10mb" }));  
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());




app.use('/api/auth',authRouter);
app.use('/api/superAdmin',superAdminRouter );
app.use('/api/admin',adminRouter)
app.use('/api/tax-authority', taxAuthorityRouter);
