import { useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { API_URL, AUTH0_CONFIG } from "@/config/constants";
import type { Item, ItemFormData } from "@/types";

export const useItems = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) return {};
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_CONFIG.audience || undefined },
    });
    return { Authorization: `Bearer ${token}` };
  }, [getAccessTokenSilently, isAuthenticated]);

  const getErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      return status ? `${status}: ${msg}` : msg;
    }
    return String(err);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{ content: Item[] }>(`${API_URL}/api/items`, { headers });
      const items = response.data.content ?? response.data;
      setItems(Array.isArray(items) ? items : []);
      return items;
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getItem = useCallback(
    async (id: number): Promise<Item | null> => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get<Item>(`${API_URL}/api/items/${id}`, { headers });
        return response.data;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [getAuthHeaders]
  );

  const createItem = useCallback(
    async (data: ItemFormData): Promise<Item | null> => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const response = await axios.post<Item>(`${API_URL}/api/items`, data, { headers });
        setItems((prev) => [...prev, response.data]);
        return response.data;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const updateItem = useCallback(
    async (id: number, data: ItemFormData): Promise<Item | null> => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const response = await axios.put<Item>(`${API_URL}/api/items/${id}`, data, { headers });
        setItems((prev) => prev.map((item) => (item.id === id ? response.data : item)));
        return response.data;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteItem = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_URL}/api/items/${id}`, { headers });
        setItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  return {
    items,
    loading,
    error,
    fetchItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    isAuthenticated,
  };
};
