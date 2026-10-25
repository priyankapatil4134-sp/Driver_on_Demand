
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: "Admin" });

    if (existingAdmin) {
      console.log("Admin account already exists. No changes made.");
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const phone = process.env.ADMIN_PHONE;

    if (!email || !password || !phone) {
      throw new Error(
        "Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE in .env first."
      );
    }

    if (password.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    }

    const password_hash = await bcrypt.hash(password, 12);

    await User.create({
      role: "Admin",
      full_name: "Priyanka Patil",
      email,
      phone,
      password_hash,
      status: "active"
    });

    console.log("Admin account created successfully.");
    console.log("Login email:", email);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
