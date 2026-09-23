import { apiRequest } from "./api";

export function requestRide(payload) {
  return apiRequest("/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
