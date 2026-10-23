'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Trash2, Coins, TrendingUp, ShieldCheck, Search, Filter,
  MapPin, CheckCircle, Eye, X, Award, Loader, RefreshCw, Lock, LogOut
} from 'lucide-react'
import { toast } from 'react-hot-toast'
const DispatchMap = dynamic(() => import('@/components/admin/DispatchMap').then(module => module.DispatchMap), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />,
})

type AdminMetrics = {
  totalUsers: number; totalCitizens: number; totalCollectors: number; totalReports: number;
  totalCollected: number; totalSold: number; assignedReports: number; pendingReports: number;
  onlineCollectors: number;
  totalRevenue: number; totalWasteKg: number; co2OffsetKg: number;
  totalPointsEarned: number; totalPointsRedeemed: number;
  todayReportsCount?: number;
  todayResolvedCount?: number;
  todayWasteKg?: number;
  citizenPointsEarned?: number;
  collectorPointsEarned?: number;
  todayCitizenPoints?: number;
  todayCollectorPoints?: number;
}
type AdminUser = {
  id: number; name: string; email: string | null; phone: string | null; role: 'admin' | 'citizen' | 'collector'; collectorAvailable: boolean;
  requestedRole: 'collector' | null;
  lastLatitude: number | null; lastLongitude: number | null; lastLocationAt: string | null; collectorOnline: boolean; collectorTracking: boolean;
  createdAt: string; reportsCount: number; collectionsCount: number; wasteReportedKg: number; balance: number; rewardPoints: number;
}
type AdminReport = {
  id: number; location: string; latitude: number | null; longitude: number | null; wasteType: string; amount: string; status: 'pending' | 'assigned' | 'collected' | 'sold';
  createdAt: string; reporterName: string; reporterEmail: string | null; reporterPhone: string | null; collectorId?: number | null; collectorName: string | null; collectorEmail: string | null;
  imageUrl: string | null; saleRevenue: number | null; collectorPhone: string | null;
  hasImage?: boolean;
  collectorLatitude: number | null; collectorLongitude: number | null; collectorLastLocationAt: string | null;
}
type UserAnalytics = {
  reportsCount: number; collectionsCount: number; totalWasteReportedKg: number; currentBalance: number;
  wasteBreakdown: Record<string, number>;
  recentReports: Array<{ id: number; location: string; wasteType: string; amount: string; status: string; date: string }>;
  recentTransactions: Array<{ id: number; type: string; amount: number; description: string; date: string }>;
}

