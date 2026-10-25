
const { pool } = require("../config/db");

exports.myProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id,
         c.customer_id,
         c.name,
         c.phone,
         c.email,
         c.address,
         c.status,
         c.created_at
       FROM users u
       JOIN customers c ON c.user_id = u.id
       WHERE u.id = ? AND u.role = 'Customer'`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Customer profile error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT customer_id FROM customers WHERE user_id = ?",
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const customerId = customers[0].customer_id;

    const [[bookings]] = await pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COALESCE(SUM(status = 'pending'), 0) AS pending_bookings,
         COALESCE(SUM(status = 'assigned'), 0) AS assigned_bookings,
         COALESCE(SUM(status = 'completed'), 0) AS completed_bookings,
         COALESCE(SUM(status = 'cancelled'), 0) AS cancelled_bookings
       FROM bookings
       WHERE customer_id = ?`,
      [customerId]
    );

    const [[payments]] = await pool.query(
      `SELECT
         COUNT(*) AS total_payments,
         COALESCE(SUM(
           CASE WHEN payment_status = 'completed'
           THEN amount ELSE 0 END
         ), 0) AS total_paid
       FROM payments p
       JOIN bookings b ON b.booking_id = p.booking_id
       WHERE b.customer_id = ?`,
      [customerId]
    );

    const [[ratings]] = await pool.query(
      `SELECT COUNT(*) AS total_ratings
       FROM ratings
       WHERE customer_id = ?`,
      [customerId]
    );

    return res.json({
      total_bookings: Number(bookings.total_bookings),
      pending_bookings: Number(bookings.pending_bookings),
      assigned_bookings: Number(bookings.assigned_bookings),
      completed_bookings: Number(bookings.completed_bookings),
      cancelled_bookings: Number(bookings.cancelled_bookings),
      total_payments: Number(payments.total_payments),
      total_paid: Number(payments.total_paid),
      total_ratings: Number(ratings.total_ratings),
    });
  } catch (err) {
    console.error("Customer dashboard stats error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.myTrips = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         t.trip_id,
         t.booking_id,
         t.driver_id,
         t.status AS trip_status,
         t.start_time,
         t.end_time,
         b.pickup_location,
         b.drop_location,
         b.booking_date,
         b.booking_time,
         b.fare,
         d.name AS driver_name,
         d.phone AS driver_phone
       FROM trips t
       JOIN bookings b ON b.booking_id = t.booking_id
       JOIN customers c ON c.customer_id = b.customer_id
       LEFT JOIN drivers d ON d.driver_id = t.driver_id
       WHERE c.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Customer trips error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
