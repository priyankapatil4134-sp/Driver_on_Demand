
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Rating = require("../models/Rating");

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalDrivers,
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalPayments,
      revenueResult,
      averageRatingResult,
    ] = await Promise.all([
      Customer.countDocuments(),
      Driver.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { payment_status: "completed" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      Rating.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalDrivers,
        totalBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalPayments,
        totalRevenue: revenueResult[0]?.total || 0,
        averageRating: Number(
          (averageRatingResult[0]?.average || 0).toFixed(1)
        ),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard statistics.",
    });
  }
};

module.exports = { getDashboardStats };
