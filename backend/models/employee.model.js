// models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  empname: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  phoneNumber: {
    type: String,
    required: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  addEmpBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Admin',
    required:true,
  },
  position:{
    type:String,
    default:"NA",
  }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
