import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createStoreApi, shopperTokenKey } from "../lib/storeApi";

const ShopperAuthContext = createContext(null);

export function ShopperAuthProvider({ clientRef, resolvedHost, children }) {
  const [shopper, setShopper] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => createStoreApi(clientRef, resolvedHost), [clientRef, resolvedHost]);
  const tokenKey = useMemo(() => shopperTokenKey(clientRef), [clientRef]);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setShopper(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setShopper(data);
    } catch {
      localStorage.removeItem(tokenKey);
      setShopper(false);
    } finally {
      setLoading(false);
    }
  }, [api, tokenKey]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem(tokenKey, data.access_token);
    setShopper(data.shopper);
    return data.shopper;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    if (data.access_token) localStorage.setItem(tokenKey, data.access_token);
    setShopper(data.shopper);
    return data.shopper;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem(tokenKey);
    setShopper(false);
  };

  return (
    <ShopperAuthContext.Provider value={{ shopper, loading, login, signup, logout, api, clientRef, resolvedHost, refresh }}>
      {children}
    </ShopperAuthContext.Provider>
  );
}

export function useShopperAuth() {
  return useContext(ShopperAuthContext);
}
