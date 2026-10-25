
const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Trip = require("../models/Trip");

exports.listDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .sort({ name: 1 })
      .lean();

    res.json(
      drivers.map((driver) => ({
        ...driver,
        driver_id: driver._id,
        user_id: driver.user_id,
      }))
    );
  } catch (err) {
    console.error("List drivers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.myTrips = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user_id: req.user.id });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const bookings = await Booking.find({
      driver_id: driver._id,
    })
      .sort({ booking_date: -1, booking_time: -1 })
      .populate("customer_id", "name phone")
      .lean();

    const bookingIds = bookings.map((booking) => booking._id);

    const trips = await Trip.find({
      booking_id: { $in: bookingIds },
    }).lean();

    const tripMap = new Map(
      trips.map((trip) => [trip.booking_id.toString(), trip])
    );

    const rows = bookings.map((booking) => {
      const trip = tripMap.get(booking._id.toString());

      return {
        booking_id: booking._id,
        pickup_location: booking.pickup_location,
        drop_location: booking.drop_location,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        booking_status: booking.status,
        fare: booking.fare || 0,
        customer_name: booking.customer_id?.name || null,
        customer_phone: booking.customer_id?.phone || null,
        trip_id: trip?._id || null,
        trip_status: trip?.status || null,
        start_time: trip?.start_time || null,
        end_time: trip?.end_time || null,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error("Driver trips error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.bookingId;

    if (!["started", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be started or completed",
      });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const driver = await Driver.findOne({ user_id: req.user.id });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      driver_id: driver._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Assigned booking not found",
      });
    }

    const trip = await Trip.findOne({
      booking_id: booking._id,
      driver_id: driver._id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip record not found",
      });
    }

    if (
      (status === "started" && trip.status !== "assigned") ||
      (status === "completed" && trip.status !== "started")
    ) {
      return res.status(400).json({
        message: "Invalid trip status transition",
      });
    }

    const now = new Date();

    if (status === "started") {
      trip.status = "started";
      trip.start_time = now;
      booking.status = "confirmed";
    } else {
      trip.status = "completed";
      trip.end_time = now;
      booking.status = "completed";
      driver.status = "available";
    }

    await trip.save();
    await booking.save();

    if (status === "completed") {
      await driver.save();
    }

    res.json({
      message: `Trip marked ${status} successfully`,
    });
  } catch (err) {
    console.error("Update trip status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
