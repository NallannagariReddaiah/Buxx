// models/TaxAuthority.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const taxAuthoritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  designation: {
    type: String,
    default: 'Tax Officer'
  }
}, { timestamps: true });


taxAuthoritySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model('TaxAuthority', taxAuthoritySchema);
