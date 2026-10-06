import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { PageSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentRide,
  requestRide,
} from "../services/rides.service";
import { getApiError } from "../services/api";

const emptyLocation = { address: "", latitude: "", longitude: "" };
const emptyForm = {
  pickup: { ...emptyLocation },
  destination: { ...emptyLocation },
};

function formatStatus(status) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function calculateDistanceInKm(start, end) {
  const radians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(end.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.max(
    0.1,
    6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)),
  );
}

export function RiderDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationBusy, setLocationBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pickupLatitude = Number(form.pickup.latitude);
  const pickupLongitude = Number(form.pickup.longitude);
  const destinationLatitude = Number(form.destination.latitude);
  const destinationLongitude = Number(form.destination.longitude);
  const hasRoute =
    [
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude,
    ].every(Number.isFinite) &&
    form.pickup.address.trim() &&
    form.destination.address.trim();
  const estimatedDistance = hasRoute
    ? calculateDistanceInKm(
        { latitude: pickupLatitude, longitude: pickupLongitude },
        { latitude: destinationLatitude, longitude: destinationLongitude },
      )
    : null;
  const estimatedFare = estimatedDistance
    ? 1000 + estimatedDistance * 500
    : null;

  useEffect(() => {
    getCurrentRide()
      .then(({ ride }) => setActiveRide(ride))
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  function updateLocation(field, key, value) {
    setForm((current) => ({
      ...current,
      [field]: { ...current[field], [key]: value },
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }

    setLocationBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          pickup: {
            ...current.pickup,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
          },
        }));
        setLocationBusy(false);
      },
      (locationError) => {
        setError(locationError.message || "Unable to access your location.");
        setLocationBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    for (const [label, place] of [
      ["Pickup", form.pickup],
      ["Destination", form.destination],
    ]) {
      if (!place.address.trim()) return `${label} address is required.`;
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (
        !place.latitude ||
        !place.longitude ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      )
        return `${label} coordinates must be valid latitude and longitude values.`;
    }
    if (
      Number(form.pickup.latitude) === Number(form.destination.latitude) &&
      Number(form.pickup.longitude) === Number(form.destination.longitude)
    )
      return "Pickup and destination must be different.";
    return "";
  }

  async function submitRide(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const rideData = await requestRide({
        pickup: {
          ...form.pickup,
          latitude: Number(form.pickup.latitude),
          longitude: Number(form.pickup.longitude),
        },
        destination: {
          ...form.destination,
          latitude: Number(form.destination.latitude),
          longitude: Number(form.destination.longitude),
        },
      });
      navigate(`/rider/rides/${rideData.ride._id}`);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <main className="dashboard-grid rider-dashboard">
      <section className="page-panel rider-booking-panel">
        <p className="eyebrow blue-text">Rider dashboard</p>
        <h1>Where are you headed, {user?.fullName}?</h1>
        {activeRide ? (
          <div className="active-ride-notice">
            <div>
              <strong>Your ride is {formatStatus(activeRide.status)}.</strong>
              <span>
                Open tracking to see the latest ride and driver details.
              </span>
            </div>
            <Link
              className="btn btn-primary"
              to={`/rider/rides/${activeRide._id}`}
            >
              Continue tracking
            </Link>
          </div>
        ) : (
          <>
            <p className="muted">
              Add a pickup and destination to preview your route before
              requesting a driver.
            </p>
            <form className="stack" onSubmit={submitRide}>
              {[
                ["pickup", "Pickup"],
                ["destination", "Destination"],
              ].map(([key, label]) => (
                <fieldset className="location-fields" key={key}>
                  <legend>{label}</legend>
                  <Input
                    label={`${label} address`}
                    value={form[key].address}
                    onChange={(event) =>
                      updateLocation(key, "address", event.target.value)
                    }
                    required
                  />
                  <div className="coordinate-grid">
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={form[key].latitude}
                      onChange={(event) =>
                        updateLocation(key, "latitude", event.target.value)
                      }
                      required
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={form[key].longitude}
                      onChange={(event) =>
                        updateLocation(key, "longitude", event.target.value)
                      }
                      required
                    />
                  </div>
                  {key === "pickup" && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={locationBusy}
                      onClick={useCurrentLocation}
                    >
                      {locationBusy
                        ? "Finding location..."
                        : "Use current location"}
                    </Button>
                  )}
                </fieldset>
              ))}
              <aside className="fare-preview" aria-live="polite">
                <div>
                  <span>Estimated Fare</span>
                  <strong>
                    {estimatedFare
                      ? `NGN ${Math.round(estimatedFare).toLocaleString()}`
                      : "Add Route Details"}
                  </strong>
                </div>
                <small>
                  {estimatedDistance
                    ? `${estimatedDistance.toFixed(1)} km · Demo fare: NGN 1,000 base + NGN 500/km`
                    : "Your estimated distance and fare will appear here."}
                </small>
              </aside>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Requesting ride..." : "Request ride"}
              </Button>
            </form>
          </>
        )}
      </section>
      <aside className="page-panel rider-booking-aside">
        <img
          className="booking-aside-image"
          src="/assets/booking-phone.webp"
          alt="Rider confirming a trip on a phone"
        />
        <p className="eyebrow green-text">Your Ride</p>
        <h2>From request to destination</h2>
        <p className="muted">
          Your request is shared with available drivers. When a driver accepts,
          their contact and vehicle details appear in live tracking.
        </p>
        <ol className="booking-steps">
          <li>
            <strong>1. Request</strong>
            <span>Share your pickup and destination.</span>
          </li>
          <li>
            <strong>2. Match</strong>
            <span>Follow the driver assignment in real time.</span>
          </li>
          <li>
            <strong>3. Ride</strong>
            <span>Track arrival, trip start, and completion.</span>
          </li>
        </ol>
      </aside>
    </main>
  );
}
