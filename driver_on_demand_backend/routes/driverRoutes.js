const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  listDrivers,
  myTrips,
  updateTripStatus,
} = require("../controllers/driverController");

const router = express.Router();

router.get("/my-trips", verifyToken, requireRole("Driver"), myTrips);
router.put("/trips/:bookingId/status", verifyToken, requireRole("Driver"), updateTripStatus);
router.get("/", verifyToken, requireRole("Admin"), listDrivers);

module.exports = router;