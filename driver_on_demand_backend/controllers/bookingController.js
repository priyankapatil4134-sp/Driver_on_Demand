
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const Payment = require("../models/Payment");

const ONE_WAY_FARE = 500;
const ROUND_TRIP_FARE = 800;

exports.createBooking = async (req, res) => {
  try {
    const {
      pickup_location,
      drop_location,
      booking_date,
      booking_time,
      trip_type,
    } = req.body;

    if (
      !pickup_location?.trim() ||
      !drop_location?.trim() ||
      !booking_date ||
      !booking_time
    ) {
      return res.status(400).json({
        message: "Pickup, drop, date and time are required",
      });
    }

    if (
      trip_type !== undefined &&
      !["One way", "Round trip"].includes(trip_type)
    ) {
      return res.status(400).json({
        message: "Invalid trip type",
      });
    }

    const selectedTripType =
      trip_type === "Round trip" ? "Round trip" : "One way";

    const fare =
      selectedTripType === "Round trip"
        ? ROUND_TRIP_FARE
        : ONE_WAY_FARE;

    const date = new Date(booking_date);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid booking date",
      });
    }

    const customer = await Customer.findOne({
      user_id: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const booking = await Booking.create({
      customer_id: customer._id,
      pickup_location: pickup_location.trim(),
      drop_location: drop_location.trim(),
      booking_date: date,
      booking_time: booking_time.trim(),
      trip_type: selectedTripType,
      status: "pending",
      fare,
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("Create booking error:", err);

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

exports.myBookings = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      user_id: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const bookings = await Booking.find({
      customer_id: customer._id,
    })
      .populate("driver_id", "name phone")
      .sort({ created_at: -1 })
      .lean();

    return res.json(
      bookings.map((booking) => ({
        ...booking,
        booking_id: booking._id,
        driver_name: booking.driver_id?.name || null,
        driver_phone: booking.driver_id?.phone || null,
      }))
    );
  } catch (err) {
    console.error("My bookings error:", err);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

exports.allBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer_id", "name phone email address")
      .populate("driver_id", "name phone")
      .sort({ created_at: -1 })
      .lean();

    return res.json(
      bookings.map((booking) => ({
        ...booking,
        booking_id: booking._id,
        customer_name: booking.customer_id?.name || null,
        customer_phone: booking.customer_id?.phone || null,
        driver_name: booking.driver_id?.name || null,
        driver_phone: booking.driver_id?.phone || null,
      }))
    );
  } catch (err) {
    console.error("All bookings error:", err);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;
    const bookingId = req.params.id;

    if (
      !mongoose.isValidObjectId(bookingId) ||
      !mongoose.isValidObjectId(driver_id)
    ) {
      return res.status(400).json({
        message: "Invalid booking or driver ID",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        message: "Cannot assign a driver to this booking",
      });
    }

    const driver = await Driver.findOne({
      _id: driver_id,
      status: "available",
    });

    if (!driver) {
      return res.status(400).json({
        message: "Driver not found or unavailable",
      });
    }

    const previousDriverId = booking.driver_id;

    booking.driver_id = driver._id;
    booking.status = "assigned";
    await booking.save();

    await Trip.findOneAndUpdate(
      { booking_id: booking._id },
      {
        $set: {
          driver_id: driver._id,
          status: "assigned",
          start_time: null,
          end_time: null,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    driver.status = "busy";
    await driver.save();

    if (
      previousDriverId &&
      previousDriverId.toString() !== driver._id.toString()
    ) {
      const oldDriverHasActiveBookings = await Booking.exists({
        driver_id: previousDriverId,
        status: { $in: ["assigned", "confirmed", "started"] },
        _id: { $ne: booking._id },
      });

      if (!oldDriverHasActiveBookings) {
        await Driver.findByIdAndUpdate(previousDriverId, {
          status: "available",
        });
      }
    }

    return res.json({
      message: "Driver assigned successfully",
      booking,
    });
  } catch (err) {
    console.error("Assign driver error:", err);

    return res.status(500).json({
      message: "Failed to assign driver",
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const customer = await Customer.findOne({
      user_id: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customer_id: customer._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (["completed", "cancelled", "started"].includes(booking.status)) {
      return res.status(400).json({
        message: "This booking cannot be cancelled",
      });
    }

    const assignedDriverId = booking.driver_id;

    booking.status = "cancelled";
    await booking.save();

    await Trip.findOneAndUpdate(
      { booking_id: booking._id },
      { $set: { status: "cancelled" } }
    );

    if (assignedDriverId) {
      const driverHasActiveBookings = await Booking.exists({
        driver_id: assignedDriverId,
        status: { $in: ["assigned", "confirmed", "started"] },
      });

      if (!driverHasActiveBookings) {
        await Driver.findByIdAndUpdate(assignedDriverId, {
          status: "available",
        });
      }
    }

    return res.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);

    return res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};

exports.stats = async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      assignedBookings,
      completedBookings,
      cancelledBookings,
      totalCustomers,
      totalDrivers,
      revenueResult,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "assigned" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Customer.countDocuments(),
      Driver.countDocuments(),
      Payment.aggregate([
        { $match: { payment_status: "completed" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    return res.json({
      total_bookings: totalBookings,
      pending_bookings: pendingBookings,
      assigned_bookings: assignedBookings,
      completed_bookings: completedBookings,
      cancelled_bookings: cancelledBookings,
      total_customers: totalCustomers,
      total_drivers: totalDrivers,
      total_revenue: revenueResult[0]?.total || 0,
    });
  } catch (err) {
    console.error("Booking stats error:", err);

    return res.status(500).json({
      message: "Failed to fetch booking statistics",
    });
  }
};
