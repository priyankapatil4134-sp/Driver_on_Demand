import { useEffect, useState } from "react";
import "./App.css";
import "./AdminDashboard.css";

const settingsInputStyle = {
  width: "100%", maxWidth: 520, boxSizing: "border-box", padding: "11px 12px",
  border: "1px solid #cbd5e1", borderRadius: 8, font: "inherit", background: "white", color: "#172b4d",
};
const settingsStatusStyle = {
  display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
  padding: "12px 14px", border: "1px solid #dbe4f0", borderRadius: 8,
};

function AdminDashboard({ onLogout }) {
  const [page, setPage] = useState("Overview");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState("");
  const [driverRefreshKey, setDriverRefreshKey] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [bookingMessage, setBookingMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsProfile, setSettingsProfile] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("driveease_user") || "{}");
      return {
        full_name: savedUser.full_name || savedUser.name || "Administrator",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
      };
    } catch {
      return { full_name: "Administrator", email: "", phone: "" };
    }
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("driveease_notifications") || "{}"); }
    catch { return {}; }
  });
  const [appearance, setAppearance] = useState(() => localStorage.getItem("driveease_appearance") || "Light");
  const [systemStatus, setSystemStatus] = useState({ backend: "Checking…", database: "Requires backend status API" });
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);


  const menu = [
    "Overview",
    "Customers",
    "Drivers",
    "Bookings",
    "Trips",
    "Payments",
    "Ratings",
    "Reports",
    "Settings",
  ];

  const stats = [
    ["Total Customers", "—", "♙"],
    ["Total Drivers", "—", "♧"],
    ["Total Bookings", "—", "▦"],
    ["Total Payments", "—", "₹"],
  ];

  const icons = {
    Overview: "▦",
    Customers: "♙",
    Drivers: "♧",
    Bookings: "▣",
    Trips: "↗",
    Payments: "₹",
    Ratings: "★",
    Reports: "▤",
    Settings: "⚙",
  };

  useEffect(() => {
    if (page !== "Payments") return;
    let cancelled = false;
    async function loadPayments() {
      setPaymentsLoading(true);
      setPaymentsError("");
      try {
        const token = localStorage.getItem("driveease_token");
        if (!token) throw new Error("Please log in as Admin again.");
        const response = await fetch("http://localhost:3000/api/payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `Payments API failed (${response.status})`);
        const rows = Array.isArray(data) ? data : data.payments || data.data || [];
        if (!cancelled) setPayments(rows);
      } catch (error) {
        if (!cancelled) setPaymentsError(error.message || "Unable to load payments.");
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    }
    loadPayments();
    return () => { cancelled = true; };
  }, [page, paymentRefreshKey]);

  useEffect(() => {
    if (page !== "Settings") return;
    let cancelled = false;
    async function checkBackend() {
      try {
        const response = await fetch("http://localhost:3000/", { method: "GET" });
        if (!response.ok) throw new Error(`Backend returned ${response.status}`);
        if (!cancelled) setSystemStatus((current) => ({ ...current, backend: "Connected" }));
      } catch {
        if (!cancelled) setSystemStatus((current) => ({ ...current, backend: "Not connected" }));
      }
      try {
        const token = localStorage.getItem("driveease_token");
        const response = await fetch("http://localhost:3000/api/health", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Database status endpoint is not available");
        if (!cancelled) setSystemStatus((current) => ({
          ...current,
          database: data.database || data.db || data.databaseStatus || "Status API connected",
        }));
      } catch {
        if (!cancelled) setSystemStatus((current) => ({ ...current, database: "Status API not configured" }));
      }
    }
    checkBackend();
    return () => { cancelled = true; };
  }, [page, statusRefreshKey]);

  async function saveAdminProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const token = localStorage.getItem("driveease_token");
      if (!token) throw new Error("Admin login token was not found. Please log in again.");
      const response = await fetch("http://localhost:3000/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsProfile),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Profile API is not available.");
      const oldUser = JSON.parse(localStorage.getItem("driveease_user") || "{}");
      const updatedUser = { ...oldUser, ...settingsProfile, ...(data.user || {}) };
      localStorage.setItem("driveease_user", JSON.stringify(updatedUser));
      setSettingsProfile((current) => ({ ...current, ...(data.user || {}) }));
      setProfileMessage(data.message || "Profile updated successfully.");
    } catch (error) {
      setProfileMessage(error.message || "Profile update failed.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changeAdminPassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    if (newPassword.length < 8) {
      setPasswordMessage("New password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New Password and Confirm Password do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const token = localStorage.getItem("driveease_token");
      if (!token) throw new Error("Admin login token was not found. Please log in again.");
      const response = await fetch("http://localhost:3000/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Change Password API is not available.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMessage(data.message || "Password changed successfully.");
    } catch (error) {
      setPasswordMessage(error.message || "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function updateNotification(key, checked) {
    setNotifications((current) => {
      const next = { ...current, [key]: checked };
      localStorage.setItem("driveease_notifications", JSON.stringify(next));
      return next;
    });
  }

  function updateAppearance(value) {
    setAppearance(value);
    localStorage.setItem("driveease_appearance", value);
    document.documentElement.dataset.driveeaseTheme = value.toLowerCase();
  }

  
  useEffect(() => {
    if (page !== "Customers") return;

    let cancelled = false;

    async function loadCustomers() {
      setCustomersLoading(true);
      setCustomersError("");

      try {
        const token = localStorage.getItem("driveease_token");
        if (!token) {
          throw new Error("Admin login token was not found. Please log out and log in again as Admin.");
        }

        const response = await fetch("http://localhost:3000/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || `Customers API failed (${response.status})`);
        }

        const rows = Array.isArray(data)
          ? data
          : data.customers || data.data || [];

        if (!cancelled) setCustomers(rows);
      } catch (error) {
        if (!cancelled) setCustomersError(error.message || "Failed to load customers.");
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    }

    loadCustomers();
    return () => { cancelled = true; };
  }, [page, customerRefreshKey]);

  useEffect(() => {
    if (page !== "Drivers") return;

    let cancelled = false;

    async function loadDrivers() {
      setDriversLoading(true);
      setDriversError("");

      try {
        const token = localStorage.getItem("driveease_token");
        if (!token) {
          throw new Error("Admin login token was not found. Please log out and log in again as Admin.");
        }

        const response = await fetch("http://localhost:3000/api/drivers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || `Drivers API failed (${response.status})`);
        }

        const rows = Array.isArray(data)
          ? data
          : data.drivers || data.data || [];

        if (!cancelled) setDrivers(rows);
      } catch (error) {
        if (!cancelled) setDriversError(error.message || "Failed to load drivers.");
      } finally {
        if (!cancelled) setDriversLoading(false);
      }
    }

    loadDrivers();
    return () => { cancelled = true; };
  }, [page, driverRefreshKey]);

  useEffect(() => {
    if (page !== "Bookings") return;

    let cancelled = false;

    async function loadBookingsAndDrivers() {
      setBookingsLoading(true);
      setBookingsError("");
      setBookingMessage("");

      try {
        const token = localStorage.getItem("driveease_token");

        if (!token) {
          throw new Error("Please login as Admin again.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [bookingResponse, driverResponse] =
          await Promise.all([
            fetch("http://localhost:3000/api/bookings", {
              headers,
            }),
            fetch("http://localhost:3000/api/drivers", {
              headers,
            }),
          ]);

        const bookingData = await bookingResponse
          .json()
          .catch(() => ({}));

        const driverData = await driverResponse
          .json()
          .catch(() => ({}));

        if (!bookingResponse.ok) {
          throw new Error(
            bookingData.message ||
              `Bookings API failed (${bookingResponse.status})`
          );
        }

        if (!driverResponse.ok) {
          throw new Error(
            driverData.message ||
              `Drivers API failed (${driverResponse.status})`
          );
        }

        const bookingRows = Array.isArray(bookingData)
          ? bookingData
          : bookingData.bookings || bookingData.data || [];

        const driverRows = Array.isArray(driverData)
          ? driverData
          : driverData.drivers || driverData.data || [];

        if (!cancelled) {
          setBookings(bookingRows);
          setDrivers(driverRows);
        }
      } catch (error) {
        if (!cancelled) {
          setBookingsError(error.message);
        }
      } finally {
        if (!cancelled) {
          setBookingsLoading(false);
        }
      }
    }

    loadBookingsAndDrivers();

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  async function handleAssignDriver(bookingId) {
    const driverId = selectedDrivers[bookingId];

    if (!driverId) {
      setBookingMessage("Please select a driver first.");
      return;
    }

    setAssigningId(bookingId);
    setBookingMessage("");

    try {
      const token = localStorage.getItem("driveease_token");

      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
  driver_id: driverId,
}),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Driver assignment failed."
        );
      }

      setBookingMessage(
        data.message || "Driver assigned successfully."
      );

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [bookingResponse, driverResponse] = await Promise.all([
        fetch("http://localhost:3000/api/bookings", { headers }),
        fetch("http://localhost:3000/api/drivers", { headers }),
      ]);

      const bookingData = await bookingResponse.json();
      const driverData = await driverResponse.json();

      if (!bookingResponse.ok || !driverResponse.ok) {
        throw new Error("Assigned successfully, but refresh failed. Reload the Bookings page.");
      }

      setBookings(
        Array.isArray(bookingData)
          ? bookingData
          : bookingData.bookings || bookingData.data || []
      );

      setDrivers(
        Array.isArray(driverData)
          ? driverData
          : driverData.drivers || driverData.data || []
      );
    } catch (error) {
      setBookingMessage(error.message);
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className={`admin-layout ${appearance === "Dark" ? "driveease-settings-dark" : ""}`} style={appearance === "Dark" ? { background: "#111827", color: "#f8fafc", minHeight: "100vh" } : undefined}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>D</span>
          <div>
            DriveEase
            <small>ADMIN PANEL</small>
          </div>
        </div>

        <p className="admin-menu-label">MANAGEMENT</p>

        <nav className="admin-menu">
          {menu.map((item) => (
            <button
              key={item}
              className={page === item ? "admin-menu-active" : ""}
              onClick={() => setPage(item)}
            >
              <span>{icons[item]}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="admin-profile">
          <span className="admin-avatar">A</span>
          <div>
            <strong>Administrator</strong>
            <small>System Manager</small>
          </div>
        </div>

        <button className="admin-logout" onClick={onLogout}>
          ← Back to Home
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">Admin / {page}</span>
            <h1>{page}</h1>
          </div>

          <div className="admin-welcome">
            <span className="online-dot" />
            Administrator
          </div>
        </header>

        <div className="admin-content">
          {page === "Overview" ? (
            <>
              <section className="admin-welcome-banner">
                <div>
                  <span>ADMIN CONTROL CENTER</span>
                  <h2>Welcome back, Administrator!</h2>
                  <p>Manage your driver service from one place.</p>
                </div>
                <div className="admin-banner-icon">▦</div>
              </section>

              <div className="admin-stats">
                {stats.map(([title, value, icon]) => (
                  <article className="admin-stat-card" key={title}>
                    <div className="admin-stat-top">
                      <span>{title}</span>
                      <span className="admin-stat-icon">{icon}</span>
                    </div>
                    <strong>{value}</strong>
                    <small>Live data integration pending</small>
                  </article>
                ))}
              </div>

              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h3>Quick Management</h3>
                    <p>Choose a section to manage your service.</p>
                  </div>
                </div>

                <div className="admin-quick-grid">
                  {["Customers", "Drivers", "Bookings", "Trips"].map(
                    (item) => (
                      <button key={item} onClick={() => setPage(item)}>
                        <span>{icons[item]}</span>
                        <strong>{item}</strong>
                        <small>Open management →</small>
                      </button>
                    )
                  )}
                </div>
              </section>

              <section className="admin-panel">
                <h3>Recent Activity</h3>
                <p className="admin-empty">
                  Booking and payment activity will appear here when
                  connected to the relevant APIs.
                </p>
              </section>
            </>
          
          ) : page === "Bookings" ? (
            <section className="admin-panel admin-page-panel">
              <div className="admin-bookings-heading">
                <div>
                  <h2>Bookings Management</h2>
                  <p>View customer bookings and assign available drivers.</p>
                </div>
                <button
                  type="button"
                  className="admin-back-button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                  disabled={bookingsLoading}
                >
                  {bookingsLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {bookingMessage && (
                <div className="admin-booking-message" role="status">
                  {bookingMessage}
                </div>
              )}

              {bookingsError && (
                <div className="admin-booking-error" role="alert">
                  <strong>Failed to load bookings.</strong>
                  <p>{bookingsError}</p>
                  <p>Please check whether you are logged in as Admin and the backend API is running.</p>
                </div>
              )}

              {bookingsLoading ? (
                <div className="admin-empty">Loading bookings...</div>
              ) : !bookingsError && bookings.length === 0 ? (
                <div className="admin-empty">
                  No bookings are available yet. Create a booking using a Customer account and refresh the page.
                </div>
              ) : !bookingsError ? (
                <div className="admin-bookings-table-wrap">
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Pickup</th>
                        <th>Destination</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Assigned Driver</th>
                        <th>Assign Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking, index) => {
                        const bookingId = booking.booking_id ?? booking.id;
                        const status = String(booking.status || "pending").toLowerCase();
                        const availableDrivers = drivers.filter((driver) =>
                          String(driver.status || "available").toLowerCase() === "available"
                        );
                        const isAssigned = Boolean(booking.driver_id) || status === "assigned";

                        return (
                          <tr key={bookingId ?? index}>
                            <td>{bookingId ?? "—"}</td>
                            <td>{booking.customer_name || booking.full_name || booking.name || "—"}</td>
                            <td>{booking.customer_phone || booking.phone || "—"}</td>
                            <td>{booking.pickup_location || "—"}</td>
                            <td>{booking.drop_location || "—"}</td>
                            <td>{booking.booking_date ? String(booking.booking_date).slice(0, 10) : "—"}</td>
                            <td>{booking.booking_time ? String(booking.booking_time).slice(0, 8) : "—"}</td>
                            <td>
                              <span className={`admin-booking-status status-${status.replace(/[^a-z0-9_-]/g, "")}`}>
                                {booking.status || "pending"}
                              </span>
                            </td>
                            <td>{booking.driver_name || booking.assigned_driver_name || "Not assigned"}</td>
                            <td>
                              {isAssigned ? (
                                <span>Driver assigned</span>
                              ) : (
                                <div className="admin-assign-controls">
                                  <select
                                    aria-label={`Select driver for booking ${bookingId}`}
                                    value={selectedDrivers[bookingId] || ""}
                                    onChange={(event) =>
                                      setSelectedDrivers((previous) => ({
                                        ...previous,
                                        [bookingId]: event.target.value,
                                      }))
                                    }
                                    disabled={assigningId === bookingId || availableDrivers.length === 0}
                                  >
                                    <option value="">Select driver</option>
                                    {availableDrivers.map((driver) => (
                                      <option key={driver.driver_id ?? driver.id} value={driver.driver_id ?? driver.id}>
                                        {driver.name || driver.full_name || `Driver ${driver.driver_id ?? driver.id}`} ({driver.phone || "No phone"})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="admin-assign-button"
                                    onClick={() => handleAssignDriver(bookingId)}
                                    disabled={assigningId === bookingId || availableDrivers.length === 0 || !bookingId}
                                  >
                                    {assigningId === bookingId ? "Assigning..." : "Assign"}
                                  </button>
                                  {availableDrivers.length === 0 && (
                                    <small>No available drivers</small>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <button
                className="admin-back-button"
                onClick={() => setPage("Overview")}
              >
                ← Back to Overview
              </button>
            </section>
          ) : page === "Customers" ? (
            <section className="admin-panel admin-page-panel">
              <div className="admin-bookings-heading">
                <div>
                  <h2>Customers Management</h2>
                  <p>Registered customer information.</p>
                </div>
                <button
                  type="button"
                  className="admin-back-button"
                  onClick={() => setCustomerRefreshKey((value) => value + 1)}
                  disabled={customersLoading}
                >
                  {customersLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {customersError && (
                <div className="admin-booking-error" role="alert">
                  <strong>Failed to load customers.</strong>
                  <p>{customersError}</p>
                </div>
              )}

              {customersLoading ? (
                <div className="admin-empty">Loading customers...</div>
              ) : !customersError && customers.length === 0 ? (
                <div className="admin-empty">No customer records are available.</div>
              ) : !customersError ? (
                <div className="admin-bookings-table-wrap">
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, index) => (
                        <tr key={customer.customer_id ?? customer._id ?? customer.id ?? index}>
                          <td>{customer.customer_id ?? customer._id ?? customer.id ?? "—"}</td>
                          <td>{customer.name ?? customer.full_name ?? customer.customer_name ?? "—"}</td>
                          <td>{customer.phone ?? "—"}</td>
                          <td>{customer.email ?? "—"}</td>
                          <td>{customer.address ?? "—"}</td>
                          <td>{customer.status ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <button className="admin-back-button" onClick={() => setPage("Overview")}>
                ← Back to Overview
              </button>
            </section>
          ) : page === "Drivers" ? (
            <section className="admin-panel admin-page-panel">
              <div className="admin-bookings-heading">
                <div>
                  <h2>Drivers Management</h2>
                  <p>View registered driver information.</p>
                </div>
                <button
                  type="button"
                  className="admin-back-button"
                  onClick={() => setDriverRefreshKey((value) => value + 1)}
                  disabled={driversLoading}
                >
                  {driversLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {driversError && (
                <div className="admin-booking-error" role="alert">
                  <strong>Failed to load drivers.</strong>
                  <p>{driversError}</p>
                  <p>Please check that you are logged in as Admin and the backend API is running.</p>
                </div>
              )}

              {driversLoading ? (
                <div className="admin-empty">Loading drivers...</div>
              ) : !driversError && drivers.length === 0 ? (
                <div className="admin-empty">No driver records are available.</div>
              ) : !driversError ? (
                <div className="admin-bookings-table-wrap">
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        <th>Driver ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>License Number</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.map((driver, index) => (
                        <tr key={driver.driver_id ?? driver._id ?? driver.id ?? index}>
                          <td>{driver.driver_id ?? driver._id ?? driver.id ?? "—"}</td>
                          <td>{driver.name ?? driver.full_name ?? driver.driver_name ?? "—"}</td>
                          <td>{driver.phone ?? "—"}</td>
                          <td>{driver.email ?? "—"}</td>
                          <td>{driver.license_number ?? driver.licenseNumber ?? "—"}</td>
                          <td>{driver.status ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <button className="admin-back-button" onClick={() => setPage("Overview")}>
                ← Back to Overview
              </button>
            </section>
          ) : page === "Settings" ? (
            <div style={{ display: "grid", gap: 20 }}>
              <section className="admin-panel admin-page-panel">
                <h2>Settings Management</h2>
                <p>Manage your administrator profile, security, notifications, appearance and system status.</p>
                <form onSubmit={saveAdminProfile} style={{ display: "grid", gap: 12, maxWidth: 760, marginTop: 18 }}>
                  <h3 style={{ margin: "8px 0 2px" }}>Admin Profile</h3>
                  <label style={{ display: "grid", gap: 6 }}>Full Name
                    <input required value={settingsProfile.full_name} onChange={(e) => setSettingsProfile({ ...settingsProfile, full_name: e.target.value })} style={settingsInputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>Email
                    <input type="email" value={settingsProfile.email} onChange={(e) => setSettingsProfile({ ...settingsProfile, email: e.target.value })} style={settingsInputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>Phone Number
                    <input value={settingsProfile.phone} onChange={(e) => setSettingsProfile({ ...settingsProfile, phone: e.target.value })} style={settingsInputStyle} />
                  </label>
                  <div><button className="admin-back-button" type="submit" disabled={profileSaving}>{profileSaving ? "Saving…" : "Save Profile"}</button></div>
                  {profileMessage && <p role="status" style={{ margin: 0 }}>{profileMessage}</p>}
                </form>
              </section>

              <section className="admin-panel admin-page-panel">
                <h2>Change Password</h2>
                <p>Use a strong password with at least 8 characters.</p>
                <form onSubmit={changeAdminPassword} style={{ display: "grid", gap: 12, maxWidth: 760, marginTop: 16 }}>
                  <label style={{ display: "grid", gap: 6 }}>Current Password
                    <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={settingsInputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>New Password
                    <input required type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={settingsInputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>Confirm New Password
                    <input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={settingsInputStyle} />
                  </label>
                  <div><button className="admin-back-button" type="submit" disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update Password"}</button></div>
                  {passwordMessage && <p role="status" style={{ margin: 0 }}>{passwordMessage}</p>}
                </form>
              </section>

              <section className="admin-panel admin-page-panel">
                <h2>Notifications</h2>
                <p>Choose which DriveEase events you want to receive notifications for.</p>
                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                  {[["newBooking", "New Booking"], ["driverAssignment", "Driver Assignment"], ["bookingCancellation", "Booking Cancellation"]].map(([key, label]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" checked={notifications[key] !== false} onChange={(e) => updateNotification(key, e.target.checked)} />
                      <span>{label}</span>
                    </label>
                  ))}
                  <small>These preferences are saved in this browser. Sending real email/SMS/push alerts needs backend notification integration.</small>
                </div>
              </section>

              <section className="admin-panel admin-page-panel">
                <h2>Appearance</h2>
                <p>Select the preferred dashboard appearance.</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                  <select value={appearance} onChange={(e) => updateAppearance(e.target.value)} style={settingsInputStyle}>
                    <option value="Light">Light Mode</option>
                    <option value="Dark">Dark Mode</option>
                  </select>
                  <small>Preference saved in this browser.</small>
                </div>
              </section>

              <section className="admin-panel admin-page-panel">
                <h2>System Information</h2>
                <p>Current application and service connection status.</p>
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <div style={settingsStatusStyle}><strong>Application</strong><span>DriveEase Admin Dashboard</span></div>
                  <div style={settingsStatusStyle}><strong>Backend API</strong><span>{systemStatus.backend}</span></div>
                  <div style={settingsStatusStyle}><strong>Database Status</strong><span>{systemStatus.database}</span></div>
                  <div><button className="admin-back-button" type="button" onClick={() => { setSystemStatus({ backend: "Checking…", database: "Checking…" }); setStatusRefreshKey((value) => value + 1); }}>Refresh Status</button></div>
                  <small>Database status becomes live after the backend exposes the GET /api/health endpoint described below.</small>
                </div>
              </section>
              <button className="admin-back-button" onClick={() => setPage("Overview")}>← Back to Overview</button>
            </div>
          ) : page === "Payments" ? (
            <section className="admin-panel admin-page-panel">
              <div className="admin-bookings-heading"><div><h2>Payments Management</h2><p>Cash payments and driver confirmation records.</p></div><button className="admin-back-button" type="button" onClick={() => setPaymentRefreshKey((v) => v + 1)} disabled={paymentsLoading}>{paymentsLoading ? "Loading…" : "↻ Refresh"}</button></div>
              {paymentsError && <div className="admin-booking-error" role="alert">{paymentsError}</div>}
              {paymentsLoading ? <div className="admin-empty">Loading payments…</div> : !paymentsError && payments.length === 0 ? <div className="admin-empty">No payment records available yet.</div> : !paymentsError ? <div className="admin-bookings-table-wrap"><table className="admin-bookings-table"><thead><tr><th>Payment ID</th><th>Customer</th><th>Driver</th><th>Booking ID</th><th>Pickup</th><th>Destination</th><th>Amount</th><th>Method</th><th>Status</th><th>Payment Date &amp; Time</th></tr></thead><tbody>{payments.map((p, i) => { const b = p.booking_id && typeof p.booking_id === "object" ? p.booking_id : p.booking || {}; const customer = b.customer_id && typeof b.customer_id === "object" ? b.customer_id : p.customer || {}; const driver = b.driver_id && typeof b.driver_id === "object" ? b.driver_id : p.driver || {}; const dt = p.payment_date ? new Date(p.payment_date).toLocaleString() : "Not received"; return <tr key={p._id || p.payment_id || i}><td>{p._id || p.payment_id || "—"}</td><td>{customer.name || customer.full_name || p.customer_name || "—"}</td><td>{driver.name || driver.full_name || p.driver_name || "—"}</td><td>{b._id || b.booking_id || p.booking_id || "—"}</td><td>{b.pickup_location || p.pickup_location || "—"}</td><td>{b.drop_location || p.drop_location || "—"}</td><td>₹{p.amount ?? b.fare ?? "—"}</td><td>{p.payment_method || "—"}</td><td>{p.payment_status || "pending"}</td><td>{dt}</td></tr>; })}</tbody></table></div> : null}
              <button className="admin-back-button" onClick={() => setPage("Overview")}>← Back to Overview</button>
            </section>
          ) : (
            <section className="admin-panel admin-page-panel">
              <h2>{page} Management</h2>
              <p>
                {page} section is ready for its data table and API
                integration.
              </p>
              <div className="admin-empty">
                {page} data will be displayed here.
              </div>
              <button
                className="admin-back-button"
                onClick={() => setPage("Overview")}
              >
                ← Back to Overview
              </button>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}


function DriverDashboard({ user, onBack, onLogout }) {
  const [page, setPage] = useState("Overview");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [updatingTripId, setUpdatingTripId] = useState(null);
  const [driverPayments, setDriverPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);

  const name = user?.full_name || user?.name || "Driver";
  const token = localStorage.getItem("driveease_token");
  const menu = ["Overview", "My Profile", "Assigned Trips", "Trip History", "Payments"];

  const getTripStatus = (trip) =>
    String(trip.trip_status || trip.status || trip.booking_status || "").toLowerCase();

  const getBookingId = (trip) => trip.booking_id || trip.id;

  async function loadTrips() {
    setLoading(true);
    setNotice("");
    try {
      if (!token) throw new Error("Login token was not found. Please log in again as Driver.");
      const response = await fetch("http://localhost:3000/api/drivers/my-trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Trips API failed (${response.status})`);
      const rows = Array.isArray(data) ? data : data.trips || data.data || [];
      setTrips(rows);
    } catch (error) {
      setNotice(error.message || "Failed to load trips. Please check the backend API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (page === "Overview" || page.includes("Trip")) loadTrips();
    // loadTrips runs when the selected dashboard page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  async function updateTripStatus(bookingId, status) {
    if (!bookingId) {
      setNotice("The Booking ID for this trip is not available.");
      return;
    }
    setUpdatingTripId(bookingId);
    setNotice("");
    try {
      if (!token) throw new Error("Login token was not found. Please log in again as Driver.");
      const response = await fetch(`http://localhost:3000/api/drivers/trips/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to update trip status.");
      setNotice(data.message || (status === "started" ? "Trip started successfully." : "Trip completed successfully."));
      await loadTrips();
    } catch (error) {
      setNotice(error.message || "An error occurred while updating the trip status.");
    } finally {
      setUpdatingTripId(null);
    }
  }

  async function loadDriverPayments() {
    setPaymentsLoading(true);
    setPaymentMessage("");
    try {
      if (!token) throw new Error("Please log in again as Driver.");
      const response = await fetch("http://localhost:3000/api/payments/driver", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Payments API failed (${response.status})`);
      setDriverPayments(Array.isArray(data) ? data : data.payments || data.data || []);
    } catch (error) { setPaymentMessage(error.message || "Unable to load payments."); }
    finally { setPaymentsLoading(false); }
  }

  useEffect(() => { if (page === "Payments") loadDriverPayments(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, token]);

  async function confirmCashReceived(paymentId) {
    if (!window.confirm("Confirm that you have received the cash from the customer?")) return;
    setConfirmingPaymentId(paymentId);
    setPaymentMessage("");
    try {
      const response = await fetch(`http://localhost:3000/api/payments/${paymentId}/received`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to confirm cash received.");
      setPaymentMessage(data.message || "Cash receipt confirmed.");
      await loadDriverPayments();
    } catch (error) { setPaymentMessage(error.message || "Unable to confirm cash received."); }
    finally { setConfirmingPaymentId(null); }
  }

  const assignedTrips = trips.filter((trip) =>
    ["assigned", "pending", "confirmed", "started", "in_progress"].includes(getTripStatus(trip))
  );
  const historyTrips = trips.filter((trip) =>
    ["completed", "cancelled"].includes(getTripStatus(trip))
  );
  const visibleTrips = page === "Assigned Trips" ? assignedTrips : page === "Trip History" ? historyTrips : [];

  const renderTrips = (rows) => {
    if (loading) return <p>Loading trips...</p>;
    if (!rows.length) return <div className="driver-empty">No trips available at the moment.</div>;
    const columns = Object.keys(rows[0]);
    return (
      <div className="driver-table-wrap">
        <table className="driver-table">
          <thead><tr>
            {columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}
            <th>Action</th>
          </tr></thead>
          <tbody>
            {rows.map((trip, index) => {
              const status = getTripStatus(trip);
              const bookingId = getBookingId(trip);
              return <tr key={trip.trip_id || bookingId || index}>
                {columns.map((column) => <td key={column}>{String(trip[column] ?? "—")}</td>)}
                <td>
                  {status === "assigned" || status === "pending" || status === "confirmed" ? (
                    <button type="button" className="driver-action-button" disabled={updatingTripId === bookingId} onClick={() => updateTripStatus(bookingId, "started")}>
                      {updatingTripId === bookingId ? "Updating..." : "Start Trip"}
                    </button>
                  ) : status === "started" || status === "in_progress" ? (
                    <button type="button" className="driver-action-button" disabled={updatingTripId === bookingId} onClick={() => updateTripStatus(bookingId, "completed")}>
                      {updatingTripId === bookingId ? "Updating..." : "Complete Trip"}
                    </button>
                  ) : <span>{status || "—"}</span>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="driver-layout">
      <aside className="driver-sidebar">
        <div className="driver-brand"><span className="driver-brand-icon">D</span><div>DriveEase<small>DRIVER PANEL</small></div></div>
        <p className="driver-menu-label">DRIVER MENU</p>
        <nav className="driver-menu">
          {menu.map((item) => <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>
            <span>{{ Overview: "▦", "My Profile": "♙", "Assigned Trips": "🚗", "Trip History": "↗", Payments: "₹" }[item]}</span>{item}
          </button>)}
        </nav>
        <div className="driver-sidebar-profile"><span className="driver-avatar">{name.charAt(0).toUpperCase()}</span><div><strong>{name}</strong><small>Driver Account</small></div></div>
        <button className="driver-logout" onClick={onBack}>← Back to Home</button>
        <button className="driver-logout" onClick={onLogout}>↪ Logout</button>
      </aside>
      <main className="driver-main">
        <header className="driver-topbar"><div><small>Driver / {page}</small><h1>{page}</h1></div><div className="driver-availability">Driver Dashboard</div></header>
        <div className="driver-content">
          {notice && <div className="driver-empty" role="status">{notice}</div>}
          {page === "Overview" && <>
            <section className="driver-hero-card"><div><span>YOUR DRIVER ACCOUNT</span><h2>Welcome, {name}!</h2><p>Manage your assigned trips and review your trip history from one place.</p><button className="driver-action-button" onClick={() => setPage("Assigned Trips")}>View Assigned Trips →</button></div><div className="driver-hero-icon">🚗</div></section>
            <div className="driver-stats">
              {[["Assigned Trips", assignedTrips.length, "▣"], ["Completed Trips", historyTrips.filter((trip) => getTripStatus(trip) === "completed").length, "✓"], ["Total Trips", trips.length, "↗"]].map(([title, count, icon]) => <button type="button" className="driver-stat-card" key={title} onClick={() => setPage(title === "Assigned Trips" ? "Assigned Trips" : "Trip History")}><span>{icon}</span><strong>{loading ? "…" : count}</strong><small>{title}</small></button>)}
            </div>
            <section className="driver-panel"><h2>My Profile</h2><p><strong>Name:</strong> {name}</p><p><strong>Phone:</strong> {user?.phone || "Not available"}</p><p><strong>Email:</strong> {user?.email || "Not available"}</p><p><strong>License Number:</strong> {user?.license_number || "Not available"}</p></section>
            <section className="driver-panel"><h2>Recent Trips</h2>{renderTrips(trips.slice(0, 5))}</section>
          </>}
          {page === "My Profile" && <section className="driver-panel"><h2>My Profile</h2><p><strong>Name:</strong> {name}</p><p><strong>Phone:</strong> {user?.phone || "Not available"}</p><p><strong>Email:</strong> {user?.email || "Not available"}</p><p><strong>License Number:</strong> {user?.license_number || "Not available"}</p><p><strong>Experience:</strong> {user?.experience_years ?? "Not available"}</p></section>}
          {page === "Assigned Trips" && <section className="driver-panel"><h2>Assigned Trips</h2><p>Review your current assigned trips.</p>{renderTrips(visibleTrips)}</section>}
          {page === "Trip History" && <section className="driver-panel"><h2>Trip History</h2><p>Review your completed and cancelled trips.</p>{renderTrips(visibleTrips)}</section>}
          {page === "Payments" && <section className="driver-panel"><h2>Cash Payments</h2><p>Confirm only after you have physically received cash from the customer. Trips must be completed first.</p>{paymentMessage && <p role="status" className="driver-empty">{paymentMessage}</p>}{paymentsLoading ? <p>Loading payments…</p> : driverPayments.length === 0 ? <div className="driver-empty">No cash payments found for your trips.</div> : <div className="driver-table-wrap"><table className="driver-table"><thead><tr><th>Customer</th><th>Booking</th><th>Pickup</th><th>Destination</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Action</th></tr></thead><tbody>{driverPayments.map((p, i) => { const b = p.booking_id && typeof p.booking_id === "object" ? p.booking_id : p.booking || {}; const customer = b.customer_id && typeof b.customer_id === "object" ? b.customer_id : p.customer || {}; const id = p._id || p.payment_id; return <tr key={id || i}><td>{customer.name || customer.full_name || p.customer_name || "—"}</td><td>{b._id || b.booking_id || "—"}</td><td>{b.pickup_location || p.pickup_location || "—"}</td><td>{b.drop_location || p.drop_location || "—"}</td><td>₹{p.amount ?? b.fare ?? "—"}</td><td>{p.payment_status || "pending"}</td><td>{p.payment_date ? new Date(p.payment_date).toLocaleString() : "—"}</td><td>{p.payment_status === "completed" ? "Received ✓" : <button type="button" className="driver-action-button" disabled={!id || confirmingPaymentId === id || String(b.status || p.booking_status || "").toLowerCase() !== "completed"} onClick={() => confirmCashReceived(id)}>{confirmingPaymentId === id ? "Confirming…" : "Payment Received"}</button>}</td></tr>; })}</tbody></table></div>}</section>}
        </div>
      </main>
    </div>
  );
}


function CustomerDashboard({ user, onBack, onLogout }) {
  const [page, setPage] = useState("Overview");
  const [records, setRecords] = useState({ bookings: [], trips: [], payments: [], ratings: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [creatingPaymentId, setCreatingPaymentId] = useState(null);
  const name = user?.full_name || user?.name || "Customer";
  const token = localStorage.getItem("driveease_token");

  const sections = ["Overview", "My Profile", "My Bookings", "My Trips", "My Payments", "My Ratings"];

  useEffect(() => {
    let cancelled = false;
    async function loadCustomerData() {
      setLoading(true);
      setNotice("");
      try {
        // Bookings uses the authenticated route that already exists in bookingRoutes.js.
        // The other customer-specific routes are checked independently so a missing
        // trips/payments/ratings endpoint does not prevent bookings from loading.
        const endpoints = [
          ["bookings", "http://localhost:3000/api/bookings/my"],
          ["trips", "http://localhost:3000/api/customer/trips"],
          ["payments", "http://localhost:3000/api/payments/my"],
          ["ratings", "http://localhost:3000/api/customer/ratings"],
        ];
        const result = { bookings: [], trips: [], payments: [], ratings: [] };
        let bookingsError = "";

        for (const [key, url] of endpoints) {
          try {
            const response = await fetch(url, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data.message || `${key} API (${response.status})`);
            }

            const data = await response.json();
            result[key] = Array.isArray(data)
              ? data
              : data[key] || data.data || [];
          } catch (error) {
            if (key === "bookings") bookingsError = error.message;
            console.warn(`${key} API could not be loaded:`, error.message);
          }
        }

        if (!cancelled) {
          setRecords(result);
          setNotice(
            bookingsError
              ? `Failed to load My Bookings: ${bookingsError}. Please log in again and try.`
              : ""
          );
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(`An error occurred while loading data: ${error.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (page === "Overview" || page.startsWith("My ")) loadCustomerData();
    return () => { cancelled = true; };
  }, [page, token]);

  async function createCashPayment(booking) {
    const bookingId = booking._id || booking.booking_id || booking.id;
    if (!bookingId) { setNotice("Booking ID is missing."); return; }
    setCreatingPaymentId(bookingId);
    setNotice("");
    try {
      if (!token) throw new Error("Please log in again as Customer.");
      const response = await fetch("http://localhost:3000/api/payments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ booking_id: bookingId, payment_method: "cash" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to create cash payment. The booking may need a driver assigned first.");
      setNotice(data.message || "Cash payment created. Pay the driver after the trip.");
      setPage("My Payments");
    } catch (error) { setNotice(error.message || "Unable to create cash payment."); }
    finally { setCreatingPaymentId(null); }
  }

  const currentKey = page === "My Bookings" ? "bookings" : page === "My Trips" ? "trips" : page === "My Payments" ? "payments" : page === "My Ratings" ? "ratings" : null;
  const rows = currentKey ? records[currentKey] : [];

  return (
    <div className="customer-layout">
      <aside className="customer-sidebar">
        <div className="customer-brand"><span>D</span><div>DriveEase<small>CUSTOMER PANEL</small></div></div>
        <p className="customer-menu-label">MY ACCOUNT</p>
        <nav className="customer-menu">
          {sections.map((item) => <button key={item} className={page === item ? "customer-menu-active" : ""} onClick={() => setPage(item)}><span>{({Overview:"▦", "My Profile":"♙", "My Bookings":"▣", "My Trips":"↗", "My Payments":"₹", "My Ratings":"★"})[item]}</span>{item}</button>)}
        </nav>
        <div className="customer-sidebar-profile"><span className="customer-avatar">{name.charAt(0).toUpperCase()}</span><div><strong>{name}</strong><small>Customer Account</small></div></div>
        <button className="customer-back-button" onClick={onBack}>← Back to Home</button>
        <button className="customer-logout-button" onClick={onLogout}>↪ Logout</button>
      </aside>
      <main className="customer-main">
        <header className="customer-topbar"><div><span>Customer / {page}</span><h1>{page}</h1></div><div className="customer-welcome">Welcome, {name}</div></header>
        <div className="customer-content">
          {page === "Overview" && <>
            <section className="customer-hero-card"><span>YOUR DRIVE EASE ACCOUNT</span><h2>Hello, {name}!</h2><p>Manage your own bookings, trips and account details from one place.</p><button onClick={() => setPage("My Bookings")}>View My Bookings →</button></section>
            <div className="customer-stats">{[["My Bookings", records.bookings.length, "▣"],["My Trips",records.trips.length,"↗"],["My Payments",records.payments.length,"₹"],["My Ratings",records.ratings.length,"★"]].map(([title,count,icon])=><button className="customer-stat-card" key={title} onClick={() => setPage(title)}><span>{icon}</span><strong>{title}</strong><b>{loading ? "…" : count}</b><small>Open section →</small></button>)}</div>
            <section className="customer-panel"><h2>My Account Details</h2><p><strong>Name:</strong> {name}</p><p><strong>Email:</strong> {user?.email || "Not available"}</p><p><strong>Phone:</strong> {user?.phone || "Not available"}</p><p><strong>Address:</strong> {user?.address || "Not available"}</p></section>
          </>}
          {page === "My Profile" && <section className="customer-panel"><h2>My Profile</h2><p><strong>Name:</strong> {name}</p><p><strong>Email:</strong> {user?.email || "Not available"}</p><p><strong>Phone:</strong> {user?.phone || "Not available"}</p><p><strong>Address:</strong> {user?.address || "Not available"}</p></section>}
          {currentKey && <section className="customer-panel">
            <h2>{page}</h2>{loading && <p>Loading your records…</p>}
            {notice && <p className="customer-notice">{notice}</p>}{!loading && rows.length === 0 && <div className="customer-empty">No records are available yet, or the backend API has not been connected.</div>}{rows.length > 0 && <div className="customer-table-wrap"><table className="customer-table"><thead><tr>{Object.keys(rows[0]).map((key) => <th key={key}>{currentKey === "bookings" && key === "customer_id" ? "Customer Name" : key.replaceAll("_", " ")}</th>)}{currentKey === "bookings" && <th>Cash Payment</th>}</tr></thead><tbody>{rows.map((row, i) => { const rowStatus = String(row.status || row.booking_status || "").toLowerCase(); const bookingId = row._id || row.booking_id || row.id; return <tr key={bookingId || row.trip_id || row.payment_id || row.rating_id || i}>{Object.keys(rows[0]).map((key) => <td key={key}>{currentKey === "bookings" && key === "customer_id" ? name : (row[key] && typeof row[key] === "object" ? (row[key].name || row[key].full_name || row[key]._id || JSON.stringify(row[key])) : String(row[key] ?? "—"))}</td>)}{currentKey === "bookings" && <td>{["assigned", "confirmed", "completed", "started"].includes(rowStatus) ? <button type="button" className="driver-action-button" disabled={creatingPaymentId === bookingId} onClick={() => createCashPayment(row)}>{creatingPaymentId === bookingId ? "Creating…" : "Choose Cash"}</button> : <span>Available after driver assignment</span>}</td>}</tr>; })}</tbody></table></div>}</section>}

            
{page === "My Payments" ? (
  <section className="customer-panel">
    <h2>My Payments</h2>

    {loading && <p>Loading your payments...</p>}
    {notice && <p className="customer-notice">{notice}</p>}

    {!loading && records.bookings.length === 0 && (
      <div className="customer-empty">
        No bookings available for payment yet.
      </div>
    )}

    {!loading && records.bookings.length > 0 && (
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Pickup</th>
              <th>Destination</th>
              <th>Fare</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {records.bookings.map((booking) => {
              const bookingId =
                booking._id || booking.booking_id || booking.id;

              const payment = records.payments.find((p) => {
                const paymentBookingId =
                  typeof p.booking_id === "object"
                    ? p.booking_id?._id
                    : p.booking_id;

                return String(paymentBookingId) === String(bookingId);
              });

              const status = String(
                payment?.payment_status || "Not created"
              ).toLowerCase();

              const bookingStatus = String(
                booking.status || booking.booking_status || ""
              ).toLowerCase();

              const canPay = [
                "assigned",
                "confirmed",
                "completed",
                "started"
              ].includes(bookingStatus);

              return (
                <tr key={bookingId}>
                  <td>{String(bookingId || "—").slice(-8)}</td>
                  <td>{booking.pickup_location || "—"}</td>
                  <td>{booking.drop_location || "—"}</td>
                  <td>
                    ₹{booking.fare ??
                      (booking.trip_type === "Round trip" ? 800 : 500)}
                  </td>
                  <td>
                    {status === "completed"
                      ? "Payment Received"
                      : status === "pending"
                      ? "Cash Payment Pending"
                      : status === "not created"
                      ? "Not Created"
                      : status}
                  </td>
                  <td>
                    {!payment && canPay ? (
                      <button
                        type="button"
                        className="driver-action-button"
                        disabled={creatingPaymentId === bookingId}
                        onClick={() => createCashPayment(booking)}
                      >
                        {creatingPaymentId === bookingId
                          ? "Creating..."
                          : "Choose Cash"}
                      </button>
                    ) : !payment && !canPay ? (
                      <span>Available after driver assignment</span>
                    ) : status === "pending" ? (
                      <span>Pay driver in cash</span>
                    ) : (
                      <span>Payment recorded</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
) : currentKey ? (
  <section className="customer-panel">
    <h2>{page}</h2>

    {loading && <p>Loading your records...</p>}
    {notice && <p className="customer-notice">{notice}</p>}

    {!loading && rows.length === 0 && (
      <div className="customer-empty">
        No records are available yet, or the backend API has not been connected.
      </div>
    )}

    {rows.length > 0 && (
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              {Object.keys(rows[0]).map((key) => (
                <th key={key}>
                  {key.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row._id || row.id || i}>
                {Object.keys(rows[0]).map((key) => (
                  <td key={key}>
                    {row[key] && typeof row[key] === "object"
                      ? row[key].name ||
                        row[key].full_name ||
                        row[key]._id ||
                        JSON.stringify(row[key])
                      : String(row[key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
) : null}


        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showCustomerDashboard, setShowCustomerDashboard] = useState(false);
  const [showDriverDashboard, setShowDriverDashboard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [role, setRole] = useState("Customer");
  const [mode, setMode] = useState("Login");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("driveease_user")) || null;
    } catch {
      return null;
    }
  });

  const [booking, setBooking] = useState({
    pickup_location: "",
    drop_location: "",
    booking_date: "",
    booking_time: "",
    trip_type: "One way",
  });

  const updateBooking = (e) => {
    setBooking({
      ...booking,
      [e.target.name]: e.target.value,
    });
  };

  const requestDriver = async (e) => {
    e.preventDefault();
    setMessage("");

    const userRole = String(loggedInUser?.role || "").toLowerCase();
    const token = localStorage.getItem("driveease_token");

    if (!loggedInUser || !token) {
      setMessage("Please log in as a Customer before making a booking.");
      openLogin("Customer");
      return;
    }

    if (userRole !== "customer" && userRole !== "user") {
      setMessage("Please log in using a Customer account to make a booking.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup_location: booking.pickup_location.trim(),
          drop_location: booking.drop_location.trim(),
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          trip_type: booking.trip_type,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Booking failed (${response.status})`);
      }

      setMessage(data.message || "Booking request successful! Check My Bookings.");
      setBooking({
        pickup_location: "",
        drop_location: "",
        booking_date: "",
        booking_time: "",
        trip_type: "One way",
      });
    } catch (error) {
      setMessage(
        error.message || "Unable to create the booking. Please check the backend API."
      );
    }
  };

  const openLogin = (selectedRole = "Customer") => {
    setRole(selectedRole);
    setMode("Login");
    setMessage("");
    setShowLogin(true);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (mode === "Register" && role === "Admin") {
      setMessage("Admin registration is not allowed.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData.entries());

    const payload =
      mode === "Register"
        ? {
            role,
            full_name: values.full_name?.trim(),
            phone: values.phone?.trim(),
            password: values.password,
            ...(role === "Customer"
              ? {
                  email: values.email?.trim(),
                  address: values.address?.trim(),
                }
              : {
                  license_number: values.license_number?.trim(),
                  experience_years: Number(
                    values.experience_years || 0
                  ),
                }),
          }
        : {
            role,
            identifier: values.identifier?.trim(),
            password: values.password,
          };

    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/${mode.toLowerCase()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      if (mode === "Register") {
        setMessage(
          data.message ||
            "Registration successful. You can login now."
        );
        setMode("Login");
      } else {
        if (!data.token || !data.user) {
          throw new Error(
            "Login response is incomplete. Please try again."
          );
        }

        localStorage.setItem("driveease_token", data.token);
        localStorage.setItem(
          "driveease_user",
          JSON.stringify(data.user)
        );

        
const user = {
  ...data.user,
  role: String(data.user?.role || role).toLowerCase(),
};

localStorage.setItem("driveease_user", JSON.stringify(user));

setLoggedInUser(user);
setShowLogin(false);
setShowAdminDashboard(user.role === "admin");
setShowCustomerDashboard(
  user.role === "customer" || user.role === "user"
);
setShowDriverDashboard(user.role === "driver");
setMessage("");

      }
    } catch (error) {
      setMessage(
        error.message ||
          "Backend connection failed. Check that the API is running."
      );
    }
  };

  const handleLogout = () => {
  localStorage.removeItem("driveease_token");
  localStorage.removeItem("driveease_user");

  setLoggedInUser(null);
  setShowLogin(false);
  setShowAdminDashboard(false);
  setShowCustomerDashboard(false);
  setShowDriverDashboard(false);
  setShowProfile(false);
  setMessage("");
};


if (showCustomerDashboard && loggedInUser) {
  return (
    <CustomerDashboard
      user={loggedInUser}
      onBack={() => setShowCustomerDashboard(false)}
      onLogout={handleLogout}
    />
  );
}

if (showDriverDashboard && loggedInUser) {
  return (
    <DriverDashboard
      user={loggedInUser}
      onBack={() => setShowDriverDashboard(false)}
      onLogout={handleLogout}
    />
  );
}
if (showAdminDashboard && loggedInUser) {
  return (
    <AdminDashboard onLogout={handleLogout} />
  );
}

  return (
    <div className="website">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">D</span>
          <span>
            DriveEase
            <small>DRIVER ON DEMAND</small>
          </span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#booking">Book a Driver</a>

<a className="nav-book" href="#roles">
  Get Started
</a>

{loggedInUser ? (
  <div className="profile-container">
    <button
      type="button"
      className="profile-trigger"
      onClick={() => setShowProfile(!showProfile)}
    >
      <span className="profile-avatar">
        {(loggedInUser.full_name || loggedInUser.name || "U")
          .charAt(0)
          .toUpperCase()}
      </span>

      <span className="profile-trigger-name">
        {(loggedInUser.full_name || loggedInUser.name || "User")
          .split(" ")
          .slice(0, 2)
          .join(" ")}
      </span>

      <span className="profile-arrow">
        {showProfile ? "▲" : "▼"}
      </span>
    </button>

    {showProfile && (
      <div className="profile-dropdown">
        <div className="profile-dropdown-header">
          <span className="profile-avatar profile-avatar-large">
            {(loggedInUser.full_name || loggedInUser.name || "U")
              .charAt(0)
              .toUpperCase()}
          </span>

          <div className="profile-user-info">
            <strong>
              {loggedInUser.full_name || loggedInUser.name || "User"}
            </strong>
            <small>{loggedInUser.email || "Account user"}</small>
          </div>
        </div>

        <div className="profile-divider" />

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => {
            setShowProfile(false);
            setMessage("Profile details are coming soon.");
          }}
        >
          <span>♙</span>
          My Profile
        </button>

        
<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    const userRole = String(
      loggedInUser?.role || "customer"
    ).toLowerCase();

    if (userRole === "customer" || userRole === "user") {
      setShowProfile(false);
      setMessage("");
      setShowCustomerDashboard(true);
    } else {
      setShowProfile(false);
      setMessage("Please log in using a Customer account.");
    }
  }}
 ></button>
<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    const userRole = String(
      loggedInUser?.role || "customer"
    ).toLowerCase();

    setShowProfile(false);
    setMessage("");

    if (userRole === "customer" || userRole === "user") {
      setShowCustomerDashboard(true);
    } else {
      setMessage("Please log in using a Customer account.");
    }
  }}
>
  <span>▣</span>
  My Bookings
</button>


        <div className="profile-divider" />

        <button
          type="button"
          className="profile-logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </div>
    )}
  </div>
) : (
  <button
    className="nav-login"
    onClick={() => openLogin("Customer")}
  >
    Login
  </button>
)}
        </nav>
      </header>

      <main>
        
<section className="hero hero-image-background" id="home">
  <div className="hero-content">
    <span className="tag">
      LOCAL DRIVER SERVICE, NOW ONLINE
    </span>

    <h1>
      Your own driver,
      <br />
      one booking away.
    </h1>

    <p>
      Book a trained driver for your own car. Manage your
      bookings and enjoy a convenient travel experience.
    </p>

    <div className="hero-actions">
      <a className="primary-btn" href="#roles">
        Get Started →
      </a>

      <a className="secondary-btn" href="#how-it-works">
        See how it works
      </a>
    </div>

    <div className="benefits">
      <span>✓ Trusted drivers</span>
      <span>✓ Easy booking</span>
      <span>✓ Convenient service</span>
    </div>
  </div>
</section>


        <section className="content-section" id="about">
          <span className="section-label">ABOUT US</span>
          <h2>Making every journey easier</h2>
          <p className="section-description">
            Driver On Demand connects customers with drivers and helps
            manage bookings, trips and payments in one place.
          </p>

          <div className="features-grid">
            <article className="feature-card">
              <span className="feature-icon">🛡️</span>
              <div>
                <h3>Trusted Service</h3>
                <p>
                  Designed for convenient and dependable journeys.
                </p>
              </div>
            </article>

            <article className="feature-card">
              <span className="feature-icon">🚗</span>
              <div>
                <h3>Easy Booking</h3>
                <p>Enter your journey details with ease.</p>
              </div>
            </article>

            <article className="feature-card">
              <span className="feature-icon">📋</span>
              <div>
                <h3>Simple Management</h3>
                <p>
                  Keep bookings and trip information organised.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="content-section" id="how-it-works">
          <span className="section-label">HOW IT WORKS</span>
          <h2>From request to rating</h2>

          <div className="steps-grid">
            {[
              [
                "1",
                "Booking request",
                "Enter pickup, drop, date and time.",
              ],
              [
                "2",
                "Driver assignment",
                "An available driver can be assigned.",
              ],
              [
                "3",
                "Trip",
                "Record trip start and completion.",
              ],
              [
                "4",
                "Payment",
                "Record payment details and receipts.",
              ],
              [
                "5",
                "Rating",
                "Share feedback about your driver.",
              ],
            ].map(([number, title, desc]) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="features">
          <span className="section-label">FEATURES</span>
          <h2>Everything in one place</h2>

          <div className="features-grid">
            {[
              [
                "♙",
                "Customers and drivers",
                "Manage customer and driver records.",
              ],
              [
                "▦",
                "Bookings and trips",
                "Organise requests and trip status.",
              ],
              [
                "₹",
                "Payments",
                "Keep payment records organised.",
              ],
              [
                "↗",
                "Reports",
                "Review service activity.",
              ],
              [
                "⬡",
                "Role-based access",
                "Separate access for different users.",
              ],
              [
                "◷",
                "History",
                "Keep track of important activity.",
              ],
            ].map(([icon, title, desc]) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon">{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="booking">
          <span className="section-label">BOOK YOUR DRIVER</span>
          <h2>Plan your next journey</h2>
          <p className="section-description">
            Enter your pickup, destination, date and time to request a driver.
          </p>

          <form
            onSubmit={requestDriver}
            style={{
              maxWidth: "760px",
              margin: "28px auto 0",
              padding: "30px",
              background: "#ffffff",
              border: "1px solid #e5eaf0",
              borderRadius: "18px",
              boxShadow: "0 12px 35px rgba(15, 35, 65, 0.08)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "18px",
              textAlign: "left",
            }}
          >
            <div>
              <label htmlFor="pickup_location">Pickup Location</label>
              <input
                id="pickup_location"
                name="pickup_location"
                value={booking.pickup_location}
                onChange={updateBooking}
                placeholder="Enter pickup location"
                required
                style={{ width: "100%", boxSizing: "border-box", marginTop: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="drop_location">Drop Location</label>
              <input
                id="drop_location"
                name="drop_location"
                value={booking.drop_location}
                onChange={updateBooking}
                placeholder="Enter destination"
                required
                style={{ width: "100%", boxSizing: "border-box", marginTop: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="booking_date">Booking Date</label>
              <input
                id="booking_date"
                name="booking_date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={booking.booking_date}
                onChange={updateBooking}
                required
                style={{ width: "100%", boxSizing: "border-box", marginTop: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="booking_time">Booking Time</label>
              <input
                id="booking_time"
                name="booking_time"
                type="time"
                value={booking.booking_time}
                onChange={updateBooking}
                required
                style={{ width: "100%", boxSizing: "border-box", marginTop: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="trip_type">Trip Type</label>
              <select id="trip_type" name="trip_type" value={booking.trip_type} onChange={updateBooking} required style={{ width: "100%", boxSizing: "border-box", marginTop: "8px", padding: "10px" }}>
                <option value="One way">One way — ₹500</option>
                <option value="Round trip">Round trip — ₹800</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", padding: "12px 14px", borderRadius: "10px", background: "#f0f7ff", color: "#163b65" }}><strong>Fixed Fare: ₹{booking.trip_type === "Round trip" ? 800 : 500}</strong><div style={{ fontSize: "13px", marginTop: 4 }}>Cash payment only. Pay the driver after the trip.</div></div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="request-btn" type="submit">
                Book Driver →
              </button>
              {message && (
                <p className="form-message" role="status" style={{ marginTop: "14px" }}>
                  {message}
                </p>
              )}
              <p className="booking-note" style={{ marginTop: "12px" }}>
                You must be logged in with a Customer account to submit a booking.
              </p>
            </div>
          </form>
        </section>

        <section className="content-section" id="roles">
          <span className="section-label">GET STARTED</span>
          <h2>Choose your account</h2>

          <div className="roles-grid">
            {[
              [
                "Admin",
                "Manage the driver service and review records.",
              ],
              [
                "Customer",
                "Request drivers and review your bookings.",
              ],
              [
                "Driver",
                "Access your assigned trips.",
              ],
            ].map(([userRole, desc]) => (
              <article className="role-card" key={userRole}>
                <h3>{userRole}</h3>
                <p>{desc}</p>
                <button onClick={() => openLogin(userRole)}>
                  {userRole} Login / Register →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section faq-section" id="faq">
          <span className="section-label">QUESTIONS</span>
          <h2>Common questions</h2>

          <details>
            <summary>How do I request a driver?</summary>
            <p>
              Fill in the booking form with your journey details.
            </p>
          </details>

          <details>
            <summary>Who assigns the driver?</summary>
            <p>
              The service administrator can assign an available driver.
            </p>
          </details>

          <details>
            <summary>Can I view past bookings?</summary>
            <p>
              Booking history will be available through account integration.
            </p>
          </details>
        </section>
      </main>

      <footer>
        © 2026 DriveEase · Driver On Demand. All rights reserved.
      </footer>

      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
        >
          <form
            className="login-card"
            onSubmit={handleAuthSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>

            <span className="login-icon">D</span>
            <h2>
              {mode === "Login"
                ? "Welcome back"
                : "Create your account"}
            </h2>
            <p className="login-subtitle">
              Driver On Demand account access
            </p>

            <label>Account type</label>
            <select
              name="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setMessage("");
              }}
            >
              <option value="Customer">Customer</option>
              <option value="Driver">Driver</option>
              <option value="Admin">Admin</option>
            </select>

            <div className="form-tabs">
              <button
                type="button"
                className={mode === "Login" ? "active" : ""}
                onClick={() => {
                  setMode("Login");
                  setMessage("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "Register" ? "active" : ""}
                onClick={() => {
                  setMode("Register");
                  setMessage("");
                }}
              >
                Register
              </button>
            </div>

            {mode === "Register" ? (
              <>
                <label>Full name</label>
                <input
                  name="full_name"
                  placeholder="Enter full name"
                  autoComplete="name"
                  required
                />

                <label>Phone number</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  pattern="[0-9]{10,15}"
                  title="Enter 10 to 15 digits"
                  required
                />

                {role === "Customer" ? (
                  <>
                    <label>Address</label>
                    <input
                      name="address"
                      placeholder="Enter address"
                      autoComplete="street-address"
                      required
                    />

                    <label>Email address</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      autoComplete="email"
                      required
                    />
                  </>
                ) : role === "Driver" ? (
                  <>
                    <label>Driving license number</label>
                    <input
                      name="license_number"
                      placeholder="Enter license number"
                      required
                    />

                    <label>Experience (years)</label>
                    <input
                      name="experience_years"
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </>
                ) : null}

                <label>Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <label className="show-password-option">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show password
                </label>
              </>
            ) : (
              <>
                <label>
                  {role === "Driver"
                    ? "Phone number"
                    : "Email address"}
                </label>
                <input
                  name="identifier"
                  type={role === "Driver" ? "tel" : "email"}
                  placeholder={
                    role === "Driver"
                      ? "Enter phone number"
                      : "Enter email address"
                  }
                  autoComplete={
                    role === "Driver" ? "tel" : "email"
                  }
                  required
                />

                <label>Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <label className="show-password-option">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show password
                </label>
              </>
            )}

            <button className="request-btn" type="submit">
              {mode} →
            </button>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <p className="booking-note">
              {mode === "Register"
                ? "Your account details will be sent securely to the registration API."
                : "Sign in with your registered account details."}
            </p>
          </form>
        </div>
      )}
    </div>
  );
}