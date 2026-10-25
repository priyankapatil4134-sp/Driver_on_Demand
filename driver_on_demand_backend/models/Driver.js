
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    license_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    experience_years: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "busy", "inactive"],
      default: "available",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports =
  mongoose.models.Driver || mongoose.model("Driver", driverSchema);
