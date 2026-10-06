import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page-panel not-found-page">
      <div className="not-found-sign" aria-hidden="true"><span>404</span><i /></div>
      <p className="eyebrow orange-text">Route Not Found</p>
      <h1>This trip took a wrong turn</h1>
      <p className="muted">The page you requested does not exist, may have moved, or needs a different account role.</p>
      <Link className="btn btn-primary" to="/">
        Return Home
      </Link>
    </main>
  );
}
