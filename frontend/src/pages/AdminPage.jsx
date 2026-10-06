import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ListSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { createAdminInvitation, getActiveAdminInvitations, getAdminOverview, getAdminRides, getAdminUsers, updateAdminUserStatus } from "../services/admin.service";

const RIDE_FILTERS = ["", "requested", "accepted", "arrived", "in_progress", "completed", "cancelled_by_rider", "cancelled_by_driver"];
const formatLabel = (value) => value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function AdminPage() {
  const { getApiError } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [tab, setTab] = useState("users");
  const [role, setRole] = useState("");
  const [rideStatus, setRideStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  async function loadOverview() {
    return getAdminOverview();
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      loadOverview(),
      getAdminUsers({ role }),
      getAdminRides({ status: rideStatus }),
      getActiveAdminInvitations(),
    ]).then(([overviewResult, userResult, rideResult, invitationResult]) => {
      if (!mounted) return;
      setOverview(overviewResult);
      setUsers(userResult.users);
      setRides(rideResult.rides);
      setInvitations(invitationResult);
      setError("");
    }).catch((requestError) => {
      if (mounted) setError(getApiError(requestError));
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [role, rideStatus, getApiError]);

  async function toggleUser(user) {
    setBusyId(user._id);
    setError("");
    try {
      const updated = await updateAdminUserStatus(user._id, !user.isActive);
      setUsers((current) => current.map((item) => item._id === updated._id ? updated : item));
      setOverview(await loadOverview());
    } catch (updateError) {
      setError(getApiError(updateError));
    } finally {
      setBusyId("");
    }
  }

  async function inviteAdministrator(event) {
    event.preventDefault();
    setInviting(true);
    setError("");
    try {
      const invitation = await createAdminInvitation(inviteEmail);
      setInvitations((current) => [
        { ...invitation, createdAt: new Date().toISOString() },
        ...current.filter((item) => item._id !== invitation._id),
      ]);
    } catch (inviteError) {
      setError(getApiError(inviteError));
    } finally {
      setInviting(false);
    }
  }

  const hasActiveInvitationForEmail = invitations.some((invitation) => (
    invitation.status === "active" && invitation.email === inviteEmail.trim().toLowerCase()
  ));

  async function copyInvitation(invitation) {
    const link = `${window.location.origin}/admin/onboarding?token=${invitation.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invitation._id);
    } catch {
      setError("Unable to copy the invitation link. Please copy it manually.");
    }
  }

  return (
    <main className="admin-page">
      <section className="page-panel admin-hero">
        <p className="eyebrow orange-text">Platform Administration</p>
        <h1>Operate the Ride Booking Platform</h1>
        <p className="muted">Monitor account activity, driver availability, and journey progress from one protected workspace.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="admin-metrics">
          {[
            ["Total Users", overview?.metrics.users], ["Riders", overview?.metrics.riders],
            ["Drivers", overview?.metrics.drivers], ["Online Drivers", overview?.metrics.activeDrivers],
            ["Active Rides", overview?.metrics.activeRides], ["Completed Trips", overview?.metrics.completedRides],
          ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{loading ? "—" : value}</strong></div>)}
        </div>
      </section>

      <section className="page-panel admin-workspace">
        <div className="admin-tabs" role="tablist" aria-label="Administration data">
          <Button type="button" variant={tab === "users" ? "primary" : "secondary"} onClick={() => setTab("users")}>Users</Button>
          <Button type="button" variant={tab === "rides" ? "primary" : "secondary"} onClick={() => setTab("rides")}>Rides</Button>
        </div>
        {tab === "users" ? (
          <>
            <div className="history-toolbar">
              <div><p className="eyebrow blue-text">Accounts</p><h2>Account Management</h2></div>
              <label className="field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="">All Roles</option><option value="rider">Riders</option><option value="driver">Drivers</option><option value="admin">Administrators</option></select></label>
            </div>
            <form className="history-toolbar" onSubmit={inviteAdministrator}>
              <div><p className="eyebrow orange-text">Team access</p><h2>Invite an administrator</h2><p className="muted">The link expires after seven days and can be used once.</p></div>
              <div className="stack"><label className="field"><span>Work email</span><input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /></label><Button type="submit" disabled={inviting}>{inviting ? "Saving..." : hasActiveInvitationForEmail ? "Regenerate link" : "Create invite link"}</Button></div>
            </form>
            {invitations.length > 0 && <div className="admin-list"><h3>Administrator invitations</h3>{invitations.map((invitation) => {
              if (invitation.status === "used") return <article className="admin-invitation" key={invitation._id}><div><strong>{invitation.email}</strong><span>Used {new Date(invitation.acceptedAt).toLocaleString()}</span></div><span className="invitation-used">Used</span></article>;
              const link = `${window.location.origin}/admin/onboarding?token=${invitation.token}`;
              return <article className="admin-invitation" key={invitation._id}><div><strong>{invitation.email}</strong><span>Expires {new Date(invitation.expiresAt).toLocaleString()}</span><a href={link}>{link}</a></div><Button type="button" variant="secondary" onClick={() => copyInvitation(invitation)}>{copiedId === invitation._id ? "Copied" : "Copy link"}</Button></article>;
            })}</div>}
            {loading ? <ListSkeleton rows={5} /> : <div className="admin-list">{users.map((user) => <article className="admin-row" key={user._id}><div><strong>{user.fullName}</strong><span>{user.email} · {user.phone}</span></div><span className="role-chip">{formatLabel(user.role)}</span><span className={user.isActive ? "status-online" : "status-offline"}>{user.isActive ? "Active" : "Inactive"}</span><Button type="button" variant={user.isActive ? "danger" : "primary"} disabled={busyId === user._id || user.role === "admin"} onClick={() => toggleUser(user)}>{busyId === user._id ? "Updating..." : user.isActive ? "Deactivate" : "Activate"}</Button></article>)}</div>}
          </>
        ) : (
          <>
            <div className="history-toolbar">
              <div><p className="eyebrow green-text">Journey Oversight</p><h2>Recent Rides</h2></div>
              <label className="field"><span>Ride Status</span><select value={rideStatus} onChange={(event) => setRideStatus(event.target.value)}><option value="">All Statuses</option>{RIDE_FILTERS.slice(1).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></label>
            </div>
            {loading ? <ListSkeleton rows={5} /> : <div className="admin-list">{rides.map((ride) => <article className="admin-row admin-ride-row" key={ride._id}><div><strong>{ride.pickup.address}</strong><span>To {ride.destination.address}</span></div><span className="status-pill status-confirmed">{formatLabel(ride.status)}</span><span>{ride.riderId?.fullName || "Rider"}</span><span>{ride.driverId?.fullName || "Unassigned"}</span><strong>NGN {Number(ride.estimatedFare).toLocaleString()}</strong></article>)}</div>}
          </>
        )}
      </section>
    </main>
  );
}
