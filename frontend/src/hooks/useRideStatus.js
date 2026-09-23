import { useState } from "react";

export function useRideStatus(initialStatus = "requested") {
  const [status, setStatus] = useState(initialStatus);
  return { status, setStatus };
}
