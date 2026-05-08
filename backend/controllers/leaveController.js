// File: leaveController.js
// Leave controller for student requests, incharge/warden approvals, and history tracking.
const LeaveApplication = require("../models/LeaveApplication");

const FINAL_STATUSES = ["approved", "rejected", "cancelled"];

function isWarden(user) {
  return user.role === "warden";
}

function isIncharge(user) {
  return user.role === "incharge";
}

function isReviewer(user) {
  return isIncharge(user) || isWarden(user);
}

function isOwner(user, studentId) {
  return String(user._id) === String(studentId);
}

function canStudentCancel(leave) {
  return ["pending", "pending_incharge", "pending_warden"].includes(leave.status);
}

function addHistory(leave, { stage, action, actor, actorRole, comment, statusSnapshot }) {
  leave.approvalHistory.push({
    stage,
    action,
    actor,
    actorRole,
    comment: comment || "",
    statusSnapshot,
    actedAt: new Date()
  });
}

// CREATE - Student applies for leave
async function applyLeave(req, res) {
  try {
    const { reason, destination, fromDate, toDate, leaveType } = req.body;
    if (!reason || !destination || !fromDate || !toDate || !leaveType) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      return res.status(400).json({ message: "To date must be after from date" });
    }
    const numberOfDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await LeaveApplication.create({
      student: req.user._id,
      reason,
      destination,
      fromDate: from,
      toDate: to,
      numberOfDays,
      leaveType,
      status: "pending_incharge",
      approvalHistory: [
        {
          stage: "application",
          action: "submitted",
          actor: req.user._id,
          actorRole: "student",
          comment: "",
          statusSnapshot: "pending_incharge",
          actedAt: new Date()
        }
      ]
    });
    return res.status(201).json({ message: "Leave application submitted", leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to apply for leave", error: error.message });
  }
}

// READ - Get all leave applications
async function getLeaves(req, res) {
  try {
    let query = {};
    if (req.user.role === "student") {
      query.student = req.user._id;
    }
    const leaves = await LeaveApplication.find(query)
      .populate("student", "name email rollNumber roomNumber hostelBlock phone")
      .populate("inchargeActionBy", "name email role")
      .populate("wardenActionBy", "name email role")
      .populate("approvalHistory.actor", "name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ leaves });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leaves", error: error.message });
  }
}

// READ - Get single leave by ID
async function getLeaveById(req, res) {
  try {
    const leave = await LeaveApplication.findById(req.params.id)
      .populate("student", "name email rollNumber roomNumber hostelBlock phone parentPhone")
      .populate("inchargeActionBy", "name email role")
      .populate("wardenActionBy", "name email role")
      .populate("approvalHistory.actor", "name email role");
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    if (!isReviewer(req.user) && !isOwner(req.user, leave.student._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    return res.status(200).json({ leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leave", error: error.message });
  }
}

// UPDATE - Incharge or Warden approves/rejects leave
async function updateLeaveStatus(req, res) {
  try {
    if (!isReviewer(req.user)) {
      return res.status(403).json({ message: "Only incharge or warden can approve/reject leave" });
    }

    const { status } = req.body;
    const comment = (req.body.comment || req.body.wardenComment || req.body.inchargeComment || "").trim();

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    const now = new Date();

    if (isIncharge(req.user)) {
      if (FINAL_STATUSES.includes(leave.status)) {
        return res.status(400).json({ message: "This leave is already closed" });
      }
      if (leave.status === "pending") {
        leave.status = "pending_incharge";
      }
      if (leave.status !== "pending_incharge") {
        return res.status(400).json({ message: "Incharge can only act on leaves pending incharge approval" });
      }

      leave.inchargeComment = comment;
      leave.inchargeActionBy = req.user._id;
      leave.inchargeActionAt = now;

      if (status === "approved") {
        leave.status = "pending_warden";
        addHistory(leave, {
          stage: "incharge",
          action: "approved",
          actor: req.user._id,
          actorRole: "incharge",
          comment,
          statusSnapshot: "pending_warden"
        });
        addHistory(leave, {
          stage: "incharge",
          action: "forwarded",
          actor: req.user._id,
          actorRole: "incharge",
          comment: "Forwarded to warden for final decision",
          statusSnapshot: "pending_warden"
        });
      } else {
        leave.status = "rejected";
        addHistory(leave, {
          stage: "incharge",
          action: "rejected",
          actor: req.user._id,
          actorRole: "incharge",
          comment,
          statusSnapshot: "rejected"
        });
      }
    }

    if (isWarden(req.user)) {
      if (FINAL_STATUSES.includes(leave.status)) {
        return res.status(400).json({ message: "This leave is already closed" });
      }
      if (leave.status !== "pending_warden") {
        return res.status(400).json({ message: "Warden can only act after incharge approval" });
      }

      leave.wardenComment = comment;
      leave.wardenActionBy = req.user._id;
      leave.wardenActionAt = now;
      leave.status = status === "approved" ? "approved" : "rejected";

      addHistory(leave, {
        stage: "warden",
        action: status,
        actor: req.user._id,
        actorRole: "warden",
        comment,
        statusSnapshot: leave.status
      });
    }

    await leave.save();
    return res.status(200).json({ message: `Leave ${status} successfully`, leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update leave status", error: error.message });
  }
}

// DELETE - Student cancels pending leave (soft cancel, keeps history)
async function deleteLeave(req, res) {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    if (!isOwner(req.user, leave.student) && !isReviewer(req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (isOwner(req.user, leave.student)) {
      if (!canStudentCancel(leave)) {
        return res.status(400).json({ message: "Only leaves pending approval can be cancelled" });
      }

      leave.status = "cancelled";
      addHistory(leave, {
        stage: "student",
        action: "cancelled",
        actor: req.user._id,
        actorRole: "student",
        comment: "Cancelled by student",
        statusSnapshot: "cancelled"
      });
      await leave.save();

      return res.status(200).json({ message: "Leave application cancelled", leave });
    }

    await LeaveApplication.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Leave application deleted by reviewer" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete leave", error: error.message });
  }
}

module.exports = { applyLeave, getLeaves, getLeaveById, updateLeaveStatus, deleteLeave };
