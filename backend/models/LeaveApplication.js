// File: LeaveApplication.js
// Leave application model with multi-step incharge/warden approvals and history.
const mongoose = require("mongoose");

const approvalHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ["application", "incharge", "warden", "student"],
      required: true
    },
    action: {
      type: String,
      enum: ["submitted", "approved", "rejected", "forwarded", "cancelled"],
      required: true
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: ["student", "incharge", "warden", "system"], required: true },
    comment: { type: String, trim: true, default: "" },
    statusSnapshot: {
      type: String,
      enum: ["pending", "pending_incharge", "pending_warden", "approved", "rejected", "cancelled"],
      required: true
    },
    actedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const leaveApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    leaveType: {
      type: String,
      enum: ["home", "medical", "personal", "emergency"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "pending_incharge", "pending_warden", "approved", "rejected", "cancelled"],
      default: "pending_incharge"
    },
    inchargeComment: { type: String, trim: true, default: "" },
    inchargeActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inchargeActionAt: { type: Date },
    wardenComment: { type: String, trim: true, default: "" },
    wardenActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    wardenActionAt: { type: Date },
    approvalHistory: { type: [approvalHistorySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);
