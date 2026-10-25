
const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
  createRating,
  myRatings,
  allRatings,
} = require("../controllers/ratingController");

router.post(
  "/",
  verifyToken,
  requireRole("Customer"),
  createRating
);

router.get(
  "/my",
  verifyToken,
  requireRole("Customer"),
  myRatings
);

router.get(
  "/",
  verifyToken,
  requireRole("Admin"),
  allRatings
);

module.exports = router;
