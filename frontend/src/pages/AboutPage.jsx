export function AboutPage() {
  return (
    <main className="content-page">
      <section className="page-panel split-panel">
        <div>
          <p className="eyebrow blue-text">About</p>
          <h1>Built for complete ride journeys</h1>
          <p className="muted">
            From the first booking to trip completion, Ride Booking keeps riders, drivers, vehicle
            details, availability, and secure account access connected in one clear experience.
          </p>
        </div>
        <div className="status-stack">
          <div>
            <span>Authentication</span>
            <strong>JWT-Secured</strong>
          </div>
          <div>
            <span>Database</span>
            <strong>MongoDB-Connected</strong>
          </div>
          <div>
            <span>Roles</span>
            <strong>Riders and Drivers</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="info-card">
          <h2>For riders</h2>
          <p>Request a ride, follow the driver’s progress, cancel when eligible, and revisit completed journeys.</p>
        </article>
        <article className="info-card">
          <h2>For drivers</h2>
          <p>Set availability, manage vehicle details, accept requests, and complete trips one step at a time.</p>
        </article>
        <article className="info-card">
          <h2>For the platform</h2>
          <p>Protected routes, safe API responses, fare estimates, and live status refreshes keep each trip reliable.</p>
        </article>
      </section>
    </main>
  );
}
