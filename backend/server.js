import express from 'express';
import {v2 as cloudinary} from 'cloudinary';
import cookieParser from 'cookie-parser'

import connectMongoDb from './db/connectMongoDb';

import authRouter from './routes/authRouter.js';
import adminRouter from './routes/admin.router.js'


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,               
}));


const app = express();


app.use(express.json({ limit: "10mb" }));  
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());




app.use('/api/auth',authRouter);
app.use('/api/superAdmin',organizerRouter);
app.use('/api/admin',adminRouter)
app.use('/api/tax-authoritee',taxAuthoriteeRouter);


app.listen(process.env.BACKED_SERVER_PORT,()=>{
    connectMongoDb();
    console.log(`Server started at the port with the port number - ${process.env.BACKED_SERVER_PORT}`);
})