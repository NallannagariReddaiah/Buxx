import mongoose from "mongoose";

const complianceStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["Compliant", "Under Review", "Non-Compliant"],
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TaxAuthority",
    required: true
  },
}, { timestamps: true });

export default mongoose.model("ComplianceStatus", complianceStatusSchema);
