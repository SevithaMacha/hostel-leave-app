// File: dashboardController.js
// Dashboard controller for role-wise metrics and recent leave records.
const LeaveApplication = require("../models/LeaveApplication");
const User = require("../models/User");

async function getWardenDashboard(req, res) {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalLeaves = await LeaveApplication.countDocuments();
    const pendingLeaves = await LeaveApplication.countDocuments({ status: "pending_warden" });
    const pendingInchargeLeaves = await LeaveApplication.countDocuments({ status: { $in: ["pending", "pending_incharge"] } });
    const approvedLeaves = await LeaveApplication.countDocuments({ status: "approved" });
    const rejectedLeaves = await LeaveApplication.countDocuments({ status: "rejected" });
    const cancelledLeaves = await LeaveApplication.countDocuments({ status: "cancelled" });

    const recentLeaves = await LeaveApplication.find()
      .populate("student", "name rollNumber roomNumber hostelBlock")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      totalStudents,
      totalLeaves,
      pendingLeaves,
      pendingInchargeLeaves,
      approvedLeaves,
      rejectedLeaves,
      cancelledLeaves,
      recentLeaves
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
}

async function getStudentDashboard(req, res) {
  try {
    const totalApplied = await LeaveApplication.countDocuments({ student: req.user._id });
    const pendingLeaves = await LeaveApplication.countDocuments({
      student: req.user._id,
      status: { $in: ["pending", "pending_incharge", "pending_warden"] }
    });
    const approvedLeaves = await LeaveApplication.countDocuments({ student: req.user._id, status: "approved" });
    const rejectedLeaves = await LeaveApplication.countDocuments({ student: req.user._id, status: "rejected" });
    const cancelledLeaves = await LeaveApplication.countDocuments({ student: req.user._id, status: "cancelled" });

    const recentLeaves = await LeaveApplication.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      totalApplied,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      cancelledLeaves,
      recentLeaves
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
}

async function getInchargeDashboard(req, res) {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalLeaves = await LeaveApplication.countDocuments();
    const pendingLeaves = await LeaveApplication.countDocuments({ status: { $in: ["pending", "pending_incharge"] } });
    const forwardedLeaves = await LeaveApplication.countDocuments({ status: "pending_warden" });
    const approvedLeaves = await LeaveApplication.countDocuments({ status: "approved" });
    const rejectedLeaves = await LeaveApplication.countDocuments({ status: "rejected" });
    const cancelledLeaves = await LeaveApplication.countDocuments({ status: "cancelled" });

    const recentLeaves = await LeaveApplication.find()
      .populate("student", "name rollNumber roomNumber hostelBlock")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      totalStudents,
      totalLeaves,
      pendingLeaves,
      forwardedLeaves,
      approvedLeaves,
      rejectedLeaves,
      cancelledLeaves,
      recentLeaves
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
}

module.exports = { getWardenDashboard, getStudentDashboard, getInchargeDashboard };
