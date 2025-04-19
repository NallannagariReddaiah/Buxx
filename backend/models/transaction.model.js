// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payroll', 'maintenance', 'construction', 'tax', 'misc','expense'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  enteredBy: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  refPath: 'enteredByModel'
},
enteredByModel: {
  type: String,
  required: true,
  enum: ['Admin', 'TaxAuthority','superAdmin']
},

  // For general transactions
  from: {
    type: String, // Could be department name, vendor name, or even an ID
    required: function () {
      return this.type !== 'payroll';
    }
  },
  to: {
    type: String,
    required: function () {
      return this.type !== 'payroll';
    }
  },

  // Payroll-specific fields
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  salary: Number,
  bonus: Number
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
