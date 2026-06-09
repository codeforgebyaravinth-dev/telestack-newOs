import { Link } from "react-router-dom";

export default function Home() {
  const features = [
    "Cloud + Offline Playback",
    "Android TV Compatible",
    "Remote Screen Control",
    "Dealer Management System",
    "Emergency Broadcast",
    "Playlist Scheduling",
  ];

  const industries = [
    "Restaurants",
    "Retail Stores",
    "Hospitals",
    "Housing Societies",
    "Salons & Clinics",
    "Corporate Offices",
  ];

  return (
    <div className="min-h-screen bg-[#070B16] text-white font-sans">
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#070B16]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RP Signage" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-xl font-bold">RP Signage</h1>
              <p className="text-xs text-gray-400">Digital Signage Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#features" className="hover:text-orange-400 transition">Features</a>
            <a href="#industries" className="hover:text-orange-400 transition">Industries</a>
            <a href="#dealer" className="hover:text-orange-400 transition">Dealers</a>
            <a href="#contact" className="hover:text-orange-400 transition">Contact</a>
          </nav>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl border border-white/20 hover:border-orange-400 transition inline-flex items-center"
            >
              Login
            </Link>
            <a
              href="#contact"
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 transition font-semibold text-black"
            >
              Book Demo
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm mb-6">
            India&apos;s Smart Digital Signage Platform
          </div>

          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            One Panel.
            <br />
            Unlimited Screens.
          </h2>

          <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
            Manage Android TVs, digital standees, menu boards and cloud signage from a single dashboard.
            Designed for dealers, businesses and enterprises.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link
              to="/login"
              className="px-7 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 transition font-bold text-black shadow-lg shadow-orange-500/20"
            >
              Start Free Trial
            </Link>

            <a
              href="#dealer"
              className="px-7 py-4 rounded-2xl border border-white/20 hover:border-orange-400 transition"
            >
              Dealer Registration
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {features.map((item) => (
              <div
                key={item}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
          <div className="relative bg-gradient-to-br from-[#111827] to-[#0B1220] rounded-[32px] border border-white/10 p-6 shadow-2xl overflow-hidden">
            <img src="/banner.png" alt="RP Signage displays" className="w-full rounded-2xl" />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-orange-400 font-semibold mb-3">WHY RP SIGNAGE</p>
            <h3 className="text-4xl font-bold mb-4">Built for Modern Digital Displays</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful cloud dashboard with support for Android TVs, standees, USB playback and dealer management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Cloud Dashboard", desc: "Manage all screens remotely from one panel." },
              { title: "Hybrid Playback", desc: "Supports cloud + USB offline playback." },
              { title: "Dealer System", desc: "Create clients, recharge wallets and manage subscriptions." },
              { title: "Emergency Broadcast", desc: "Instantly push emergency alerts to all screens." },
              { title: "Smart Scheduling", desc: "Schedule playlists by date, time and location." },
              { title: "Live Monitoring", desc: "Monitor online/offline devices in real time." },
            ].map((card) => (
              <div
                key={card.title}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-2xl mb-5">
                  ⚡
                </div>
                <h4 className="text-2xl font-semibold mb-3">{card.title}</h4>
                <p className="text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="py-20 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-orange-400 font-semibold mb-3">INDUSTRIES</p>
            <h3 className="text-4xl font-bold">Solutions for Every Business</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <div
                key={industry}
                className="p-8 rounded-3xl bg-[#101827] border border-white/10 hover:border-orange-500/40 transition text-center"
              >
                <div className="text-5xl mb-4">📺</div>
                <h4 className="text-2xl font-semibold">{industry}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dealer" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-[40px] overflow-hidden border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-blue-500/10 p-10 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-orange-400 font-semibold mb-3">DEALER PROGRAM</p>
                <h3 className="text-5xl font-bold leading-tight mb-6">
                  Start Your Own Digital Signage Business
                </h3>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Join RP Signage dealer network and manage multiple clients with your own dashboard, wallet system and subscription plans.
                </p>
                <div className="space-y-4 text-gray-300">
                  <div>✓ White Label Opportunity</div>
                  <div>✓ Multi-client Management</div>
                  <div>✓ Wallet Recharge System</div>
                  <div>✓ Installation Support</div>
                </div>
              </div>

              <div className="bg-[#0B1220] rounded-3xl border border-white/10 p-8 shadow-2xl">
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Total Active Screens</p>
                    <h4 className="text-4xl font-bold">1,248</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400">Dealers</p>
                      <h4 className="text-3xl font-bold">120+</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400">Clients</p>
                      <h4 className="text-3xl font-bold">850+</h4>
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className="block p-5 rounded-2xl bg-orange-500 text-black font-semibold text-center text-lg hover:bg-orange-400 transition"
                  >
                    Become RP Signage Dealer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-5xl font-bold mb-6">Ready to Control Every Screen?</h3>
          <p className="text-xl text-gray-400 mb-10">
            Launch your digital signage network with RP Signage today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 transition font-bold text-black"
            >
              Start Free Trial
            </Link>
            <a
              href="#contact"
              className="px-8 py-4 rounded-2xl border border-white/20 hover:border-orange-400 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-8 text-gray-400">
          <div>
            <h4 className="text-white text-2xl font-bold mb-3">RP Signage</h4>
            <p>Digital Signage Cloud Platform</p>
          </div>
          <div>
            <p>📞 9323037254</p>
            <p>📧 ravi@rp-infotech.com</p>
            <p>🌐 rpsignage.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
