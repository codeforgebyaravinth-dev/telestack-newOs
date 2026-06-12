import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPublicCustomerApi, customerTokenKey } from "../lib/publicCustomerApi";

const PublicCustomerAuthContext = createContext(null);

export function PublicCustomerAuthProvider({ clientRef, resolvedHost, scope = "providers", children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => createPublicCustomerApi(clientRef, resolvedHost, scope), [clientRef, resolvedHost, scope]);
  const tokenKey = useMemo(() => customerTokenKey(clientRef), [clientRef]);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setCustomer(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setCustomer(data);
    } catch {
      localStorage.removeItem(tokenKey);
      setCustomer(false);
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
    setCustomer(data.shopper);
    return data.shopper;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    if (data.access_token) localStorage.setItem(tokenKey, data.access_token);
    setCustomer(data.shopper);
    return data.shopper;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem(tokenKey);
    setCustomer(false);
  };

  return (
    <PublicCustomerAuthContext.Provider value={{ customer, loading, login, signup, logout, api, clientRef, resolvedHost, refresh }}>
      {children}
    </PublicCustomerAuthContext.Provider>
  );
}

export function usePublicCustomerAuth() {
  return useContext(PublicCustomerAuthContext);
}
