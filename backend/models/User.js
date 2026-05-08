// File: User.js
// User schema with role-based access for Student, Incharge, and Warden accounts.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["student", "incharge", "warden"], default: "student" },
    rollNumber: { type: String, trim: true, default: "" },
    roomNumber: { type: String, trim: true, default: "" },
    hostelBlock: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    parentPhone: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
