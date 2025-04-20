// models/Organization.js
import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  coverImg:{
    type:String,
    default:'',
  },
  address: {
    street: { type: String, required: true }, 
    city: { type: String, required: true },   
    state: { type: String, required: true },  
    postalCode: { type: String, required: true }, 
    country: { type: String, required: true },
},
  contactEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);
