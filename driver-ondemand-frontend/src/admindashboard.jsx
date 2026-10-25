
import { useState } from "react";
import "./admindashboard.css";

export default function AdminDashboard({ onLogout }) {
  const [page, setPage] = useState("Overview");

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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>DriveEase</h2>
        <p>ADMIN PANEL</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          ← Back to Home
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>Admin / {page}</p>
            <h1>{page}</h1>
          </div>
          <span>Administrator</span>
        </header>

        {page === "Overview" ? (
          <>
            <section className="admin-banner">
              <h2>Welcome back, Administrator!</h2>
              <p>Manage your Driver On Demand service.</p>
            </section>

            <section className="admin-stats">
              {[
                "Total Customers",
                "Total Drivers",
                "Total Bookings",
                "Total Payments",
              ].map((item) => (
                <article key={item}>
                  <p>{item}</p>
                  <h2>—</h2>
                  <small>Live data will be connected</small>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="admin-banner">
            <h2>{page} Management</h2>
            <p>
              {page} data and management options will appear here.
            </p>
            <button onClick={() => setPage("Overview")}>
              Back to Overview
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

