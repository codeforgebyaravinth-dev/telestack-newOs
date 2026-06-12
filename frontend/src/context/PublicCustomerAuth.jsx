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

  const login = async ({ email, phone, password }) => {
    const payload = { password };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    const { data } = await api.post("/auth/login", payload);
    if (data.access_token) localStorage.setItem(tokenKey, data.access_token);
    setCustomer(data.shopper);
    return data.shopper;
  };

  const requestSignup = async (payload) => {
    await api.post("/auth/signup", payload);
  };

  const verifySignup = async (email, code) => {
    const { data } = await api.post("/auth/signup/verify", { email, code });
    if (data.access_token) localStorage.setItem(tokenKey, data.access_token);
    setCustomer(data.shopper);
    return data.shopper;
  };

  const resendSignupCode = async (email) => {
    await api.post("/auth/signup/resend", { email });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem(tokenKey);
    setCustomer(false);
  };

  return (
    <PublicCustomerAuthContext.Provider value={{
      customer, loading, login, requestSignup, verifySignup, resendSignupCode, logout, api, clientRef, resolvedHost, refresh,
    }}>
      {children}
    </PublicCustomerAuthContext.Provider>
  );
}

export function usePublicCustomerAuth() {
  return useContext(PublicCustomerAuthContext);
}
