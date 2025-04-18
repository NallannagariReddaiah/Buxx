import mongoose from 'mongoose';

const connectMongoDb = async ()=>{
    try{
        const conn= await mongoose.connect(process.env.MONGO_URI);
        if(conn){
            console.log("Mongodb connected");
        }
        else{
            console.log("Error has occured");
        }
    }
    catch(err){
        console.log('Internal error occured')
        process.exit(1);
    }
}
export default connectMongoDb;