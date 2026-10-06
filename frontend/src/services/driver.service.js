import { api } from "./api";

export async function getDriverProfile() {
  const response = await api.get("/drivers/profile");
  return response.data.data.profile;
}

export async function updateDriverProfile(payload) {
  const response = await api.patch("/drivers/profile", payload);
  return response.data.data.profile;
}

export async function updateDriverAvailability(isAvailable) {
  const response = await api.patch("/drivers/availability", { isAvailable });
  return response.data.data.isAvailable;
}

export async function updateDriverLocation(latitude, longitude) {
  const response = await api.patch("/drivers/location", { latitude, longitude });
  return response.data.data.currentLocation;
}

export async function getCurrentDriverRide() {
  const response = await api.get("/drivers/rides/current");
  return response.data.data.ride;
}