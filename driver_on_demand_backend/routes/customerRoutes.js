
const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const Customer = require("../models/Customer");

const {
  myProfile,
  dashboardStats,
  myTrips,
} = require("../controllers/customerController");

// Admin: View all customers
router.get(
  "/",
  verifyToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const customers = await Customer.find()
        .sort({ created_at: -1 })
        .lean();

      return res.json(
        customers.map((customer) => ({
          customer_id: customer._id,
          user_id: customer.user_id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          status: customer.status,
          created_at: customer.created_at,
        }))
      );
    } catch (error) {
      console.error("Customers API error:", error);

      return res.status(500).json({
        message: "Failed to load customers",
      });
    }
  }
);

// Customer: View own profile
router.get(
  "/my-profile",
  verifyToken,
  requireRole("Customer"),
  myProfile
);

// Customer: View dashboard statistics
router.get(
  "/stats",
  verifyToken,
  requireRole("Customer"),
  dashboardStats
);

// Customer: View own trips
router.get(
  "/trips",
  verifyToken,
  requireRole("Customer"),
  myTrips
);

module.exports = router;
