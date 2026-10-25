
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "started", "completed", "cancelled"],
      default: "assigned",
    },
    start_time: {
      type: Date,
      default: null,
    },
    end_time: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports =
  mongoose.models.Trip || mongoose.model("Trip", tripSchema);
