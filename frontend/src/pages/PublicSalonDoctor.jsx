import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Scissors, Stethoscope, Clock, MapPin, Phone, CalendarCheck, IndianRupee,
  ArrowLeft, Sparkles, Users, Timer, Award,
  ChevronRight, Star, Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { resolveMediaUrl } from "../lib/api";
import { loadActiveBookings } from "../lib/publicCustomerApi";
import { publicSiteUrl } from "../lib/publicSiteUrl";
import PublicTopNav from "../components/PublicTopNav";

function themeFor(isSalon) {
  if (isSalon) {
    return {
      accent: "#BE185D",
      accentSoft: "#FDF2F8",
      accentBorder: "#FBCFE8",
      accentText: "#9D174D",
      heroGradient: "from-[#4C0519] via-[#831843] to-[#9D174D]",
      pageBg: "radial-gradient(circle at top, rgba(190,24,93,0.09), transparent 42%), linear-gradient(180deg, #FFFBFC 0%, #FFF1F2 45%, #FFFBFC 100%)",
      icon: Scissors,
      providerLabel: "Salon & Spa",
      specialtyLabel: "Specialties",
      servicesTitle: "Our services",
      servicesSubtitle: "Browse treatments, pick your slot, and get your queue token instantly.",
      bookTitle: "Book your visit",
      bookSubtitle: "Walk-ins and online bookings share the same live queue.",
      serviceLabel: "service",
      servicesFormLabel: "Services",
      nameLabel: "Your name",
      queueLabel: "In queue",
      queueHint: "Clients waiting",
      priceLabel: "From",
      credentialsTitle: "Our expertise",
      emptyService: "Premium grooming and styling tailored to you.",
      step1: "Choose a service",
      step2: "Pick your time slot",
      step3: "Receive your token",
    };
  }
  return {
    accent: "#0D9488",
    accentSoft: "#F0FDFA",
    accentBorder: "#99F6E4",
    accentText: "#0F766E",
    heroGradient: "from-[#042F2E] via-[#134E4A] to-[#0F766E]",
    pageBg: "radial-gradient(circle at top, rgba(13,148,136,0.09), transparent 42%), linear-gradient(180deg, #F8FAFC 0%, #ECFEFF 45%, #F8FAFC 100%)",
    icon: Stethoscope,
    providerLabel: "Medical clinic",
    specialtyLabel: "Specialization",
    servicesTitle: "Consultations & treatments",
    servicesSubtitle: "Transparent pricing, clear durations, and hassle-free appointment booking.",
    bookTitle: "Book appointment",
    bookSubtitle: "Online and walk-in patients are managed in one unified queue.",
    serviceLabel: "appointment",
    servicesFormLabel: "Consultations",
    nameLabel: "Patient name",
    queueLabel: "In queue",
    queueHint: "Patients waiting",
    priceLabel: "Consultation from",
    credentialsTitle: "Doctor credentials",
    emptyService: "Professional care with clear wait times and live queue updates.",
    step1: "Select consultation",
    step2: "Choose available slot",
    step3: "Get your token",
  };
}

function bookingStatusLabel(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "called") return "Your turn — please proceed";
  if (s === "pending") return "Waiting in queue";
  return status;
}

export function ActiveBookingBanner({ booking, providerName, theme, compact = false }) {
  if (!booking?.token) return null;
  const statusLabel = bookingStatusLabel(booking.status);
  return (
    <div
      className={`rounded-2xl border-2 shadow-lg ${compact ? "p-4" : "p-5"}`}
      style={{ borderColor: theme.accent, background: `linear-gradient(135deg, ${theme.accentSoft}, white)` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accentText }}>
            {compact ? "Active token" : "Your booking today"}
          </div>
          <div className={`font-display font-extrabold tracking-tighter text-[#111827] mt-1 ${compact ? "text-4xl" : "text-5xl"}`}>
            Token #{booking.token}
          </div>
          <p className="text-sm text-[#6B7280] mt-2">
            {providerName} · {booking.assigned_time || booking.preferred_time || "ASAP"}
            {booking.service_name ? ` · ${booking.service_name}` : ""}
            {" · "}<span className="capitalize">{statusLabel}</span>
          </p>
        </div>
        <CalendarCheck className={`shrink-0 ${compact ? "w-9 h-9" : "w-12 h-12"}`} style={{ color: theme.accent }} />
      </div>
    </div>
  );
}

