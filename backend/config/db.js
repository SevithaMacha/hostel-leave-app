// File: db.js
// Connects the application to MongoDB using the URI from environment variables.
const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }
  await mongoose.connect(mongoURI);
  console.log("MongoDB connected");
}

module.exports = connectDB;
