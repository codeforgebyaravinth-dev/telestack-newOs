import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatErr, resolveMediaUrl, API_BASE } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Pencil, Trash2, Copy, GraduationCap, ClipboardList, BookOpen, X } from "lucide-react";
import { toast } from "sonner";

const SECTORS = [
  { value: "tuition", label: "Tuition center" },
  { value: "academy", label: "Academy" },
  { value: "coaching", label: "Coaching institute" },
  { value: "training", label: "Training center" },
  { value: "workshops", label: "Workshops & events" },
  { value: "other", label: "Other services" },
];

const MODES = [
  { value: "offline", label: "In-person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const LEVELS = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const emptyCourse = {
  name: "", description: "", price: 0, duration: "", schedule: "", mode: "offline",
  level: "all", category: "", image_url: "", seats: 0, tags: "", is_published: true,
};

export default function GeneralStorefrontPanel() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState({
    headline: "", tagline: "", description: "", hours: "", is_open: true,
    image_url: "", announcement: "", sector: "academy", highlights: [],
  });
  const [highlightInput, setHighlightInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  const bookingSlug = useMemo(() => {
    if (!me) return "";
    const base = String(me.public_booking_slug || me.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    return base || me.id;
  }, [me]);

  const publicUrl = useMemo(() => {
    if (me?.custom_booking_domain_status === "active" && me?.custom_booking_domain) {
      return `https://${me.custom_booking_domain}`;
    }
    const ref = bookingSlug || me?.public_booking_slug || me?.id || "";
    if (!ref) return "";
    return `${window.location.origin}/book/${encodeURIComponent(ref)}`;
  }, [bookingSlug, me?.custom_booking_domain, me?.custom_booking_domain_status, me?.id, me?.public_booking_slug]);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/client/me");
      setMe(data);
      const stored = data.general_profile || {};
      setProfile({
        headline: stored.headline || "",
        tagline: stored.tagline || "",
        description: stored.description || "",
        hours: stored.hours || "",
        is_open: stored.is_open !== false,
        image_url: stored.image_url || "",
        announcement: stored.announcement || "",
        sector: stored.sector || "academy",
        highlights: Array.isArray(stored.highlights) ? stored.highlights : [],
      });
    } catch {}
  }, []);

  const loadCourses = useCallback(async () => {
    try { setCourses((await api.get("/client/courses")).data || []); } catch {}
  }, []);

  const loadEnrollments = useCallback(async () => {
    try { setEnrollments((await api.get("/client/enrollments")).data || []); } catch {}
  }, []);

  useEffect(() => { loadProfile(); loadCourses(); loadEnrollments(); }, [loadProfile, loadCourses, loadEnrollments]);

  const uploadImage = async (file, onUrl) => {
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
      onUrl(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async () => {
    try {
      await api.put("/client/general/profile", profile);
      toast.success("Public page saved");
      loadProfile();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public page link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const submitCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (typeof payload.tags === "string") {
        payload.tags = payload.tags.split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
      }
      if (editing) await api.put(`/client/courses/${editing.id}`, payload);
      else await api.post("/client/courses", payload);
      toast.success(editing ? "Course updated" : "Course added");
      setOpen(false);
      loadCourses();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const removeCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await api.delete(`/client/courses/${id}`);
      toast.success("Course deleted");
      loadCourses();
      loadEnrollments();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const updateEnrollment = async (id, status) => {
    try {
      await api.put(`/client/enrollments/${id}/status`, { status });
      toast.success(`Enrollment ${status}`);
      loadEnrollments();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setProfile((p) => ({ ...p, highlights: [...(p.highlights || []), highlightInput.trim()] }));
    setHighlightInput("");
  };

  const statusClass = (status) => ({
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
  }[status] || "bg-gray-50 text-gray-700 border-gray-200");

  return (
    <div>
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="rounded-sm bg-[#F3F4F6] flex-wrap h-auto p-2 gap-2">
          <TabsTrigger value="courses" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><BookOpen className="w-3.5 h-3.5 mr-1.5" /> Courses</TabsTrigger>
          <TabsTrigger value="enrollments" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Enrollments</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white"><GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Public page</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Catalog</div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">Courses & programs</h3>
              <p className="text-sm text-[#6B7280] mt-1">Add tuition batches, coaching programs, workshops, or any bookable offering.</p>
            </div>
            <Button onClick={() => { setEditing(null); setForm(emptyCourse); setOpen(true); }} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white">
              <Plus className="w-4 h-4 mr-2" /> New course
            </Button>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-sm text-[#6B7280]">No courses yet.</TableCell></TableRow>}
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-[#6B7280] line-clamp-1">{c.duration || c.schedule || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.category || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{c.mode || "offline"}</TableCell>
                    <TableCell className="font-semibold">₹{Number(c.price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{Number(c.seats || 0) > 0 ? c.seats : "Unlimited"}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded border ${c.is_published !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600"}`}>{c.is_published !== false ? "Published" : "Draft"}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setForm({ ...emptyCourse, ...c, tags: (c.tags || []).join(", ") }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-600" onClick={() => removeCourse(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="enrollments">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Bookings</div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">Course enrollments</h3>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-sm text-[#6B7280]">No enrollments yet.</TableCell></TableRow>}
                {enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold">{e.student_name}</TableCell>
                    <TableCell className="text-sm">{e.course_name}</TableCell>
                    <TableCell className="text-sm font-mono">{e.student_phone}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded border capitalize ${statusClass(e.status)}`}>{e.status}</span></TableCell>
                    <TableCell className="text-right space-x-1">
                      {e.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="rounded-sm h-7 text-xs" onClick={() => updateEnrollment(e.id, "confirmed")}>Confirm</Button>
                          <Button size="sm" variant="ghost" className="rounded-sm h-7 text-xs text-red-600" onClick={() => updateEnrollment(e.id, "cancelled")}>Cancel</Button>
                        </>
                      )}
                      {e.status === "confirmed" && (
                        <Button size="sm" variant="outline" className="rounded-sm h-7 text-xs" onClick={() => updateEnrollment(e.id, "completed")}>Complete</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#0F172A] text-white rounded-2xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-2">Public business page</div>
                <h3 className="font-display text-3xl font-extrabold tracking-tight">Your professional storefront</h3>
                <p className="mt-3 text-sm text-white/70">Perfect for tuition centers, academies, coaching institutes, and training providers.</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                <Label className="text-xs text-white/70">Accepting enrollments</Label>
                <Switch checked={!!profile.is_open} onCheckedChange={(v) => setProfile({ ...profile, is_open: v })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Sector</Label>
                <Select value={profile.sector || "academy"} onValueChange={(v) => setProfile({ ...profile, sector: v })}>
                  <SelectTrigger className="rounded-lg bg-white/95 text-[#111827] mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTORS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Headline</Label>
                <Input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Excel Academy — JEE & NEET coaching" />
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Tagline</Label>
                <Input value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Expert faculty · Small batches · Proven results" />
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">About</Label>
                <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" rows={3} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Working hours</Label>
                <Input value={profile.hours} onChange={(e) => setProfile({ ...profile, hours: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Mon–Sat · 9 AM – 7 PM" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Announcement</Label>
                <Input value={profile.announcement} onChange={(e) => setProfile({ ...profile, announcement: e.target.value })} className="rounded-lg bg-white/95 text-[#111827] mt-2" placeholder="Admissions open for 2026 batch" />
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Highlights</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} placeholder="Small batch sizes" className="rounded-lg bg-white/95 text-[#111827]" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())} />
                  <Button type="button" variant="outline" onClick={addHighlight} className="rounded-lg bg-white/10 text-white border-white/15">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(profile.highlights || []).map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/15 rounded-full px-3 py-1">
                      {h}
                      <button type="button" onClick={() => setProfile((p) => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
                <Label className="text-xs uppercase tracking-wider text-white/60">Cover image</Label>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-[#0F172A]">
                    {profile.image_url ? <img src={resolveMediaUrl(profile.image_url)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white/50">No image</div>}
                  </div>
                  <label className={`inline-flex items-center gap-2 rounded-md px-3 py-2 bg-white/10 border border-white/10 text-sm cursor-pointer ${uploadingCover ? "opacity-60" : ""}`}>
                    <input type="file" accept="image/*" onChange={(e) => { setUploadingCover(true); uploadImage(e.target.files?.[0], (url) => setProfile((p) => ({ ...p, image_url: url }))).finally(() => setUploadingCover(false)); e.target.value = ""; }} className="hidden" />
                    {uploadingCover ? "Uploading…" : "Upload cover"}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-white/60 mb-1">Public page link</div>
                <div className="font-mono text-xs text-white/80 break-all">{publicUrl || "Loading…"}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyLink} disabled={!publicUrl} className="rounded-xl bg-white/10 text-white border-white/15 hover:bg-white/20"><Copy className="w-3.5 h-3.5 mr-2" /> Copy link</Button>
                <Button onClick={saveProfile} className="rounded-xl bg-white text-[#111827] hover:bg-white/90">Save public page</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-sm max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle></DialogHeader>
          <form onSubmit={submitCourse} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-sm mt-1" /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-sm mt-1" placeholder="JEE, Spoken English…" /></div>
            <div><Label>Price (₹)</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value || 0) })} className="rounded-sm mt-1" /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-sm mt-1" placeholder="6 months" /></div>
            <div><Label>Schedule</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="rounded-sm mt-1" placeholder="Mon–Fri 5–7 PM" /></div>
            <div><Label>Mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger className="rounded-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger className="rounded-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Seat limit (0 = unlimited)</Label><Input type="number" min="0" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value || "0", 10) })} className="rounded-sm mt-1" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-sm mt-1" rows={2} /></div>
            <div className="col-span-2">
              <Label>Course image</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], (url) => setForm((f) => ({ ...f, image_url: url })))} className="rounded-sm mt-1" disabled={uploadingImage} />
              {form.image_url && <img src={resolveMediaUrl(form.image_url)} alt="" className="mt-2 w-20 h-20 object-cover rounded border" />}
            </div>
            <div className="col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tags || ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="rounded-sm mt-1" /></div>
            <div className="col-span-2 flex items-center gap-2"><Switch checked={form.is_published !== false} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published on public page</Label></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#111827] text-white">{editing ? "Save" : "Add course"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
