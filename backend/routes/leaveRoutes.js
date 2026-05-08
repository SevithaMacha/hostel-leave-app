// File: leaveRoutes.js
// Leave route definitions for CRUD operations on leave applications.
const express = require("express");
const {
  applyLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave
} = require("../controllers/leaveController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/apply", protect, applyLeave);
router.get("/", protect, getLeaves);
router.get("/:id", protect, getLeaveById);
router.put("/:id/status", protect, updateLeaveStatus);
router.delete("/:id", protect, deleteLeave);

module.exports = router;
