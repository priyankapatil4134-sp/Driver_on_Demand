require("dotenv").config();
const mongoose = require("mongoose");

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}

module.exports = { testConnection };