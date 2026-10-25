
const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
  myTrips,
  startTrip,
  completeTrip,
} = require("../controllers/tripcontroller");

const router = express.Router();

router.get("/my", verifyToken, requireRole("Driver"), myTrips);
router.put("/:id/start", verifyToken, requireRole("Driver"), startTrip);
router.put("/:id/complete", verifyToken, requireRole("Driver"), completeTrip);

module.exports = router;
