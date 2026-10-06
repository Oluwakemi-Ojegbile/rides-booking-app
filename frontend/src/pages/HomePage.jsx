import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  if (user?.role === "rider") return <Navigate to="/rider/dashboard" replace />;
  if (user?.role === "driver") return <Navigate to="/driver/dashboard" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <main className="home-flow">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Reliable Trips for Riders and Drivers</p>
          <h1>Book a ride in minutes and keep every trip on track.</h1>
          <p>
            Request a ride, match with an available driver, follow each trip update, and return to
            your ride history when the journey is complete.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">
              Get Started
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Sign In
            </Link>
          </div>
        </div>

        <aside className="trip-preview" aria-label="Ride booking preview">
          <div className="hero-ride-image">
            <img src="/assets/ride-vehicle.webp" alt="Blue car ready for a ride" />
            <span className="ride-image-tag">Driver Ready Nearby</span>
          </div>
          <div className="trip-card">
            <div>
              <span className="label">Pickup</span>
              <strong>Victoria Island</strong>
            </div>
            <div>
              <span className="label">Destination</span>
              <strong>Lekki Phase 1</strong>
            </div>
            <div className="fare-row">
              <span>Estimated fare</span>
              <strong>NGN 4,500</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="feature-grid">
        <article className="info-card">
          <span className="card-mark blue-mark">01</span>
          <h2>Book With Confidence</h2>
          <p>Enter your journey details, see an estimated fare, and track the request from pickup to arrival.</p>
        </article>
        <article className="info-card">
          <span className="card-mark green-mark">02</span>
          <h2>Drive On Your Terms</h2>
          <p>Manage availability, keep vehicle information current, and accept one trip at a time.</p>
        </article>
        <article className="info-card">
          <span className="card-mark gold-mark">03</span>
          <h2>Stay In The Loop</h2>
          <p>Clear status updates let riders and drivers know what happens next throughout every journey.</p>
        </article>
      </section>

      <section className="workflow-band">
        <div>
          <p className="eyebrow green-text">How It Works</p>
          <h2>Request, match, ride, complete.</h2>
        </div>
        <div className="workflow-steps">
          <span>Choose Pickup</span>
          <span>Confirm Fare</span>
          <span>Meet Driver</span>
          <span>Track Status</span>
        </div>
      </section>
    </main>
  );
}
