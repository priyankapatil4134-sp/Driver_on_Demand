const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
  createPayment,
  myPayments,
  allPayments,
  driverPayments,
  confirmCashReceived,
} = require("../controllers/paymentController");

const router = express.Router();

// Customer: Create cash payment
router.post(
  "/",
  verifyToken,
  requireRole("Customer"),
  createPayment
);

// Customer: View own payments
router.get(
  "/my",
  verifyToken,
  requireRole("Customer"),
  myPayments
);

// Driver: View payments for assigned bookings
router.get(
  "/driver",
  verifyToken,
  requireRole("Driver"),
  driverPayments
);

// Driver: Confirm cash received after trip completion
router.put(
  "/:id/received",
  verifyToken,
  requireRole("Driver"),
  confirmCashReceived
);

// Admin: View all payments
router.get(
  "/",
  verifyToken,
  requireRole("Admin"),
  allPayments
);

module.exports = router;