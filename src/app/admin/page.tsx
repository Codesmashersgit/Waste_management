// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { 
  Users, Trash2, Coins, TrendingUp, ShieldCheck, Search, Filter, 
  MapPin, CheckCircle, Clock, Eye, X, ArrowUpRight, Award, BarChart3, Loader, RefreshCw, Lock, KeyRound, LogOut
} from 'lucide-react'
import { getAdminMetrics, getAllUsersWithDetailedStats, getAllReportsWithUsers, getUserComprehensiveAnalytics } from '@/utils/db/actions'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { toast } from 'react-hot-toast'

export default function AdminDashboardPage() {
  const { checking } = useAuthGuard()
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminEmailInput, setAdminEmailInput] = useState('')
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const [metrics, setMetrics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users')
  
  // Search & Filter
  const [userSearch, setUserSearch] = useState('')
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'collected'>('all')

  // Selected User Modal Analytics
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<any | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  useEffect(() => {
    const isAuth = sessionStorage.getItem('wastechain_admin_auth') === 'true'
    if (isAuth) {
      setIsAdminAuthenticated(true)
      loadData()
    }
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmailInput,
          password: adminPasswordInput
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        sessionStorage.setItem('wastechain_admin_auth', 'true')
        setIsAdminAuthenticated(true)
        toast.success('Admin identity verified! Welcome 🛡️')
        loadData()
      } else {
        setAuthError(data.message || 'Invalid credentials. Access denied.')
        toast.error('Invalid Admin credentials!')
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('wastechain_admin_auth')
    setIsAdminAuthenticated(false)
    setAdminPasswordInput('')
    toast.success('Admin session locked.')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [m, u, r] = await Promise.all([
        getAdminMetrics(),
        getAllUsersWithDetailedStats(),
        getAllReportsWithUsers()
      ])
      setMetrics(m)
      setUsers(u)
      setReports(r)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load admin metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleInspectUser = async (user: any) => {
    setSelectedUser(user)
    setLoadingAnalytics(true)
    try {
      const data = await getUserComprehensiveAnalytics(user.id)
      setUserAnalytics(data)
    } catch (e) {
      toast.error('Failed to load user analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true
    return r.status === reportFilter
  })

  if (!isAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4">
        <div className="w-full max-w-md bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-green-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(74,222,128,0.4)]">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Restricted Access</span>
            </div>
            <h2 className="text-2xl font-black text-white">Admin Authentication</h2>
            <p className="text-gray-400 text-xs mt-1">Enter Master Admin credentials configured in .env</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmailInput}
                onChange={e => setAdminEmailInput(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-green-400 focus:bg-white/10 transition-colors"
                placeholder="Enter admin email..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Secret Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-green-400 focus:bg-white/10 transition-colors"
                  placeholder="Enter admin password..."
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {authSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-gray-500 text-center mt-6">
            Authorized personnel only • WasteCHAiN Infrastructure Security
          </p>
        </div>
      </div>
    )
  }

  if (checking || loading) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500">Total Citizens</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{metrics?.totalUsers || 0}</p>
          <span className="text-[11px] text-gray-400 mt-1">Active participants</span>
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
          <span className="text-[11px] text-yellow-600 font-medium mt-1">{metrics?.pendingReports || 0} tasks pending</span>
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

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Citizen Directory & Individual Analytics ({users.length})
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
                    <td colSpan={7} className="text-center py-8 text-gray-400">
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
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {user.createdAt}
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
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No reports match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-green-50/30 transition-colors">
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
                        <p className="text-[11px] text-gray-400">{report.reporterEmail || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {report.createdAt}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          report.status === 'collected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
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
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
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
                      {userAnalytics.recentReports.map((r: any) => (
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
                      {userAnalytics.recentTransactions.map((t: any) => (
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
    </div>
  )
}
