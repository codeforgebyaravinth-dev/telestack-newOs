import axios from "axios";

const RAW_BASE = (process.env.REACT_APP_BACKEND_URL || "https://rpsignage.com").replace(/\/$/, "");
const BASE = RAW_BASE.replace(/\/api$/, "");
export const API_BASE = `${BASE}/api`;

/** Turn stored media paths into absolute backend URLs for <img src>. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^data:/i.test(trimmed)) return trimmed;

  const serveMatch = trimmed.match(/\/api\/media\/serve\/([^/?#]+)/i);
  if (serveMatch) {
    return `${API_BASE}/media/serve/${serveMatch[1]}`;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.startsWith("/")) return `${BASE}${trimmed}`;
  return `${BASE}/${trimmed}`;
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// attach token from localStorage as Bearer fallback (works if cookies blocked)
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("access_token");
  if (t) cfg.headers["Authorization"] = `Bearer ${t}`;
  return cfg;
});

export function formatErr(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
