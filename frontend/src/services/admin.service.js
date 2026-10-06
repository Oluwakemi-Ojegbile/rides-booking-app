import { api } from "./api";

export async function getAdminOverview() {
  const response = await api.get("/admin/overview");
  return response.data.data;
}

export async function getAdminUsers(params = {}) {
  const response = await api.get("/admin/users", { params });
  return response.data.data;
}

export async function updateAdminUserStatus(userId, isActive) {
  const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return response.data.data.user;
}

export async function getAdminRides(params = {}) {
  const response = await api.get("/admin/rides", { params });
  return response.data.data;
}

export async function createAdminInvitation(email) {
  const response = await api.post("/admin/invitations", { email });
  return response.data.data;
}

export async function getActiveAdminInvitations() {
  const response = await api.get("/admin/invitations");
  return response.data.data.invitations;
}
