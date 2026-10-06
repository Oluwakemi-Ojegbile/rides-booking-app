import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ride_booking_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ride_booking_token");
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  return error.response?.data?.message || error.message || "Request failed";
}
