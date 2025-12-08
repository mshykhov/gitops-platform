import { useState, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { API_URL, AUTH0_CONFIG } from "@/config/constants";

interface CacheResponse {
  action: string;
  key: string;
  value: string | null;
  ttl?: number | null;
  podName: string;
  timestamp: string;
}

interface PodInfoResponse {
  podName: string;
  timestamp: string;
}

interface KeysResponse {
  keys: string[];
  count: number;
  podName: string;
  timestamp: string;
}

export interface CacheLogEntry {
  id: number;
  action: string;
  key?: string;
  value?: string | null;
  ttl?: number | null;
  podName: string;
  timestamp: string;
  responseTime: number;
  status: "success" | "error";
  error?: string;
}

export const useCacheTest = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<CacheLogEntry[]>([]);
  const logCounter = useRef(0);

  const getAuthHeaders = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_CONFIG.audience || undefined },
    });
    return { Authorization: `Bearer ${token}` };
  }, [getAccessTokenSilently]);

  const addLog = useCallback((entry: Omit<CacheLogEntry, "id">) => {
    logCounter.current += 1;
    setLogs((logs) => [{ ...entry, id: logCounter.current }, ...logs].slice(0, 50));
  }, []);

  const getPodInfo = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get<PodInfoResponse>(`${API_URL}/api/cache-test/pod`, { headers });
      addLog({
        action: "POD",
        podName: data.podName,
        timestamp: data.timestamp,
        responseTime: Date.now() - start,
        status: "success",
      });
      return data;
    } catch (error) {
      addLog({
        action: "POD",
        podName: "unknown",
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        status: "error",
        error: axios.isAxiosError(error) ? error.message : String(error),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addLog]);

  const setValue = useCallback(
    async (key: string, value: string, ttl: number = 60) => {
      setLoading(true);
      const start = Date.now();
      try {
        const headers = await getAuthHeaders();
        const { data } = await axios.post<CacheResponse>(
          `${API_URL}/api/cache-test/set`,
          { key, value, ttl },
          { headers }
        );
        addLog({
          action: "SET",
          key: data.key,
          value: data.value,
          ttl: data.ttl,
          podName: data.podName,
          timestamp: data.timestamp,
          responseTime: Date.now() - start,
          status: "success",
        });
        return data;
      } catch (error) {
        addLog({
          action: "SET",
          key,
          value,
          ttl,
          podName: "unknown",
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - start,
          status: "error",
          error: axios.isAxiosError(error) ? error.message : String(error),
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, addLog]
  );

  const getValue = useCallback(
    async (key: string) => {
      setLoading(true);
      const start = Date.now();
      try {
        const headers = await getAuthHeaders();
        const { data } = await axios.get<CacheResponse>(`${API_URL}/api/cache-test/get/${key}`, { headers });
        addLog({
          action: "GET",
          key: data.key,
          value: data.value,
          podName: data.podName,
          timestamp: data.timestamp,
          responseTime: Date.now() - start,
          status: "success",
        });
        return data;
      } catch (error) {
        addLog({
          action: "GET",
          key,
          podName: "unknown",
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - start,
          status: "error",
          error: axios.isAxiosError(error) ? error.message : String(error),
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, addLog]
  );

  const deleteValue = useCallback(
    async (key: string) => {
      setLoading(true);
      const start = Date.now();
      try {
        const headers = await getAuthHeaders();
        const { data } = await axios.delete<CacheResponse>(`${API_URL}/api/cache-test/delete/${key}`, { headers });
        addLog({
          action: "DELETE",
          key: data.key,
          value: data.value,
          podName: data.podName,
          timestamp: data.timestamp,
          responseTime: Date.now() - start,
          status: "success",
        });
        return data;
      } catch (error) {
        addLog({
          action: "DELETE",
          key,
          podName: "unknown",
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - start,
          status: "error",
          error: axios.isAxiosError(error) ? error.message : String(error),
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, addLog]
  );

  const getKeys = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get<KeysResponse>(`${API_URL}/api/cache-test/keys`, { headers });
      addLog({
        action: "KEYS",
        value: `${data.count} keys: ${data.keys.join(", ")}`,
        podName: data.podName,
        timestamp: data.timestamp,
        responseTime: Date.now() - start,
        status: "success",
      });
      return data;
    } catch (error) {
      addLog({
        action: "KEYS",
        podName: "unknown",
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        status: "error",
        error: axios.isAxiosError(error) ? error.message : String(error),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addLog]);

  const clearLogs = useCallback(() => {
    logCounter.current = 0;
    setLogs([]);
  }, []);

  return {
    loading,
    logs,
    getPodInfo,
    setValue,
    getValue,
    deleteValue,
    getKeys,
    clearLogs,
  };
};
