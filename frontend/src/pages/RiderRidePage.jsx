import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmCancelDialog } from "../components/ConfirmCancelDialog";
import { PageSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useRideStatus } from "../hooks/useRideStatus";
import { cancelRide } from "../services/rides.service";

const STATUS_MESSAGES = {
  requested: "Finding a driver",
  accepted: "Driver is travelling to the pickup location",
  arrived: "Driver has arrived",
  in_progress: "Trip is in progress",
  completed: "Trip completed",
  cancelled_by_rider: "Trip cancelled",
  cancelled_by_driver: "Trip cancelled",
};
const TERMINAL_STATUSES = new Set(["completed", "cancelled_by_rider", "cancelled_by_driver"]);
const formatStatus = (status) => status.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function RiderRidePage() {
  const { rideId } = useParams();
  const { getApiError } = useAuth();
  const { ride, setRide, loading, error, notFound, statusNotice } = useRideStatus(rideId);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function confirmCancellation() {
    setBusy(true);
    setActionError("");
    try {
      setRide(await cancelRide(rideId, reason));
      setShowCancelDialog(false);
    } catch (cancelError) {
      setActionError(getApiError(cancelError));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !ride) return <PageSkeleton variant="tracking" />;
  if (notFound) {
    return (
      <main className="page-panel tracking-page">
        <p className="eyebrow orange-text">Ride unavailable</p>
        <h1>We could not find this ride</h1>
        <p className="form-error" role="alert">{error || "The ride may have been removed."}</p>
        <Link className="btn btn-secondary" to="/rider/dashboard">Back to dashboard</Link>
      </main>
    );
  }
  if (!ride && error) {
    return (
      <main className="page-panel tracking-page">
        <p className="eyebrow orange-text">Tracking unavailable</p>
        <h1>We could not load your ride</h1>
        <p className="form-error" role="alert">{error}. We will retry when the connection is available.</p>
        <Link className="text-link" to="/rider/dashboard">Back to dashboard</Link>
      </main>
    );
  }
  if (!ride) return <main className="page-panel tracking-page"><p className="empty-requests">No active ride was found.</p></main>;

  const vehicle = ride.driverProfile;

  return (
    <main className="page-panel tracking-page">
      <p className="eyebrow blue-text">Ride tracking</p>
      <div className="tracking-title">
        <h1>{formatStatus(ride.status)}</h1>
        <span className={`status-pill ${ride.status === "accepted" || ride.status === "arrived" || ride.status === "in_progress" ? "status-confirmed" : "status-pending"}`}>
          {STATUS_MESSAGES[ride.status]}
        </span>
      </div>
      <p className="muted" role="status">
        {STATUS_MESSAGES[ride.status]}. {!TERMINAL_STATUSES.has(ride.status) && "Updates refresh automatically."}
      </p>
      {error && <p className="form-error" role="alert">Live update failed: {error}. Retrying automatically.</p>}
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {statusNotice && <p className="form-success" role="status">{statusNotice}</p>}

      <div className="tracking-grid">
        <section className="tracking-block">
          <h2>Your journey</h2>
          <dl className="ride-details">
            <div><dt>Pickup</dt><dd>{ride.pickup.address}</dd></div>
            <div><dt>Destination</dt><dd>{ride.destination.address}</dd></div>
            <div><dt>Distance</dt><dd>{Number(ride.distanceInKm).toFixed(1)} km</dd></div>
            <div><dt>Estimated fare</dt><dd>NGN {Number(ride.estimatedFare).toLocaleString()}</dd></div>
          </dl>
        </section>
        {ride.driverId ? (
          <section className="tracking-block driver-assignment">
            <p className="eyebrow green-text">Your driver</p>
            <h2>{ride.driverId.fullName || "Driver assigned"}</h2>
            {ride.driverId.phone && <a className="driver-phone" href={`tel:${ride.driverId.phone}`}>{ride.driverId.phone}</a>}
            {vehicle && (
              <dl className="ride-details vehicle-details">
                <div><dt>Vehicle</dt><dd>{[vehicle.vehicleColor, vehicle.vehicleMake, vehicle.vehicleModel].filter(Boolean).join(" ")}</dd></div>
                <div><dt>Plate</dt><dd>{vehicle.plateNumber}</dd></div>
              </dl>
            )}
          </section>
        ) : (
          <section className="tracking-block waiting-driver">
            <h2>Matching you with a driver</h2>
            <p className="muted">Driver and vehicle details will appear here as soon as someone accepts.</p>
          </section>
        )}
      </div>
      <div className="trip-actions">
        {["requested", "accepted", "arrived"].includes(ride.status) && (
          <Button type="button" variant="danger" disabled={busy} onClick={() => setShowCancelDialog(true)}>Cancel ride</Button>
        )}
        <Link className="btn btn-secondary" to="/rider/dashboard">
          {TERMINAL_STATUSES.has(ride.status) ? "Return to dashboard" : "Back to rider dashboard"}
        </Link>
      </div>
      <ConfirmCancelDialog
        open={showCancelDialog}
        reason={reason}
        onReasonChange={setReason}
        onConfirm={confirmCancellation}
        onClose={() => setShowCancelDialog(false)}
        busy={busy}
      />
    </main>
  );
}
