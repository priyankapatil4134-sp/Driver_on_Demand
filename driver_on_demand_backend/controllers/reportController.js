
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Rating = require("../models/Rating");

exports.getReports = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalDrivers,
      totalBookings,
      completedBookings,
      cancelledBookings,
      revenueResult,
      totalRatings,
      ratingResult,
    ] = await Promise.all([
      Customer.countDocuments(),
      Driver.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Payment.aggregate([
        { $match: { payment_status: "completed" } },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: "$amount" },
          },
        },
      ]),
      Rating.countDocuments(),
      Rating.aggregate([
        {
          $group: {
            _id: null,
            average_rating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const summary = {
      total_customers: totalCustomers,
      total_drivers: totalDrivers,
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      cancelled_bookings: cancelledBookings,
      total_revenue: Number(revenueResult[0]?.total_revenue || 0),
      total_ratings: totalRatings,
      average_rating: Number(
        (ratingResult[0]?.average_rating || 0).toFixed(2)
      ),
    };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          created_at: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$created_at",
            },
          },
          total_bookings: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          total_bookings: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    const bookingStatuses = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          total: 1,
        },
      },
      { $sort: { status: 1 } },
    ]);

    const paymentSummary = await Payment.aggregate([
      {
        $group: {
          _id: "$payment_status",
          total: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          payment_status: "$_id",
          total: 1,
          amount: 1,
        },
      },
      { $sort: { payment_status: 1 } },
    ]);

    return res.json({
      summary,
      monthly_bookings: monthlyBookings,
      booking_statuses: bookingStatuses,
      payment_summary: paymentSummary,
    });
  } catch (err) {
    console.error("Reports error:", err);

    return res.status(500).json({
      message: "Failed to load reports",
    });
  }
};
