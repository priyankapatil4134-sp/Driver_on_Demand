const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Payment = require("../models/Payment");

// Driver: View assigned trips
exports.myTrips = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      user_id: req.user.id,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const trips = await Trip.find({
      driver_id: driver._id,
    })
      .populate({
        path: "booking_id",
        populate: {
          path: "customer_id",
          select: "name phone email address",
        },
      })
      .sort({ created_at: -1 });

    return res.json(trips);
  } catch (err) {
    console.error("My trips error:", err);

    return res.status(500).json({
      message: "Failed to fetch trips",
    });
  }
};

// Driver: Start trip
exports.startTrip = async (req, res) => {
  try {
    const tripId = req.params.id;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({
        message: "Invalid trip ID",
      });
    }

    const driver = await Driver.findOne({
      user_id: req.user.id,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const trip = await Trip.findOne({
      _id: tripId,
      driver_id: driver._id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Assigned trip not found",
      });
    }

    if (trip.status !== "assigned") {
      return res.status(400).json({
        message: "Only assigned trips can be started",
      });
    }

    const booking = await Booking.findById(trip.booking_id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    trip.status = "started";
    trip.start_time = new Date();
    await trip.save();

    booking.status = "started";
    await booking.save();

    return res.json({
      message: "Trip started successfully",
      trip,
    });
  } catch (err) {
    console.error("Start trip error:", err);

    return res.status(500).json({
      message: "Failed to start trip",
    });
  }
};

// Driver: Complete trip and create pending payment
exports.completeTrip = async (req, res) => {
  try {
    const tripId = req.params.id;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({
        message: "Invalid trip ID",
      });
    }

    const driver = await Driver.findOne({
      user_id: req.user.id,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const trip = await Trip.findOne({
      _id: tripId,
      driver_id: driver._id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Assigned trip not found",
      });
    }

    if (trip.status !== "started") {
      return res.status(400).json({
        message: "Only started trips can be completed",
      });
    }

    const booking = await Booking.findById(trip.booking_id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Use the fare already saved for this booking.
    const amount = Number(booking.fare);

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({
        message: "Invalid booking fare",
      });
    }

    // Create a payment record only if one doesn't already exist.
    let payment = await Payment.findOne({
      booking_id: booking._id,
    });

    if (!payment) {
      payment = await Payment.create({
        booking_id: booking._id,
        amount,
        payment_method: "cash",
        payment_status: "pending",
      });
    }

    trip.status = "completed";
    trip.end_time = new Date();
    await trip.save();

    booking.status = "completed";
    await booking.save();

    driver.status = "available";
    await driver.save();

    return res.json({
      message: "Trip completed successfully. Payment is pending.",
      trip,
      booking,
      payment,
    });
  } catch (err) {
    console.error("Complete trip error:", err);

    return res.status(500).json({
      message: "Failed to complete trip",
    });
  }
};