import axios from "axios";

const PLATFORM_HOSTS = new Set(["rpsignage.com", "rpsignage.in", "localhost", "127.0.0.1"]);

export function isCustomPublicHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host && !PLATFORM_HOSTS.has(host);
}

export function publicApiBase(resolvedHost) {
  if (resolvedHost || isCustomPublicHost(typeof window !== "undefined" ? window.location.hostname : "")) {
    return `${window.location.origin}/api/public`;
  }
  return `${(process.env.REACT_APP_BACKEND_URL || "https://rpsignage.com").replace(/\/$/, "")}/api/public`;
}

export function customerTokenKey(clientRef) {
  return `shopper_token_${clientRef}`;
}

export function createPublicCustomerApi(clientRef, resolvedHost, scope = "providers") {
  const base = `${publicApiBase(resolvedHost)}/${scope}/${encodeURIComponent(clientRef)}`;
  const instance = axios.create({
    baseURL: base,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  instance.interceptors.request.use((cfg) => {
    const t = localStorage.getItem(customerTokenKey(clientRef));
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  return instance;
}

function legacyBookingPersistKey(clientId, branchId = "") {
  return `signage_active_booking_${clientId}_${branchId || "main"}`;
}

export function bookingPersistKey(clientId, branchId = "") {
  return `signage_active_bookings_${clientId}_${branchId || "main"}`;
}

export function isActiveBookingStatus(status) {
  return !["done", "cancelled"].includes(String(status || "").toLowerCase());
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function sortBookings(list) {
  return [...list].sort((a, b) => {
    const tokenDelta = Number(a.token || 0) - Number(b.token || 0);
    if (tokenDelta !== 0) return tokenDelta;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });
}

function normalizeBookingEntry(entry) {
  if (!entry || typeof entry !== "object" || !entry.id) return null;
  return entry;
}

export function loadActiveBookings(clientId, branchId) {
  if (!clientId) return [];
  const today = todayIso();
  const key = bookingPersistKey(clientId, branchId);
  let list = [];

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch {}

  if (!list.length) {
    try {
      const legacyRaw = localStorage.getItem(legacyBookingPersistKey(clientId, branchId));
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && typeof legacy === "object") list = [legacy];
      }
    } catch {}
  }

  const active = sortBookings(
    list
      .map(normalizeBookingEntry)
      .filter(Boolean)
      .filter((item) => item.date === today && isActiveBookingStatus(item.status))
  );

  try {
    if (active.length) {
      localStorage.setItem(key, JSON.stringify(active));
    } else {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(legacyBookingPersistKey(clientId, branchId));
  } catch {}

  return active;
}

export function saveActiveBooking(clientId, branchId, booking) {
  if (!clientId || !booking?.id) return;
  const list = loadActiveBookings(clientId, branchId).filter((item) => item.id !== booking.id);
  if (isActiveBookingStatus(booking.status) && (booking.date || todayIso()) === todayIso()) {
    list.push({ ...booking, date: booking.date || todayIso() });
  }
  localStorage.setItem(bookingPersistKey(clientId, branchId), JSON.stringify(sortBookings(list)));
  localStorage.removeItem(legacyBookingPersistKey(clientId, branchId));
}

export function removeActiveBooking(clientId, branchId, bookingId) {
  if (!clientId || !bookingId) return;
  const list = loadActiveBookings(clientId, branchId).filter((item) => item.id !== bookingId);
  const key = bookingPersistKey(clientId, branchId);
  if (list.length) {
    localStorage.setItem(key, JSON.stringify(list));
  } else {
    localStorage.removeItem(key);
  }
}

export function loadActiveBooking(clientId, branchId) {
  const list = loadActiveBookings(clientId, branchId);
  return list[0] || null;
}

export function clearActiveBooking(clientId, branchId) {
  localStorage.removeItem(bookingPersistKey(clientId, branchId));
  localStorage.removeItem(legacyBookingPersistKey(clientId, branchId));
}
