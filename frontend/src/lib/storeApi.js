import axios from "axios";

const PLATFORM_HOSTS = new Set([
  "rpsignage.com",
  "rpsignage.in",
  "localhost",
  "127.0.0.1",
  "telestack.dev",
  "console.telestack.dev",
]);

export function isCustomStoreHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host || PLATFORM_HOSTS.has(host)) return false;
  if (
    host === "console.telestack.dev" ||
    host === "telestack.dev" ||
    host.endsWith(".onrender.com") ||
    host.endsWith(".render.com") ||
    host.includes("render.com") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".netlify.app") ||
    host.endsWith(".pages.dev")
  ) {
    return false;
  }
  return true;
}

export function publicStoreBase(resolvedHost) {
  if (resolvedHost || isCustomStoreHost(typeof window !== "undefined" ? window.location.hostname : "")) {
    return `${window.location.origin}/api/public`;
  }
  return `${(process.env.REACT_APP_BACKEND_URL || "https://rpsignage.com").replace(/\/$/, "")}/api/public`;
}

export function createStoreApi(clientRef, resolvedHost) {
  const base = `${publicStoreBase(resolvedHost)}/store/${encodeURIComponent(clientRef)}`;
  const instance = axios.create({
    baseURL: base,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  instance.interceptors.request.use((cfg) => {
    const key = `shopper_token_${clientRef}`;
    const t = localStorage.getItem(key);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  return instance;
}

export function storePublicUrl(clientRef, resolvedHost = null) {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  if (resolvedHost || (typeof window !== "undefined" && isCustomStoreHost(window.location.hostname))) {
    return origin || "/";
  }
  return `${origin}/store/${encodeURIComponent(clientRef)}`;
}

export function storePath(clientRef, sub = "", resolvedHost = null) {
  if (resolvedHost || isCustomStoreHost(typeof window !== "undefined" ? window.location.hostname : "")) {
    return sub ? `/${sub.replace(/^\//, "")}` : "/";
  }
  const base = `/store/${encodeURIComponent(clientRef)}`;
  return sub ? `${base}/${sub.replace(/^\//, "")}` : base;
}

export function shopperTokenKey(clientRef) {
  return `shopper_token_${clientRef}`;
}
