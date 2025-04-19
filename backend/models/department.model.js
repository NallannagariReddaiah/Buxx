// models/Department.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  deptname: {
    type: String,
    required: true,
    trim: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  expenditure: {
    type: Number,
    default:0,
  },
  deptHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', 
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', 
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', 
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);
