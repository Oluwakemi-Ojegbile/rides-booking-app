import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { user, login, getApiError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.role === "rider") return <Navigate to="/rider/dashboard" replace />;
  if (user?.role === "driver") return <Navigate to="/driver/dashboard" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(form);
      const fallback = loggedInUser.role === "admin" ? "/admin/dashboard" : loggedInUser.role === "driver" ? "/driver/dashboard" : "/rider/dashboard";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow blue-text">Login</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue to your rider or driver dashboard.</p>
        <form className="stack" onSubmit={handleSubmit}>
          <Input label="Email" name="email" type="email" value={form.email} onChange={update} />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={update}
          />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
      <aside className="auth-aside">
        <img className="auth-image" src="/assets/booking-phone.webp" alt="Passenger booking a trip on a phone" />
        <span className="card-mark blue-mark">Secure</span>
        <h2>One login, role-aware access.</h2>
        <p>Riders go to booking tools. Drivers go to availability and trip controls.</p>
      </aside>
    </main>
  );
}
