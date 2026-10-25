
const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { getReports } = require("../controllers/reportController");

router.get(
  "/",
  verifyToken,
  requireRole("Admin"),
  getReports
);

module.exports = router;
