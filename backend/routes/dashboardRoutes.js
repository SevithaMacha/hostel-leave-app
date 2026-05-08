// File: dashboardRoutes.js
// Dashboard route definitions for warden and student views.
const express = require("express");
const {
  getWardenDashboard,
  getStudentDashboard,
  getInchargeDashboard
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/warden", protect, authorize("warden"), getWardenDashboard);
router.get("/incharge", protect, authorize("incharge"), getInchargeDashboard);
router.get("/student", protect, authorize("student"), getStudentDashboard);

module.exports = router;
