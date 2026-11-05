export interface HealthStatusResponse {
  status: "ok" | "error";
  checks: { database: "ok" | "error" };
  timestamp: string;
}

export interface ApiHealthResponse {
  success: boolean;
  message: string;
  data: HealthStatusResponse;
}

export function healthResponse(): HealthStatusResponse {
  return {
    status: "ok",
    checks: { database: "ok" },
    timestamp: new Date().toISOString(),
  };
}

export function unhealthyResponse(): HealthStatusResponse {
  return {
    status: "error",
    checks: { database: "error" },
    timestamp: new Date().toISOString(),
  };
}

export function apiHealthResponse(
  data: HealthStatusResponse,
): ApiHealthResponse {
  return {
    success: data.status === "ok",
    message: data.status === "ok" ? "OK" : "Health check failed.",
    data,
  };
}
