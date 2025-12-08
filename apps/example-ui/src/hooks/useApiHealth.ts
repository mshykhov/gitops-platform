import { useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { API_URL, AUTH0_CONFIG } from "@/config/constants";
import type { ApiEndpointResult } from "@/types";

export const useApiHealth = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiEndpointResult[]>([]);

  const callEndpoint = useCallback(
    async (endpoint: string, requiresAuth = false): Promise<ApiEndpointResult> => {
      const start = Date.now();
      try {
        const headers: Record<string, string> = {};

        if (requiresAuth && isAuthenticated) {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: AUTH0_CONFIG.audience || undefined,
            },
          });
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(`${API_URL}${endpoint}`, { headers });
        return {
          endpoint,
          status: "success",
          data: response.data,
          responseTime: Date.now() - start,
        };
      } catch (error) {
        return {
          endpoint,
          status: "error",
          error: axios.isAxiosError(error)
            ? `${error.response?.status || "Network"}: ${error.response?.data?.message || error.message}`
            : String(error),
          responseTime: Date.now() - start,
        };
      }
    },
    [getAccessTokenSilently, isAuthenticated]
  );

  const checkPublicEndpoints = useCallback(async () => {
    setLoading(true);
    const endpoints = ["/api/public/health", "/api/public/info", "/api/public/time"];
    const results = await Promise.all(endpoints.map((e) => callEndpoint(e, false)));
    setResults(results);
    setLoading(false);
    return results;
  }, [callEndpoint]);

  const checkPrivateEndpoints = useCallback(async () => {
    setLoading(true);
    const endpoints = ["/api/me", "/api/protected", "/api/admin/stats"];
    const results = await Promise.all(endpoints.map((e) => callEndpoint(e, true)));
    setResults(results);
    setLoading(false);
    return results;
  }, [callEndpoint]);

  const clearResults = useCallback(() => setResults([]), []);

  return {
    loading,
    results,
    checkPublicEndpoints,
    checkPrivateEndpoints,
    clearResults,
    isAuthenticated,
  };
};
