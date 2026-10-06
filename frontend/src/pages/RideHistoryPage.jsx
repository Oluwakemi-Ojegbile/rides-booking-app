import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ListSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getDriverRideHistory, getRideHistory } from "../services/rides.service";

const FILTERS = ["", "completed", "cancelled_by_rider", "cancelled_by_driver", "accepted", "arrived", "in_progress", "requested"];

function formatStatus(status) {
  return status.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function rideDate(ride) {
  return ride.completedAt || ride.cancelledAt || ride.requestedAt || ride.createdAt;
}

export function RideHistoryPage({ role }) {
  const { getApiError } = useAuth();
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const getHistory = role === "driver" ? getDriverRideHistory : getRideHistory;
    getHistory({ page: pagination.page, status })
      .then((result) => {
        if (!mounted) return;
        setRides(result.rides);
        setPagination(result.pagination);
        setError("");
      })
      .catch((requestError) => { if (mounted) setError(getApiError(requestError)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [role, status, pagination.page, getApiError]);

  function changeStatus(event) {
    setStatus(event.target.value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  const dashboardPath = role === "driver" ? "/driver/dashboard" : "/rider/dashboard";
  const detailPath = role === "driver" ? "/driver/rides" : "/rider/rides";
  const title = role === "driver" ? "Trip history" : "Ride history";

  return (
    <main className="page-panel history-page">
      <p className={`eyebrow ${role === "driver" ? "green-text" : "blue-text"}`}>{role === "driver" ? "Driver Account" : "Rider Account"}</p>
      <h1>{title}</h1>
      <div className="history-toolbar">
        <label className="field">
          <span>Filter by status</span>
          <select value={status} onChange={changeStatus}>
            {FILTERS.map((value) => <option key={value} value={value}>{value ? formatStatus(value) : "Completed and cancelled"}</option>)}
          </select>
        </label>
        <Link className="btn btn-secondary" to={dashboardPath}>Back to dashboard</Link>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <ListSkeleton rows={4} /> : rides.length === 0 ? (
        <p className="empty-requests">No rides match this filter.</p>
      ) : (
        <div className="history-list">
          {rides.map((ride) => (
            <article className="history-card" key={ride._id}>
              <div>
                <span className="status-pill status-confirmed">{formatStatus(ride.status)}</span>
                <strong>{ride.pickup.address}</strong>
                <span className="muted">to {ride.destination.address}</span>
              </div>
              <div className="history-meta">
                <span>{new Date(rideDate(ride)).toLocaleString()}</span>
                <span>{Number(ride.distanceInKm).toFixed(1)} km · NGN {Number(ride.estimatedFare).toLocaleString()}</span>
              </div>
              <Link to={`${detailPath}/${ride._id}`}>View details</Link>
            </article>
          ))}
        </div>
      )}
      <div className="pagination-controls">
        <Button type="button" variant="secondary" disabled={loading || pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button>
        <span>Page {pagination.page} of {Math.max(1, pagination.pages)}</span>
        <Button type="button" variant="secondary" disabled={loading || pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</Button>
      </div>
    </main>
  );
}
