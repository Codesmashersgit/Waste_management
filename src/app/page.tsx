// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, TrendingUp, Globe } from 'lucide-react'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedGlobe() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8 animate-float">
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full border border-green-400/20 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-4 rounded-full border border-green-400/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />

      {/* Globe body */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center glow-green">
        <Globe className="h-16 w-16 text-white drop-shadow-lg" />
      </div>

      {/* Orbiting dot */}
      <div className="absolute inset-0 rounded-full" style={{ animation: 'spin 6s linear infinite' }}>
        <div className="absolute top-2 left-1/2 w-3 h-3 bg-green-300 rounded-full -translate-x-1/2 shadow-lg shadow-green-400/50" />
      </div>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card-dark rounded-2xl p-6 flex flex-col gap-3 hover:glow-green-sm transition-all duration-300 group cursor-default">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white animate-count">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{title}</p>
      </div>
      <div className="h-px bg-gradient-to-r from-green-500/30 to-transparent" />
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, badge }: {
  icon: React.ElementType; title: string; description: string; badge?: string
}) {
  return (
    <div className="group bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-green-100 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

      {badge && (
        <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="bg-green-600 p-3 rounded-xl mb-5 relative">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
      <div className="flex items-center gap-1 text-green-600 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
        Learn more <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    // Check login status
    const email = localStorage.getItem('userEmail');
    if (email) setLoggedIn(true);

    async function fetchImpactData() {
      try {
        const [reports, rewards, tasks] = await Promise.all([
          getRecentReports(100),
          getAllRewards(),
          getWasteCollectionTasks(100)
        ]);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          return total + (match ? parseFloat(match[0]) : 0);
        }, 0);

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted: reports.length,
          tokensEarned: rewards.reduce((t, r) => t + (r.points || 0), 0),
          co2Offset: Math.round(wasteCollected * 0.5 * 10) / 10
        });
      } catch (e) {
        console.error("Impact data error:", e);
      }
    }
    fetchImpactData();
  }, []);

  return (
    <div className={`${poppins.className}`}>

      {/* ── HERO SECTION ── */}
      <section className="hero-gradient rounded-3xl mx-0 mb-12 overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-8 py-16 lg:py-20">
          {/* Globe */}
          <div className="flex-shrink-0">
            <AnimatedGlobe />
          </div>

          {/* Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Powered by Blockchain & AI
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 text-glow">
              WASTE<span className="text-green-400">CHAiN</span>
            </h1>
            <p className="text-green-100/80 text-lg max-w-lg leading-relaxed mb-8">
              Turning waste into wealth with the power of decentralization—because a cleaner future belongs to everyone.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {loggedIn ? (
                <Link href="/report">
                  <button className="flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-900 font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-green-900/40 hover:scale-105 active:scale-95">
                    Report Waste
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => {}}
                  className="flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-900 font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-green-900/40 hover:scale-105 active:scale-95 animate-pulse-ring"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
              <Link href="/leaderboard">
                <button className="flex items-center gap-2 border border-green-400/40 text-green-300 hover:bg-green-500/10 font-medium px-6 py-3.5 rounded-2xl transition-all duration-200">
                  View Leaderboard
                  <TrendingUp className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-200" />
          <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider px-3">Our Impact</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ImpactCard title="Waste Collected" value={`${impactData.wasteCollected} kg`} icon={Recycle} color="bg-green-400" />
          <ImpactCard title="Reports Submitted" value={impactData.reportsSubmitted} icon={MapPin} color="bg-blue-400" />
          <ImpactCard title="Tokens Earned" value={impactData.tokensEarned} icon={Coins} color="bg-yellow-400" />
          <ImpactCard title="CO₂ Offset" value={`${impactData.co2Offset} kg`} icon={Leaf} color="bg-emerald-400" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Why WasteCHAiN?</h2>
        <p className="text-gray-500 mb-8">Join thousands making a real impact on the environment.</p>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Leaf}
            title="Eco-Friendly"
            description="Contribute to a cleaner environment by reporting and collecting waste in your community."
            badge="Green"
          />
          <FeatureCard
            icon={Coins}
            title="Earn Rewards"
            description="Get tokens and reward points for every contribution to waste management efforts."
            badge="🪙 Earn"
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="Be part of a growing community committed to sustainable practices and a better tomorrow."
            badge="Community"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Report Waste', desc: 'Spot waste? Take a photo and report it with location. AI verifies the waste type automatically.', link: '/report', color: 'from-green-400 to-emerald-500' },
            { step: '02', title: 'Collect & Verify', desc: 'Community collectors pick up reported waste and mark it as collected to earn bonus points.', link: '/collect', color: 'from-blue-400 to-cyan-500' },
            { step: '03', title: 'Earn & Redeem', desc: 'Earn tokens for every action. Redeem them for real rewards and climb the leaderboard!', link: '/rewards', color: 'from-yellow-400 to-orange-500' },
          ].map((item) => (
            <Link href={item.link} key={item.step}>
              <div className="group text-center cursor-pointer p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
