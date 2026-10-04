// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, TrendingUp, Globe, Shield, LogOut } from 'lucide-react'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'
import { useLanguage } from '@/contexts/LanguageContext'

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

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    if (email) {
      setLoggedIn(true);
      setUserName(name || email.split('@')[0]);
    }

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

  if (!loggedIn) {
    return (
      <div className="relative w-full flex flex-col bg-black text-white">
        {/* Epic Hero Section */}
        <div className="relative w-full min-h-screen flex flex-col justify-center">
          <div className="absolute inset-0 z-0 bg-black">
            <div 
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: 'url(/hero-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.3,
              }}
            />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-black/60 to-black pointer-events-none" />

          {/* Minimal Transparent Navbar for Landing Page */}
          <nav className="absolute top-0 w-full z-10 px-8 py-6 flex justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center backdrop-blur-md glow-green-sm transition-all group-hover:bg-green-500/40">
                <Leaf className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-white text-xl tracking-tight text-glow">WASTE-CHAiN</span>
              </div>
            </div>
            <Link href="/login">
              <button className="glass-dark hover:bg-green-600/30 text-white font-medium px-6 py-2.5 rounded-full transition-all duration-300 border border-green-500/30 hover:border-green-400/60 shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:shadow-[0_0_25px_rgba(74,222,128,0.4)]">
                {t('landing.login_btn')}
              </button>
            </Link>
          </nav>

          {/* Hero Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border border-green-500/30 mb-6 animate-fade-up">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-sm font-semibold tracking-wide uppercase">{t('landing.badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 text-glow">{t('landing.hero_title2')}</span>{' '}
              {t('landing.hero_title')} {t('landing.hero_title3')}
            </h1>
            
            <p className="text-lg md:text-xl text-green-50/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {t('landing.hero_sub')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/login">
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:shadow-[0_0_50px_rgba(74,222,128,0.6)] hover:scale-105 flex items-center gap-2 text-lg">
                  {t('landing.enter_btn')} <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Glassmorphism Stats Footer */}
          <div className="relative z-10 w-full px-8 pb-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-dark rounded-2xl p-4 flex items-center gap-4">
                <Recycle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">4,123</p>
                  <p className="text-xs text-green-200/70 uppercase tracking-wider">{t('landing.stat_recycled')}</p>
                </div>
              </div>
              <div className="glass-dark rounded-2xl p-4 flex items-center gap-4">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">12.5K</p>
                  <p className="text-xs text-blue-200/70 uppercase tracking-wider">{t('landing.stat_citizens')}</p>
                </div>
              </div>
              <div className="glass-dark rounded-2xl p-4 flex items-center gap-4">
                <Coins className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">2.8M</p>
                  <p className="text-xs text-yellow-200/70 uppercase tracking-wider">{t('landing.stat_tokens')}</p>
                </div>
              </div>
              <div className="glass-dark rounded-2xl p-4 flex items-center gap-4">
                <Globe className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-white">14</p>
                  <p className="text-xs text-emerald-200/70 uppercase tracking-wider">{t('landing.stat_cities')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Powerful Features Section */}
        <div className="w-full bg-black py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-green-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">{t('landing.features_title')} <span className="text-green-400">{t('landing.features_highlight')}</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{t('landing.features_sub')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-dark p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition-colors group">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('landing.f1_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t('landing.f1_desc')}</p>
              </div>

              <div className="glass-dark p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition-colors group">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('landing.f2_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t('landing.f2_desc')}</p>
              </div>

              <div className="glass-dark p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition-colors group">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Coins className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('landing.f3_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t('landing.f3_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="w-full bg-[#050505] py-24 border-t border-white/5 relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-900/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <h2 className="text-4xl font-bold text-white mb-16 text-center">{t('landing.journey_title')} <span className="text-green-400">{t('landing.journey_highlight')}</span></h2>
            
            <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
              <div className="flex flex-col items-center text-center max-w-xs relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 flex items-center justify-center text-3xl font-bold text-white mb-6 z-10 shadow-[0_0_20px_rgba(74,222,128,0.15)]">1</div>
                <h4 className="text-xl font-bold text-white mb-3">{t('landing.step1_title')}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t('landing.step1_desc')}</p>
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-gradient-to-r from-green-500/30 to-transparent z-0" />
              </div>
              
              <div className="flex flex-col items-center text-center max-w-xs relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 flex items-center justify-center text-3xl font-bold text-white mb-6 z-10 shadow-[0_0_20px_rgba(74,222,128,0.15)]">2</div>
                <h4 className="text-xl font-bold text-white mb-3">{t('landing.step2_title')}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t('landing.step2_desc')}</p>
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-gradient-to-r from-green-500/30 to-transparent z-0" />
              </div>

              <div className="flex flex-col items-center text-center max-w-xs relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 border border-green-400 flex items-center justify-center text-3xl font-bold text-white mb-6 z-10 shadow-[0_0_30px_rgba(74,222,128,0.4)]">3</div>
                <h4 className="text-xl font-bold text-white mb-3">{t('landing.step3_title')}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t('landing.step3_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Epic CTA Footer */}
        <div className="w-full bg-black py-32 relative flex flex-col items-center justify-center text-center px-4">
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-green-900/30 to-black pointer-events-none" />
          <h2 className="relative z-10 text-5xl font-black text-white mb-6">{t('landing.cta_title')}</h2>
          <p className="relative z-10 text-xl text-gray-400 mb-10 max-w-2xl">{t('landing.cta_sub')}</p>
          <Link href="/login" className="relative z-10">
            <button className="bg-white text-black hover:bg-gray-200 font-bold px-12 py-5 rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 flex items-center gap-3 text-lg">
              {t('landing.cta_btn')} <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Dashboard View (Logged In)
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
