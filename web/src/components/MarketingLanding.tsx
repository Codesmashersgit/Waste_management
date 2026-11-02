'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, MapPin, ShieldCheck, Recycle, Coins, Users,
  ClipboardCheck, Truck, BarChart3, Sparkles, Check,
  CircleHelp, Cpu, Zap,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MarketingLanding() {
  const { t } = useLanguage()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/15 bg-[#030712]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <span className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center">
                <Recycle size={22} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
              </span>
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-black text-xl tracking-tight text-white">
                WASTE<span className="text-emerald-400">CHAiN</span>
              </span>
              <span className="hidden text-[10px] font-semibold text-slate-400 sm:block tracking-wider uppercase">
                Smart Waste Management Platform
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400 md:flex">
            <a href="#how" className="hover:text-emerald-400 transition">How It Works</a>
            <a href="#roles" className="hover:text-emerald-400 transition">Who Is It For</a>
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#faq" className="hover:text-emerald-400 transition">FAQ</a>
          </nav>

          {/* Login CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Login</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative isolate min-h-[92vh] flex flex-col justify-center items-center overflow-hidden pt-12 pb-20">
        {/* Background city image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url(/drone-smart-city-night.jpg), url(/smart-city-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-[#030712]/50 to-[#030712]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/25 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 text-center flex flex-col items-center">
          {/* Live badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-[#030712]/85 backdrop-blur-xl px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live · Smart City Waste Management</span>
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            Clean Cities,<br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Smarter Way.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base sm:text-xl font-normal leading-relaxed text-slate-300">
            Report waste with a live photo, track collector pickup in real-time, and earn rewards — all powered by AI verification and an automated dispatch system.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-8 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how"
              className="w-full sm:w-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-[#061811]/70 backdrop-blur-xl px-8 text-sm font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-950/80 hover:border-emerald-400/60"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-14 w-full max-w-4xl rounded-2xl border border-emerald-500/20 bg-[#061510]/80 backdrop-blur-2xl p-4 sm:p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Active Collectors', value: '48+', sub: '100% On Duty' },
                { label: 'Avg Pickup Time', value: '18 Mins', sub: '↓ 62% Faster' },
                { label: 'Waste Collected', value: '14,820 KG', sub: '98% Recycled' },
                { label: 'Reports Resolved', value: '2,400+', sub: 'AI Verified' },
              ].map((s, i) => (
                <div key={i} className={i < 3 ? 'border-r border-emerald-500/10 pr-3' : ''}>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">{s.label}</span>
                  <span className="text-2xl font-black text-white mt-1 block">{s.value}</span>
                  <span className="text-[10px] font-semibold text-emerald-400">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 bg-[#05110b]/60">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Step by Step</span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
              How It Works
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              From reporting a waste spot to confirmed pickup — fully automated, transparent, and rewarding for everyone involved.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01', icon: Camera,
                title: 'Take a Live Photo',
                desc: 'Open the app, click a live photo of the waste spot. GPS location is auto-captured. Gallery uploads are blocked to prevent fake reports.',
              },
              {
                step: '02', icon: Cpu,
                title: 'AI Verifies the Waste',
                desc: 'Gemini AI analyzes the photo, classifies waste type (Plastic, Organic, Metal), and estimates quantity automatically.',
              },
              {
                step: '03', icon: Truck,
                title: 'Collector Gets Dispatched',
                desc: 'Admin assigns the nearest available collector. You can track pickup progress live on the map.',
              },
              {
                step: '04', icon: Coins,
                title: 'Earn Reward Points',
                desc: 'Once waste is collected and verified, eco-reward points are instantly added to your wallet.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="group relative rounded-3xl border border-emerald-500/20 bg-[#071812]/80 backdrop-blur-xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/50 hover:shadow-[0_0_35px_rgba(16,185,129,0.18)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </span>
                  <span className="text-2xl font-black text-emerald-500/30 font-mono">{step}</span>
                </div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section id="roles" className="py-24 px-5 md:px-8 border-t border-emerald-500/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Built For Everyone</span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">Who Is It For?</h2>
            <p className="mt-4 max-w-xl mx-auto text-slate-400 text-sm leading-relaxed">
              Dedicated interfaces designed for citizens, field collectors, and city administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Citizens */}
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Users size={32} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">Citizen App</span>
                </div>
                <h3 className="text-2xl font-black text-white">For Residents</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Spot waste near you, report it with a live photo, and track pickup in real-time while earning eco-token rewards.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> OTP Login via Fast2SMS</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Live Camera + GPS Photo</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Real-time Pickup Tracking</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Eco Reward Points Wallet</li>
              </ul>
            </div>

            {/* Collectors */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0c291d] to-[#05140e] p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:border-emerald-400/60 transition">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Truck size={32} className="text-teal-400" />
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-black uppercase tracking-widest text-teal-300">Field Collector</span>
                </div>
                <h3 className="text-2xl font-black text-white">For Collectors</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Get assigned pickup tasks on your phone. View location on map, navigate there, and confirm collection with one tap.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Task Notifications</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> OpenStreetMap Navigation</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Live GPS Location Sharing</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Weight & Material Logging</li>
              </ul>
            </div>

            {/* Admins */}
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <ClipboardCheck size={32} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">Admin</span>
                </div>
                <h3 className="text-2xl font-black text-white">For Administrators</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Web dashboard to monitor all complaints, manage collectors, approve roles, dispatch pickups, and view analytics.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Full-Screen Live Dispatch Map</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> One-Click Collector Assignment</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Approve / Reject Collectors</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Analytics & Reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section id="features" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 bg-[#05110b]/60">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Platform Highlights</span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">Key Features</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Fraud-Proof Reporting', desc: 'Live camera mandatory — no gallery uploads. GPS coordinates auto-captured with every report.' },
              { icon: Sparkles, title: 'Gemini AI Classification', desc: 'Google Gemini AI identifies waste type and quantity from the photo automatically.' },
              { icon: MapPin, title: 'Live Map Tracking', desc: 'Real-time OpenStreetMap showing complaint pins and collector positions. Full-screen mode available.' },
              { icon: Zap, title: 'Instant Dispatch', desc: 'Admin assigns collector with one click. Collector gets notified instantly on their app.' },
              { icon: Coins, title: 'Reward System', desc: 'Citizens earn eco-points for verified waste reports. Points redeemable for rewards.' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track total waste collected, collector performance, and city cleanliness trends over time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-emerald-500/20 bg-[#071812]/80 p-6 transition-all hover:border-emerald-400/40 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </span>
                <h3 className="text-base font-black text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 bg-[#040d09]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <CircleHelp size={28} className="mx-auto text-emerald-400 mb-3" />
            <h2 className="text-3xl font-black sm:text-5xl text-white tracking-tight">Frequently Asked</h2>
          </div>

          <div className="space-y-3">
            {[
              ['How do I report waste?', 'Download the WasteCHAiN mobile app, register with your phone number via OTP, and tap "Report Waste". Click a live photo — the GPS location is auto-captured and AI verifies the waste.'],
              ['Can I upload a photo from my gallery?', 'No. Gallery uploads are permanently disabled to prevent fake or duplicate reports. Only live camera captures are accepted.'],
              ['How does AI verification work?', 'Google Gemini AI analyzes each live photo and classifies the waste type (Plastic, Organic, Metal, etc.) and estimates quantity. This ensures accurate data for collectors.'],
              ['How do I become a collector?', 'Apply through the mobile app. Your request goes to the district administrator for review. Once approved, you receive dispatch tasks directly on your phone.'],
              ['How do reward points work?', 'After a collector picks up and confirms the waste you reported, eco-reward points are instantly credited to your wallet in the app.'],
              ['Which map does the platform use?', 'We use OpenStreetMap — free, open-source, and works across all of India without any API billing.'],
            ].map(([q, a], i) => (
              <div
                key={i}
                className="rounded-2xl border border-emerald-500/20 bg-[#071811] overflow-hidden transition-all hover:border-emerald-400/30"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-white text-sm"
                >
                  <span>{q}</span>
                  <span className={`text-emerald-400 text-xl shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>＋</span>
                </button>
                {openFaq === i && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-emerald-500/15 bg-[#02060d] py-12 px-5 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Recycle size={20} />
            </span>
            <span className="font-black text-lg tracking-tight text-white">
              WASTE<span className="text-emerald-400">CHAiN</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Smart Waste Management Platform · Built with ❤️ for cleaner cities · © 2025 WasteCHAiN
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              All Systems Live
            </span>
            <Link href="/login" className="hover:text-white transition">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
