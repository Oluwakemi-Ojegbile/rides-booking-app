import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <main className="page-panel">
      <p className="eyebrow orange-text">Unauthorized</p>
      <h1>This page is restricted</h1>
      <p className="muted">
        Your current account role cannot access this route.
      </p>
      <p className="muted">
        Kindly contact the administrator to get access to this page.
      </p>
      <Link className="btn btn-primary" to="/">
        Go home
      </Link>
    </main>
  );
}
