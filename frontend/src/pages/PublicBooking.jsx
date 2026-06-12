import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { CircleSlash, ArrowLeft, ShoppingBag, Tag, Package } from "lucide-react";
import { toast } from "sonner";
import { formatErr, resolveMediaUrl } from "../lib/api";
import {
  createPublicCustomerApi, customerTokenKey, loadActiveBookings, saveActiveBooking,
  removeActiveBooking, isActiveBookingStatus, publicApiBase, isCustomPublicHost,
} from "../lib/publicCustomerApi";
import PublicGeneral from "./PublicGeneral";
import PublicSalonDoctor from "./PublicSalonDoctor";

const PLATFORM_HOSTS = new Set(["rpsignage.com", "rpsignage.in", "localhost", "127.0.0.1"]);

function isCustomBookingHost(hostname) {
  return isCustomPublicHost(hostname);
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const text = String(value).trim().toUpperCase();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const period = match[3];
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (period) {
    const upper = String(period).toUpperCase();
    hours = hours % 12 + (upper === "PM" ? 12 : 0);
  }
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes) {
  const safeMinutes = Math.max(0, Math.min(23 * 60 + 59, Number(minutes) || 0));
  const hours24 = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function getTimeMinutesInZone(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timeZone || "Asia/Kolkata",
    }).formatToParts(new Date());
    const hours = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minutes = Number(parts.find((part) => part.type === "minute")?.value || 0);
    return hours * 60 + minutes;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function BookingAuthDialog({ open, onOpenChange, mode, setMode, onLogin, onSignup }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await onSignup(form);
        toast.success("Account created");
      } else {
        await onLogin(form.email, form.password);
        toast.success("Signed in");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "signup" ? "Create account" : "Sign in"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl mt-1" /></div>
            </>
          )}
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl mt-1" /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl mt-1" /></div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button type="submit" disabled={busy} className="w-full rounded-xl bg-[#111827] text-white">{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</Button>
            <button type="button" className="text-sm text-[#007185]" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PublicBooking({ resolvedHost = null }) {
  return <PublicBookingInner resolvedHost={resolvedHost} />;
}

function PublicBookingInner({ resolvedHost = null }) {
  const { clientId: routeClientId } = useParams();
  const [resolvedClientId, setResolvedClientId] = useState(routeClientId || "");
  const branchId = useMemo(() => new URLSearchParams(window.location.search).get("branch_id") || "", []);
  const apiBase = useMemo(() => publicApiBase(resolvedHost), [resolvedHost]);
  const clientId = routeClientId || resolvedClientId;
  const authRef = routeClientId || clientId;
  const customerApi = useMemo(() => (authRef && authRef !== false ? createPublicCustomerApi(authRef, resolvedHost, "providers") : null), [authRef, resolvedHost]);
  const [customer, setCustomer] = useState(null);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [justBooked, setJustBooked] = useState(false);
  const [activeBookings, setActiveBookings] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", preferred_time: "", booking_location: "", booking_device_id: "", service_name: "", service_id: "", service_ids: [], service_price: 0, notes: "" });

  useEffect(() => {
    if (routeClientId) {
      setResolvedClientId(routeClientId);
      return;
    }
    const host = resolvedHost || window.location.hostname;
    if (!isCustomBookingHost(host)) {
      setResolvedClientId(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    axios.get(`${publicApiBase(host)}/resolve-host`, { params: { host } })
      .then(({ data }) => { if (mounted) setResolvedClientId(data?.client_id || false); })
      .catch(() => { if (mounted) setResolvedClientId(false); });
    return () => { mounted = false; };
  }, [routeClientId, resolvedHost]);

  useEffect(() => {
    if (!clientId || clientId === false) {
      setLoading(false);
      setDoc(clientId === false ? false : null);
      return;
    }
    let mounted = true;
    const loadDoc = async () => {
      try {
        const url = branchId
          ? `${apiBase}/providers/${clientId}/branches/${encodeURIComponent(branchId)}`
          : `${apiBase}/providers/${clientId}`;
        const { data } = await axios.get(url);
        if (mounted) setDoc(data);
      } catch {
        if (mounted) setDoc(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    setLoading(true);
    loadDoc();
    const timer = setInterval(loadDoc, 20000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [clientId, branchId, apiBase]);

  const isBookingVertical = doc?.vertical === "doctor" || doc?.vertical === "salon";

  useEffect(() => {
    if (!customerApi || !isBookingVertical) return;
    const token = localStorage.getItem(customerTokenKey(authRef));
    if (!token) {
      setCustomer(false);
      return;
    }
    customerApi.get("/auth/me").then(({ data }) => setCustomer(data)).catch(() => {
      localStorage.removeItem(customerTokenKey(authRef));
      setCustomer(false);
    });
  }, [customerApi, authRef, isBookingVertical]);

  useEffect(() => {
    if (!clientId || !isBookingVertical) return;
    setActiveBookings(loadActiveBookings(clientId, branchId));
  }, [clientId, branchId, isBookingVertical]);

  useEffect(() => {
    if (!customer || customer === false || !customerApi || !isBookingVertical) return;
    (async () => {
      try {
        const params = branchId ? { branch_id: branchId } : {};
        const { data } = await customerApi.get("/my-appointments", { params });
        if (Array.isArray(data) && data.length) {
          data.filter((item) => isActiveBookingStatus(item?.status)).forEach((item) => {
            saveActiveBooking(clientId, branchId, item);
          });
          setActiveBookings(loadActiveBookings(clientId, branchId));
        }
      } catch {}
    })();
  }, [customer, customerApi, clientId, branchId, isBookingVertical]);

  useEffect(() => {
    if (!customer || customer === false || !isBookingVertical) return;
    setForm((prev) => ({
      ...prev,
      patient_name: prev.patient_name || customer.name || "",
      patient_phone: prev.patient_phone || customer.phone || "",
    }));
  }, [customer, isBookingVertical]);

  useEffect(() => {
    if (!clientId || !isBookingVertical) return;
    const refreshAll = async () => {
      const list = loadActiveBookings(clientId, branchId);
      if (!list.length) {
        setActiveBookings([]);
        return;
      }
      const updates = await Promise.all(
        list.map(async (item) => {
          try {
            const { data } = await axios.get(`${apiBase}/providers/${clientId}/appointments/${item.id}`);
            return data || item;
          } catch {
            return item;
          }
        }),
      );
      updates.forEach((item) => {
        if (item?.id && isActiveBookingStatus(item.status)) {
          saveActiveBooking(clientId, branchId, item);
        } else if (item?.id) {
          removeActiveBooking(clientId, branchId, item.id);
        }
      });
      setActiveBookings(loadActiveBookings(clientId, branchId));
    };
    refreshAll();
    const timer = setInterval(refreshAll, 20000);
    return () => clearInterval(timer);
  }, [clientId, branchId, apiBase, isBookingVertical]);

  const handleCustomerLogin = async (email, password) => {
    const { data } = await customerApi.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem(customerTokenKey(authRef), data.access_token);
    setCustomer(data.shopper);
    return data.shopper;
  };

  const handleCustomerSignup = async (payload) => {
    const { data } = await customerApi.post("/auth/signup", payload);
    if (data.access_token) localStorage.setItem(customerTokenKey(authRef), data.access_token);
    setCustomer(data.shopper);
    return data.shopper;
  };

  const handleCustomerLogout = async () => {
    try { await customerApi.post("/auth/logout"); } catch {}
    localStorage.removeItem(customerTokenKey(authRef));
    setCustomer(false);
  };

  const profile = doc?.profile || {};
  const services = useMemo(() => {
    const raw = Array.isArray(profile.services) ? profile.services : [];
    return raw.filter((item) => item?.active !== false);
  }, [profile.services]);

  useEffect(() => {
    if (services.length && !form.service_ids.length && !form.service_id) {
      const first = services[0];
      setForm((prev) => ({ ...prev, service_id: first.id || "", service_ids: first.id ? [first.id] : [], service_name: first.name || prev.service_name, service_price: Number(first.price || 0) }));
    }
  }, [services, form.service_id, form.service_ids.length]);

  const selectedServices = useMemo(() => {
    const selected = services.filter((service) => form.service_ids.includes(service.id));
    if (selected.length) return selected;
    const fallback = services.find((service) => service.id === form.service_id);
    return fallback ? [fallback] : services.slice(0, 1);
  }, [form.service_id, form.service_ids, services]);
  const selectedService = selectedServices[0] || null;
  const selectedServiceDuration = selectedServices.reduce((sum, item) => sum + Math.max(5, Number(item.duration_mins || profile.slot_minutes || 15)), 0) || Math.max(5, Number(profile.slot_minutes || 15));
  const queuePreview = useMemo(() => (Array.isArray(doc?.queue_preview) ? doc.queue_preview : []), [doc?.queue_preview]);
  const bookingDevices = useMemo(() => (Array.isArray(doc?.booking_devices) ? doc.booking_devices : []), [doc?.booking_devices]);
  const bookingLocations = useMemo(() => {
    const fromDoc = Array.isArray(doc?.booking_locations) ? doc.booking_locations : [];
    const fromDevices = bookingDevices.map((item) => String(item.location || "").trim()).filter(Boolean);
    return [...new Set([...fromDoc, ...fromDevices])];
  }, [bookingDevices, doc?.booking_locations]);

  useEffect(() => {
    if (!bookingLocations.length) return;
    if (!form.booking_location) {
      setForm((prev) => ({ ...prev, booking_location: bookingLocations[0] }));
    }
  }, [bookingLocations, form.booking_location]);

  const filteredQueuePreview = useMemo(() => {
    if (!form.booking_location && !form.booking_device_id) return queuePreview;
    return queuePreview.filter((item) => {
      const byDevice = form.booking_device_id ? String(item?.routed_device_id || "") === String(form.booking_device_id) : true;
      const byLocation = form.booking_location ? String(item?.routed_location || "").trim().toLowerCase() === String(form.booking_location || "").trim().toLowerCase() : true;
      return byDevice && byLocation;
    });
  }, [form.booking_device_id, form.booking_location, queuePreview]);

  const currentlyServingToken = useMemo(() => {
    const serving = filteredQueuePreview.find((item) => String(item?.status || "").toLowerCase() === "called") || filteredQueuePreview[0] || null;
    const token = String(serving?.token || "").trim();
    return token || null;
  }, [filteredQueuePreview]);

  const approxWaitMinutes = filteredQueuePreview.reduce((sum, item) => sum + Math.max(5, Number(item?.service_duration_mins || profile.slot_minutes || 15)), 0) + Number(selectedServiceDuration || 15);
  const availableSlots = useMemo(() => {
    const slotMinutes = Math.max(5, Number(selectedServiceDuration || profile.slot_minutes || 15));
    const dayEndMinutes = 24 * 60;
    const occupied = filteredQueuePreview
      .map((item) => {
        const start = parseTimeToMinutes(item.assigned_time || item.preferred_time);
        if (start == null) return null;
        const duration = Math.max(5, Number(item.service_duration_mins || slotMinutes));
        return { start, end: start + duration };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const options = [];
    const seen = new Set();
    const zoneNow = getTimeMinutesInZone(doc?.timezone);
    let cursor = Math.ceil(zoneNow / slotMinutes) * slotMinutes;
    cursor = Math.max(cursor, zoneNow);

    while (options.length < 12 && cursor < dayEndMinutes) {
      const conflict = occupied.find((slot) => cursor < slot.end && cursor + slotMinutes > slot.start);
      if (conflict) {
        cursor = conflict.end;
        continue;
      }
      const label = formatMinutesToTime(cursor);
      if (!seen.has(label)) {
        seen.add(label);
        options.push(label);
      }
      cursor += slotMinutes;
    }

    return options;
  }, [doc?.timezone, filteredQueuePreview, profile.slot_minutes, selectedServiceDuration]);

  useEffect(() => {
    if (!availableSlots.length) {
      if (form.preferred_time) setForm((prev) => ({ ...prev, preferred_time: "" }));
      return;
    }
    if (!form.preferred_time || !availableSlots.includes(form.preferred_time)) {
      setForm((prev) => ({ ...prev, preferred_time: availableSlots[0] }));
    }
  }, [availableSlots, form.preferred_time]);

  const openServiceDetail = (service) => {
    setDetailItem({
      kind: "service",
      id: service.id,
      name: service.name || "Service",
      price: Number(service.price || 0),
      description: service.description || "Premium service details are available here.",
      image_url: service.image_url || profile.image_url || "",
      duration_mins: Number(service.duration_mins || profile.slot_minutes || 15),
      stock: null,
    });
  };

  const openProductDetail = (product) => {
    setDetailItem({
      kind: "product",
      id: product.id,
      name: product.name || "Product",
      price: Number(product.price || 0),
      description: product.description || "Product details are available here.",
      image_url: product.image_url || "",
      stock: Number(product.stock || 0),
    });
  };

  const closeDetail = () => setDetailItem(null);

  const selectServiceForBooking = (service) => {
    setForm((prev) => ({
      ...prev,
      service_id: service.id || "",
      service_ids: service.id ? [service.id] : prev.service_ids,
      service_name: service.name || prev.service_name,
      service_price: Number(service.price || 0),
    }));
  };

  const validateForm = () => {
    if (!String(form.patient_name || "").trim() || String(form.patient_name || "").trim().length < 2) {
      return "Enter a valid name (minimum 2 characters).";
    }
    const phone = normalizePhone(form.patient_phone);
    if (phone.length < 10 || phone.length > 15) {
      return "Enter a valid phone number (10 to 15 digits).";
    }
    if (!form.preferred_time) {
      return "Please select an available slot.";
    }
    if (services.length > 0 && selectedServices.length === 0) {
      return "Please select at least one service.";
    }
    return "";
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const errMsg = validateForm();
      if (errMsg) {
        toast.error(errMsg);
        return;
      }
      const totalPrice = selectedServices.reduce((sum, item) => sum + Number(item?.price || 0), 0);
      const serviceNames = selectedServices.map((item) => item.name).filter(Boolean);
      const payload = {
        ...form,
        service_id: selectedService?.id || form.service_id || "",
        booking_location: form.booking_location || "",
        booking_device_id: form.booking_device_id || "",
        service_ids: selectedServices.map((item) => item.id).filter(Boolean),
        service_name: serviceNames.join(" + ") || form.service_name,
        service_price: Number(totalPrice || form.service_price || 0),
      };
      const url = branchId ? `${apiBase}/providers/${clientId}/branches/${encodeURIComponent(branchId)}/book` : `${apiBase}/providers/${clientId}/book`;
      const token = localStorage.getItem(customerTokenKey(authRef));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(url, payload, { headers, withCredentials: true });
      saveActiveBooking(clientId, branchId, data);
      setActiveBookings(loadActiveBookings(clientId, branchId));
      setConfirmed(data);
      setJustBooked(true);
      toast.success(`Token #${data.token} confirmed`);
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280] font-mono uppercase tracking-widest">Loading...</div>;
  if (!doc) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><CircleSlash className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" /><h2 className="font-display text-2xl font-extrabold">Provider not found</h2><p className="text-sm text-[#6B7280] mt-1">This booking link is invalid.</p></div></div>;

  if (doc.vertical === "retailer" && !resolvedHost && clientId) {
    return <Navigate to={`/store/${encodeURIComponent(routeClientId || clientId)}`} replace />;
  }

  const isOpen = profile.is_open !== false;
  const isSalon = String(doc?.vertical || "").toLowerCase() === "salon";

  if (detailItem && detailItem.kind === "product" && doc.vertical === "retailer") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.12),_transparent_42%),linear-gradient(180deg,#F8FAFC,#EEF2FF)] text-[#111827]">
        <header className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#111827] text-white px-4 sm:px-5 py-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-[#111827] flex items-center justify-center rounded-xl"><ShoppingBag className="w-5 h-5" /></div>
              <div>
                <div className="font-display font-extrabold text-lg tracking-tight">SIGNAGE OS · Storefront</div>
                <div className="text-xs text-white/60 uppercase tracking-[0.2em]">Product details</div>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={closeDetail} className="rounded-xl bg-white/10 text-white border-white/15 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to products
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-start">
            <div className="rounded-[2rem] overflow-hidden border border-white/60 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)]">
              <div className="relative min-h-[420px] bg-[#0F172A]">
                {detailItem.image_url ? <img src={detailItem.image_url} alt={detailItem.name} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_35%),linear-gradient(135deg,#0F172A,#334155)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70">
                    <Tag className="w-3.5 h-3.5" /> Product
                  </div>
                  <h1 className="mt-3 font-display text-4xl md:text-5xl font-extrabold tracking-tighter max-w-2xl">{detailItem.name}</h1>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.25)] lg:sticky lg:top-6">
              <div className="text-[10px] uppercase tracking-[0.4em] text-[#6B7280]">Ecommerce details</div>
              <div className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0F172A]">{detailItem.name}</div>
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.35em] text-[#6B7280]">Price</div>
                  <div className="mt-1 font-display text-3xl font-black text-[#111827]">₹{Number(detailItem.price || 0).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.35em] text-[#6B7280]">Stock</div>
                  <div className="mt-1 font-semibold text-[#111827]">{detailItem.stock ?? "—"}</div>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-[#374151] leading-6">
                <p>{detailItem.description || "Product details are available here."}</p>
              </div>
              <div className="mt-6 flex gap-3">
                <a href={doc.phone ? `tel:${doc.phone}` : "#"} className="flex-1 text-center rounded-2xl py-3 bg-[#111827] text-white font-semibold">Contact seller</a>
                <Button type="button" variant="outline" className="rounded-2xl" onClick={closeDetail}>Close</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Retailer storefront: render product catalog instead of booking form
  if (doc.vertical === "retailer") {
    const products = Array.isArray(doc.products) ? doc.products : [];
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.12),_transparent_42%),linear-gradient(180deg,#F8FAFC,#EEF2FF)] text-[#111827]">
        <header className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#111827] text-white px-4 sm:px-5 py-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-[#111827] flex items-center justify-center rounded-xl"><ShoppingBag className="w-5 h-5" /></div>
              <div>
                <div className="font-display font-extrabold text-lg tracking-tight">SIGNAGE OS · Storefront</div>
                <div className="text-xs text-white/60 uppercase tracking-[0.2em]">Retail catalog</div>
              </div>
            </div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${doc?.profile?.is_open !== false ? "bg-emerald-400/15 border-emerald-300/30 text-emerald-100" : "bg-white/10 border-white/20 text-white/70"}`}>{doc?.profile?.is_open !== false ? "Open" : "Closed"}</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <div className="space-y-6">
            <div className="rounded-[2rem] overflow-hidden border border-white/60 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)]">
              <div className="relative min-h-[220px] bg-[#0F172A]">
                {doc.profile?.image_url ? <img src={doc.profile.image_url} alt={doc.name} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_35%),linear-gradient(135deg,#0F172A,#334155)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/65 mb-2">Store</div>
                  <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tighter max-w-2xl">{doc.name}</h1>
                  {profile.specialty ? <p className="mt-2 max-w-2xl text-sm md:text-base font-semibold text-white/90">{profile.specialty}</p> : null}
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80">{profile.description || "Browse products and contact the seller."}</p>
                  {profile.hours ? <p className="mt-2 text-sm text-white/70">{profile.hours}</p> : null}
                </div>
              </div>
            </div>

            <section>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Products</div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight">Shop</h2>
                </div>
                <div className="text-sm text-[#6B7280]">{products.length} items</div>
              </div>
              {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-10 text-center">
                  <Package className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
                  <h3 className="font-display text-xl font-extrabold tracking-tight">No products yet</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">This store has not published any products yet. Please check back soon.</p>
                </div>
              ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openProductDetail(p)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openProductDetail(p)}
                    className="cursor-pointer text-left rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  >
                    <div className="h-44 bg-[#F8FAFC] relative">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-lg">{p.name}</div>
                      <div className="text-sm text-[#6B7280] mt-1 line-clamp-2">{p.description}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="font-display text-2xl font-extrabold">Rs {Number(p.price || 0).toLocaleString()}</div>
                        <div className="text-sm text-[#6B7280]">{p.stock} in stock</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <a href={doc.phone ? `tel:${doc.phone}` : "#"} onClick={(e) => e.stopPropagation()} className="flex-1 text-center rounded-xl py-2 bg-[#111827] text-white">Contact seller</a>
                        <span className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white">Details</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (doc.vertical === "general") {
    return <PublicGeneral doc={doc} clientId={clientId} apiBase={apiBase} />;
  }

  if (doc.vertical === "society") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="text-center max-w-md">
          <CircleSlash className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h2 className="font-display text-2xl font-extrabold">Public page not available</h2>
          <p className="text-sm text-[#6B7280] mt-2">Society accounts use the resident directory in the client panel.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BookingAuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} setMode={setAuthMode} onLogin={handleCustomerLogin} onSignup={handleCustomerSignup} />
      <PublicSalonDoctor
        doc={doc}
        profile={profile}
        services={services}
        isSalon={isSalon}
        isOpen={isOpen}
        currentlyServingToken={currentlyServingToken}
        approxWaitMinutes={approxWaitMinutes}
        queueLength={doc?.queue_length || filteredQueuePreview.length}
        form={form}
        setForm={setForm}
        submit={submit}
        busy={busy}
        availableSlots={availableSlots}
        bookingLocations={bookingLocations}
        bookingDevices={bookingDevices}
        selectedServices={selectedServices}
        selectedService={selectedService}
        customer={customer}
        onLoginOpen={() => { setAuthMode("login"); setAuthOpen(true); }}
        onSignupOpen={() => { setAuthMode("signup"); setAuthOpen(true); }}
        onLogout={handleCustomerLogout}
        activeBookings={activeBookings}
        detailItem={detailItem}
        openServiceDetail={openServiceDetail}
        closeDetail={closeDetail}
        selectServiceForBooking={selectServiceForBooking}
        justBooked={justBooked}
        confirmed={confirmed}
        setJustBooked={setJustBooked}
        timezone={doc?.timezone}
        clientId={clientId}
        apiBase={apiBase}
        branchId={branchId}
      />
    </>
  );
}
