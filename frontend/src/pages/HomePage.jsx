import { AdminPage } from "./AdminPage";
import { DriverPage } from "./DriverPage";
import { RiderPage } from "./RiderPage";

export function HomePage() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="hero-kicker">Ride Booking MVP</p>
          <h1>Move riders, drivers, and admins through one clean flow.</h1>
          <p>
            A colorful starter interface for booking rides, accepting trips, and monitoring activity.
          </p>
        </div>
        <div className="hero-panel">
          <span>Live MVP</span>
          <strong>Request → Accept → Track → Complete</strong>
        </div>
      </section>

      <section className="role-grid">
        <RiderPage />
        <DriverPage />
        <AdminPage />
      </section>
    </main>
  );
}
