const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  createBooking,
  myBookings,
  allBookings,
  assignDriver,
  cancelBooking,
  stats,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", verifyToken, requireRole("Customer"), createBooking);
router.get("/my", verifyToken, requireRole("Customer"), myBookings);
router.get("/stats", verifyToken, requireRole("Admin"), stats);
router.get("/", verifyToken, requireRole("Admin"), allBookings);
router.put("/:id/assign", verifyToken, requireRole("Admin"), assignDriver);
router.put("/:id/cancel", verifyToken, requireRole("Customer"), cancelBooking);

module.exports = router;