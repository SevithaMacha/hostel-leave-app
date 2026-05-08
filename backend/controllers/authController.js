// File: authController.js
// Handles registration, login, and profile retrieval for authenticated users.
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function getSafeRole(role) {
  if (["student", "incharge", "warden"].includes(role)) {
    return role;
  }
  return "student";
}

async function register(req, res) {
  try {
    const { name, email, password, role, rollNumber, roomNumber, hostelBlock, phone, parentPhone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const safeRole = getSafeRole(role);
    const userPayload = {
      name,
      email,
      password,
      role: safeRole,
      rollNumber,
      roomNumber,
      hostelBlock,
      phone,
      parentPhone
    };

    // Non-student users don't need student hostel meta.
    if (safeRole !== "student") {
      userPayload.rollNumber = "";
      userPayload.roomNumber = "";
      userPayload.hostelBlock = "";
      userPayload.parentPhone = "";
    }

    const user = await User.create(userPayload);
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
}

async function getMe(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { register, login, getMe };
