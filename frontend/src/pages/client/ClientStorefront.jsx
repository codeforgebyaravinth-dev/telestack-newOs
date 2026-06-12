import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatErr, resolveMediaUrl, API_BASE } from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Pencil, Trash2, Stethoscope, Package, Building, Copy, Scissors, Megaphone, X, ShoppingCart, FolderTree, Images, ArrowUp, ArrowDown, GraduationCap, Search } from "lucide-react";
import { Checkbox } from "../../components/ui/checkbox";
import GeneralStorefrontPanel from "./GeneralStorefrontPanel";
import { toast } from "sonner";

function ServicePanel({ vertical, label, icon: Icon }) {
  const profileKey = `${vertical}_profile`;
  const emptyProfile = useMemo(() => ({ specialty: "", qualifications: "", fee: 0, hours: "", is_open: true, image_url: "", description: "", slot_minutes: 15, services: [] }), []);
  const [profile, setProfile] = useState(emptyProfile);
  const [apts, setApts] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [devices, setDevices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [me, setMe] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceIndex, setServiceIndex] = useState(null);
  const [serviceForm, setServiceForm] = useState({ id: "", name: "", price: 0, duration_mins: 30, description: "", image_url: "", active: true });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ patient_name: "", patient_phone: "", preferred_time: "", booking_location: "", booking_device_id: "", service_id: "", service_ids: [], notes: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showPastBookings, setShowPastBookings] = useState(false);

  const title = label === "Salon" ? "Salon profile" : "Clinic profile";
  const bookingCta = label === "Salon" ? "Book service" : "Book appointment";
  const services = Array.isArray(profile.services) ? profile.services : [];
  const servingQueue = useMemo(() => liveQueue.filter((item) => String(item.status || "").toLowerCase() === "called").slice(0, 3), [liveQueue]);
  const visibleAppointments = useMemo(() => {
    if (showPastBookings) return apts;
    return todayBookings;
  }, [apts, showPastBookings, todayBookings]);
  const pastCount = Math.max(0, apts.length - todayBookings.length);

  const sortAppointments = useCallback((appointments = []) => {
    const rank = (status) => ({ called: 0, pending: 1, done: 2, cancelled: 3 }[status || ""] ?? 9);
    return [...appointments].sort((a, b) => {
      const statusDelta = rank(a.status) - rank(b.status);
      if (statusDelta !== 0) return statusDelta;
      const tokenDelta = Number(a.token || 0) - Number(b.token || 0);
      if (tokenDelta !== 0) return tokenDelta;
      return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    });
  }, []);

  const load = useCallback(async (branchIdOverride = null) => {
    try {
      const branchId = branchIdOverride ?? selectedBranch?.id ?? "";
      const branchQuery = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : "";
      const [m, board, d, br] = await Promise.all([
        api.get("/client/me"),
        api.get(`/client/${vertical}/appointments/board${branchQuery}`),
        api.get(`/client/devices${branchQuery}`),
        api.get('/client/branches'),
      ]);
      setMe(m.data);
      setApts(sortAppointments(board.data?.recent_bookings || []));
      setTodayBookings(sortAppointments(board.data?.today_bookings || []));
      setLiveQueue(sortAppointments(board.data?.live_queue || []));
      setDevices(Array.isArray(d.data) ? d.data : []);
      const uniqueBranches = Array.from(new Map((Array.isArray(br.data) ? br.data : []).filter(Boolean).map((branch) => [branch.id, branch])).values());
      setBranches(uniqueBranches);
      const branchInState = selectedBranch?.id ? uniqueBranches.find((branch) => branch.id === selectedBranch.id) || null : null;
      const nextBranch = branchInState || (selectedBranch?.id ? null : selectedBranch);

      const clientProfile = m.data?.[profileKey] || {};
      const branchProfileType = nextBranch?.profile_type || "";
      const branchProfileRaw = nextBranch?.profile || {};
      const branchProfile = branchProfileType && branchProfileType !== profileKey ? {} : branchProfileRaw;
      const mergedProfile = branchId
        ? { ...emptyProfile, ...clientProfile, ...branchProfile }
        : { ...emptyProfile, ...clientProfile };
      setProfile({
        ...mergedProfile,
        services: Array.isArray(mergedProfile.services) ? mergedProfile.services : [],
      });
    } catch {}
  }, [profileKey, vertical, emptyProfile, sortAppointments, selectedBranch]);
  useEffect(() => {
    setProfile(emptyProfile);
    setApts([]);
    setTodayBookings([]);
    setLiveQueue([]);
    setSelectedBranch(null);
  }, [vertical, profileKey, emptyProfile]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const branchQuery = activeBranchId ? `?branch_id=${encodeURIComponent(activeBranchId)}` : "";
      await api.put(`/client/${vertical}/profile${branchQuery}`, profile);
      toast.success(`${label} profile saved`);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const setStatus = async (aid, status) => {
    try {
      await api.post(`/client/${vertical}/appointments/${aid}/status?status=${status}`);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const openServiceEditor = (item = null, index = null) => {
    setServiceIndex(index);
    setServiceForm(item ? { id: item.id || `svc-${Date.now()}`, name: item.name || "", price: item.price || 0, duration_mins: item.duration_mins || 30, description: item.description || "", image_url: item.image_url || "", active: item.active !== false, tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || "") } : { id: `svc-${Date.now()}`, name: "", price: 0, duration_mins: 30, description: "", image_url: "", active: true, tags: "" });
    setServiceOpen(true);
  };

  const saveService = (e) => {
    e.preventDefault();
    const next = [...services];
    const payload = { ...serviceForm, price: Number(serviceForm.price || 0), duration_mins: Math.max(5, parseInt(serviceForm.duration_mins || 30, 10)), active: !!serviceForm.active };
    // normalize tags to array on save
    if (typeof payload.tags === "string") payload.tags = payload.tags.split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
    if (serviceIndex === null) next.push(payload);
    else next[serviceIndex] = { ...(next[serviceIndex] || {}), ...payload, id: next[serviceIndex]?.id || payload.id };
    const nextProfile = { ...profile, services: next };
    setProfile(nextProfile);
    setServiceOpen(false);
    api.put(`/client/${vertical}/profile${activeBranchId ? `?branch_id=${encodeURIComponent(activeBranchId)}` : ""}`, nextProfile)
      .then(() => {
        toast.success(serviceIndex === null ? `${label} service added` : `${label} service updated`);
        load();
      })
      .catch((e) => {
        toast.error(formatErr(e.response?.data?.detail));
      });
  };

  const removeService = (index) => {
    const next = services.filter((_, i) => i !== index);
    const nextProfile = { ...profile, services: next };
    setProfile(nextProfile);
    api.put(`/client/${vertical}/profile${activeBranchId ? `?branch_id=${encodeURIComponent(activeBranchId)}` : ""}`, nextProfile)
      .then(() => {
        toast.success(`${label} service removed`);
        load();
      })
      .catch((e) => {
        toast.error(formatErr(e.response?.data?.detail));
      });
  };

  const uploadServiceImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setServiceForm((prev) => ({ ...prev, image_url: data.public_url || `${API_BASE}${data.url || ""}` }));
      toast.success("Service image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadCoverImage = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", "cover");
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const newProfile = { ...profile, image_url: data.public_url || (data.url ? `${API_BASE}${data.url}` : profile.image_url) };
      setProfile(newProfile);
      // persist immediately
      await api.put(`/client/${vertical}/profile${activeBranchId ? `?branch_id=${encodeURIComponent(activeBranchId)}` : ""}`, newProfile);
      toast.success("Cover image uploaded and saved");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingCover(false);
    }
  };

  const openManualBooking = () => {
    const firstServiceId = services[0]?.id || "";
    const firstDevice = devices[0] || null;
    setManualForm({
      patient_name: "",
      patient_phone: "",
      preferred_time: "",
      booking_location: firstDevice?.location || "",
      booking_device_id: firstDevice?.id || "",
      service_id: firstServiceId,
      service_ids: firstServiceId ? [firstServiceId] : [],
      notes: "",
    });
    setManualOpen(true);
  };

  const submitManualBooking = async (e) => {
    e.preventDefault();
    try {
      const selected = services.filter((item) => manualForm.service_ids.includes(item.id));
      const fallback = selected.length ? selected : (services.find((item) => item.id === manualForm.service_id) ? [services.find((item) => item.id === manualForm.service_id)] : (services[0] ? [services[0]] : []));
      await api.post(`/client/${vertical}/appointments${activeBranchId ? `?branch_id=${encodeURIComponent(activeBranchId)}` : ""}`, {
        patient_name: manualForm.patient_name,
        patient_phone: manualForm.patient_phone,
        preferred_time: manualForm.preferred_time,
        booking_location: manualForm.booking_location || "",
        booking_device_id: manualForm.booking_device_id || "",
        notes: manualForm.notes,
        service_id: fallback[0]?.id || manualForm.service_id || "",
        service_ids: fallback.map((item) => item.id).filter(Boolean),
        service_name: fallback.map((item) => item?.name).filter(Boolean).join(" + ") || "Walk-in booking",
        service_price: fallback.reduce((sum, item) => sum + Number(item?.price || 0), 0),
        source: "manual",
      });
      toast.success("Walk-in booking added");
      setManualOpen(false);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const bookingSlug = useMemo(() => {
    if (!me) return "";
    const base = String(me.public_booking_slug || me.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    return base || me.id;
  }, [me]);
  const bookingUrl = useMemo(() => {
    const branchQuery = selectedBranch?.id ? `?branch_id=${encodeURIComponent(selectedBranch.id)}` : "";
    if (me?.custom_booking_domain_status === "active" && me?.custom_booking_domain) {
      return `https://${me.custom_booking_domain}${branchQuery}`;
    }
    const ref = bookingSlug || me?.public_booking_slug || me?.id || "";
    if (!ref) return "";
    const base = `${window.location.origin}/book/${encodeURIComponent(ref)}`;
    return `${base}${branchQuery}`;
  }, [bookingSlug, me?.public_booking_slug, me?.id, me?.custom_booking_domain, me?.custom_booking_domain_status, selectedBranch]);
  const activeBranchId = useMemo(() => {
    const selectedId = selectedBranch?.id || "";
    if (selectedId) return selectedId;
    const selectedName = String(selectedBranch?.name || "").trim().toLowerCase();
    if (selectedName) {
      const found = branches.find((branch) => String(branch.name || "").trim().toLowerCase() === selectedName);
      if (found?.id) return found.id;
    }
    return "";
  }, [branches, selectedBranch]);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast.success("Booking link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const createBranch = async () => {
    try {
      const payload = { name: newBranchName || `Branch ${Date.now()}` };
      const { data } = await api.post('/client/branches', payload);
      setBranchDialogOpen(false);
      setNewBranchName('');
      toast.success('Branch created');
      if (data?.id) setSelectedBranch(data);
      load(data?.id || null);
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const deleteBranch = async () => {
    if (!selectedBranch?.id) return;
    if (!window.confirm(`Delete branch "${selectedBranch.name || selectedBranch.id}"? This removes branch-specific devices, bookings and playlists.`)) return;
    try {
      await api.delete(`/client/branches/${encodeURIComponent(selectedBranch.id)}`);
      toast.success('Branch deleted');
      setSelectedBranch(null);
      load(null);
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_24px_60px_-36px_rgba(15,23,42,0.22)]">
        <div className="px-4 sm:px-6 py-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#F9FAFB]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Branch context</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Active storefront branch</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#374151]">
              <span className="inline-flex items-center rounded-full bg-[#111827] px-3 py-1 text-white font-semibold">{selectedBranch?.name || 'Global storefront'}</span>
              {selectedBranch?.id ? <span className="font-mono text-xs text-[#6B7280]">{selectedBranch.id}</span> : <span className="text-xs text-[#6B7280]">No branch selected</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium text-[#374151]">Branch</Label>
            <select
              value={selectedBranch?.id || ''}
              onChange={(e) => {
                const bid = e.target.value;
                const found = branches.find((b) => b.id === bid);
                setSelectedBranch(found || null);
                load(found?.id || null);
              }}
              className="min-w-[220px] rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827]"
            >
              <option value="">Global</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setBranchDialogOpen(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add branch
            </Button>
            {selectedBranch?.id ? (
              <Button variant="outline" onClick={deleteBranch} className="rounded-xl text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" /> Delete branch
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bookings and tokens (moved to top) */}
      <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Live queue</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Bookings and tokens</h3>
            <div className="mt-1 text-xs text-[#6B7280]">Live queue: {liveQueue.length} · Currently serving: {servingQueue.length} · Today's bookings: {todayBookings.length}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              className="rounded-sm"
              onClick={() => setShowPastBookings((value) => !value)}
            >
              {showPastBookings ? "Show today only" : `Show past bookings${pastCount ? ` (${pastCount})` : ""}`}
            </Button>
            <Button variant="outline" className="rounded-sm" onClick={openManualBooking}>Add walk-in</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Token</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Branch</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Name</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Phone</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Time</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-sm text-[#6B7280]">No bookings yet. Share your link to start receiving tokens.</TableCell></TableRow>}
            {apts.length > 0 && visibleAppointments.length === 0 && !showPastBookings && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-sm text-[#6B7280]">
                  No bookings for today. Toggle past bookings to view older queue items.
                </TableCell>
              </TableRow>
            )}
            {visibleAppointments.map((a) => (
              <TableRow key={a.id}>
                <TableCell><span className="inline-flex items-center justify-center w-9 h-9 rounded-sm bg-[#111827] text-white font-mono font-bold">{a.token}</span></TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] uppercase tracking-wider text-[#374151] font-semibold">
                    {a.branch_name || selectedBranch?.name || 'Global'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{a.patient_name}</div>
                  <div className="text-xs text-[#6B7280]">{a.service_name || bookingCta}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{a.patient_phone}</TableCell>
                <TableCell className="font-mono text-xs">{a.assigned_time || a.preferred_time || "ASAP"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] uppercase tracking-wider font-semibold">
                    {a.status === "called" ? "Currently serving" : a.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {a.status === "pending" && <Button size="sm" variant="outline" className="rounded-sm mr-2" onClick={() => setStatus(a.id, "called")}>Call</Button>}
                  {a.status === "called" && <Button size="sm" variant="outline" className="rounded-sm mr-2" onClick={() => setStatus(a.id, "called")}>Recall</Button>}
                  {a.status === "called" && <Button size="sm" variant="outline" className="rounded-sm mr-2" onClick={() => setStatus(a.id, "done")}>Done</Button>}
                  {a.status !== "cancelled" && a.status !== "done" && <Button size="sm" variant="outline" className="rounded-sm text-red-600" onClick={() => setStatus(a.id, "cancelled")}>Cancel</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Services and pricing (middle) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
        <div className="px-4 sm:px-6 py-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F9FAFB]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Catalog</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Services and pricing</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={openManualBooking}>Add walk-in</Button>
            <Button className="rounded-xl bg-[#111827] hover:bg-[#374151] text-white" onClick={() => openServiceEditor()}>Add service</Button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {services.length === 0 ? (
            <div className="border border-dashed border-[#D1D5DB] rounded-2xl p-8 text-center text-sm text-[#6B7280]">No services yet. Add one premium service row for your storefront.</div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                    <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Service</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Duration</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280] text-right">Price</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Visibility</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Image</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={service.id || index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#111827] overflow-hidden shrink-0">
                            {service.image_url ? (
                              <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[linear-gradient(135deg,#111827,#334155)]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{service.name || "Service"}</div>
                            <div className="text-xs text-[#6B7280] line-clamp-1">{service.description || "Premium service item for your storefront."}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{service.duration_mins || 30} mins</TableCell>
                      <TableCell className="text-right font-mono">₹{Number(service.price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`text-[11px] uppercase tracking-wider font-semibold ${service.active === false ? "text-[#9CA3AF]" : "text-emerald-600"}`}>
                          {service.active === false ? "Hidden" : "Visible"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-[#6B7280]">{service.image_url ? "Added" : "No image"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" className="rounded-xl mr-2" onClick={() => openServiceEditor(service, index)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </Button>
                        <Button variant="outline" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={() => removeService(index)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Public storefront / profile (moved to bottom) */}
      <div className="bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#0F172A] text-white rounded-2xl p-4 sm:p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] border border-white/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-2">{title}</div>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Public storefront</h3>
            <p className="mt-3 text-sm text-white/70 max-w-xl">Add multiple services with prices, images and duration. The same data powers the premium public booking page and your walk-in queue.</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80">
              <span className="uppercase tracking-[0.2em] text-white/50">Active branch</span>
              <span className="font-semibold text-white">{selectedBranch?.name || 'Global storefront'}</span>
              {selectedBranch?.id ? <span className="text-white/50">· {selectedBranch.id.slice(0, 8)}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <Label className="text-xs text-white/70">Accepting bookings</Label>
            <Switch checked={!!profile.is_open} onCheckedChange={(v) => setProfile({ ...profile, is_open: v })} data-testid="toggle-open" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Headline</Label>
            <Input value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} className="rounded-lg bg-white/95 text-[#111827]" placeholder={label === "Salon" ? "Premium haircuts, styling, beard trim" : "General medicine, dental, diagnostics"} />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Featured price</Label>
            <Input type="number" value={profile.fee} onChange={(e) => setProfile({ ...profile, fee: parseFloat(e.target.value || 0) })} className="rounded-lg bg-white/95 text-[#111827]" />
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Details</Label>
            <Input value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} className="rounded-lg bg-white/95 text-[#111827]" placeholder={label === "Salon" ? "Senior stylist, bridal specialist" : "MBBS, MD"} />
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Description</Label>
            <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="rounded-lg bg-white/95 text-[#111827]" rows={3} placeholder="Write a premium description for end users." />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Working hours</Label>
            <Input value={profile.hours} onChange={(e) => setProfile({ ...profile, hours: e.target.value })} placeholder="Mon-Sat · 9 AM - 7 PM" className="rounded-lg bg-white/95 text-[#111827]" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Slot minutes</Label>
            <Input type="number" min={5} value={profile.slot_minutes} onChange={(e) => setProfile({ ...profile, slot_minutes: Math.max(5, parseInt(e.target.value || 15, 10)) })} className="rounded-lg bg-white/95 text-[#111827]" />
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Cover image</Label>
            <div className="mt-3 flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#0F172A] flex items-center justify-center">
                {profile.image_url ? (
                  // preview
                  <img src={profile.image_url} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs text-white/60 px-2">No cover image</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className={`inline-flex items-center gap-2 rounded-md px-3 py-2 bg-white/10 border border-white/10 text-sm cursor-pointer ${uploadingCover ? 'opacity-60 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/*" onChange={(e) => uploadCoverImage(e.target.files && e.target.files[0])} className="hidden" />
                  <span>{uploadingCover ? 'Uploading…' : 'Upload image'}</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setProfile({ ...profile, image_url: '' }); api.put(`/client/${vertical}/profile`, { ...profile, image_url: '' }).catch(() => {}); }} className="rounded-xl">Remove</Button>
                  <div className="text-xs text-white/60 self-center">Recommended: 1200×600px JPG/PNG</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60 mb-1">Public booking link</div>
            <div className="font-mono text-xs text-white/80 break-all">
              {bookingUrl || "Loading booking link..."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink} disabled={!bookingUrl} className="rounded-xl bg-white/10 text-white border-white/15 hover:bg-white/20 disabled:opacity-50"><Copy className="w-3.5 h-3.5 mr-2" /> Copy link</Button>
            <Button onClick={save} className="rounded-xl bg-white text-[#111827] hover:bg-white/90">Save profile</Button>
          </div>
        </div>
      </div>

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{serviceIndex === null ? "Add service" : "Edit service"}</DialogTitle></DialogHeader>
          <form onSubmit={saveService} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Service name</Label>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Price (₹)</Label>
              <Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value || 0) })} className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Duration (mins)</Label>
              <Input type="number" min="5" value={serviceForm.duration_mins} onChange={(e) => setServiceForm({ ...serviceForm, duration_mins: parseInt(e.target.value || 30, 10) })} className="rounded-sm" /></div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Description</Label>
              <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="rounded-sm" rows={3} /></div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Tags (comma separated)</Label>
              <Input value={serviceForm.tags || ""} onChange={(e) => setServiceForm({ ...serviceForm, tags: e.target.value })} className="rounded-sm" placeholder="pillows, bedding, cotton" /></div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Service image</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadServiceImage(e.target.files?.[0])} className="rounded-sm" />
              <div className="mt-2 text-xs text-[#6B7280]">Uploads into your storefront folder in media.</div>
            </div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Image URL</Label>
              <Input value={serviceForm.image_url} onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })} className="rounded-sm" placeholder="https://..." /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={!!serviceForm.active} onCheckedChange={(v) => setServiceForm({ ...serviceForm, active: v })} />
              <Label className="text-sm">Visible on public storefront</Label>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setServiceOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">Create branch</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createBranch(); }} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Branch name</Label>
              <Input value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} required className="rounded-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">Add walk-in booking</DialogTitle></DialogHeader>
          <form onSubmit={submitManualBooking} className="space-y-4">
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Customer name</Label>
              <Input value={manualForm.patient_name} onChange={(e) => setManualForm({ ...manualForm, patient_name: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Phone</Label>
              <Input value={manualForm.patient_phone} onChange={(e) => setManualForm({ ...manualForm, patient_phone: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Preferred time</Label>
              <Input value={manualForm.preferred_time} onChange={(e) => setManualForm({ ...manualForm, preferred_time: e.target.value })} placeholder="ASAP" className="rounded-sm" /></div>
            {devices.length > 0 ? (
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Location</Label>
                <select
                  value={manualForm.booking_location || ""}
                  onChange={(e) => setManualForm({ ...manualForm, booking_location: e.target.value, booking_device_id: "" })}
                  className="w-full h-10 rounded-sm border border-[#D1D5DB] bg-white px-3 text-sm"
                >
                  <option value="">Default location</option>
                  {[...new Set(devices.map((device) => String(device.location || "").trim()).filter(Boolean))].map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            ) : null}
            {devices.length > 0 ? (
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Route to device</Label>
                <select
                  value={manualForm.booking_device_id || ""}
                  onChange={(e) => setManualForm({ ...manualForm, booking_device_id: e.target.value })}
                  className="w-full h-10 rounded-sm border border-[#D1D5DB] bg-white px-3 text-sm"
                >
                  <option value="">Auto-select device</option>
                  {devices
                    .filter((device) => !manualForm.booking_location || String(device.location || "") === String(manualForm.booking_location || ""))
                    .map((device) => (
                      <option key={device.id} value={device.id}>{device.name}{device.location ? ` · ${device.location}` : ""}</option>
                    ))}
                </select>
              </div>
            ) : null}
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Service</Label>
              <div className="mt-2 max-h-36 overflow-y-auto rounded-sm border border-[#D1D5DB] bg-white p-2 space-y-1">
                {services.length === 0 && <div className="text-sm text-[#6B7280] px-2 py-1">No services added</div>}
                {services.map((service) => {
                  const checked = manualForm.service_ids.includes(service.id);
                  return (
                    <label key={service.id} className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm border cursor-pointer ${checked ? "border-[#111827] bg-[#F9FAFB]" : "border-transparent hover:bg-[#F9FAFB]"}`}>
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...new Set([...manualForm.service_ids, service.id])]
                              : manualForm.service_ids.filter((sid) => sid !== service.id);
                            setManualForm({ ...manualForm, service_ids: next, service_id: next[0] || "" });
                          }}
                        />
                        <span>{service.name}</span>
                      </span>
                      <span className="text-sm font-semibold">₹{Number(service.price || 0).toLocaleString()}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Notes</Label>
              <Textarea value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} rows={3} className="rounded-sm" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">Add booking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isOrderToday(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function orderMatchesSearch(order, query) {
  if (!query) return true;
  const hay = [
    order.order_no,
    order.shopper_name,
    order.shopper_email,
    order.shopper_phone,
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(query);
}

function orderCustomerKey(order) {
  return order.shopper_id || order.shopper_phone || order.shopper_email || order.shopper_name || order.id;
}

function isOrderSelectable(order) {
  return order.status !== "completed" && order.status !== "cancelled";
}

function RetailerPanel() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderTodayOnly, setOrderTodayOnly] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [completingSelected, setCompletingSelected] = useState(false);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const empty = { name: "", price: 0, sku: "", description: "", image_url: "", image_urls: [], category_id: "", stock: 0, tags: "", is_published: true, compare_at_price: "" };
  const emptyCat = { name: "", sort_order: 0, is_active: true };
  const [form, setForm] = useState(empty);
  const [catForm, setCatForm] = useState(emptyCat);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState({ headline: "", description: "", hours: "", is_open: true, image_url: "", announcement: "", banner_slides: [] });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const bookingSlug = useMemo(() => {
    if (!me) return "";
    const base = String(me.public_booking_slug || me.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    return base || me.id;
  }, [me]);

  const storeUrl = useMemo(() => {
    if (me?.custom_booking_domain_status === "active" && me?.custom_booking_domain) {
      return `https://${me.custom_booking_domain}`;
    }
    const ref = bookingSlug || me?.public_booking_slug || me?.id || "";
    if (!ref) return "";
    return `${window.location.origin}/store/${encodeURIComponent(ref)}`;
  }, [bookingSlug, me?.custom_booking_domain, me?.custom_booking_domain_status, me?.id, me?.public_booking_slug]);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/client/me");
      setMe(data);
      const stored = data.retailer_profile || {};
      setProfile({
        headline: stored.headline || "",
        description: stored.description || "",
        hours: stored.hours || "",
        is_open: stored.is_open !== false,
        image_url: stored.image_url || "",
        announcement: stored.announcement || "",
        banner_slides: Array.isArray(stored.banner_slides) ? stored.banner_slides : [],
      });
    } catch {}
  }, []);

  const uploadProductImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setForm((prev) => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), url].filter(Boolean),
        image_url: prev.image_url || url,
      }));
      toast.success("Product image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingImage(false);
    }
  };

  const load = useCallback(async () => { try { setItems((await api.get("/client/products")).data); } catch {} }, []);
  const loadCategories = useCallback(async () => { try { setCategories((await api.get("/client/categories")).data); } catch {} }, []);
  const loadOrders = useCallback(async () => { try { setOrders((await api.get("/client/orders")).data); } catch {} }, []);

  useEffect(() => { load(); loadCategories(); loadOrders(); loadProfile(); }, [load, loadCategories, loadOrders, loadProfile]);

  useEffect(() => {
    setSelectedOrderIds((prev) => {
      const selectable = new Set(orders.filter(isOrderSelectable).map((order) => order.id));
      return prev.filter((id) => selectable.has(id));
    });
  }, [orders]);

  const saveProfile = async () => {
    try {
      const payload = {
        headline: profile.headline || "",
        description: profile.description || "",
        hours: profile.hours || "",
        is_open: profile.is_open !== false,
        image_url: profile.image_url || "",
        announcement: profile.announcement || "",
        banner_slides: (profile.banner_slides || []).map((slide, idx) => ({
          id: slide.id || String(idx),
          image_url: slide.image_url || "",
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          link_url: slide.link_url || "",
          sort_order: idx,
          is_active: slide.is_active !== false,
        })),
      };
      await api.put("/client/retailer/profile", payload);
      toast.success("Storefront profile saved");
      loadProfile();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const copyStoreLink = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      toast.success("Public store link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const uploadCoverImage = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setProfile((prev) => ({ ...prev, image_url: url }));
      toast.success("Cover image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadBannerImage = async (file) => {
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      const slide = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        image_url: url,
        title: "",
        subtitle: "",
        link_url: "",
        sort_order: (profile.banner_slides || []).length,
        is_active: true,
      };
      setProfile((prev) => ({ ...prev, banner_slides: [...(prev.banner_slides || []), slide] }));
      toast.success("Banner slide added — add title and save storefront");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingBanner(false);
    }
  };

  const updateBannerSlide = (id, patch) => {
    setProfile((prev) => ({
      ...prev,
      banner_slides: (prev.banner_slides || []).map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    }));
  };

  const removeBannerSlide = (id) => {
    setProfile((prev) => ({
      ...prev,
      banner_slides: (prev.banner_slides || []).filter((slide) => slide.id !== id),
    }));
  };

  const moveBannerSlide = (id, direction) => {
    setProfile((prev) => {
      const slides = [...(prev.banner_slides || [])];
      const index = slides.findIndex((slide) => slide.id === id);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= slides.length) return prev;
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return {
        ...prev,
        banner_slides: slides.map((slide, i) => ({ ...slide, sort_order: i })),
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (typeof payload.tags === "string") payload.tags = payload.tags.split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
      payload.image_urls = (payload.image_urls || []).filter(Boolean);
      payload.image_url = payload.image_urls[0] || payload.image_url || "";
      if (!payload.category_id) payload.category_id = null;
      if (payload.compare_at_price === "" || payload.compare_at_price == null) delete payload.compare_at_price;
      else payload.compare_at_price = Number(payload.compare_at_price);
      if (editing) await api.put(`/client/products/${editing.id}`, payload);
      else await api.post("/client/products", payload);
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      load();
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) await api.put(`/client/categories/${editingCat.id}`, catForm);
      else await api.post("/client/categories", catForm);
      toast.success(editingCat ? "Category updated" : "Category added");
      setCatOpen(false);
      loadCategories();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/client/products/${id}`); toast.success("Deleted"); load(); } catch {}
  };

  const removeCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try { await api.delete(`/client/categories/${id}`); toast.success("Deleted"); loadCategories(); load(); } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/client/orders/${orderId}/status`, { status });
      toast.success(`Order marked ${status}`);
      loadOrders();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const completeSelectedOrders = async () => {
    if (!selectedOrderIds.length) return;
    setCompletingSelected(true);
    try {
      await Promise.all(selectedOrderIds.map((orderId) => api.put(`/client/orders/${orderId}/status`, { status: "completed" })));
      toast.success(`${selectedOrderIds.length} order${selectedOrderIds.length === 1 ? "" : "s"} marked completed`);
      setSelectedOrderIds([]);
      loadOrders();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
      loadOrders();
    } finally {
      setCompletingSelected(false);
    }
  };

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "-";

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderTodayOnly && !isOrderToday(order.created_at)) return false;
      if (orderStatusFilter === "not_completed" && order.status === "completed") return false;
      else if (orderStatusFilter !== "all" && orderStatusFilter !== "not_completed" && order.status !== orderStatusFilter) return false;
      return orderMatchesSearch(order, q);
    });
  }, [orders, orderSearch, orderStatusFilter, orderTodayOnly]);

  const selectableFilteredOrders = useMemo(
    () => filteredOrders.filter(isOrderSelectable),
    [filteredOrders],
  );

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id) && isOrderSelectable(order)),
    [orders, selectedOrderIds],
  );

  const selectedTotal = useMemo(
    () => selectedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [selectedOrders],
  );

  const allVisibleSelected = selectableFilteredOrders.length > 0
    && selectableFilteredOrders.every((order) => selectedOrderIds.includes(order.id));

  const toggleOrderSelected = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !isOrderSelectable(order)) return;
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  const toggleSelectAllVisible = (checked) => {
    if (!checked) {
      const visible = new Set(selectableFilteredOrders.map((order) => order.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !visible.has(id)));
      return;
    }
    const merged = new Set([...selectedOrderIds, ...selectableFilteredOrders.map((order) => order.id)]);
    setSelectedOrderIds([...merged]);
  };

  const selectCustomerVisibleOrders = (customerKey) => {
    const ids = selectableFilteredOrders
      .filter((order) => orderCustomerKey(order) === customerKey)
      .map((order) => order.id);
    const merged = new Set([...selectedOrderIds, ...ids]);
    setSelectedOrderIds([...merged]);
  };

  const orderStatusClass = (status) => ({
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-700 border-slate-300",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  }[status] || "bg-gray-50 text-gray-700 border-gray-200");

  return (
    <div>
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="rounded-sm bg-[#F3F4F6] flex-wrap h-auto p-2 gap-2">
          <TabsTrigger value="products" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><Package className="w-3.5 h-3.5 mr-1.5" /> Products</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><FolderTree className="w-3.5 h-3.5 mr-1.5" /> Categories</TabsTrigger>
          <TabsTrigger value="banners" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><Images className="w-3.5 h-3.5 mr-1.5" /> Banners</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Inventory</div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">Products</h3>
            </div>
            <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Product</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Category</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">SKU</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280] text-right">Price</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280] text-right">Stock</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-sm text-[#6B7280]">No products yet.</TableCell></TableRow>}
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {(p.image_urls?.[0] || p.image_url) && <img src={resolveMediaUrl(p.image_urls?.[0] || p.image_url)} alt="" className="w-10 h-10 object-cover rounded border" />}
                        <div><div className="font-semibold">{p.name}</div><div className="text-xs text-[#6B7280] line-clamp-1">{p.description}</div></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{categoryName(p.category_id)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku || "-"}</TableCell>
                    <TableCell className="text-right font-mono">Rs {Number(p.price).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{p.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setForm({ ...empty, ...p, image_urls: p.image_urls?.length ? p.image_urls : (p.image_url ? [p.image_url] : []), tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""), category_id: p.category_id || "" }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Catalog</div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">Categories</h3>
            </div>
            <Button onClick={() => { setEditingCat(null); setCatForm(emptyCat); setCatOpen(true); }} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">
              <Plus className="w-4 h-4 mr-2" /> New Category
            </Button>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-[#F9FAFB]"><TableHead>Name</TableHead><TableHead>Sort</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {categories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 text-sm text-[#6B7280]">No categories yet.</TableCell></TableRow>}
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>{c.is_active !== false ? "Active" : "Hidden"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingCat(c); setCatForm({ name: c.name, sort_order: c.sort_order || 0, is_active: c.is_active !== false }); setCatOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeCategory(c.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="banners">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Homepage</div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">Banner slider</h3>
              <p className="text-sm text-[#6B7280] mt-1">Upload images that rotate on your public store homepage. Slides show one after another automatically.</p>
            </div>
            <label className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 bg-[#111827] text-white text-sm cursor-pointer hover:bg-[#374151] ${uploadingBanner ? "opacity-60 pointer-events-none" : ""}`}>
              <input type="file" accept="image/*" onChange={(e) => { uploadBannerImage(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              <Plus className="w-4 h-4" /> {uploadingBanner ? "Uploading…" : "Add banner"}
            </label>
          </div>

          {(profile.banner_slides || []).length === 0 ? (
            <div className="border border-dashed border-[#D1D5DB] rounded-2xl p-10 text-center text-sm text-[#6B7280]">
              No banners yet. Upload images to create a sliding hero on your public store.
            </div>
          ) : (
            <div className="space-y-4">
              {(profile.banner_slides || []).map((slide, index) => (
                <div key={slide.id} className="bg-white border border-[#E5E7EB] rounded-sm p-4 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-4 items-start">
                  <div className="aspect-[21/9] rounded-md overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]">
                    {slide.image_url ? (
                      <img src={resolveMediaUrl(slide.image_url)} alt={slide.title || `Banner ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF]">No image</div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Title</Label>
                      <Input value={slide.title || ""} onChange={(e) => updateBannerSlide(slide.id, { title: e.target.value })} className="rounded-sm mt-1" placeholder="Summer sale — up to 40% off" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Subtitle</Label>
                      <Input value={slide.subtitle || ""} onChange={(e) => updateBannerSlide(slide.id, { subtitle: e.target.value })} className="rounded-sm mt-1" placeholder="Limited time on bedding and decor" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Link (optional)</Label>
                      <Input value={slide.link_url || ""} onChange={(e) => updateBannerSlide(slide.id, { link_url: e.target.value })} className="rounded-sm mt-1 font-mono text-sm" placeholder="search?q=pillows or product/abc123" />
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">Use a search query, product path, or full URL for the Shop now button.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={slide.is_active !== false} onCheckedChange={(v) => updateBannerSlide(slide.id, { is_active: v })} />
                      <Label className="text-sm">Show on public store</Label>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-1">
                    <Button type="button" size="icon" variant="outline" className="rounded-sm" disabled={index === 0} onClick={() => moveBannerSlide(slide.id, -1)}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" size="icon" variant="outline" className="rounded-sm" disabled={index === (profile.banner_slides || []).length - 1} onClick={() => moveBannerSlide(slide.id, 1)}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="text-red-600 rounded-sm" onClick={() => removeBannerSlide(slide.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-[#6B7280]">Click <span className="font-semibold">Save storefront</span> below after editing banners so they appear on your public page.</p>
        </TabsContent>

        <TabsContent value="orders">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Sales</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Customer orders</h3>
            <p className="text-sm text-[#6B7280] mt-1">Search by customer, select open orders (not completed) to total them, then mark the batch completed when done.</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-sm p-4 mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search name, phone, email, or order no."
                  className="rounded-sm pl-9"
                />
              </div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="rounded-sm min-w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="not_completed">Not completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <label className="inline-flex items-center gap-2 rounded-sm border border-[#E5E7EB] px-3 py-2 text-sm cursor-pointer hover:bg-[#F9FAFB]">
                <Checkbox checked={orderTodayOnly} onCheckedChange={(v) => setOrderTodayOnly(v === true)} />
                Today only
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(v) => toggleSelectAllVisible(v === true)}
                    disabled={selectableFilteredOrders.length === 0}
                  />
                  Select all open ({selectableFilteredOrders.length})
                </label>
                <span className="text-[#6B7280]">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => { setOrderStatusFilter("not_completed"); setOrderTodayOnly(true); }}
                >
                  Today · open
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => { setOrderStatusFilter("delivered"); setOrderTodayOnly(true); }}
                >
                  Today · delivered
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => { setOrderSearch(""); setOrderStatusFilter("all"); setOrderTodayOnly(false); }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>

          {selectedOrderIds.length > 0 && (
            <div className="bg-[#111827] text-white rounded-sm px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/70">Selected open orders</div>
                <div className="font-display text-xl font-bold">
                  {selectedOrders.length} order{selectedOrders.length === 1 ? "" : "s"} · Rs {selectedTotal.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={completingSelected}
                  onClick={completeSelectedOrders}
                >
                  {completingSelected ? "Completing…" : "Mark completed"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-sm bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setSelectedOrderIds([])}>
                  Clear selection
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {orders.length === 0 && <div className="bg-white border border-[#E5E7EB] rounded-sm p-10 text-center text-sm text-[#6B7280]">No orders yet.</div>}
            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-sm p-10 text-center text-sm text-[#6B7280]">No orders match your filters.</div>
            )}
            {filteredOrders.map((order) => {
              const customerKey = orderCustomerKey(order);
              const customerLabel = order.shopper_name || order.shopper_email || "Guest";
              const sameCustomerSelectableCount = selectableFilteredOrders.filter((o) => orderCustomerKey(o) === customerKey).length;
              const selectable = isOrderSelectable(order);
              const isSelected = selectable && selectedOrderIds.includes(order.id);
              const contentIndent = selectable ? "ml-7" : "";

              return (
                <div key={order.id} className={`bg-white border rounded-sm p-5 ${isSelected ? "border-[#111827] ring-1 ring-[#111827]/10" : "border-[#E5E7EB]"}`}>
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    {selectable ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOrderSelected(order.id)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="w-4 shrink-0" aria-hidden />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{order.order_no}</div>
                          <div className="text-sm text-[#6B7280]">
                            {customerLabel} · {order.shopper_phone || "-"}
                          </div>
                          <div className="text-xs text-[#6B7280]">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</div>
                          {sameCustomerSelectableCount > 1 && (
                            <button
                              type="button"
                              className="text-xs text-[#007185] hover:underline mt-1"
                              onClick={() => selectCustomerVisibleOrders(customerKey)}
                            >
                              Select all {sameCustomerSelectableCount} open orders for this customer
                            </button>
                          )}
                        </div>
                        <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded-sm border ${orderStatusClass(order.status)}`}>{order.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`space-y-1 text-sm ${contentIndent}`}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between"><span>{item.name} × {item.qty}</span><span>Rs {Number(item.line_total || 0).toLocaleString()}</span></div>
                    ))}
                  </div>
                  <div className={`flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E7EB] ${contentIndent}`}>
                    <div className="font-bold">Total: Rs {Number(order.total || 0).toLocaleString()}</div>
                    <div className="flex flex-wrap gap-2">
                      {order.status === "pending" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")} className="rounded-sm">Confirm</Button>}
                      {order.status === "confirmed" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "shipped")} className="rounded-sm">Mark shipped</Button>}
                      {order.status === "shipped" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "delivered")} className="rounded-sm">Mark delivered</Button>}
                      {order.status === "delivered" && <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")} className="rounded-sm bg-emerald-600 hover:bg-emerald-700">Mark completed</Button>}
                      {["pending", "confirmed"].includes(order.status) && (
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "cancelled")} className="rounded-sm text-red-600">Cancel</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-sm max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-sm font-mono" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Category</Label>
              <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Price</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value || 0) })} className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Compare at price</Label>
              <Input type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="rounded-sm" placeholder="Optional MRP" /></div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value || 0, 10) })} className="rounded-sm" /></div>
            <div className="col-span-2">
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Product images</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => { [...(e.target.files || [])].forEach(uploadProductImage); e.target.value = ""; }} className="rounded-sm" disabled={uploadingImage} />
              <div className="flex flex-wrap gap-2 mt-3">
                {(form.image_urls || []).map((url, i) => (
                  <div key={url + i} className="relative w-16 h-16 rounded border overflow-hidden">
                    <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button type="button" className="absolute top-0 right-0 bg-black/60 text-white p-0.5" onClick={() => setForm((prev) => ({ ...prev, image_urls: prev.image_urls.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-sm" rows={2} /></div>
            <div className="col-span-2"><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Tags (comma separated)</Label>
              <Input value={form.tags || ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="rounded-sm" placeholder="pillows, bedding, cotton" /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_published !== false} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Published on public store</Label>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">{editing ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="rounded-sm max-w-md">
          <DialogHeader><DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <form onSubmit={submitCategory} className="space-y-4">
            <div><Label>Name</Label><Input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="rounded-sm mt-1" /></div>
            <div><Label>Sort order</Label><Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value || 0, 10) })} className="rounded-sm mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={catForm.is_active !== false} onCheckedChange={(v) => setCatForm({ ...catForm, is_active: v })} /><Label>Active</Label></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#111827] text-white">{editingCat ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#0F172A] text-white rounded-2xl p-4 sm:p-6 mt-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] border border-white/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-2">Public storefront</div>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Share your store</h3>
            <p className="mt-3 text-sm text-white/70 max-w-xl">Configure your public store page and share the link with customers. Products you add above appear on this page.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <Label className="text-xs text-white/70">Store open</Label>
            <Switch checked={!!profile.is_open} onCheckedChange={(v) => setProfile({ ...profile, is_open: v })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Headline</Label>
            <Input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Premium home decor and bedding" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Working hours</Label>
            <Input value={profile.hours} onChange={(e) => setProfile({ ...profile, hours: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Mon-Sat · 10 AM - 8 PM" />
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Store description</Label>
            <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" rows={3} placeholder="Tell customers about your store." />
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Announcement bar</Label>
            <Input
              value={profile.announcement || ""}
              onChange={(e) => setProfile({ ...profile, announcement: e.target.value })}
              className="rounded-lg bg-white/95 text-[#111827] mt-2"
              placeholder="Free delivery on orders above ₹999 this week"
            />
            <p className="mt-1 text-[11px] text-white/50">Shown as an orange strip below the store header on your public page.</p>
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Label className="text-xs uppercase tracking-wider text-white/60">Cover image</Label>
            <div className="mt-3 flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#0F172A] flex items-center justify-center">
                {profile.image_url ? <img src={resolveMediaUrl(profile.image_url)} alt="cover" className="w-full h-full object-cover" /> : <div className="text-xs text-white/60 px-2">No cover</div>}
              </div>
              <label className={`inline-flex items-center gap-2 rounded-md px-3 py-2 bg-white/10 border border-white/10 text-sm cursor-pointer ${uploadingCover ? "opacity-60 pointer-events-none" : ""}`}>
                <input type="file" accept="image/*" onChange={(e) => uploadCoverImage(e.target.files?.[0])} className="hidden" />
                <span>{uploadingCover ? "Uploading…" : "Upload image"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60 mb-1">Public store link</div>
            <div className="font-mono text-xs text-white/80 break-all">{storeUrl || "Loading store link..."}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyStoreLink} disabled={!storeUrl} className="rounded-xl bg-white/10 text-white border-white/15 hover:bg-white/20 disabled:opacity-50">
              <Copy className="w-3.5 h-3.5 mr-2" /> Copy link
            </Button>
            <Button onClick={saveProfile} className="rounded-xl bg-white text-[#111827] hover:bg-white/90">Save storefront</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocietyPanel() {
  const [rooms, setRooms] = useState([]);
  const [roomOpen, setRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const emptyRoom = { room_no: "", user_name: "", mobile: "", notes: "" };
  const [roomForm, setRoomForm] = useState(emptyRoom);

  const [notices, setNotices] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const emptyNotice = { title: "", body: "", image_url: "" };
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [uploadingNotice, setUploadingNotice] = useState(false);

  const uploadNoticeImage = async (file) => {
    if (!file) return;
    setUploadingNotice(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "storefront");
      fd.append("zone", "main");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNoticeForm((prev) => ({ ...prev, image_url: data.public_url || data.url || "" }));
      toast.success("Notice image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingNotice(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const [r, n] = await Promise.all([api.get("/client/rooms"), api.get("/client/notices")]);
      setRooms(r.data);
      setNotices(n.data);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) await api.put(`/client/rooms/${editingRoom.id}`, roomForm);
      else await api.post("/client/rooms", roomForm);
      toast.success(editingRoom ? "Room updated" : "Room added");
      setRoomOpen(false);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const removeRoom = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    try { await api.delete(`/client/rooms/${id}`); toast.success("Deleted"); load(); } catch {}
  };

  const submitNotice = async (e) => {
    e.preventDefault();
    try {
      if (editingNotice) await api.put(`/client/notices/${editingNotice.id}`, noticeForm);
      else await api.post("/client/notices", noticeForm);
      toast.success(editingNotice ? "Notice updated" : "Notice uploaded");
      setNoticeOpen(false);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const removeNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try { await api.delete(`/client/notices/${id}`); toast.success("Deleted"); load(); } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Society directory</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Rooms and residents</h3>
          </div>
          <Button onClick={() => { setEditingRoom(null); setRoomForm(emptyRoom); setRoomOpen(true); }} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Room
          </Button>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Room</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Resident</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Mobile</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Notes</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rooms.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-sm text-[#6B7280]">No rooms yet.</TableCell></TableRow>}
              {rooms.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-display font-bold">{r.room_no}</TableCell>
                  <TableCell>{r.user_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.mobile || "-"}</TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{r.notes}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingRoom(r); setRoomForm({ ...emptyRoom, ...r }); setRoomOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeRoom(r.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Notice upload</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Society announcements</h3>
          </div>
          <Button onClick={() => { setEditingNotice(null); setNoticeForm(emptyNotice); setNoticeOpen(true); }} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">
            <Megaphone className="w-4 h-4 mr-2" /> Add Notice
          </Button>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Title</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Message</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Image</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {notices.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 text-sm text-[#6B7280]">No notices yet.</TableCell></TableRow>}
              {notices.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-semibold">{n.title}</TableCell>
                  <TableCell className="text-sm text-[#6B7280] max-w-[420px] truncate">{n.body}</TableCell>
                  <TableCell className="text-xs font-mono">{n.image_url ? "Added" : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingNotice(n); setNoticeForm({ ...emptyNotice, ...n }); setNoticeOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeNotice(n.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
        <DialogContent className="rounded-sm max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle></DialogHeader>
          <form onSubmit={submitRoom} className="space-y-4">
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Room number</Label>
              <Input value={roomForm.room_no} onChange={(e) => setRoomForm({ ...roomForm, room_no: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Resident name</Label>
              <Input value={roomForm.user_name} onChange={(e) => setRoomForm({ ...roomForm, user_name: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Mobile</Label>
              <Input value={roomForm.mobile} onChange={(e) => setRoomForm({ ...roomForm, mobile: e.target.value })} className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Notes</Label>
              <Textarea value={roomForm.notes} onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })} className="rounded-sm" rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoomOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">{editingRoom ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{editingNotice ? "Edit Notice" : "Upload Notice"}</DialogTitle></DialogHeader>
          <form onSubmit={submitNotice} className="space-y-4">
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Title</Label>
              <Input value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} required className="rounded-sm" /></div>
            <div><Label className="text-xs uppercase tracking-wider text-[#6B7280]">Message</Label>
              <Textarea value={noticeForm.body} onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })} className="rounded-sm" rows={3} /></div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Notice image</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadNoticeImage(e.target.files?.[0])} className="rounded-sm" />
              <div className="mt-2 text-xs text-[#6B7280]">Uploads into your storefront folder in media.</div>
              <div className="mt-2">
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Image URL</Label>
                <Input value={noticeForm.image_url} onChange={(e) => setNoticeForm({ ...noticeForm, image_url: e.target.value })} className="rounded-sm" placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoticeOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">{editingNotice ? "Save" : "Upload"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClientStorefront() {
  const [me, setMe] = useState(null);
  useEffect(() => { api.get("/client/me").then((r) => setMe(r.data)).catch(() => {}); }, []);

  const v = me?.vertical || "general";
  const config = useMemo(() => ({
    doctor: {
      overline: "Storefront / Doctor",
      title: "Clinic console.",
      subtitle: "Manage profile, accept bookings and call tokens.",
      icon: Stethoscope,
      panel: <ServicePanel vertical="doctor" label="Doctor" icon={Stethoscope} />,
    },
    salon: {
      overline: "Storefront / Salon",
      title: "Salon console.",
      subtitle: "Publish services, collect bookings and run live token queue.",
      icon: Scissors,
      panel: <ServicePanel vertical="salon" label="Salon" icon={Scissors} />,
    },
    retailer: {
      overline: "Storefront / Retailer",
      title: "Store & orders.",
      subtitle: "Manage catalog, categories, and customer orders.",
      icon: Package,
      panel: <RetailerPanel />,
    },
    society: {
      overline: "Storefront / Society",
      title: "Residence registry.",
      subtitle: "Manage directory entries and upload resident notices.",
      icon: Building,
      panel: <SocietyPanel />,
    },
    general: {
      overline: "Storefront / Academy",
      title: "Courses & enrollments.",
      subtitle: "Run tuition centers, academies, coaching, and training programs with a professional public page.",
      icon: GraduationCap,
      panel: <GeneralStorefrontPanel />,
    },
  }), []);

  const screen = config[v] || config.general;

  return (
    <div data-testid="client-storefront">
      <PageHeader overline={screen.overline} title={screen.title} subtitle={screen.subtitle} />
      {screen.panel}
    </div>
  );
}
