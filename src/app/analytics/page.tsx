// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { 
  BarChart3, Recycle, Coins, Leaf, TrendingUp, Award, Clock, 
  MapPin, CheckCircle, ShieldCheck, Flame, Loader, ArrowRight
} from 'lucide-react'
import { getUserByEmail, getUserComprehensiveAnalytics } from '@/utils/db/actions'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import Link from 'next/link'

export default function UserAnalyticsPage() {
  const { email: guardEmail, checking } = useAuthGuard()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!guardEmail) return
    const init = async () => {
      try {
        const user = await getUserByEmail(guardEmail)
        if (user) {
          setUserName(user.name)
          const data = await getUserComprehensiveAnalytics(user.id)
          setAnalytics(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [guardEmail])

  if (checking || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Computing your personal eco impact...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-green-950 to-gray-900 rounded-3xl p-6 md:p-10 border border-green-500/20 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-3 py-1 rounded-full text-xs font-semibold text-green-300 mb-3">
              <Leaf className="w-3.5 h-3.5 text-green-400" />
              <span>Personal Eco Telemetry</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {userName ? `${userName}'s` : 'Your'} Impact Analytics
            </h1>
            <p className="text-green-100/70 text-sm mt-2 max-w-xl">
              Real-time audit of your community contributions, verified waste offsets, and decentralized token rewards.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-green-300 font-semibold">Citizen Rank</p>
              <p className="text-xl font-bold text-white">Level {analytics?.level || 1} Pioneer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE METRICS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-green-600 mb-3">
            <span className="text-xs font-bold uppercase text-gray-500">Waste Cleaned</span>
            <Recycle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{analytics?.totalWasteReportedKg || 0} <span className="text-sm font-normal text-gray-500">kg</span></p>
          <p className="text-xs text-green-600 mt-2 font-medium">Logged on blockchain</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-bold uppercase text-gray-500">Reports Filed</span>
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{analytics?.reportsCount || 0}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">{analytics?.collectionsCount || 0} waste collection(s)</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-yellow-600 mb-3">
            <span className="text-xs font-bold uppercase text-gray-500">Current Balance</span>
            <Coins className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{analytics?.currentBalance || 0} <span className="text-sm font-normal text-gray-500">pts</span></p>
          <p className="text-xs text-yellow-600 mt-2 font-medium">+{analytics?.totalEarned || 0} total earned</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-bold uppercase text-gray-500">Carbon Offset</span>
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{analytics?.co2OffsetKg || 0} <span className="text-sm font-normal text-gray-500">kg</span></p>
          <p className="text-xs text-emerald-600 mt-2 font-medium">~{( (analytics?.co2OffsetKg || 0) / 20 ).toFixed(1)} trees saved</p>
        </div>
      </div>

      {/* ── TWO-COLUMN DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Waste Category Breakdown
            </h3>
            <span className="text-xs text-gray-400">By submission frequency</span>
          </div>

          {Object.keys(analytics?.wasteBreakdown || {}).length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Recycle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No waste reported yet. Start reporting to see insights!</p>
              <Link href="/report">
                <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold">
                  Report Waste
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {Object.entries(analytics.wasteBreakdown).map(([category, count]) => {
                const percentage = Math.round(((count as number) / (analytics.reportsCount || 1)) * 100)
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 capitalize">{category}</span>
                      <span className="text-gray-500">{count as number} report(s) ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Ledger Transactions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              Recent Reward Transactions
            </h3>
            <Link href="/rewards" className="text-xs font-semibold text-green-600 hover:underline">
              View Rewards
            </Link>
          </div>

          {analytics?.recentTransactions?.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Coins className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reward transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {analytics?.recentTransactions?.map((t: any) => (
                <div key={t.id} className="p-3 bg-gray-50/80 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-800">{t.description}</p>
                    <p className="text-[11px] text-gray-400">{t.date}</p>
                  </div>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                    t.type?.startsWith('earned')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {t.type?.startsWith('earned') ? `+${t.amount}` : `-${t.amount}`} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
