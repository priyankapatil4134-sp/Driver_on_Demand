
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");

// CREATE CASH PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !mongoose.isValidObjectId(booking_id)) {
      return res.status(400).json({
        message: "Valid booking ID is required",
      });
    }

    if (payment_method !== "cash") {
      return res.status(400).json({
        message: "Only cash payment is supported",
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
      _id: booking_id,
      customer_id: customer._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Your booking was not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Payment cannot be created for a cancelled booking",
      });
    }

    if (!booking.driver_id) {
      return res.status(400).json({
        message: "Please wait until a driver is assigned",
      });
    }

    console.log(
      "CREATE PAYMENT - trip_type:",
      booking.trip_type
    );

    console.log(
      "CREATE PAYMENT - fare before:",
      booking.fare
    );

    const fixedFare =
      booking.trip_type === "Round trip" ? 800 : 500;

    if (
      !Number.isFinite(Number(booking.fare)) ||
      Number(booking.fare) <= 0
    ) {
      booking.fare = fixedFare;
      await booking.save();
    }

    console.log(
      "CREATE PAYMENT - fare after:",
      booking.fare
    );

    const fare = Number(booking.fare);

    if (!Number.isFinite(fare) || fare <= 0) {
      return res.status(400).json({
        message: "Valid booking fare is not available",
      });
    }

    const existingPayment = await Payment.findOne({
      booking_id: booking._id,
    });

    if (existingPayment) {
      return res.status(409).json({
        message: "Payment record already exists for this booking",
      });
    }

    const payment = await Payment.create({
      booking_id: booking._id,
      amount: fare,
      payment_method: "cash",
      payment_status: "pending",
      payment_date: null,
    });

    return res.status(201).json({
      message: "Cash payment record created",
      payment_id: payment._id,
      amount: payment.amount,
      payment_status: payment.payment_status,
    });
  } catch (err) {
    console.error("Create payment error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Payment record already exists for this booking",
      });
    }

    return res.status(500).json({
      message: "Failed to create payment",
    });
  }
};


// CUSTOMER: VIEW MY PAYMENTS
exports.myPayments = async (req, res) => {
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
    }).select("_id");

    const bookingIds = bookings.map((booking) => booking._id);

    const payments = await Payment.find({
      booking_id: { $in: bookingIds },
    })
      .populate({
        path: "booking_id",
        select:
          "pickup_location drop_location booking_date booking_time status fare driver_id trip_type",
        populate: {
          path: "driver_id",
          select: "name full_name phone",
        },
      })
      .sort({ createdAt: -1 });

    const result = payments.map((payment) => {
      const booking = payment.booking_id;
      const driver = booking?.driver_id;

      return {
        _id: payment._id,
        payment_id: payment._id,
        booking_id: booking?._id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        payment_date: payment.payment_date,
        pickup_location: booking?.pickup_location,
        drop_location: booking?.drop_location,
        booking_date: booking?.booking_date,
        booking_time: booking?.booking_time,
        booking_status: booking?.status,
        fare: booking?.fare,
        driver_name: driver?.full_name || driver?.name || "",
        driver_phone: driver?.phone || "",
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("My payments error:", err);

    return res.status(500).json({
      message: "Failed to load customer payments",
    });
  }
};


// DRIVER: VIEW PAYMENTS FOR ASSIGNED BOOKINGS
exports.driverPayments = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      user_id: req.user.id,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const bookings = await Booking.find({
      driver_id: driver._id,
    }).select("_id");

    const bookingIds = bookings.map((booking) => booking._id);

    const payments = await Payment.find({
      booking_id: { $in: bookingIds },
    })
      .populate({
        path: "booking_id",
        select:
          "pickup_location drop_location booking_date booking_time status fare customer_id",
        populate: {
          path: "customer_id",
          select: "name full_name phone",
        },
      })
      .sort({ createdAt: -1 });

    const result = payments.map((payment) => {
      const booking = payment.booking_id;
      const customer = booking?.customer_id;

      return {
        _id: payment._id,
        payment_id: payment._id,
        booking_id: booking?._id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        payment_date: payment.payment_date,
        pickup_location: booking?.pickup_location,
        drop_location: booking?.drop_location,
        booking_status: booking?.status,
        customer_name:
          customer?.full_name || customer?.name || "",
        customer_phone: customer?.phone || "",
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Driver payments error:", err);

    return res.status(500).json({
      message: "Failed to load driver payments",
    });
  }
};


// DRIVER: CONFIRM CASH RECEIVED
exports.confirmCashReceived = async (req, res) => {
  try {
    const { payment_id } = req.params;

    if (!mongoose.isValidObjectId(payment_id)) {
      return res.status(400).json({
        message: "Valid payment ID is required",
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

    const payment = await Payment.findById(payment_id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const booking = await Booking.findOne({
      _id: payment.booking_id,
      driver_id: driver._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Assigned booking not found",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Booking must be completed before confirming payment",
      });
    }

    if (payment.payment_method !== "cash") {
      return res.status(400).json({
        message: "This payment is not a cash payment",
      });
    }

    if (payment.payment_status !== "pending") {
      return res.status(400).json({
        message: "Payment is not pending",
      });
    }

    payment.payment_status = "completed";
    payment.payment_date = new Date();

    await payment.save();

    return res.status(200).json({
      message: "Cash payment confirmed",
      payment_id: payment._id,
      payment_status: payment.payment_status,
      payment_date: payment.payment_date,
    });
  } catch (err) {
    console.error("Confirm cash received error:", err);

    return res.status(500).json({
      message: "Failed to confirm cash payment",
    });
  }
};


// ADMIN: VIEW ALL PAYMENTS
exports.allPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "booking_id",
        select:
          "pickup_location drop_location booking_date booking_time status fare customer_id driver_id",
        populate: [
          {
            path: "customer_id",
            select: "name full_name phone email",
          },
          {
            path: "driver_id",
            select: "name full_name phone",
          },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (err) {
    console.error("All payments error:", err);

    return res.status(500).json({
      message: "Failed to load all payments",
    });
  }
};


// ADMIN: UPDATE PAYMENT STATUS
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Valid payment ID is required",
      });
    }

    const allowedStatuses = ["pending", "completed"];

    if (!allowedStatuses.includes(payment_status)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    payment.payment_status = payment_status;

    if (payment_status === "completed") {
      payment.payment_date = new Date();
    } else {
      payment.payment_date = null;
    }

    await payment.save();

    return res.status(200).json({
      message: "Payment status updated successfully",
      payment_id: payment._id,
      payment_status: payment.payment_status,
      payment_date: payment.payment_date,
    });
  } catch (err) {
    console.error("Update payment status error:", err);

    return res.status(500).json({
      message: "Failed to update payment status",
    });
  }
};
