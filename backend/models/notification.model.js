import mongoose from "mongoose";

const systemNotificationSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'fromType'
  },
  fromType: {
    type: String,
    required: true,
    enum: ['Admin', 'SuperAdmin', 'TaxAuthority']
  },
  targetRoles: {
    type: [String],
    required: true,
    enum: ['Admin', 'SuperAdmin', 'TaxAuthority'],
    validate: val => val.length > 0
  },
  subject: {
    type: String,
    required: true,
    maxLength: 50
  },
  message: {
    type: String,
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resolvedByType',
    default: null
  },
  resolvedByType: {
    type: String,
    enum: ['Admin', 'SuperAdmin', 'TaxAuthority'],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SystemNotification', systemNotificationSchema, 'SystemNotifications');
