import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "rider",
  vehicleMake: "",
  vehicleModel: "",
  vehicleColor: "",
  plateNumber: "",
};

export function RegisterPage() {
  const { user, register, getApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.role === "rider") return <Navigate to="/rider/dashboard" replace />;
  if (user?.role === "driver") return <Navigate to="/driver/dashboard" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  function validate() {
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      return "Name, email, phone and password are required.";
    }
    if (form.password.length < 8) return "Password must be at least 8 characters long.";
    if (form.role === "driver") {
      const vehicleFields = ["vehicleMake", "vehicleModel", "vehicleColor", "plateNumber"];
      if (vehicleFields.some((field) => !form[field])) {
        return "Vehicle make, model, colour and plate number are required for drivers.";
      }
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const createdUser = await register(form);
      navigate(createdUser.role === "driver" ? "/driver/dashboard" : "/rider/dashboard", {
        replace: true,
      });
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout register-layout">
      <section className="auth-card wide-auth">
        <p className="eyebrow green-text">Register</p>
        <h1>Create your account</h1>
        <p className="muted">
          Choose your role and we will collect only the details needed to get you started.
        </p>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="vehicle-grid">
            <Input label="Full name" name="fullName" value={form.fullName} onChange={update} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={update} />
            <Input label="Phone" name="phone" value={form.phone} onChange={update} />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
            />
          </div>
          <label className="field">
            <span>Account type</span>
            <select name="role" value={form.role} onChange={update}>
              <option value="rider">Rider</option>
              <option value="driver">Driver</option>
            </select>
          </label>

        {form.role === "driver" && (
          <div className="vehicle-grid">
            <Input
              label="Vehicle make"
              name="vehicleMake"
              value={form.vehicleMake}
              onChange={update}
            />
            <Input
              label="Vehicle model"
              name="vehicleModel"
              value={form.vehicleModel}
              onChange={update}
            />
            <Input
              label="Vehicle colour"
              name="vehicleColor"
              value={form.vehicleColor}
              onChange={update}
            />
            <Input
              label="Plate number"
              name="plateNumber"
              value={form.plateNumber}
              onChange={update}
            />
          </div>
        )}

          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
      <aside className="auth-aside">
        <img
          className="auth-image"
          src={form.role === "driver" ? "/assets/ride-vehicle.webp" : "/assets/booking-phone.webp"}
          alt={form.role === "driver" ? "Vehicle ready to accept ride requests" : "Passenger booking a ride on a phone"}
        />
        <span className="card-mark green-mark">{form.role === "driver" ? "Driver" : "Rider"}</span>
        <h2>{form.role === "driver" ? "Vehicle profile included." : "Ready to book rides."}</h2>
        <p>
          {form.role === "driver"
            ? "Driver registration creates a separate profile for car details and plate number."
            : "Rider registration keeps the flow quick so you can move to booking in the next phase."}
        </p>
      </aside>
    </main>
  );
}
