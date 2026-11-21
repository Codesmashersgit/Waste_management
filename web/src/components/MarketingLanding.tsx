'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, MapPin, ShieldCheck, Recycle, Coins, Users,
  ClipboardCheck, Truck, BarChart3, Sparkles, Check,
  CircleHelp, Cpu, Zap, Activity, ChevronRight, Eye, RefreshCw
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MarketingLanding() {
  const { t } = useLanguage()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'citizen' | 'collector' | 'admin'>('citizen')
  const [simulatedScan, setSimulatedScan] = useState<'plastic' | 'organic' | 'metal'>('plastic')
  const [isScanning, setIsScanning] = useState(false)

  const handleSimulateScan = (type: 'plastic' | 'organic' | 'metal') => {
    setIsScanning(true)
    setSimulatedScan(type)
    setTimeout(() => setIsScanning(false), 500)
  }

  const scanData = {
    plastic: {
      type: 'High-Density Polymer (Plastic Bottles & Film)',
      volume: 'Est. 38.5 KG',
      confidence: '98.6%',
      urgency: 'HIGH',
      urgencyColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      points: '+45 Eco-Tokens',
      timeToDispatch: '14 mins',
    },
    organic: {
      type: 'Compostable Organic & Food Scrap Cluster',
      volume: 'Est. 62.0 KG',
      confidence: '99.1%',
      urgency: 'CRITICAL',
      urgencyColor: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
      points: '+60 Eco-Tokens',
      timeToDispatch: '8 mins',
    },
    metal: {
      type: 'Ferrous Scrap, Beverage Cans & Foil',
      volume: 'Est. 24.2 KG',
      confidence: '97.4%',
      urgency: 'MEDIUM',
      urgencyColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
      points: '+55 Eco-Tokens',
      timeToDispatch: '20 mins',
    },
  }

  return (
    <main className="overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">

      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#030712]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <span className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center">
                <Recycle size={20} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
              </span>
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-black text-xl tracking-tight text-white">
                WASTE<span className="text-emerald-400">CHAiN</span>
              </span>
              <span className="hidden text-[9px] font-bold text-slate-400 sm:block tracking-widest uppercase">
                Autonomous Municipal OS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-400 md:flex">
            <a href="#scanner" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400 animate-pulse" /> AI Scanner
            </a>
            <a href="#how" className="hover:text-emerald-400 transition">How It Works</a>
            <a href="#roles" className="hover:text-emerald-400 transition">Command Portals</a>
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#faq" className="hover:text-emerald-400 transition">FAQ</a>
          </nav>

          {/* Login CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]"
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative isolate min-h-[95vh] flex flex-col justify-center items-center overflow-hidden pt-12 pb-24">
        {/* Night Drone Backdrop with Screen Blend */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{ backgroundImage: 'url(/drone-smart-city-night.jpg), url(/smart-city-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/75 via-[#030712]/60 to-[#030712]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Ambient Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.12) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(16, 185, 129, 0.12) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center flex flex-col items-center">
          {/* Live Status Badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-[#030712]/90 backdrop-blur-xl px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Autonomous Municipal Waste Intelligence Grid</span>
          </div>

          {/* Epic Main Headline */}
          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            Clean Cities.<br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
              Automated Future.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-slate-300">
            Real-time geospatial incident tracking, fraud-proof live camera reporting, multimodal Gemini AI vision classification, and automated municipal collector dispatch routing.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-8 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch Operations Portal</span>
              <ArrowRight size={16} />
            </Link>
            <a
              href="#scanner"
              className="w-full sm:w-auto inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-[#061811]/80 backdrop-blur-xl px-7 text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-950/80 hover:border-emerald-400/60"
            >
              <Eye size={15} className="text-emerald-400" />
              <span>Interactive AI Demo</span>
            </a>
          </div>

          {/* Live Telemetry Floating Strip */}
          <div className="mt-12 w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-[#061510]/80 backdrop-blur-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Autonomous Fleet</span>
                <span className="text-2xl font-black text-white mt-1 block">48 Units</span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">● 100% Active On Grid</span>
              </div>
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Avg Dispatch Speed</span>
                <span className="text-2xl font-black text-white mt-1 block">18.4 Mins</span>
                <span className="text-[10px] font-semibold text-teal-300">↓ 62% Faster Routing</span>
              </div>
              <div className="border-r border-emerald-500/10 pr-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Waste Recovered</span>
                <span className="text-2xl font-black text-white mt-1 block">14,820 KG</span>
                <span className="text-[10px] font-semibold text-emerald-400">98.4% Verified Recycled</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Audit Registry</span>
                <span className="text-2xl font-black text-white mt-1 block">PostgreSQL</span>
                <span className="text-[10px] font-semibold text-teal-300">Neon Cloud Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE AI VISION SCANNER DEMO WIDGET (LOVABLE TIER) ── */}
      <section id="scanner" className="py-24 px-5 md:px-8 border-t border-white/[0.08] relative">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
                <Sparkles size={14} /> Interactive Gemini Multimodal Vision Telemetry
              </div>
              <h2 className="text-3xl font-black sm:text-5xl tracking-tight text-white">
                Live Waste Classification Simulator
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>AI INFERENCE ENGINE READY</span>
            </div>
          </div>

          {/* Interactive Simulation Sandbox */}
          <div className="grid lg:grid-cols-12 gap-6 rounded-3xl border border-white/[0.1] bg-[#071811]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
            {/* Left: Viewport */}
            <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl bg-black/60 border border-white/[0.08] min-h-[340px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                  <Activity size={15} /> LIVE CAMERA SENSOR FEED
                </div>
                <span className="text-[10px] font-mono text-slate-400">GPS: 25.3756° N, 86.4744° E</span>
              </div>

              {/* Bounding Box Visualizer */}
              <div className="relative my-8 flex items-center justify-center">
                <div className="w-56 h-36 rounded-2xl border-2 border-dashed border-emerald-400/80 bg-emerald-500/5 flex flex-col items-center justify-center p-4 relative shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  {/* Corner Target Markers */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

                  {isScanning ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400">
                      <RefreshCw size={24} className="animate-spin" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Running Gemini Vision AI...</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl block mb-1">
                        {simulatedScan === 'plastic' && '🧴'}
                        {simulatedScan === 'organic' && '🥗'}
                        {simulatedScan === 'metal' && '🥫'}
                      </span>
                      <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                        {simulatedScan.toUpperCase()} DETECTED
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 mt-1">
                        CONFIDENCE: {scanData[simulatedScan].confidence}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Switcher Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.08]">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Test Sample:</span>
                <div className="flex gap-2">
                  {(['plastic', 'organic', 'metal'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSimulateScan(type)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        simulatedScan === type
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-gray-900 border border-white/[0.08] text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Telemetry Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Inference Diagnostics
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${scanData[simulatedScan].urgencyColor}`}>
                    PRIORITY: {scanData[simulatedScan].urgency}
                  </span>
                </div>

                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08]">
                    <span className="text-slate-400 block text-[10px] uppercase">Classified Material</span>
                    <span className="text-white font-bold text-sm mt-1 block">
                      {scanData[simulatedScan].type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.08]">
                      <span className="text-slate-400 block text-[10px] uppercase">Tonnage Estimate</span>
                      <span className="text-emerald-300 font-bold text-sm mt-1 block">{scanData[simulatedScan].volume}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.08]">
                      <span className="text-slate-400 block text-[10px] uppercase">Incentive Credit</span>
                      <span className="text-emerald-400 font-bold text-sm mt-1 block">{scanData[simulatedScan].points}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Rider Route ETA</span>
                    <span className="text-teal-300 font-bold text-sm">~ {scanData[simulatedScan].timeToDispatch}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
              >
                <span>Authorize & Access Live Fleet Radar</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: HOW IT WORKS ── */}
      <section id="how" className="py-24 px-5 md:px-8 border-t border-white/[0.08] bg-[#05110b]/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              End-To-End Autonomous Pipeline
            </span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
              Engineered for Zero Operational Latency
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              From hardware camera fraud prevention to turn-by-turn collector navigation, every component coordinates across cloud databases, Android APK, and web command console.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Live Camera Capture',
                desc: 'Fraud-proof camera capture with embedded GPS. Gallery and file picker uploads are permanently disabled at code level.',
              },
              {
                step: '02',
                icon: Cpu,
                title: 'Gemini AI Telemetry',
                desc: 'Multimodal AI vision analyzes composition (Plastic, Organic, Metal) and calculates estimated tonnage automatically.',
              },
              {
                step: '03',
                icon: Truck,
                title: 'Smart Fleet Routing',
                desc: 'Administrators dispatch available electric collectors with turn-by-turn OpenStreetMap vector routes.',
              },
              {
                step: '04',
                icon: Coins,
                title: 'Tokenized Audit Trail',
                desc: 'Pickup verification releases instant reward points to citizen wallets while updating municipal cleanliness indexes.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="group relative rounded-3xl border border-white/[0.08] bg-[#071812]/80 backdrop-blur-xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/40 hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 group-hover:scale-110 transition-transform">
                    <Icon size={22} />
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

      {/* ── THREE COMMAND PORTALS ── */}
      <section id="roles" className="py-24 px-5 md:px-8 border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              Role-Specific Interfaces
            </span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
              Engineered For Every Node
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-slate-400 text-sm leading-relaxed">
              Tailored interfaces designed for resident citizens, field collectors, and city municipal directors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Citizens */}
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Users size={30} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    CITIZEN APP
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Residents & Citizens</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Spot a hotspot, take an authentic live camera photo, verify with AI, and track collector pickup in real-time while earning eco-token rewards.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-white/[0.08] pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Fast2SMS OTP Instant Login</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Live Hardware Camera + GPS Location</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Real-Time Pickup Status Timeline</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Eco Reward Points & Leaderboard</li>
              </ul>
            </div>

            {/* Collectors */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0c291d] to-[#05140e] p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.12)] hover:border-emerald-400/60 transition">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Truck size={30} className="text-teal-400" />
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-black uppercase tracking-widest text-teal-300">
                    FIELD COLLECTOR
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Sanitation Fleets</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Receive admin-assigned pickup tasks on your mobile device. View turn-by-turn map coordinates and confirm collection with one tap.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-emerald-500/20 pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Real-Time OpenStreetMap Navigation</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Admin-Approved Security Gate</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Direct Weight & Material Log</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Live Location Telemetry Streaming</li>
              </ul>
            </div>

            {/* Administrators */}
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#081d15] to-[#040e0a] p-8 flex flex-col justify-between transition hover:border-emerald-400/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <ClipboardCheck size={30} className="text-emerald-400" />
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    DISTRICT ADMIN
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">For Municipal Command</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Comprehensive web dispatch console to monitor city hotspots, manage field collectors, approve roles, and audit impact data.
                </p>
              </div>
              <ul className="mt-8 space-y-2.5 text-xs text-slate-300 border-t border-white/[0.08] pt-6 font-semibold">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Full-Screen Interactive Dispatch Map</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Live GPS Trace & 30s Snap Back</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> One-Click Collector Assignment</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Territory Delegation & Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section id="features" className="py-24 px-5 md:px-8 border-t border-white/[0.08] bg-[#05110b]/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
              Technical Capabilities
            </span>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight text-white">
              Built on Modern Architecture
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Fraud-Proof Reporting', desc: 'Hardware camera enforced at native level. No gallery uploads. GPS coordinates captured with tamper-proof signatures.' },
              { icon: Sparkles, title: 'Gemini AI Multimodal Vision', desc: 'Google Gemini multimodal AI verifies waste authenticity, material type, and estimated tonnage in milliseconds.' },
              { icon: MapPin, title: 'Live OpenStreetMap Vector Radar', desc: 'Real-time vector maps showing complaint pins, assigned routes, and collector telemetry with full-screen mode.' },
              { icon: Zap, title: 'Zero-Latency Dispatch', desc: 'Administrators dispatch collectors with a single click. Notifications delivered instantly to field workers.' },
              { icon: Coins, title: 'Eco-Token Reward Wallet', desc: 'Citizens receive verified reward points upon confirmed pickup, redeemable for municipal benefits.' },
              { icon: BarChart3, title: 'Decentralized Audit Records', desc: 'All collections, weights, and timestamps logged in Neon Serverless PostgreSQL with Drizzle ORM.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-3xl border border-white/[0.08] bg-[#071812]/80 p-7 transition-all hover:border-emerald-400/40 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </span>
                <h3 className="text-base font-black text-white">{title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-5 md:px-8 border-t border-white/[0.08] bg-[#040d09]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <CircleHelp size={26} className="mx-auto text-emerald-400 mb-3" />
            <h2 className="text-3xl font-black sm:text-5xl text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              ['How does fraud prevention work in the mobile APK?', 'The mobile app enforces live camera captures using device hardware sensors. Gallery and file picker uploads are completely blocked to eliminate fake or duplicate reports.'],
              ['How does Gemini AI verify waste?', 'The photo is processed by Google Gemini multimodal vision, which detects waste composition (Plastic, Organic, Metal) and calculates estimated tonnage automatically.'],
              ['How does the Live GPS map work on the dashboard?', 'The web console uses OpenStreetMap with automatic geolocation tracing. If an administrator drags the map to inspect another district, the system automatically snaps back to their position after 30 seconds of inactivity.'],
              ['Which database and backend infrastructure powers WasteCHAiN?', 'WasteCHAiN uses Neon Serverless PostgreSQL with Drizzle ORM, Next.js 15 App Router serverless routes, and Fast2SMS Indian SMS gateway.'],
              ['How do citizens earn and redeem points?', 'Once a field collector completes a pickup and confirms the weight, reward points are credited to the citizen wallet immediately.'],
            ].map(([q, a], i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-[#071811] overflow-hidden transition-all hover:border-emerald-400/30"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-white text-sm cursor-pointer"
                >
                  <span>{q}</span>
                  <span className={`text-emerald-400 text-lg shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>＋</span>
                </button>
                {openFaq === i && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400 border-t border-white/[0.04] pt-3">{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.08] bg-[#02060d] py-12 px-5 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <Recycle size={20} />
            </span>
            <span className="font-black text-lg tracking-tight text-white">
              WASTE<span className="text-emerald-400">CHAiN</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Autonomous Smart City Waste & Dispatch OS · Built for cleaner cities · © 2025 WasteCHAiN
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              All Systems Operational
            </span>
            <Link href="/login" className="hover:text-white transition">Command Login</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
