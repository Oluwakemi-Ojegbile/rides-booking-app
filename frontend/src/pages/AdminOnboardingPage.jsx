import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function AdminOnboardingPage() {
  const { user, getApiError, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return setError("This invitation link is incomplete.");
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/admin-invitations/accept", { ...form, token });
      const { user: invitedUser } = response.data.data;
      await login({ email: invitedUser.email, password: form.password });
      navigate("/admin/dashboard", { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow orange-text">Administrator invitation</p>
        <h1>Set up your administrator account</h1>
        <p className="muted">Complete the details below to activate your invitation.</p>
        <form className="stack" onSubmit={handleSubmit}>
          <Input label="Full name" name="fullName" value={form.fullName} onChange={update} />
          <Input label="Phone" name="phone" value={form.phone} onChange={update} />
          <Input label="Password" name="password" type="password" value={form.password} onChange={update} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" disabled={loading || !token}>{loading ? "Creating account..." : "Activate administrator account"}</Button>
        </form>
        <p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
