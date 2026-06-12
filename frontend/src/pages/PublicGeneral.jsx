import { useMemo, useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  GraduationCap, Clock, MapPin, Phone, IndianRupee, CheckCircle2,
  Monitor, Users, Sparkles, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatErr, resolveMediaUrl } from "../lib/api";
import StoreBannerCarousel from "./store/StoreBannerCarousel";

const SECTOR_LABELS = {
  tuition: "Tuition Center",
  academy: "Academy",
  coaching: "Coaching Institute",
  training: "Training Center",
  workshops: "Workshops & Events",
  other: "Professional Services",
};

function CourseCard({ course, onEnroll }) {
  const img = resolveMediaUrl(course.image_url);
  const seatsLeft = Number(course.seats || 0) > 0 ? course.seats : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="aspect-[16/10] bg-[#F8FAFC] relative">
        {img ? (
          <img src={img} alt={course.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {course.category && (
          <span className="absolute top-3 left-3 bg-[#111827]/85 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            {course.category}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold tracking-tight line-clamp-2">{course.name}</h3>
          <span className="text-[10px] uppercase font-semibold text-[#6B7280] shrink-0 capitalize">{course.level || "all"}</span>
        </div>
        <p className="text-sm text-[#6B7280] mt-2 line-clamp-2 flex-1">{course.description || "Structured program with expert guidance."}</p>
        <div className="mt-4 space-y-1.5 text-xs text-[#6B7280]">
          {course.duration && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.duration}</div>}
          {course.schedule && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.schedule}</div>}
          <div className="flex items-center gap-1.5 capitalize"><Monitor className="w-3.5 h-3.5" /> {course.mode || "offline"}</div>
          {seatsLeft && <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {seatsLeft} seats</div>}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-[#F3F4F6]">
          <div className="flex items-baseline gap-1">
            <IndianRupee className="w-4 h-4" />
            <span className="font-display text-2xl font-extrabold">{Number(course.price || 0).toLocaleString()}</span>
          </div>
          <Button onClick={() => onEnroll(course)} className="rounded-xl bg-[#111827] hover:bg-[#374151] text-white shrink-0">
            Enroll now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PublicGeneral({ doc, clientId, apiBase }) {
  const profile = doc?.profile || {};
  const courses = useMemo(() => (Array.isArray(doc?.courses) ? doc.courses : []), [doc?.courses]);
  const banners = profile.banner_slides?.length ? profile.banner_slides : [];
  const sectorLabel = SECTOR_LABELS[profile.sector] || SECTOR_LABELS.academy;

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [form, setForm] = useState({
    student_name: "", student_phone: "", student_email: "", notes: "", preferred_batch: "",
  });

  const openEnroll = (course) => {
    setSelectedCourse(course);
    setConfirmed(null);
    setForm({ student_name: "", student_phone: "", student_email: "", notes: "", preferred_batch: "" });
    setEnrollOpen(true);
  };

  const submitEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setBusy(true);
    try {
      const { data } = await axios.post(`${apiBase}/providers/${encodeURIComponent(clientId)}/enroll`, {
        course_id: selectedCourse.id,
        ...form,
      });
      setConfirmed(data);
      toast.success("Enrollment submitted!");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const isOpen = profile.is_open !== false;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_50%,#F8FAFC_100%)] text-[#111827]">
      {profile.announcement && (
        <div className="bg-[#111827] text-white text-sm font-medium text-center py-2.5 px-4">
          {profile.announcement}
        </div>
      )}

      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-[#E5E7EB]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-extrabold text-lg tracking-tight">{doc.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">{sectorLabel}</div>
            </div>
          </div>
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {isOpen ? "Enrollments open" : "Currently closed"}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {banners.length > 0 ? (
          <StoreBannerCarousel slides={banners} />
        ) : (
          <section className="rounded-[2rem] overflow-hidden border border-white/60 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)]">
            <div className="relative min-h-[280px] md:min-h-[360px] bg-[#0F172A]">
              {profile.image_url ? (
                <img src={resolveMediaUrl(profile.image_url)} alt={doc.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),linear-gradient(135deg,#0F172A,#312E81)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-2">{sectorLabel}</div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tighter">
                  {profile.headline || doc.name}
                </h1>
                {profile.tagline && <p className="mt-3 text-lg text-white/90 font-medium">{profile.tagline}</p>}
                {profile.description && <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed">{profile.description}</p>}
              </div>
            </div>
          </section>
        )}

        {(profile.highlights?.length > 0 || doc.phone || doc.address || profile.hours) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(profile.highlights || []).slice(0, 3).map((h, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-start gap-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-sm font-medium text-[#374151]">{h}</div>
              </div>
            ))}
            {doc.phone && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-3 shadow-sm">
                <Phone className="w-5 h-5 text-[#111827]" />
                <a href={`tel:${doc.phone}`} className="text-sm font-semibold hover:underline">{doc.phone}</a>
              </div>
            )}
            {doc.address && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-start gap-3 shadow-sm">
                <MapPin className="w-5 h-5 text-[#111827] shrink-0" />
                <div className="text-sm text-[#374151]">{doc.address}</div>
              </div>
            )}
            {profile.hours && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-3 shadow-sm">
                <Clock className="w-5 h-5 text-[#111827]" />
                <div className="text-sm text-[#374151]">{profile.hours}</div>
              </div>
            )}
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-1">Programs</div>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Courses & batches</h2>
              <p className="text-sm text-[#6B7280] mt-2">Choose a program and submit your enrollment — we will confirm your seat shortly.</p>
            </div>
            <div className="text-sm text-[#6B7280] font-medium">{courses.length} available</div>
          </div>

          {!isOpen ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h3 className="font-display text-xl font-extrabold text-amber-900">Enrollments paused</h3>
              <p className="text-sm text-amber-800 mt-2">Please check back later or contact us directly.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
              <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <h3 className="font-display text-xl font-extrabold">Programs coming soon</h3>
              <p className="text-sm text-[#6B7280] mt-2">New courses will be published here shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onEnroll={openEnroll} />
              ))}
            </div>
          )}
        </section>

        <footer className="rounded-2xl bg-[#111827] text-white p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight">{doc.name}</h3>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">{profile.description || profile.tagline || "Professional programs for your growth."}</p>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              {doc.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {doc.phone}</div>}
              {doc.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {doc.address}</div>}
              {profile.hours && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {profile.hours}</div>}
            </div>
          </div>
        </footer>
      </main>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          {confirmed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" /> Enrollment received
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-[#374151]">
                <p>Thank you, <strong>{confirmed.student_name}</strong>! Your request for <strong>{confirmed.course_name}</strong> has been submitted.</p>
                <p className="text-[#6B7280]">We will contact you at <strong>{confirmed.student_phone}</strong> to confirm your seat.</p>
                <p className="text-xs text-[#9CA3AF]">Reference: {confirmed.id?.slice(0, 8)}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setEnrollOpen(false)} className="w-full rounded-xl bg-[#111827] text-white">Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Enroll in {selectedCourse?.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitEnroll} className="space-y-4">
                <div><Label>Full name</Label><Input required value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} className="rounded-xl mt-1" /></div>
                <div><Label>Phone</Label><Input required value={form.student_phone} onChange={(e) => setForm({ ...form, student_phone: e.target.value })} className="rounded-xl mt-1" inputMode="tel" /></div>
                <div><Label>Email (optional)</Label><Input type="email" value={form.student_email} onChange={(e) => setForm({ ...form, student_email: e.target.value })} className="rounded-xl mt-1" /></div>
                <div><Label>Preferred batch / timing</Label><Input value={form.preferred_batch} onChange={(e) => setForm({ ...form, preferred_batch: e.target.value })} className="rounded-xl mt-1" placeholder="Weekend batch, morning…" /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl mt-1" rows={2} /></div>
                <DialogFooter className="flex-col sm:flex-col gap-2">
                  <Button type="submit" disabled={busy} className="w-full rounded-xl bg-[#111827] text-white">{busy ? "Submitting…" : `Enroll · ₹${Number(selectedCourse?.price || 0).toLocaleString()}`}</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
