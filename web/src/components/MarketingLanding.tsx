'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, MapPin, ShieldCheck, Recycle, Coins, Users,
  ClipboardCheck, Truck, BarChart3, Sparkles, Smartphone, Check,
  Navigation, CircleHelp, Radio, Cpu, Activity, Zap, Compass, Crosshair
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MarketingLanding() {
  const { t } = useLanguage()
  const [activeHotspot, setActiveHotspot] = useState(1)
  const [radarAngle, setRadarAngle] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* ===================== TOP COMMAND NAVBAR ===================== */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/15 bg-[#030712]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <span className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center">
                <Recycle size={22} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
              </span>
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-black text-xl tracking-tight text-white">
                WASTE<span className="text-emerald-400">CHAiN</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SMART CITY OS
                </span>
              </span>
              <span className="hidden text-[10px] font-semibold text-slate-400 sm:block tracking-wider uppercase">
                Autonomous Municipal AI Grid
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400 md:flex">
            <a href="#radar" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <Radio size={13} className="text-emerald-400 animate-pulse" /> Drone Radar
            </a>
            <a href="#how" className="hover:text-emerald-400 transition">Architecture</a>
            <a href="#roles" className="hover:text-emerald-400 transition">Command Portals</a>
            <a href="#telemetry" className="hover:text-emerald-400 transition">Telemetry</a>
            <a href="#faq" className="hover:text-emerald-400 transition">Protocol FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]"
            >
              <span>{t('landing.login_btn') || 'Access Portal'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ===================== HERO: NIGHT DRONE SMART CITY VIEW ===================== */}
      <section className="relative isolate min-h-[95vh] flex flex-col justify-center items-center overflow-hidden pt-12 pb-20">
        {/* Night Drone City Aerial Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 mix-blend-screen opacity-45 transition-transform duration-1000"
          style={{ backgroundImage: 'url(/drone-smart-city-night.jpg), url(/smart-city-bg.jpg)' }}
        />

        {/* Ambient Dark Gradients & Cyber Scanlines */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/50 to-[#030712]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Cyber HUD Grid Lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-5 text-center flex flex-col items-center">
          {/* Telemetry Badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-[#030712]/85 backdrop-blur-xl px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Drone Mesh // Sector 04 Munger District</span>
          </div>

          {/* Epic Main Headline */}
          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            Autonomous Waste
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
              Intelligence Grid.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base sm:text-xl font-normal leading-relaxed text-slate-300">
            Real-time drone spatial telemetry, multimodal Gemini vision verification, and automated collector dispatch routing — engineered for zero-latency municipal cleanliness.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-8 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]"
            >
              <span>Launch Operations Portal</span>
              <ArrowRight size={18} />
            </Link>
            <a
              href="#radar"
              className="w-full sm:w-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-[#061811]/70 backdrop-blur-xl px-8 text-sm font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-950/80 hover:border-emerald-400/60"
            >
              <Radio size={16} className="text-emerald-400" />
              <span>Explore Live Radar</span>
            </a>
          </div>

          {/* Live Telemetry Floating Strip */}
          <div className="mt-14 w-full max-w-4xl rounded-2xl border border-emerald-500/20 bg-[#061510]/80 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Autonomous Fleet</span>
                <span className="text-2xl font-black text-white mt-1 block">48 Units</span>
                <span className="text-[10px] font-semibold text-emerald-400">● 100% Active On Grid</span>
              </div>
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Avg Dispatch Speed</span>
                <span className="text-2xl font-black text-white mt-1 block">18.4 Mins</span>
                <span className="text-[10px] font-semibold text-teal-300">↓ 62% Faster Routing</span>
              </div>
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Waste Recovered</span>
                <span className="text-2xl font-black text-white mt-1 block">14,820 KG</span>
                <span className="text-[10px] font-semibold text-emerald-400">98.4% Verified Recycled</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Audit Registry</span>
                <span className="text-2xl font-black text-white mt-1 block">PostgreSQL</span>
                <span className="text-[10px] font-semibold text-teal-300">Neon Cloud Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== INTERACTIVE DRONE RADAR HUD ===================== */}
      <section id="radar" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 relative">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
                <Crosshair size={15} /> Geospatial Telemetry Feed
              </div>
              <h2 className="text-3xl font-black sm:text-5xl tracking-tight text-white">
                Live District Drone Dispatch
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR SCANNING: 360° ACTIVE</span>
            </div>
          </div>

          {/* Interactive Radar Terminal Box */}
          <div className="grid lg:grid-cols-12 gap-6 rounded-3xl border border-emerald-500/30 bg-[#05130e]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
            {/* Left: The Circular Radar Scope */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/60 border border-emerald-500/20 relative min-h-[380px] overflow-hidden">
              {/* Radar Rings */}
              <div className="absolute w-[320px] h-[320px] rounded-full border border-emerald-500/20" />
              <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-500/30" />
              <div className="absolute w-[160px] h-[160px] rounded-full border border-emerald-500/40" />
              <div className="absolute w-[80px] h-[80px] rounded-full border border-emerald-500/60" />
              <div className="absolute w-full h-[1px] bg-emerald-500/20" />
              <div className="absolute h-full w-[1px] bg-emerald-500/20" />

              {/* Rotating Sweep Line */}
              <div
                className="absolute w-[160px] h-[160px] origin-bottom-right"
                style={{
                  top: 'calc(50% - 160px)',
                  left: 'calc(50% - 160px)',
                  transform: `rotate(${radarAngle}deg)`,
                  background: 'conic-gradient(from 0deg at 100% 100%, rgba(16, 185, 129, 0.4) 0deg, transparent 60deg)',
                }}
              />

              {/* Pulsing Hotspot Target Markers */}
              <button
                onClick={() => setActiveHotspot(1)}
                className={`absolute top-1/4 left-1/3 flex flex-col items-center transition-all ${activeHotspot === 1 ? 'scale-125 z-20' : 'opacity-70'}`}
              >
                <span className="h-4 w-4 rounded-full bg-emerald-400 animate-pulse border-2 border-white shadow-[0_0_15px_#10b981]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 mt-1 bg-black/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  SECTOR-A · BIO 24KG
                </span>
              </button>

              <button
                onClick={() => setActiveHotspot(2)}
                className={`absolute bottom-1/3 right-1/4 flex flex-col items-center transition-all ${activeHotspot === 2 ? 'scale-125 z-20' : 'opacity-70'}`}
              >
                <span className="h-4 w-4 rounded-full bg-amber-400 animate-pulse border-2 border-white shadow-[0_0_15px_#f59e0b]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mt-1 bg-black/80 px-2 py-0.5 rounded border border-amber-500/40">
                  SECTOR-C · PLASTIC 48KG
                </span>
              </button>

              <button
                onClick={() => setActiveHotspot(3)}
                className={`absolute top-2/3 left-1/4 flex flex-col items-center transition-all ${activeHotspot === 3 ? 'scale-125 z-20' : 'opacity-70'}`}
              >
                <span className="h-4 w-4 rounded-full bg-cyan-400 animate-pulse border-2 border-white shadow-[0_0_15px_#06b6d4]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 mt-1 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/40">
                  UNIT #09 DISPATCHED
                </span>
              </button>

              {/* Center Radar Node */}
              <div className="z-10 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_#10b981]">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <span className="absolute bottom-3 left-4 text-[10px] font-mono text-emerald-400/60 uppercase">
                LAT: 25.3756° N // LON: 86.4741° E // ALT: 120M
              </span>
            </div>

            {/* Right: Live Drone Mission Feed */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Mission Control Telemetry
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">STATUS: NOMINAL</span>
                </div>

                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>HOTSPOT #{activeHotspot === 1 ? '0482' : activeHotspot === 2 ? '0483' : '0484'}</span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">VERIFIED VIA GEMINI AI</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                      {activeHotspot === 1 && 'High-density organic waste detected near Gandhi Chowk. Automatic routing queued for Collector #04.'}
                      {activeHotspot === 2 && 'Plastic packaging & cardboard cluster flagged. Route efficiency score 94.8%.'}
                      {activeHotspot === 3 && 'Truck #09 in-route. Real-time Leaflet tracking broadcast to citizen reporter.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-slate-400">Response ETA</span>
                    <span className="text-white font-bold text-sm">~ 14 mins</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-slate-400">Incentive Credit</span>
                    <span className="text-emerald-400 font-bold text-sm">+50 Eco Tokens</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <span>Authorize & Connect Dispatcher</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== WORKFLOW PILLARS ===================== */}
      <section id="how" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 bg-[#05110b]/60">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              End-To-End Operational Protocol
            </span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
              How The Autonomous Grid Operates.
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              From live camera capture to automated collector dispatch, every step is synchronized in real-time across cloud database, mobile APK, and web command dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Live Camera Capture',
                desc: 'Fraud-proof live camera upload with GPS location pin. Gallery uploads strictly blocked for authenticity.',
              },
              {
                step: '02',
                icon: Cpu,
                title: 'Gemini AI Telemetry',
                desc: 'Multimodal AI classifies waste composition (Plastic, Organic, Metal) and calculates estimated tonnage.',
              },
              {
                step: '03',
                icon: Truck,
                title: 'Smart Fleet Routing',
                desc: 'District administrators dispatch available electric collectors with turn-by-turn OpenStreetMap vector routes.',
              },
              {
                step: '04',
                icon: Coins,
                title: 'Tokenized Audit Trail',
                desc: 'Pickup verification releases instant reward points to citizen wallets while updating municipal cleanliness index.',
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

      {/* ===================== THREE COMMAND PORTALS ===================== */}
      <section id="roles" className="py-24 px-5 md:px-8 border-t border-emerald-500/10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                Multi-Role Infrastructure
              </span>
              <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
                Engineered For Every Node.
              </h2>
            </div>
            <p className="max-w-md text-slate-400 text-sm leading-relaxed">
              Dedicated interfaces designed specifically for community reporters, field collectors, and city municipal directors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Citizens */}
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Users size={32} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    CITIZEN APP
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Residents & Citizens</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Spot a hotspot, take an authentic live camera photo, verify with AI, and track collector pickup in real-time while earning eco-token rewards.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Fast2SMS OTP Instant Login</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Zomato-grade Bold Mobile Typography</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Live Status Timeline</li>
              </ul>
            </div>

            {/* Collectors */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0c291d] to-[#05140e] p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:border-emerald-400/60 transition">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Truck size={32} className="text-teal-400" />
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-black uppercase tracking-widest text-teal-300">
                    FIELD COLLECTOR
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Sanitation Fleets</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Receive admin-assigned pickup tasks on your mobile device. View turn-by-turn map coordinates and confirm collection with one tap.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Real-Time OpenStreetMap Navigation</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Admin-Approved Security Gate</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-teal-400" /> Direct Weight & Material Log</li>
              </ul>
            </div>

            {/* Administrators */}
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <ClipboardCheck size={32} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    DISTRICT ADMIN
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Municipal Command</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Comprehensive web dispatch console to monitor city hotspots, manage field collectors, approve roles, and audit impact data.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/15 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Full-Screen Interactive Dispatch Map</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> One-Click Collector Assignment</li>
                <li className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> Instant CSV Analytics Export</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROTOCOL FAQ ===================== */}
      <section id="faq" className="py-24 px-5 md:px-8 border-t border-emerald-500/10 bg-[#040d09]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <CircleHelp size={28} className="mx-auto text-emerald-400 mb-3" />
            <h2 className="text-3xl font-black sm:text-5xl text-white tracking-tight">
              Protocol Specifications
            </h2>
          </div>

          <div className="space-y-4">
            {[
              ['How does live fraud prevention work in the mobile APK?', 'The mobile app strictly enforces live camera capture using the device hardware sensors and automatically captures exact GPS coordinates. Gallery/file picker uploads are permanently disabled to prevent duplicate or falsified reports.'],
              ['How does Google & Web3Auth authentication work?', 'The web platform uses Web3Auth which supports Google sign-in and email passwordless access. Verified session signatures are validated on serverless route handlers and recorded into Neon PostgreSQL.'],
              ['Which map provider is utilized for collector tracking?', 'OpenStreetMap vector tiles are embedded natively without requiring costly Google Maps billing or API keys, ensuring zero-downtime mapping.'],
              ['How do municipal administrators get authority?', 'The district command dashboard is tied to verified administrator email credentials. Once signed in, administrators have full override dispatch permissions across all regional zones.'],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-emerald-500/20 bg-[#071811] p-6 transition-all duration-300 hover:border-emerald-400/40"
              >
                <summary className="cursor-pointer list-none font-bold text-white text-base flex items-center justify-between">
                  <span>{q}</span>
                  <span className="text-emerald-400 text-xl transition-transform group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3.5 text-sm leading-relaxed text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
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
            Autonomous Smart City Waste & Dispatch OS · OpenStreetMap Contributors · NeonDB PostgreSQL
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              All Systems Operational
            </span>
            <Link href="/login" className="hover:text-white transition">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
