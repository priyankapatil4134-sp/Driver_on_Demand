
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/mongo");

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const driverRoutes = require("./routes/driverRoutes");
const customerRoutes = require("./routes/customerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const tripRoutes = require("./routes/tripRoutes");



const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "DriveEase API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/driver/trips", tripRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
