import { useCallback, useEffect, useRef, useState } from "react";
import { getApiError } from "../services/api";
import { getRide } from "../services/rides.service";

const TERMINAL_STATUSES = new Set(["completed", "cancelled_by_rider", "cancelled_by_driver"]);
const formatStatus = (status) => status.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function useRideStatus(rideId) {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const refreshRef = useRef(null);
  const previousStatusRef = useRef("");
  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let stopPolling = false;
    const controller = new AbortController();

    async function refreshRide() {
      if (inFlight || stopPolling) return;
      inFlight = true;
      try {
        const updatedRide = await getRide(rideId, { signal: controller.signal });
        if (mounted) {
          if (previousStatusRef.current && previousStatusRef.current !== updatedRide.status) {
            setStatusNotice(`Ride Status Updated: ${formatStatus(updatedRide.status)}.`);
          }
          previousStatusRef.current = updatedRide.status;
          setRide(updatedRide);
          setError("");
          setNotFound(false);
          if (TERMINAL_STATUSES.has(updatedRide.status)) stopPolling = true;
        }
      } catch (requestError) {
        if (!mounted || controller.signal.aborted) return;
        if (requestError.response?.status === 404) {
          stopPolling = true;
          setRide(null);
          setNotFound(true);
        }
        setError(getApiError(requestError));
      } finally {
        inFlight = false;
        if (mounted) setLoading(false);
      }
    }

    refreshRef.current = refreshRide;
    previousStatusRef.current = "";
    setLoading(true);
    refreshRide();
    const intervalId = window.setInterval(refreshRide, 5000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      controller.abort();
      refreshRef.current = null;
    };
  }, [rideId]);

  const refresh = useCallback(() => refreshRef.current?.(), []);
  return { ride, setRide, loading, error, notFound, statusNotice, refresh };
}
