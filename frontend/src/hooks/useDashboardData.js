
import { useCallback, useEffect, useState } from "react";
import { api, normalizeAlerts } from "../services/api";

export default function useDashboardData() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const healthResult = await api.getHealth().then(
        (data) => ({ ok: true, data }),
        (error) => ({ ok: false, error })
      );

      setApiOnline(healthResult.ok);

      const [alertsResult, statsResult] = await Promise.allSettled([
        api.getAlerts(500, 0),
        api.getStats(),
      ]);

      if (alertsResult.status === "rejected") {
        throw alertsResult.reason;
      }

      setAlerts(normalizeAlerts(alertsResult.value));

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value ?? {});
      } else {
        setStats({});
      }

      setLastUpdated(new Date());
      setError(
        healthResult.ok
          ? ""
          : "Alert data loaded, but the backend health check failed."
      );
    } catch (err) {
      setApiOnline(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const intervalId = window.setInterval(refresh, 15000);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  return {
    alerts,
    stats,
    apiOnline,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    setAlerts,
  };
}
