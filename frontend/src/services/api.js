
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `${endpoint}: HTTP ${response.status} ${response.statusText}`
    );
  }

  if (response.status === 204) return null;

  return response.json();
}

export const api = {
  baseUrl: API_BASE_URL,

  getHealth() {
    return request("/health");
  },

  // Backend allows a maximum of 500 alerts per request.
  getAlerts(limit = 500, offset = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    return request(`/api/alerts?${params.toString()}`);
  },

  getStats() {
    return request("/api/alerts/stats");
  },

  updateAlertStatus(alertId, status) {
    return request(
      `/api/alerts/${encodeURIComponent(alertId)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );
  },
};

export function normalizeAlerts(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.alerts)) return payload.alerts;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}
