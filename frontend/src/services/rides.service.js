import { api } from "./api";

export function requestRide(payload) {
  return api.post("/rides", payload).then((response) => response.data.data);
}

export function estimateRide(payload) {
  return api
    .post("/rides/estimate", payload)
    .then((response) => response.data.data);
}

export function getCurrentRide() {
  return api.get("/rides/current").then((response) => response.data.data);
}

export async function getRide(rideId, options = {}) {
  const response = await api.get(`/rides/${rideId}`, options);
  return response.data.data?.ride || response.data.ride;
}

export async function getCurrentRiderRide() {
  const response = await api.get("/rides/current");

  return response.data.data.ride;
}

export async function getAvailableRides(page = 1, limit = 10) {
  const response = await api.get("/rides/available", {
    params: {
      page,
      limit,
    },
  });

  return response.data.data;
}

export async function acceptRide(rideId) {
  const response = await api.patch(`/rides/${rideId}/accept`);

  return response.data.data.ride;
}

export async function updateRideLifecycle(rideId, action) {
  const response = await api.patch(`/rides/${rideId}/${action}`);
  return response.data.data?.ride || response.data.ride;
}

export async function cancelRide(rideId, reason) {
  const response = await api.patch(`/rides/${rideId}/cancel`, { reason });
  return response.data.data?.ride || response.data.ride;
}

export async function getRideHistory({
  page = 1,
  limit = 10,
  status = "",
} = {}) {
  const response = await api.get("/rides/history", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  return response.data.data;
}

export async function getDriverRideHistory({
  page = 1,
  limit = 10,
  status = "",
} = {}) {
  const response = await api.get("/drivers/rides/history", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  return response.data.data;
}