export function ActiveBookingsPanel({ bookings, providerName, theme }) {
  if (!bookings?.length) return null;
  const sorted = [...bookings].sort((a, b) => Number(a.token || 0) - Number(b.token || 0));
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
        Your active tokens today ({sorted.length})
      </div>
      {sorted.length === 1 ? (
        <ActiveBookingBanner booking={sorted[0]} providerName={providerName} theme={theme} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((booking) => (
            <ActiveBookingBanner
              key={booking.id || booking.token}
              booking={booking}
              providerName={providerName}
              theme={theme}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, theme, isSelected, onBook, onView }) {
  const img = resolveMediaUrl(service.image_url);
  return (
    <article
      className={`group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full ${isSelected ? "ring-2" : "border-[#E5E7EB]"}`}
      style={isSelected ? { borderColor: theme.accent, ringColor: theme.accent } : undefined}
    >
      <button type="button" onClick={() => onView(service)} className="text-left flex flex-col flex-1">
        <div className="aspect-[4/3] bg-[#F8FAFC] relative overflow-hidden">
          {img ? (
            <img src={img} alt={service.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.heroGradient} flex items-center justify-center`}>
              <theme.icon className="w-14 h-14 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {service.duration_mins ? (
            <span className="absolute top-3 right-3 bg-white/95 text-[#111827] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> {service.duration_mins} min
            </span>
          ) : null}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-extrabold tracking-tight line-clamp-2">{service.name}</h3>
          <p className="text-sm text-[#6B7280] mt-2 line-clamp-2 flex-1">
            {service.description || theme.emptyService}
          </p>
          {Array.isArray(service.tags) && service.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {service.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: theme.accentSoft, color: theme.accentText }}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-[#F3F4F6]">
            <div className="flex items-baseline gap-0.5">
              <IndianRupee className="w-4 h-4" />
              <span className="font-display text-2xl font-extrabold">{Number(service.price || 0).toLocaleString()}</span>
            </div>
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: theme.accent }}>
              View details <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </button>
      <div className="px-5 pb-5 -mt-1">
        <Button
          type="button"
          onClick={() => onBook(service)}
          className="w-full rounded-xl text-white"
          style={{ background: theme.accent }}
        >
          Book this {theme.serviceLabel}
        </Button>
      </div>
    </article>
  );
}

function StatCard({ label, value, hint, icon: Icon, theme }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">{label}</div>
        {Icon ? <Icon className="w-4 h-4 shrink-0" style={{ color: theme.accent }} /> : null}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-extrabold mt-1 text-[#111827]">{value}</div>
      {hint ? <div className="text-xs text-[#6B7280] mt-1">{hint}</div> : null}
    </div>
  );
}

function computeQueueSnapshot(queuePreview, userToken) {
  const userNum = Number(userToken);
  const active = (queuePreview || []).filter((item) => ["pending", "called"].includes(String(item?.status || "").toLowerCase()));
  const sorted = [...active].sort((a, b) => Number(a.token || 0) - Number(b.token || 0));
  const serving = sorted.find((item) => String(item?.status || "").toLowerCase() === "called") || null;
  const nowServing = serving?.token != null ? Number(serving.token) : null;
  const pending = sorted.filter((item) => String(item?.status || "").toLowerCase() === "pending");
  const nextToken = pending.find((item) => nowServing == null || Number(item.token) > nowServing)?.token ?? pending[0]?.token ?? null;
  const ahead = sorted.filter((item) => Number(item.token) < userNum && String(item?.status || "").toLowerCase() === "pending");
  const waitlist = sorted.filter((item) => Number(item.token) > userNum);
  const position = ahead.length + (String(serving?.token) === String(userToken) ? 0 : 1);
  return { sorted, nowServing, nextToken, ahead, waitlist, position, serving };
}

function BookingQueueStatusView({ confirmed, doc, theme, isSalon, onBack, clientId, apiBase, branchId, activeBookings = [] }) {
  const [liveDoc, setLiveDoc] = useState(doc);
  const [bookings, setBookings] = useState(() => {
    const map = new Map();
    [...activeBookings, confirmed].filter(Boolean).forEach((item) => {
      if (item?.id) map.set(item.id, item);
    });
    return [...map.values()].sort((a, b) => Number(a.token || 0) - Number(b.token || 0));
  });
  const booking = bookings.find((item) => item.id === confirmed?.id) || confirmed;
  const userToken = booking?.token ?? confirmed?.token;
  const userTokens = useMemo(
    () => new Set(bookings.map((item) => Number(item.token)).filter((n) => Number.isFinite(n))),
    [bookings],
  );

  useEffect(() => {
    if (!clientId || !apiBase) return undefined;
    const fetchLive = async () => {
      try {
        const url = branchId
          ? `${apiBase}/providers/${encodeURIComponent(clientId)}/branches/${encodeURIComponent(branchId)}`
          : `${apiBase}/providers/${encodeURIComponent(clientId)}`;
        const { data } = await axios.get(url);
        setLiveDoc(data);
      } catch {}
      const stored = loadActiveBookings(clientId, branchId);
      const ids = [...new Set([...stored.map((b) => b.id), confirmed?.id].filter(Boolean))];
      if (!ids.length) return;
      const refreshed = await Promise.all(
        ids.map(async (id) => {
          try {
            const { data } = await axios.get(`${apiBase}/providers/${encodeURIComponent(clientId)}/appointments/${id}`);
            return data;
          } catch {
            return stored.find((b) => b.id === id) || null;
          }
        }),
      );
      const active = refreshed
        .filter((item) => item && !["done", "cancelled"].includes(String(item.status || "").toLowerCase()))
        .sort((a, b) => Number(a.token || 0) - Number(b.token || 0));
      if (active.length) setBookings(active);
    };
    fetchLive();
    const timer = setInterval(fetchLive, 15000);
    return () => clearInterval(timer);
  }, [clientId, apiBase, branchId, confirmed?.id]);

  const queuePreview = Array.isArray(liveDoc?.queue_preview) ? liveDoc.queue_preview : [];
  const snap = useMemo(() => computeQueueSnapshot(queuePreview, userToken), [queuePreview, userToken]);
  const status = String(booking?.status || "pending").toLowerCase();
  const statusLabel = status === "called"
    ? (isSalon ? "Your turn — please proceed to the salon" : "Your turn — please proceed to the clinic")
    : status === "pending"
      ? `Waiting — ${snap.ahead.length} token${snap.ahead.length === 1 ? "" : "s"} ahead of you`
      : status;

  return (
    <div className="min-h-screen text-[#111827]" style={{ background: theme.pageBg }}>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-[#E5E7EB]/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">Live queue status</div>
            <div className="font-display font-extrabold text-lg">{liveDoc?.name || doc?.name}</div>
          </div>
          <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">Back</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-lg text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-2">
            {bookings.length > 1 ? "Latest token" : "Your token"}
          </div>
          <div className="font-display text-7xl sm:text-8xl font-extrabold tracking-tighter" style={{ color: theme.accent }}>#{userToken}</div>
          <p className="mt-4 text-sm text-[#6B7280] capitalize">{statusLabel}</p>
          <p className="mt-2 text-sm text-[#374151]">
            Scheduled: <strong>{booking?.assigned_time || booking?.preferred_time || confirmed?.assigned_time || confirmed?.preferred_time || "ASAP"}</strong>
          </p>
          {booking?.service_name ? (
            <p className="mt-1 text-sm text-[#6B7280]">{booking.service_name}</p>
          ) : null}
        </section>

        {bookings.length > 1 ? (
          <section className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-3">All your active tokens</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bookings.map((item) => {
                const isLatest = String(item.id) === String(confirmed?.id);
                return (
                  <div
                    key={item.id || item.token}
                    className={`rounded-xl border p-4 text-left ${isLatest ? "ring-2" : ""}`}
                    style={isLatest ? { borderColor: theme.accent, background: theme.accentSoft, ringColor: theme.accent } : { borderColor: "#E5E7EB" }}
                  >
                    <div className="font-display text-3xl font-extrabold" style={{ color: theme.accent }}>#{item.token}</div>
                    <p className="text-sm text-[#374151] mt-1">{item.service_name || theme.serviceLabel}</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {item.assigned_time || item.preferred_time || "ASAP"} · <span className="capitalize">{bookingStatusLabel(item.status)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Now serving</div>
            <div className="font-display text-4xl font-extrabold mt-2" style={{ color: theme.accent }}>
              {snap.nowServing != null ? `#${snap.nowServing}` : "—"}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Currently being processed</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Next token</div>
            <div className="font-display text-4xl font-extrabold mt-2 text-[#111827]">
              {snap.nextToken != null ? `#${snap.nextToken}` : "—"}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Up next in queue</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Your position</div>
            <div className="font-display text-4xl font-extrabold mt-2 text-[#111827]">
              {status === "called" ? "Now" : snap.ahead.length > 0 ? `#${snap.ahead.length + 1}` : "Next"}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">{snap.ahead.length} ahead of you</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Waitlist</div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Live queue</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updates every 15 sec
            </div>
          </div>

          {snap.sorted.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-6 text-center">Queue is empty right now.</p>
          ) : (
            <div className="space-y-2">
              {snap.sorted.map((item) => {
                const tokenNum = Number(item.token);
                const isYou = userTokens.has(tokenNum);
                const isServing = String(item.status || "").toLowerCase() === "called";
                return (
                  <div
                    key={`${item.token}-${item.patient_name || ""}`}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isYou ? "ring-2" : ""}`}
                    style={isYou ? { borderColor: theme.accent, background: theme.accentSoft, ringColor: theme.accent } : { borderColor: "#E5E7EB", background: isServing ? "#F9FAFB" : "white" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-display text-2xl font-extrabold shrink-0">#{item.token}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{item.service_name || theme.serviceLabel}</div>
                        <div className="text-xs text-[#6B7280]">{item.assigned_time || item.preferred_time || "ASAP"}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isYou ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white" style={{ background: theme.accent }}>You</span>
                      ) : isServing ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Serving</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Waiting</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {snap.waitlist.length > 0 ? (
            <p className="mt-4 text-xs text-[#6B7280]">
              {snap.waitlist.length} token{snap.waitlist.length === 1 ? "" : "s"} booked after you.
            </p>
          ) : null}
        </section>

        <p className="text-center text-xs text-[#6B7280]">
          Keep this page open — your token status refreshes automatically. You can also return anytime from the booking link.
        </p>
      </main>
    </div>
  );
}

function ServiceDetailView({ detailItem, profile, doc, theme, onBack, onBook }) {
  const img = resolveMediaUrl(detailItem.image_url);
  return (
    <div className="min-h-screen text-[#111827]" style={{ background: theme.pageBg }}>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b border-[#E5E7EB]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#374151] hover:text-[#111827]">
            <ArrowLeft className="w-4 h-4" /> Back to services
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">{doc.name}</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-[2rem] overflow-hidden border border-[#E5E7EB] bg-white shadow-lg">
            <div className="relative min-h-[360px] sm:min-h-[420px] bg-[#0F172A]">
              {img ? (
                <img src={img} alt={detailItem.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.heroGradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/80">
                  <Clock className="w-3.5 h-3.5" /> {detailItem.duration_mins || profile.slot_minutes || 30} min
                </span>
                <h1 className="mt-4 font-display text-4xl sm:text-5xl font-extrabold tracking-tighter">{detailItem.name}</h1>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-lg lg:sticky lg:top-24">
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#6B7280]">Service overview</div>
            <p className="mt-4 text-[#374151] leading-relaxed">{detailItem.description || theme.emptyService}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Price</div>
                <div className="mt-1 font-display text-3xl font-extrabold flex items-baseline gap-0.5">
                  <IndianRupee className="w-5 h-5" />
                  {Number(detailItem.price || 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Duration</div>
                <div className="mt-1 font-display text-3xl font-extrabold">{detailItem.duration_mins || profile.slot_minutes || 30}<span className="text-base font-semibold ml-1">min</span></div>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => onBook(detailItem)}
              className="w-full mt-8 rounded-2xl text-white h-12 text-base font-semibold"
              style={{ background: theme.accent }}
            >
              Book this {theme.serviceLabel}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PublicSalonDoctor({
  doc,
  profile,
  services,
  isSalon,
  isOpen,
  currentlyServingToken,
  approxWaitMinutes,
  queueLength,
  form,
  setForm,
  submit,
  busy,
  availableSlots,
  bookingLocations,
  bookingDevices,
  selectedServices,
  selectedService,
  customer,
  onLoginOpen,
  onSignupOpen,
  onLogout,
  activeBookings,
  detailItem,
  openServiceDetail,
  closeDetail,
  selectServiceForBooking,
  justBooked,
  confirmed,
  setJustBooked,
  timezone,
  clientId,
  resolvedHost = null,
  apiBase,
  branchId,
}) {
  const theme = themeFor(isSalon);
  const BrandIcon = theme.icon;
  const bookingRef = useRef(null);
  const coverImg = resolveMediaUrl(profile.image_url);
  const minPrice = services.length
    ? Math.min(...services.map((s) => Number(s.price || 0)))
    : Number(profile.fee || 0);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBookService = (service) => {
    selectServiceForBooking(service);
    closeDetail();
    setTimeout(scrollToBooking, 100);
  };

  if (justBooked && confirmed) {
    return (
      <BookingQueueStatusView
        confirmed={confirmed}
        doc={doc}
        theme={theme}
        isSalon={isSalon}
        onBack={() => setJustBooked(false)}
        clientId={clientId}
        apiBase={apiBase}
        branchId={branchId}
        activeBookings={activeBookings}
      />
    );
  }

  if (detailItem?.kind === "service") {
    return (
      <ServiceDetailView
        detailItem={detailItem}
        profile={profile}
        doc={doc}
        theme={theme}
        onBack={closeDetail}
        onBook={handleBookService}
      />
    );
  }

  const totalSelectedPrice = selectedServices.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <div className="min-h-screen text-[#111827]" style={{ background: theme.pageBg }}>
      <PublicTopNav
        title={doc.name}
        subtitle={theme.providerLabel}
        siteUrl={publicSiteUrl(clientId, { resolvedHost, vertical: doc?.vertical })}
        siteName={doc.name}
        user={customer}
        onSignIn={onLoginOpen}
        onLogout={onLogout}
        brandIcon={coverImg ? (
          <img src={coverImg} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-md bg-white" />
        ) : (
          <div className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md" style={{ background: theme.accent }}>
            <BrandIcon className="w-5 h-5" />
          </div>
        )}
        trailing={(
          <>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${isOpen ? "" : "bg-gray-100 text-gray-600 border-gray-200"}`}
              style={isOpen ? { background: theme.accentSoft, color: theme.accentText, borderColor: theme.accentBorder } : undefined}
            >
              {isOpen ? "Open now" : "Closed"}
            </span>
            <Button type="button" size="sm" onClick={scrollToBooking} className="rounded-xl text-white hidden sm:inline-flex" style={{ background: theme.accent }}>
              Book now
            </Button>
          </>
        )}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      {activeBookings?.length > 0 ? (
          <div className="pt-6">
            <ActiveBookingsPanel bookings={activeBookings} providerName={doc.name} theme={theme} />
          </div>
        ) : null}

        {/* Hero */}
        <section className="pt-8">
          <div className="rounded-[2rem] overflow-hidden border border-white/70 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)]">
            <div className="relative min-h-[300px] sm:min-h-[380px]">
              {coverImg ? (
                <img src={coverImg} alt={doc.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.heroGradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/65 mb-2">{theme.providerLabel}</div>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white max-w-3xl">{doc.name}</h1>
                {profile.specialty ? (
                  <p className="mt-3 text-lg sm:text-xl font-semibold text-white/95 max-w-2xl">
                    <span className="text-white/60 text-sm font-medium uppercase tracking-wider mr-2">{theme.specialtyLabel}:</span>
                    {profile.specialty}
                  </p>
                ) : null}
                {profile.qualifications && !isSalon ? (
                  <p className="mt-2 text-sm text-white/80 flex items-center gap-2 max-w-2xl">
                    <Award className="w-4 h-4 shrink-0" /> {profile.qualifications}
                  </p>
                ) : null}
                <p className="mt-4 text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
                  {profile.description || (isSalon ? "Expert stylists, premium products, and a relaxing experience from walk-in to finish." : "Trusted medical care with transparent wait times and seamless online booking.")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={scrollToBooking} className="rounded-xl text-white h-11 px-6" style={{ background: theme.accent }}>
                    Book {theme.serviceLabel}
                  </Button>
                  {doc.phone ? (
                    <a href={`tel:${doc.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur px-5 h-11 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                      <Phone className="w-4 h-4" /> {isSalon ? "Call salon" : "Call clinic"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live stats */}
        {/* Live Queue Status - Responsive: Mobile Left/Right, Desktop 4-Column */}
<section className="mt-8">
  {/* Mobile View (shows on screens < lg) */}
  <div className="block lg:hidden">
    <div className="bg-white  border border-[#E5E7EB] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">QUEUE STATUS</div>
      </div>

      {/* Now Serving - Left label, Right token */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-[#E5E7EB]">
        <div className="text-[15px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">NOW SERVING</div>
        <div className="font-display text-5xl font-extrabold" style={{ color: "#D97706" }}>
          {currentlyServingToken ? `${currentlyServingToken}` : "—"}
        </div>
      </div>

      {/* Next Token - Left label, Right token */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-[#E5E7EB] bg-[#FFFBEB]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">NEXT</div>
        <div className="font-display text-4xl font-extrabold text-[#111827]">
          {queueLength > 0 && currentlyServingToken ? `${Number(currentlyServingToken) + 1}` : "—"}
        </div>
      </div>

      {/* Waiting List - Left label, Right count */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">WAITING LIST</div>
        <div className="font-display text-4xl font-extrabold text-[#111827]">
          {queueLength || 0}
        </div>
      </div>
    </div>

    {/* Estimated wait time for mobile */}
    {approxWaitMinutes > 0 && (
      <div className="mt-4 flex items-center justify-between bg-amber-50  border border-amber-200 px-5 py-3">
        <div className="text-sm font-medium text-amber-800">⏱️ Estimated wait</div>
        <div className="text-lg font-bold text-amber-900">~{approxWaitMinutes} min</div>
      </div>
    )}
  </div>

  {/* Desktop View (shows on lg screens and above) */}
  <div className="hidden lg:grid lg:grid-cols-4 gap-3 sm:gap-4">
    <StatCard label="Now serving" value={currentlyServingToken ? `#${currentlyServingToken}` : "—"} hint="Live queue token" icon={Users} theme={theme} />
    <StatCard label="Est. wait" value={`~${approxWaitMinutes}m`} hint="Updates every 20 sec" icon={Timer} theme={theme} />
    <StatCard label={theme.queueLabel} value={queueLength || 0} hint={theme.queueHint} icon={Users} theme={theme} />
    <StatCard label={theme.priceLabel} value={`₹${minPrice.toLocaleString()}`} hint={isSalon ? "Starting service price" : "Starting consultation fee"} icon={IndianRupee} theme={theme} />
  </div>
</section>

        {/* Contact strip */}
        {(doc.phone || doc.address || profile.hours) && (
          <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {doc.phone ? (
              <a href={`tel:${doc.phone}`} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <Phone className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Phone</div>
                  <div className="text-sm font-semibold mt-0.5">{doc.phone}</div>
                </div>
              </a>
            ) : null}
            {doc.address ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-start gap-3 shadow-sm">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.accent }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Location</div>
                  <div className="text-sm mt-0.5 leading-relaxed">{doc.address}</div>
                </div>
              </div>
            ) : null}
            {profile.hours ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-3 shadow-sm">
                <Clock className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Hours</div>
                  <div className="text-sm font-semibold mt-0.5">{profile.hours}</div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* How it works */}
        <section className="mt-10 rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Simple process</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">How booking works</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: theme.step1, text: "Explore services with photos, prices, and durations." },
              { step: "02", title: theme.step2, text: "Pick a free slot that fits your schedule." },
              { step: "03", title: theme.step3, text: "Get an instant token — same queue as walk-ins." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="font-display text-3xl font-extrabold" style={{ color: theme.accent }}>{item.step}</div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services grid + booking form */}
        <section className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Catalog</div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{theme.servicesTitle}</h2>
                <p className="text-sm text-[#6B7280] mt-2 max-w-xl">{theme.servicesSubtitle}</p>
              </div>
              <div className="text-sm font-medium text-[#6B7280]">{services.length} available</div>
            </div>

            {!isOpen ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
                <h3 className="font-display text-xl font-extrabold text-amber-900">Currently closed</h3>
                <p className="text-sm text-amber-800 mt-2">Please check hours or call us directly.</p>
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
                <Sparkles className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
                <h3 className="font-display text-xl font-extrabold">Services coming soon</h3>
                <p className="text-sm text-[#6B7280] mt-2">New offerings will appear here shortly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    theme={theme}
                    isSelected={form.service_ids.includes(service.id)}
                    onBook={handleBookService}
                    onView={openServiceDetail}
                  />
                ))}
              </div>
            )}

            {profile.qualifications ? (
              <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 flex items-start gap-3">
                <Star className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.accent }} />
                <div>
                  <div className="font-semibold">{theme.credentialsTitle}</div>
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{profile.qualifications}</p>
                </div>
              </div>
            ) : null}
          </div>

          <form
            ref={bookingRef}
            id="booking-form"
            onSubmit={submit}
            className="lg:sticky lg:top-24 bg-white border border-[#E5E7EB] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.25)] rounded-[2rem] p-5 sm:p-7"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">{theme.bookTitle}</div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tighter">Get your token</h2>
            <p className="text-sm text-[#6B7280] mt-2 mb-6">{theme.bookSubtitle}</p>

            {selectedServices.length > 0 ? (
              <div className="mb-5 rounded-2xl border p-4" style={{ borderColor: theme.accentBorder, background: theme.accentSoft }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.accentText }}>Selected</div>
                <div className="mt-1 text-sm font-semibold">{selectedServices.map((s) => s.name).join(" + ")}</div>
                <div className="mt-2 font-display text-xl font-extrabold">₹{totalSelectedPrice.toLocaleString()}</div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">{theme.nameLabel}</Label>
                <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} required className="rounded-xl mt-1" data-testid="book-name" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Phone</Label>
                <Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} required className="rounded-xl mt-1" data-testid="book-phone" />
                <p className="mt-1 text-xs text-[#6B7280]">Used as your booking reference.</p>
              </div>

              {bookingLocations.length > 0 ? (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Location</Label>
                  <select
                    value={form.booking_location || ""}
                    onChange={(e) => setForm({ ...form, booking_location: e.target.value, booking_device_id: "" })}
                    className="w-full h-11 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm mt-1"
                  >
                    <option value="">Default location</option>
                    {bookingLocations.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
              ) : null}

              {bookingDevices.length > 0 ? (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Screen (optional)</Label>
                  <select
                    value={form.booking_device_id || ""}
                    onChange={(e) => setForm({ ...form, booking_device_id: e.target.value })}
                    className="w-full h-11 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm mt-1"
                  >
                    <option value="">Auto route by location</option>
                    {bookingDevices
                      .filter((item) => !form.booking_location || String(item.location || "") === String(form.booking_location || ""))
                      .map((item) => (
                        <option key={item.id} value={item.id}>{item.name}{item.location ? ` · ${item.location}` : ""}</option>
                      ))}
                  </select>
                </div>
              ) : null}

              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Available slot</Label>
                <select
                  value={form.preferred_time}
                  onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm mt-1"
                >
                  {availableSlots.length === 0 ? <option value="">No slots available</option> : null}
                  {availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
                <p className="mt-2 text-xs text-[#6B7280]">Timezone: {timezone || "Asia/Kolkata"}</p>
              </div>

              {services.length > 0 ? (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">{theme.servicesFormLabel}</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#D1D5DB] bg-white p-2 space-y-1">
                    {services.map((service) => {
                      const checked = form.service_ids.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer border transition-colors ${checked ? "" : "border-transparent hover:bg-[#F9FAFB]"}`}
                          style={checked ? { borderColor: theme.accent, background: theme.accentSoft } : undefined}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...new Set([...form.service_ids, service.id])]
                                  : form.service_ids.filter((sid) => sid !== service.id);
                                const selectedItems = services.filter((item) => next.includes(item.id));
                                setForm((prev) => ({
                                  ...prev,
                                  service_ids: next,
                                  service_id: next[0] || "",
                                  service_name: selectedItems.map((item) => item.name).join(" + "),
                                  service_price: selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
                                }));
                              }}
                            />
                            <span className="text-sm truncate">{service.name}</span>
                          </span>
                          <span className="text-sm font-semibold shrink-0">₹{Number(service.price || 0).toLocaleString()}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">{theme.servicesFormLabel}</Label>
                  <Input
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                    placeholder={isSalon ? "Haircut, styling..." : "General consultation"}
                    className="rounded-xl mt-1"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Note (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-xl mt-1" data-testid="book-notes" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy || !isOpen}
              className="w-full mt-6 rounded-xl text-white h-12 text-base font-semibold shadow-lg"
              style={{ background: isOpen ? theme.accent : "#9CA3AF" }}
              data-testid="book-submit"
            >
              {busy ? "Booking..." : isOpen ? "Confirm booking →" : "Currently closed"}
            </Button>
            <p className="mt-4 text-xs text-[#6B7280] text-center">You&apos;ll receive a token after confirmation.</p>
          </form>
        </section>

        {/* Footer */}
        <footer className="mt-16 rounded-2xl text-white p-8 sm:p-10" style={{ background: `linear-gradient(135deg, #111827, ${isSalon ? "#831843" : "#134E4A"})` }}>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">{doc.name}</h3>
              <p className="text-white/75 text-sm mt-2 leading-relaxed max-w-md">
                {profile.description || (isSalon ? "Your destination for premium salon services." : "Professional healthcare with a patient-first approach.")}
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/85">
              {doc.phone ? <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {doc.phone}</div> : null}
              {doc.address ? <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {doc.address}</div> : null}
              {profile.hours ? <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {profile.hours}</div> : null}
              {profile.specialty ? <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {theme.specialtyLabel}: {profile.specialty}</div> : null}
              {profile.qualifications && !isSalon ? <div className="flex items-center gap-2"><Award className="w-4 h-4" /> {profile.qualifications}</div> : null}
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={scrollToBooking}
        className="fixed bottom-6 right-6 z-50 sm:hidden rounded-full text-white px-5 h-12 shadow-xl font-semibold text-sm flex items-center gap-2"
        style={{ background: theme.accent }}
      >
        <CalendarCheck className="w-4 h-4" /> Book
      </button>
    </div>
  );
}
