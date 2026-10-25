
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["Admin", "Customer", "Driver"],
      required: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    license_number: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
