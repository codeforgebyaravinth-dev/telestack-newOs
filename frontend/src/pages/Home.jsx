import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Tv,
  Layers,
  Zap,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Activity,
  Boxes,
  Cpu,
  Sparkles,
  QrCode,
  Users,
  PlaySquare,
  Radio,
  ExternalLink,
  ChevronRight,
  Terminal,
  Database,
  Lock,
  Store,
  Camera,
  Check
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("signage");
  const [liveToken, setLiveToken] = useState(108);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveToken((prev) => (prev >= 115 ? 101 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleCopyEndpoint = () => {
    navigator.clipboard?.writeText("https://telestack-newos.onrender.com/api");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-50 selection:text-indigo-700 antialiased">
      {/* ----------------- TOP NOTIFICATION BANNER ----------------- */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Telestack Ecosystem
        </span>
        <span className="text-slate-300">
          TelestackOS is natively powered by the <strong>Telestack Backend-as-a-Service</strong> platform.
        </span>
        <a href="#baas" className="text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1 inline-flex items-center gap-1">
          Explore BaaS Engine <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* ----------------- NAVIGATION ----------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 flex items-center justify-center text-white shadow-sm shadow-slate-950/20 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-slate-950">Telestack</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-mono font-bold uppercase tracking-wider">
                  OS
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">Displays · Queues · Storefronts</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">OS Capabilities</a>
            <a href="#baas" className="hover:text-slate-950 transition-colors">BaaS Foundation</a>
            <a href="#solutions" className="hover:text-slate-950 transition-colors">Verticals</a>
            <a href="#dealers" className="hover:text-slate-950 transition-colors">Dealers & Fleets</a>
            <Link to="/play" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              <PlaySquare className="w-4 h-4" /> Live Player
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-950 px-4 py-2 rounded-xl transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm shadow-slate-950/15 hover:shadow-md transition-all flex items-center gap-2"
            >
              <span>Control Panel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(99,102,241,0.12),transparent_70%)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3.5xl mx-auto">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Telestack Cloud BaaS Powered</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-mono">v2.4 Active</span>
            </div>

            {/* Main Title */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              The Operating System for <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-slate-950 via-indigo-900 to-indigo-600 bg-clip-text text-transparent">
                Every Screen & Space.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Built on the <strong>Telestack</strong> Backend-as-a-Service infrastructure. Effortlessly drive digital signage, smart voice token queues, and interactive studio storefronts with sub-50ms real-time synchronization.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-950 text-white font-semibold hover:bg-slate-800 transition-all shadow-md shadow-slate-950/20 flex items-center justify-center gap-2"
              >
                <span>Launch TelestackOS Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/play"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Tv className="w-4 h-4 text-indigo-600" />
                <span>Pair Display Screen</span>
              </Link>
            </div>

            {/* Trust bullet row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero-Setup Cloud Pairing</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-Provisioned Custom Domains</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Offline USB + Cloud Hybrid Cache</span>
            </div>
          </div>

          {/* ----------------- INTERACTIVE LIVE DEMO BOARD ----------------- */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
              {/* Window Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 pl-2">telestack-os.internal/live-fleet</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-semibold">
                    <Radio className="w-3 h-3 animate-ping" /> WebSocket Connected (38ms)
                  </span>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 px-2 pb-3 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("signage")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "signage" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" /> Digital Signage & TV Wall
                </button>
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "queue" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Token Queue Board
                </button>
                <button
                  onClick={() => setActiveTab("studio")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "studio" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Studio & Custom Domain Storefront
                </button>
              </div>

              {/* Dynamic Preview Screen */}
              <div className="rounded-xl overflow-hidden bg-slate-950 text-white p-6 min-h-[340px] flex flex-col justify-between relative border border-slate-800">
                {activeTab === "signage" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
                    <div className="md:col-span-8 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-mono text-indigo-300 font-bold bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">
                          Zone 1 · 4K Master Video
                        </span>
                        <span className="text-xs font-mono text-slate-400">PlayList #14 · 60 FPS</span>
                      </div>
                      <div className="my-8">
                        <p className="text-xs text-indigo-400 uppercase tracking-widest font-mono">Grand Promotional Showcase</p>
                        <h3 className="text-2xl sm:text-3xl font-bold font-display mt-1">Festival Seasonal Offers Live</h3>
                        <p className="text-xs text-slate-400 mt-2">Displaying scheduled 4K video canvas across all paired screens.</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-white/10">
                        <span>Device: Sony Bravia 65" 4K</span>
                        <span className="text-emerald-400 font-bold">● Active Online</span>
                      </div>
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-4">
                      <div className="rounded-xl bg-slate-900/90 border border-white/10 p-4 flex-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Zone 2 · Live Ticker</span>
                        <p className="text-sm font-semibold mt-2 text-slate-200">✨ Welcome to Star Digital Studios! Book your wedding shoots today.</p>
                      </div>
                      <div className="rounded-xl bg-slate-900/90 border border-white/10 p-4 flex-1 flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Zone 3 · Weather & Time</span>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-2xl font-bold text-amber-400">28°C</span>
                          <span className="text-sm font-mono text-slate-300">Coimbatore, IN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "queue" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center my-auto">
                    <div className="rounded-xl bg-slate-900 border border-white/10 p-6 flex flex-col items-center justify-center">
                      <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Now Serving</span>
                      <div className="text-6xl font-black font-display text-emerald-400 my-2">#{liveToken}</div>
                      <span className="text-xs text-slate-400">Counter 1 · Express Desk</span>
                    </div>
                    <div className="rounded-xl bg-slate-900 border border-white/10 p-6 flex flex-col items-center justify-center">
                      <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Next in Line</span>
                      <div className="text-4xl font-black font-display text-amber-400 my-3">#{liveToken + 1}</div>
                      <span className="text-xs text-slate-400">Counter 2 · Photography</span>
                    </div>
                    <div className="rounded-xl bg-slate-900 border border-white/10 p-6 flex flex-col items-center justify-center">
                      <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Est. Wait Time</span>
                      <div className="text-4xl font-black font-display text-indigo-400 my-3">~8 mins</div>
                      <span className="text-xs text-slate-400">Auto-calculated by BaaS</span>
                    </div>
                  </div>
                )}

                {activeTab === "studio" && (
                  <div className="space-y-4 my-auto">
                    <div className="rounded-xl bg-slate-900/95 border border-indigo-500/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono mb-2">
                          <Globe className="w-3 h-3" /> Custom Domain Engine
                        </div>
                        <h4 className="text-xl font-bold font-display text-white">stardigitalstudios.telestack.dev</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Automated SSL, Custom Product Categories & WhatsApp Direct Ordering.</p>
                      </div>
                      <Link
                        to="/login"
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        Manage Storefront →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      {["Customised Gifts", "Photo Frames", "Digital Printing", "Passport & ID"].map((cat, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-900 border border-white/10">
                          <span className="text-[10px] font-mono text-indigo-400">Category #{i + 1}</span>
                          <p className="text-xs font-bold text-slate-200 mt-1">{cat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- THE TELESTACK BAAS FOUNDATION ----------------- */}
      <section id="baas" className="py-24 border-t border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
              Architecture & Backbone
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mt-4 tracking-tight">
              Powered by the Telestack BaaS Cloud
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              TelestackOS isn’t a standalone frontend widget. It is built natively on top of <strong>Telestack</strong> — the high-performance Backend-as-a-Service providing real-time data streaming, object storage, and fleet orchestration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-950">Multi-Tenant Data Fabric</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Client isolation with structured collections for devices, templates, schedules, products, categories, and customer appointments.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Isolated tenant indexing</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Scalable MongoDB Atlas cluster</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-950">Realtime Event Bus & Sockets</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Ultra-low latency pub/sub powered by Redis & WebSockets. Push live token calls, emergency announcements, and playlist swaps in real time.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Sub-50ms token broadcast</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Instant emergency override</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-950">Automated Custom Domains & SSL</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Each client can bind their own vanity subdomain or domain (like <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-purple-700">stardigitalstudios.telestack.dev</code>) with zero server configuration.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Dynamic Host Resolver</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Cloud-ready CORS headers</li>
              </ul>
            </div>
          </div>

          {/* Backend API Snippet Bar */}
          <div className="mt-8 rounded-2xl bg-slate-950 border border-slate-800 p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Telestack BaaS Endpoint:</span>
              <span className="text-emerald-300 font-semibold">https://telestack-newos.onrender.com/api</span>
            </div>
            <button
              onClick={handleCopyEndpoint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? "Copied" : "Copy API URL"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ----------------- VERTICAL SOLUTIONS GRID ----------------- */}
      <section id="solutions" className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Tailored Verticals
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mt-4 tracking-tight">
              One Operating System for Every Space
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              TelestackOS adapts instantly to your industry with dedicated UI engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-950">Studios & Photography</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Showcase shoots, offer customizable gift hampers, photo frames, and enable direct WhatsApp booking.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-950">Salons & Spas</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Smart queue displays, service menus, stylist assignment, and live waiting room time calculation.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-950">Clinics & Healthcare</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Voice token calling, doctor schedule boards, multi-department routing, and patient SMS notifications.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-950">Retail & Video Walls</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                High-definition product catalogs, flash discount tickers, standee displays, and multi-screen sync.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- DEALER & ENTERPRISE FLEET ----------------- */}
      <section id="dealers" className="py-20 border-t border-slate-100 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full">
                White-Label & Resellers
              </span>
              <h3 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mt-4 leading-tight">
                Build & Scale Your Signage Business on TelestackOS
              </h3>
              <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
                Join our network of authorized dealers. Provision client dashboards, recharge prepaid wallets, allocate screen licenses, and remotely control hundreds of devices from your dealer console.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold font-display text-white">100%</div>
                  <div className="text-xs text-slate-400 mt-1">White-Label Branding</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold font-display text-emerald-400">Prepaid</div>
                  <div className="text-xs text-slate-400 mt-1">Wallet & Credit System</div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
                >
                  <span>Become a TelestackOS Dealer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-7 shadow-2xl">
              <h4 className="font-bold text-base text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Dealer Multi-Tenant Capabilities
              </h4>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Create & manage unlimited client spaces with custom permissions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Configure client vertical types (Studio, Salon, Clinic, Retailer).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Assign vanity custom domains with automated SSL generation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Live remote health telemetry on every paired Android TV / Standee.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- CLEAN FOOTER ----------------- */}
      <footer className="border-t border-slate-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white text-xs font-bold font-mono">
              T
            </div>
            <div>
              <span className="font-display font-bold text-base text-slate-900">TelestackOS</span>
              <p className="text-xs text-slate-500 font-mono">A product of the Telestack BaaS platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <Link to="/login" className="hover:text-slate-950 transition-colors">Control Panel</Link>
            <Link to="/play" className="hover:text-slate-950 transition-colors">Signage Player</Link>
            <a href="https://telestack.dev" target="_blank" rel="noreferrer" className="hover:text-slate-950 transition-colors flex items-center gap-1">
              Telestack Platform <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">© 2026 Telestack. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
