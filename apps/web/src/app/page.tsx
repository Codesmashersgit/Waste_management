'use client'
import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, TrendingUp, Globe, Shield } from 'lucide-react'
import Link from 'next/link'
import MarketingLanding from '@/components/MarketingLanding'
import { useLanguage } from '@/contexts/LanguageContext'

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

function FeatureCard({ icon: Icon, title, description, badge, learnMore }: {
  icon: React.ElementType; title: string; description: string; badge?: string; learnMore: string
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
        {learnMore} <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });
  const { t } = useLanguage()

  const fetchImpactData = useCallback(async () => {
    try {
      const response = await fetch('/api/web/home', { cache: 'no-store', credentials: 'include' })
      const data = await response.json()
      if (response.status === 401) {
        setLoggedIn(false)
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        return
      }
      if (!response.ok) throw new Error(data.error || 'Could not load your impact.')
      setUserName(data.name)
      setImpactData({
        wasteCollected: data.wasteCollected,
        reportsSubmitted: data.reportsSubmitted,
        tokensEarned: data.tokensEarned,
        co2Offset: data.co2Offset,
      })
    } catch (error) {
      console.error('Impact data error:', error)
    }
  }, [])

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    if (email) {
      setLoggedIn(true);
      setUserName(name || email.split('@')[0]);
      void fetchImpactData()
      return;
    }
  }, [fetchImpactData]);

  if (!loggedIn) {
    return <MarketingLanding />
  }

  // Dashboard View (Logged In)
  return (
    <div className="font-manrope">
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
              {t('dash.badge')}
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 text-glow">
              WASTE<span className="text-green-400">CHAiN</span> Dashboard
            </h1>
            <p className="text-green-100/90 text-lg max-w-lg leading-relaxed mb-8">
              {t('dash.welcome')} <span className="font-bold text-green-300 capitalize">{userName || t('dash.warrior')}</span>! {t('dash.sub')}
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/report">
                <button className="flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-900 font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-green-900/40 hover:scale-105 active:scale-95 cursor-pointer">
                  {t('dash.report_btn')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/leaderboard">
                <button className="flex items-center gap-2 border border-green-400/40 text-green-300 hover:bg-green-500/10 font-medium px-6 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer">
                  {t('dash.leaderboard_btn')}
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
          <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider px-3">{t('dash.impact')}</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ImpactCard title={t('dash.stat_collected')} value={`${impactData.wasteCollected} kg`} icon={Recycle} color="bg-green-400" />
          <ImpactCard title={t('dash.stat_reports')} value={impactData.reportsSubmitted} icon={MapPin} color="bg-blue-400" />
          <ImpactCard title={t('dash.stat_tokens')} value={impactData.tokensEarned} icon={Coins} color="bg-yellow-400" />
          <ImpactCard title={t('dash.stat_co2')} value={`${impactData.co2Offset} kg`} icon={Leaf} color="bg-emerald-400" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('dash.quick_actions')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Leaf}
            title={t('dash.f1_title')}
            description={t('dash.f1_desc')}
            badge={t('dash.f1_badge')}
            learnMore={t('dash.learn_more')}
          />
          <FeatureCard
            icon={Coins}
            title={t('dash.f2_title')}
            description={t('dash.f2_desc')}
            badge="🪙 Earn"
            learnMore={t('dash.learn_more')}
          />
          <FeatureCard
            icon={Users}
            title={t('dash.f3_title')}
            description={t('dash.f3_desc')}
            badge={t('dash.f3_badge')}
            learnMore={t('dash.learn_more')}
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{t('dash.how_title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: t('dash.step1_title'), desc: t('dash.step1_desc'), link: '/report', color: 'from-green-400 to-emerald-500' },
            { step: '02', title: t('dash.step2_title'), desc: t('dash.step2_desc'), link: '/collect', color: 'from-blue-400 to-cyan-500' },
            { step: '03', title: t('dash.step3_title'), desc: t('dash.step3_desc'), link: '/rewards', color: 'from-yellow-400 to-orange-500' },
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
