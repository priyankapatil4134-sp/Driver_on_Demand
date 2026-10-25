
const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");

exports.createRating = async (req, res) => {
  try {
    const { booking_id, rating, review } = req.body;

    if (!booking_id || rating === undefined || rating === null) {
      return res.status(400).json({
        message: "Booking ID and rating are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const ratingValue = Number(rating);

    if (
      !Number.isInteger(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
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

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "You can rate only completed bookings",
      });
    }

    if (!booking.driver_id) {
      return res.status(400).json({
        message: "No driver is assigned to this booking",
      });
    }

    const existingRating = await Rating.findOne({
      booking_id: booking._id,
    });

    if (existingRating) {
      return res.status(409).json({
        message: "This booking has already been rated",
      });
    }

    const newRating = await Rating.create({
  booking_id: booking._id,
  customer_id: customer._id,
  driver_id: booking.driver_id,
  rating: ratingValue,
  review: review ? String(review).trim() : "",
});

    return res.status(201).json({
      message: "Rating submitted successfully",
      rating_id: newRating._id,
    });
  } catch (err) {
    console.error("Create rating error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "This booking has already been rated",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.myRatings = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      user_id: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const ratings = await Rating.find({
      customer_id: customer._id,
    })
      .populate("booking_id", "pickup_location drop_location booking_date")
      .populate("driver_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const result = ratings.map((item) => ({
      rating_id: item._id,
      booking_id: item.booking_id?._id || item.booking_id,
      driver_id: item.driver_id?._id || item.driver_id,
      driver_name: item.driver_id?.name || null,
      rating: item.rating,
      review: item.review,
      created_at: item.created_at,
      pickup_location: item.booking_id?.pickup_location || null,
      drop_location: item.booking_id?.drop_location || null,
      booking_date: item.booking_id?.booking_date || null,
    }));

    return res.json(result);
  } catch (err) {
    console.error("My ratings error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.allRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate("booking_id", "pickup_location drop_location booking_date")
      .populate("customer_id", "name")
      .populate("driver_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const result = ratings.map((item) => ({
      rating_id: item._id,
      booking_id: item.booking_id?._id || item.booking_id,
      customer_id: item.customer_id?._id || item.customer_id,
      customer_name: item.customer_id?.name || null,
      driver_id: item.driver_id?._id || item.driver_id,
      driver_name: item.driver_id?.name || null,
      rating: item.rating,
      review: item.review,
      created_at: item.created_at,
    }));

    return res.json(result);
  } catch (err) {
    console.error("All ratings error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
