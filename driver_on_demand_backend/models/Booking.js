
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    pickup_location: {
      type: String,
      required: true,
      trim: true,
    },
    drop_location: {
      type: String,
      required: true,
      trim: true,
    },
    booking_date: {
      type: Date,
      required: true,
    },
    booking_time: {
      type: String,
      required: true,
      trim: true,
    },
    trip_type: {
      type: String,
      enum: ["One way", "Round trip"],
      default: "One way",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "assigned",
        "started",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    fare: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
