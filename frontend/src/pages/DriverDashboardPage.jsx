import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { PageSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentDriverRide,
  getDriverProfile,
  updateDriverAvailability,
  updateDriverLocation,
  updateDriverProfile,
} from "../services/driver.service";
import { acceptRide, getAvailableRides } from "../services/rides.service";

const VEHICLE_FIELDS = ["vehicleMake", "vehicleModel", "vehicleColor", "plateNumber"];
const EMPTY_VEHICLE = { vehicleMake: "", vehicleModel: "", vehicleColor: "", plateNumber: "" };
const formatStatus = (status) => status.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function DriverDashboardPage() {
  const { user, getApiError } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [currentRide, setCurrentRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const requestListInFlight = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const driverProfile = await getDriverProfile();
        if (!mounted) return;
        setProfile(driverProfile);
        setVehicle(Object.fromEntries(VEHICLE_FIELDS.map((field) => [field, driverProfile[field] || ""])));

        try {
          const activeRide = await getCurrentDriverRide();
          if (mounted) setCurrentRide(activeRide);
        } catch (rideError) {
          if (mounted) setError(getApiError(rideError));
        }
      } catch (profileError) {
        if (mounted) setError(getApiError(profileError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [getApiError]);

  async function refreshRides(page = 1) {
    if (requestListInFlight.current) return;
    requestListInFlight.current = true;
    try {
      const result = await getAvailableRides(page);
      setRides(result.rides);
      setPagination(result.pagination);
    } finally {
      requestListInFlight.current = false;
    }
  }

  useEffect(() => {
    if (!profile?.isAvailable || currentRide) {
      setRides([]);
      return undefined;
    }

    let mounted = true;
    async function pollAvailableRides() {
      if (requestListInFlight.current) return;
      requestListInFlight.current = true;
      try {
        const result = await getAvailableRides(pagination.page);
        if (mounted) {
          setRides(result.rides);
          setPagination(result.pagination);
          setError("");
        }
      } catch (pollError) {
        if (mounted && pollError.response?.status === 409) {
          setRides([]);
        } else if (mounted) {
          setError(getApiError(pollError));
        }
      } finally {
        requestListInFlight.current = false;
      }
    }

    pollAvailableRides();
    const intervalId = window.setInterval(pollAvailableRides, 5000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [profile?.isAvailable, currentRide, pagination.page, getApiError]);

  async function handleSaveVehicle(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateDriverProfile(vehicle);
      setProfile((current) => ({ ...current, ...updated }));
      setVehicle(Object.fromEntries(VEHICLE_FIELDS.map((field) => [field, updated[field] || ""])));
      setMessage("Vehicle profile saved.");
    } catch (saveError) {
      setError(getApiError(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function handleAvailabilityChange() {
    if (!profile) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const isAvailable = await updateDriverAvailability(!profile.isAvailable);
      setProfile((current) => ({ ...current, isAvailable }));
      if (!isAvailable) setRides([]);
    } catch (availabilityError) {
      setError(getApiError(availabilityError));
    } finally {
      setBusy(false);
    }
  }

  async function handleLocationUpdate() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const currentLocation = await updateDriverLocation(coords.latitude, coords.longitude);
          setProfile((current) => ({ ...current, currentLocation }));
          setMessage("Location updated.");
        } catch (locationError) {
          setError(getApiError(locationError));
        } finally {
          setBusy(false);
        }
      },
      (locationError) => {
        setError(locationError.message || "Unable to access your location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleAccept(rideId) {
    setBusy(true);
    setAcceptingRideId(rideId);
    setError("");
    setMessage("");
    try {
      const ride = await acceptRide(rideId);
      setCurrentRide(ride);
      setRides([]);
      setProfile((current) => ({ ...current, isAvailable: false }));
      navigate(`/driver/rides/${ride._id}`, { replace: true });
    } catch (acceptError) {
      setRides((current) => current.filter((ride) => ride._id !== rideId));
      setError(acceptError.response?.status === 409
        ? "This request was just taken or is no longer available. The request list has been refreshed."
        : getApiError(acceptError));
      try {
        await refreshRides(pagination.page);
      } catch {
        setRides([]);
      }
    } finally {
      setBusy(false);
      setAcceptingRideId(null);
    }
  }

  async function handlePageChange(page) {
    setBusy(true);
    setError("");
    try {
      await refreshRides(page);
    } catch (pageError) {
      setError(getApiError(pageError));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <main className="dashboard-grid driver-dashboard-layout">
      <section className="page-panel dashboard-hero driver-panel">
        <p className="eyebrow green-text">Driver dashboard</p>
        <div className="driver-hero-heading">
          <div>
            <h1>Ready when the city moves, {user?.fullName?.split(" ")[0]}.</h1>
            <p className="muted">Keep your vehicle ready, set your availability, and take the next trip with confidence.</p>
          </div>
          <span className={profile?.isAvailable ? "shift-badge is-live" : "shift-badge"}>{profile?.isAvailable ? "● Live shift" : "○ Shift paused"}</span>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="driver-overview" aria-label="Driver shift summary">
          <div>
            <span>Shift status</span>
            <strong className={profile?.isAvailable ? "online-text" : "offline-text"}>{profile?.isAvailable ? "Ready for trips" : "Offline"}</strong>
          </div>
          <div>
            <span>Nearby requests</span>
            <strong>{profile?.isAvailable && !currentRide ? pagination.total : "—"}</strong>
          </div>
          <div>
            <span>Current trip</span>
            <strong>{currentRide ? formatStatus(currentRide.status) : "None active"}</strong>
          </div>
        </div>
        <div className="driver-toolbar" aria-label="Shift controls">
          <div className="driver-toggle">
            <span>Availability</span>
            <strong className={profile?.isAvailable ? "online-text" : "offline-text"}>
              {profile?.isAvailable ? "Online" : "Offline"}
            </strong>
          </div>
          <Button
            type="button"
            variant={profile?.isAvailable ? "secondary" : "primary"}
            disabled={busy || !profile}
            onClick={handleAvailabilityChange}
          >
            {profile?.isAvailable ? "Go offline" : "Go online"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy || !profile} onClick={handleLocationUpdate}>
            Update location
          </Button>
        </div>
      </section>

      <div className="driver-workspace">
      <section className="page-panel driver-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow blue-text">Vehicle profile</p>
            <h2>Your vehicle</h2>
          </div>
          <span className="driver-plate">{profile?.plateNumber || "No plate"}</span>
        </div>
        <div className="vehicle-summary">
          <span>Registered vehicle</span>
          <strong>{[profile?.vehicleColor, profile?.vehicleMake, profile?.vehicleModel].filter(Boolean).join(" ") || "Vehicle details needed"}</strong>
          <small>Keep these details accurate so riders can identify you at pickup.</small>
        </div>
        <form className="driver-vehicle-form" onSubmit={handleSaveVehicle}>
          <div className="vehicle-grid">
            <Input label="Make" name="vehicleMake" value={vehicle.vehicleMake} onChange={(event) => setVehicle({ ...vehicle, vehicleMake: event.target.value })} required />
            <Input label="Model" name="vehicleModel" value={vehicle.vehicleModel} onChange={(event) => setVehicle({ ...vehicle, vehicleModel: event.target.value })} required />
            <Input label="Colour" name="vehicleColor" value={vehicle.vehicleColor} onChange={(event) => setVehicle({ ...vehicle, vehicleColor: event.target.value })} required />
            <Input label="Plate number" name="plateNumber" value={vehicle.plateNumber} onChange={(event) => setVehicle({ ...vehicle, plateNumber: event.target.value.toUpperCase() })} required />
          </div>
          <Button variant="secondary" disabled={busy}>Save vehicle</Button>
        </form>
        {profile?.currentLocation && (
          <p className="location-note">
            Last location: {profile.currentLocation.latitude.toFixed(4)}, {profile.currentLocation.longitude.toFixed(4)}
          </p>
        )}
      </section>

      <section className="page-panel driver-section driver-requests">
        <div className="section-heading">
          <div>
            <p className="eyebrow green-text">Ride requests</p>
            <h2>{currentRide ? "Your current ride" : "Available nearby"}</h2>
          </div>
          {profile?.isAvailable && !currentRide && <span className="request-count">{pagination.total} waiting</span>}
        </div>

        {message && <p className="form-success" role="status">{message}</p>}

        {currentRide ? (
          <article className="ride-request current-ride">
            <div className="request-status">{formatStatus(currentRide.status)}</div>
            <div className="route-points">
              <p><span>Pickup</span><strong>{currentRide.pickup.address}</strong></p>
              <p><span>Drop-off</span><strong>{currentRide.destination.address}</strong></p>
            </div>
            <div className="ride-meta">
              <span>{currentRide.distanceInKm} km</span>
              <strong>NGN {Number(currentRide.estimatedFare).toLocaleString()}</strong>
            </div>
            <div className="rider-summary">
              <span>Rider</span>
              <strong>{currentRide.riderId?.fullName || "Rider"}</strong>
              {currentRide.riderId?.phone && <a href={`tel:${currentRide.riderId.phone}`}>{currentRide.riderId.phone}</a>}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/driver/rides/${currentRide._id}`)}
            >
              Continue ride
            </Button>
          </article>
        ) : !profile?.isAvailable ? (
          <div className="empty-requests"><strong>You are offline</strong><span>Go online to see available ride requests.</span></div>
        ) : rides.length === 0 ? (
          <div className="empty-requests"><strong>No requests right now</strong><span>New ride requests will appear here.</span></div>
        ) : (
          <div className="request-list">
            {rides.map((ride) => (
              <article className="ride-request" key={ride._id}>
                <div className="request-status">New request</div>
                <div className="route-points">
                  <p><span>Pickup</span><strong>{ride.pickup.address}</strong></p>
                  <p><span>Drop-off</span><strong>{ride.destination.address}</strong></p>
                </div>
                <div className="ride-meta">
                  <span>{ride.distanceInKm} km</span>
                  <strong>NGN {Number(ride.estimatedFare).toLocaleString()}</strong>
                </div>
                <Button disabled={busy} onClick={() => handleAccept(ride._id)}>
                  {acceptingRideId === ride._id ? "Accepting..." : "Accept ride"}
                </Button>
              </article>
            ))}
            <div className="pagination-controls">
              <Button variant="secondary" disabled={busy || pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>Previous</Button>
              <span>Page {pagination.page} of {Math.max(1, pagination.pages)}</span>
              <Button variant="secondary" disabled={busy || pagination.page >= pagination.pages} onClick={() => handlePageChange(pagination.page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </section>
      </div>
    </main>
  );
}