export default function AdminDashboardPage() {
  const { email, checking } = useAuthGuard()
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null)

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(false)
  const hasLoadedData = useRef(false)
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'map' | 'reports' | 'users'>('map')

  useEffect(() => {
    if (tabParam === 'reports' || tabParam === 'users' || tabParam === 'map') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Search & Filter
  const [userSearch, setUserSearch] = useState('')
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'collected' | 'assigned' | 'sold'>('all')

  // Selected User Modal Analytics
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedReportDetails, setSelectedReportDetails] = useState<AdminReport | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingReportImage, setLoadingReportImage] = useState(false)

  const handleInspectReport = async (report: AdminReport) => {
    setSelectedReportDetails(report)
    if (!report.hasImage || report.imageUrl) return
    setLoadingReportImage(true)
    try {
      const response = await fetch('/api/admin/dashboard?reportId=' + encodeURIComponent(report.id), { cache: 'no-store', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load report photo.')
      setSelectedReportDetails(current => current?.id === report.id ? { ...current, imageUrl: data.imageUrl ?? null } : current)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load report photo.')
    } finally {
      setLoadingReportImage(false)
    }
  }


  const handleAdminLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
    setIsAdminAuthenticated(false)
    toast.success('Admin session locked.')
  }

  const loadData = useCallback(async () => {
    if (!email) return
    const showInitialLoading = !hasLoadedData.current
    if (showInitialLoading) setLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store', credentials: 'include' })
      const data = await response.json()
      if (response.status === 401) {
        setIsAdminAuthenticated(false)
        return
      }
      if (!response.ok) throw new Error(data.error || 'Could not load admin dashboard.')
      setIsAdminAuthenticated(true)
      setMetrics(data.metrics as AdminMetrics)
      setUsers(data.users as AdminUser[])
      setReports(data.reports as AdminReport[])
      hasLoadedData.current = true
    } catch {
      toast.error('Failed to load admin metrics')
    } finally {
      if (showInitialLoading) setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (checking || !email) return
    void loadData()
    const refresh = setInterval(() => void loadData(), 15000)
    return () => clearInterval(refresh)
  }, [checking, email, loadData])

  const handleInspectUser = async (user: AdminUser) => {
    setSelectedUser(user)
    setLoadingAnalytics(true)
    try {
      const response = await fetch('/api/admin/dashboard?userId=' + encodeURIComponent(user.id), { cache: 'no-store', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load user analytics.')
      setUserAnalytics(data as UserAnalytics)
    } catch {
      toast.error('Failed to load user analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleUserRoleChange = async (userId: number, role: 'citizen' | 'collector') => {
    try {
      const response = await fetch('/api/admin/dashboard', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update user role.')
      toast.success('User role updated.')
      await loadData()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update user role.') }
  }

  const handleRevenueEdit = async (report: AdminReport) => {
    const value = window.prompt('Sale amount in rupees', String(report.saleRevenue ?? ''))
    if (value === null) return
    const saleRevenue = Math.round(Number(value))
    if (!Number.isFinite(saleRevenue) || saleRevenue < 0) { toast.error('Enter a valid sale amount.'); return }
    try {
      const response = await fetch('/api/admin/dashboard', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: report.id, saleRevenue }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update sale amount.')
      toast.success('Sale amount saved.')
      await loadData()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update sale amount.') }
  }

  const handleUpdateReport = async (reportId: number, status: string, collectorId: number | null) => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_REPORT', reportId, status, collectorId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update report.')
      toast.success('Report updated successfully.')
      await loadData()
      setSelectedReportDetails(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update report.')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true
    return r.status === reportFilter
  })

  if (!isAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4">
        <div className="w-full max-w-md bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-red-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Session Locked</h2>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            Aapne panel lock kar diya tha ya admin session expire ho gaya hai. Dobara unlock karne ke liye admin account se log in karein.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?redirect=/admin"
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all block"
            >
              🔑 Unlock / Login as Admin
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors block"
            >
              Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading Admin Analytics & Records...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-green-950 to-gray-900 border border-green-500/20 p-6 md:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span>Master Admin Control Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Waste<span className="text-green-400">CHAiN</span> Analytics & Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time telemetry, user balances, waste volume logs, and individual citizen audit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            title="Lock Admin session"
          >
            <LogOut className="w-4 h-4" />
            Lock Panel
          </button>
        </div>
      </div>

      {/* ── METRIC STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Total Citizens</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalCitizens || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">Registered reporters</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-700 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Collectors online</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.onlineCollectors || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">of {metrics?.totalCollectors || 0} collectors</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-green-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Waste Logged</span>
            <Trash2 className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalWasteKg || 0} <span className="text-sm font-normal text-gray-500">kg</span></p>
          <span className="text-[11px] text-green-600 font-medium mt-1">~{metrics?.co2OffsetKg || 0} kg CO₂ offset</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Total Reports</span>
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalReports || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">Logged by community</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-yellow-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Collections</span>
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalCollected || 0}</p>
          <span className="text-[11px] text-yellow-600 font-medium mt-1">{metrics?.pendingReports || 0} waiting · {metrics?.assignedReports || 0} assigned</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Points Minted</span>
            <Coins className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalPointsEarned || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">Awarded to citizens</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Redeemed</span>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalPointsRedeemed || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">Claimed rewards</span>
        </div>
      </div>

      {/* ── DAILY IMPACT & REAL-TIME DISPATCH SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Live District Pulse */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 rounded-2xl p-5 border border-emerald-500/30 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-300 tracking-wider">🌟 Aaj Ka Impact (Today)</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">Munger District</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-extrabold text-white">{metrics?.todayReportsCount || 0}</p>
              <span className="text-xs text-gray-300">nayi complaints aaj</span>
            </div>
            <p className="text-xs text-emerald-200 mt-2 font-medium">
              ✅ {metrics?.todayResolvedCount || 0} Resolved/Collected aaj · ~{metrics?.todayWasteKg || 0} kg kachra uthaya
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex justify-between text-[11px] text-gray-300">
            <span>Pending: <strong className="text-amber-300">{metrics?.pendingReports || 0}</strong></span>
            <span>Assigned: <strong className="text-blue-300">{metrics?.assignedReports || 0}</strong></span>
            <span>Resolved: <strong className="text-green-300">{metrics?.totalCollected || 0}</strong></span>
          </div>
        </div>

        {/* Citizen vs Collector Points Earned */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-indigo-700 mb-2">
              <span className="text-xs font-bold uppercase text-gray-500">Citizen Points Earned</span>
              <Coins className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {metrics?.citizenPointsEarned ?? metrics?.totalPointsEarned ?? 0}
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              +{metrics?.todayCitizenPoints || 0} points aaj citizens ne earn kiye
            </p>
          </div>
          <span className="text-[11px] text-gray-400 mt-2">Citizens reporting waste in Munger</span>
        </div>

        {/* Collector Points Earned */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase text-gray-500">Collector Earnings / Points</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {metrics?.collectorPointsEarned ?? 0} <span className="text-sm font-normal text-gray-500">pts</span>
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              +{metrics?.todayCollectorPoints || 0} pts aaj · ₹{Number(metrics?.totalRevenue || 0).toLocaleString('en-IN')} sale
            </p>
          </div>
          <span className="text-[11px] text-gray-400 mt-2">{metrics?.onlineCollectors || 0} collectors active on ground</span>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('map')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'map' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <MapPin className="w-4 h-4" />
          Live Dispatch Map
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Directory & Individual Analytics ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          All Waste Records ({reports.length})
        </button>
      </div>

      {activeTab === 'map' && <DispatchMap reports={reports} users={users} />}

      {/* ── TAB 1: USERS DIRECTORY & INDIVIDUAL ANALYTICS ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <span className="text-xs text-gray-500">
              Showing {filteredUsers.length} of {users.length} registered accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="py-3.5 px-6">User / Citizen</th>
                  <th className="py-3.5 px-4">Join Date</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Reports Filed</th>
                  <th className="py-3.5 px-4 text-center">Collections</th>
                  <th className="py-3.5 px-4 text-right">Waste (kg)</th>
                  <th className="py-3.5 px-4 text-right">Coin Balance</th>
                  <th className="py-3.5 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No users match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-green-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                            {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email || user.phone || 'Phone-only account'}</p>
                            {user.requestedRole === 'collector' && user.role !== 'collector' ? <p className="mt-1 text-[10px] font-bold text-amber-700">COLLECTOR ACCESS REQUESTED · ADMIN APPROVAL NEEDED</p> : null}
                            {user.phone ? <a href={`tel:${user.phone}`} className="text-[11px] font-semibold text-green-700">📞 {user.phone}</a> : user.role === 'collector' ? <span className="text-[11px] text-amber-700">Phone not added</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {user.createdAt}
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'admin' ? <span className="text-xs font-bold text-purple-700">ADMIN</span> : (
                          <select value={user.role || 'citizen'} onChange={e => void handleUserRoleChange(user.id, e.target.value as 'citizen' | 'collector')} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700">
                            <option value="citizen">Citizen</option>
                            <option value="collector">Collector</option>
                          </select>
                        )}
                        {user.role === 'collector' && <span className="block mt-1 text-[10px] text-gray-400">{user.collectorAvailable ? 'Online' : user.collectorTracking ? 'On assignment' : 'Offline'}</span>}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-gray-700">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {user.reportsCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-gray-700">
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {user.collectionsCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-800">
                        {user.wasteReportedKg} kg
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 border border-green-200/80 px-2.5 py-0.5 rounded-full text-xs">
                          <Coins className="w-3.5 h-3.5 text-green-600" />
                          {user.balance} pts
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleInspectUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-green-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Analytics
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: WASTE REPORTS AUDIT LOGS ── */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold uppercase text-gray-500 mr-2">Filter Status:</span>
              <button
                onClick={() => setReportFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  reportFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setReportFilter('pending')}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  reportFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setReportFilter('collected')}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  reportFilter === 'collected' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Collected
              </button>
              <button onClick={() => setReportFilter('assigned')} className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${reportFilter === 'assigned' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`}>Assigned</button>
              <button onClick={() => setReportFilter('sold')} className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${reportFilter === 'sold' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Sold</button>
            </div>
            <span className="text-xs text-gray-500">
              Total {filteredReports.length} records found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="py-3.5 px-6">ID & Location</th>
                  <th className="py-3.5 px-4">Waste Type</th>
                  <th className="py-3.5 px-4">Estimated Amount</th>
                  <th className="py-3.5 px-4">Reported By</th>
                  <th className="py-3.5 px-4">Collector / sale</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No reports match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} onClick={() => void handleInspectReport(report)} className="hover:bg-green-50/30 transition-colors cursor-pointer">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-gray-900 block max-w-xs truncate">
                              #{report.id} - {report.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-800 capitalize">
                        {report.wasteType}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-700">
                        {report.amount}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900 text-xs">{report.reporterName || 'Unknown'}</p>
                        <p className="text-[11px] text-gray-400">{report.reporterEmail || report.reporterPhone || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4 min-w-40">
                        <p className="font-semibold text-gray-900 text-xs">{report.collectorName || 'Not assigned'}</p>
                        <p className="text-[11px] text-gray-400">{report.collectorEmail || (report.status === 'pending' ? 'Waiting for nearby collector' : '')}</p>
                        {report.collectorPhone ? <a href={`tel:${report.collectorPhone}`} className="block text-[11px] font-semibold text-green-700 mt-0.5">📞 {report.collectorPhone}</a> : null}
                        {report.saleRevenue != null ? <p className="text-xs font-bold text-emerald-700 mt-1">₹{Number(report.saleRevenue).toLocaleString('en-IN')}</p> : null}
                        {(report.status === 'collected' || report.status === 'sold') && <button onClick={(e) => { e.stopPropagation(); void handleRevenueEdit(report); }} className="mt-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">Edit sale</button>}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {report.createdAt}
                      </td>
                      <td className="py-4 px-4">
                        {report.hasImage ? <span className="text-xs font-semibold text-green-700">View photo</span> : <span className="text-xs text-gray-400">No photo</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          report.status === 'sold' ? 'bg-blue-100 text-blue-800' : report.status === 'assigned' ? 'bg-purple-100 text-purple-800' : report.status === 'collected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: INDIVIDUAL CITIZEN AUDIT & ANALYTICS ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-400 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {(selectedUser.name?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500">{selectedUser.email || selectedUser.phone || 'Phone-only account'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader className="w-8 h-8 text-green-500 animate-spin" />
                <p className="text-xs text-gray-500">Calculating citizen impact telemetry...</p>
              </div>
            ) : userAnalytics ? (
              <div className="mt-6 space-y-6">
                {/* Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase">Reports</p>
                    <p className="text-2xl font-extrabold text-green-700 mt-1">{userAnalytics.reportsCount}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase">Waste Total</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">{userAnalytics.totalWasteReportedKg} <span className="text-xs font-normal">kg</span></p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase">Collections</p>
                    <p className="text-2xl font-extrabold text-blue-700 mt-1">{userAnalytics.collectionsCount}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase">Token Balance</p>
                    <p className="text-2xl font-extrabold text-yellow-700 mt-1">{userAnalytics.currentBalance}</p>
                  </div>
                </div>

                {/* Waste types breakdown */}
                {Object.keys(userAnalytics.wasteBreakdown || {}).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Reported Waste Composition</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(userAnalytics.wasteBreakdown).map(([type, count]) => (
                        <div key={type} className="px-3 py-1 rounded-xl bg-gray-100 text-xs font-medium text-gray-700 capitalize flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span>{type}: <b>{count as number} report(s)</b></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Submissions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Recent Citizen Reports</h4>
                  {userAnalytics.recentReports.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No reports filed by this user yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {userAnalytics.recentReports.map(r => (
                        <div key={r.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{r.location}</p>
                            <p className="text-gray-500 capitalize">{r.wasteType} • {r.amount}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'collected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Recent Token Ledger Entries</h4>
                  {userAnalytics.recentTransactions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No ledger transactions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {userAnalytics.recentTransactions.map(t => (
                        <div key={t.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-gray-800">{t.description}</p>
                            <p className="text-[10px] text-gray-400">{t.date}</p>
                          </div>
                          <span className={`font-bold ${
                            t.type?.startsWith('earned') ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {t.type?.startsWith('earned') ? `+${t.amount}` : `-${t.amount}`} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
      {/* "?"? MODAL: COMPLAINT DETAILS "?"? */}
      {selectedReportDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complaint #{selectedReportDetails.id}</h3>
                <p className="text-xs text-gray-500">{selectedReportDetails.createdAt}</p>
              </div>
              <button onClick={() => setSelectedReportDetails(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Waste Type</p>
                  <p className="font-semibold">{selectedReportDetails.wasteType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Estimated Amount</p>
                  <p className="font-semibold">{selectedReportDetails.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                  <p className="font-semibold">{selectedReportDetails.location}</p>
                  <p className="text-xs text-blue-600 mt-1">{selectedReportDetails.latitude}, {selectedReportDetails.longitude}</p>
                </div>
              </div>

              {loadingReportImage && <p className="text-xs text-gray-500">Loading attached photo…</p>}
              {selectedReportDetails.imageUrl && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Attached Photo</p>
                  <Image src={selectedReportDetails.imageUrl} alt="Waste Photo" width={300} height={200} className="rounded-xl border border-gray-200" unoptimized />
                </div>
              )}
              {selectedReportDetails.hasImage && !loadingReportImage && !selectedReportDetails.imageUrl && <p className="text-xs text-gray-500">Photo could not be loaded.</p>}

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold mb-3">Management</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                      value={selectedReportDetails.status}
                      onChange={(e) => handleUpdateReport(selectedReportDetails.id, e.target.value, selectedReportDetails.collectorId ?? null)}
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">Collection and sale are confirmed by the assigned collector.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Collector</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateReport(selectedReportDetails.id, 'assigned', Number(e.target.value));
                        }
                      }}
                    >
                      <option value="" disabled>
                        {selectedReportDetails.collectorName ? `Currently: ${selectedReportDetails.collectorName}` : 'Select a collector to assign...'}
                      </option>
                      {users.filter(u => u.role === 'collector').map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.collectorAvailable ? '(Available)' : '(Busy/Offline)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
