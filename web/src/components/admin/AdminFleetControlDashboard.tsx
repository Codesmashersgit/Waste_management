'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  Users, Truck, MapPin, Search, Filter, ShieldCheck, CheckCircle,
  Clock, AlertTriangle, Eye, X, RefreshCw, ChevronRight, Award,
  TrendingUp, Leaf, Coins, Check, ArrowRight, Phone, Mail, Navigation,
  Calendar, Layers, Sparkles, AlertCircle, Globe, Compass, Lock,
  KeyRound, UserCheck, ShieldAlert
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const DispatchMap = dynamic(() => import('@/components/admin/DispatchMap').then(m => m.DispatchMap), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-3xl bg-gray-900/60 border border-emerald-500/20 animate-pulse flex flex-col items-center justify-center gap-3 text-emerald-400">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-bold tracking-wide">Initializing Global Dispatch Radar...</span>
    </div>
  ),
})

export type AdminMetrics = {
  totalUsers: number;
  totalCitizens: number;
  totalCollectors: number;
  totalReports: number;
  totalCollected: number;
  totalSold: number;
  assignedReports: number;
  pendingReports: number;
  onlineCollectors: number;
  totalRevenue: number;
  totalWasteKg: number;
  co2OffsetKg: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  todayReportsCount?: number;
  todayResolvedCount?: number;
  todayWasteKg?: number;
  citizenPointsEarned?: number;
  collectorPointsEarned?: number;
  todayCitizenPoints?: number;
  todayCollectorPoints?: number;
}

export type AdminUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'citizen' | 'collector';
  collectorAvailable: boolean;
  requestedRole: 'collector' | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
  collectorOnline: boolean;
  collectorTracking: boolean;
  createdAt: string;
  reportsCount: number;
  collectionsCount: number;
  wasteReportedKg: number;
  balance: number;
  rewardPoints: number;
}

export type AdminReport = {
  id: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  wasteType: string;
  amount: string;
  status: 'pending' | 'assigned' | 'collected' | 'sold';
  createdAt: string;
  reporterName: string;
  reporterEmail: string | null;
  reporterPhone: string | null;
  collectorId?: number | null;
  collectorName: string | null;
  collectorEmail: string | null;
  collectorPhone: string | null;
  imageUrl: string | null;
  saleRevenue: number | null;
  hasImage?: boolean;
  collectorLatitude: number | null;
  collectorLongitude: number | null;
  collectorLastLocationAt: string | null;
}

// Global Jurisdictions / Territories Directory
const PRESET_DISTRICTS: Array<{
  id: string;
  name: string;
  state: string;
  center: [number, number];
  officialAdminEmail: string;
  isHQ?: boolean;
}> = [
  { id: 'munger', name: 'Munger District', state: 'Bihar', center: [25.3756, 86.4744], officialAdminEmail: 'sudhanshu.ok1802@gmail.com', isHQ: true },
  { id: 'patna', name: 'Patna Division', state: 'Bihar', center: [25.5941, 85.1376], officialAdminEmail: 'patna.ops@wastechain.org' },
  { id: 'bhagalpur', name: 'Bhagalpur Division', state: 'Bihar', center: [25.2425, 86.9842], officialAdminEmail: 'bhagalpur.ops@wastechain.org' },
  { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', center: [28.6139, 77.2090], officialAdminEmail: 'delhi.admin@wastechain.org' },
  { id: 'bengaluru', name: 'Bengaluru Urban', state: 'Karnataka', center: [12.9716, 77.5946], officialAdminEmail: 'bengaluru.admin@wastechain.org' },
  { id: 'mumbai', name: 'Mumbai Metropolitan', state: 'Maharashtra', center: [19.0760, 72.8777], officialAdminEmail: 'mumbai.ops@wastechain.org' },
]

export default function AdminFleetControlDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'map' | 'reports' | 'fleet' | 'analytics'>('map')

  // Global & Jurisdiction State
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null)
  const [gpsCity, setGpsCity] = useState<string | null>(null)
  const [gpsDetecting, setGpsDetecting] = useState(false)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('munger')
  const [assignedDistrictAdmins, setAssignedDistrictAdmins] = useState<Record<string, string>>({
    munger: 'sudhanshu.ok1802@gmail.com',
    patna: 'patna.ops@wastechain.org',
    bhagalpur: 'bhagalpur.ops@wastechain.org',
    delhi: 'delhi.admin@wastechain.org',
    bengaluru: 'bengaluru.admin@wastechain.org',
    mumbai: 'mumbai.ops@wastechain.org',
  })
  const [delegatingEmail, setDelegatingEmail] = useState('')

  useEffect(() => {
    if (tabParam === 'reports' || tabParam === 'fleet' || tabParam === 'analytics' || tabParam === 'map') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Filters & State
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'assigned' | 'collected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [assigningReportId, setAssigningReportId] = useState<number | null>(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)

  // Live GPS Acquisition
  const handleDetectGPS = useCallback((silent = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) return
    if (!silent) setGpsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setGpsCoords([lat, lon])
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.county || 'Current GPS Area'
          const state = data.address?.state || 'India'
          const formatted = `${city}, ${state}`
          setGpsCity(formatted)
          if (!silent) toast.success(`📍 GPS Located: ${formatted}`)
        } catch {
          setGpsCity(`${lat.toFixed(3)}, ${lon.toFixed(3)}`)
        } finally {
          setGpsDetecting(false)
        }
      },
      () => {
        if (!silent) toast.error('GPS permission not granted or timeout.')
        setGpsDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    handleDetectGPS(true)
  }, [handleDetectGPS])

  // Active Territory Calculation
  const activeDistrict = useMemo(() => {
    if (selectedDistrictId === 'gps' && gpsCoords) {
      return {
        id: 'gps',
        name: gpsCity || 'Local GPS Jurisdiction',
        state: 'Detected Territory',
        center: gpsCoords,
        officialAdminEmail: assignedDistrictAdmins['gps'] || 'Assigned to GPS Operator',
      }
    }
    if (selectedDistrictId === 'global') {
      return {
        id: 'global',
        name: 'Global Multi-District Overview',
        state: 'All Regions',
        center: [25.3756, 86.4744] as [number, number],
        officialAdminEmail: 'sudhanshu.ok1802@gmail.com (Super Authority)',
      }
    }
    const found = PRESET_DISTRICTS.find(d => d.id === selectedDistrictId)
    return found || PRESET_DISTRICTS[0]
  }, [selectedDistrictId, gpsCoords, gpsCity, assignedDistrictAdmins])

  // Conflict Prevention Engine: Check Authority of Logged-In User
  const currentUserEmail = (typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null) || 'sudhanshu.ok1802@gmail.com'
  const isSuperAdmin = currentUserEmail.toLowerCase() === 'sudhanshu.ok1802@gmail.com'
  const officialAdminOfActive = assignedDistrictAdmins[activeDistrict.id] || activeDistrict.officialAdminEmail
  const isAuthorizedForActiveDistrict = isSuperAdmin || officialAdminOfActive.toLowerCase() === currentUserEmail.toLowerCase()

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store', credentials: 'include' })
      const data = await response.json()
      if (response.ok) {
        setMetrics(data.metrics as AdminMetrics)
        setUsers(data.users as AdminUser[])
        setReports(data.reports as AdminReport[])
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
    const interval = setInterval(() => void loadData(true), 12000)
    return () => clearInterval(interval)
  }, [loadData])

  // Delegate / Appoint District Administrator (Super Admin's Power)
  const handleAppointDistrictAdmin = (districtId: string, email: string) => {
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address.')
      return
    }
    setAssignedDistrictAdmins(prev => ({
      ...prev,
      [districtId]: email.trim().toLowerCase(),
    }))
    toast.success(`🛡️ Official Administrator for ${activeDistrict.name} delegated to ${email}`)
    setDelegatingEmail('')
  }

  // Collector Role Approvals (Admin's Core Task)
  const handleApproveCollector = async (userId: number, approve: boolean) => {
    if (!isAuthorizedForActiveDistrict) {
      toast.error(`Territory conflict protection: Only the appointed admin (${officialAdminOfActive}) can approve collectors in ${activeDistrict.name}.`)
      return
    }
    try {
      const role = approve ? 'collector' : 'citizen'
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update user role')
      toast.success(approve ? '🎉 Collector application approved! Rider active.' : 'Application dismissed.')
      await loadData(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating collector status')
    }
  }

  // Dispatch Assignment (Assigning Collector to Pending Report)
  const handleAssignCollector = async (reportId: number, collectorId: number) => {
    if (!isAuthorizedForActiveDistrict) {
      toast.error(`Territory conflict protection: Only the appointed admin (${officialAdminOfActive}) can dispatch riders in ${activeDistrict.name}.`)
      return
    }
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_REPORT', reportId, status: 'assigned', collectorId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to assign collector')
      toast.success('🚀 Collector dispatched! Route active.')
      setAssigningReportId(null)
      await loadData(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch collector')
    }
  }

  const handleInspectPhoto = async (report: AdminReport) => {
    setSelectedReport(report)
    if (!report.hasImage || report.imageUrl) return
    setLoadingPhoto(true)
    try {
      const res = await fetch(`/api/admin/dashboard?reportId=${report.id}`, { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.imageUrl) {
        setSelectedReport(prev => prev?.id === report.id ? { ...prev, imageUrl: data.imageUrl } : prev)
      }
    } catch (err) {
      console.warn('Could not fetch report photo', err)
    } finally {
      setLoadingPhoto(false)
    }
  }

  // Pending Collector Requests (Applicants)
  const pendingCollectorRequests = useMemo(() => {
    return users.filter(u => u.requestedRole === 'collector')
  }, [users])

  // Active / Available Collectors
  const activeCollectors = useMemo(() => {
    return users.filter(u => u.role === 'collector')
  }, [users])

  // Filtered Reports
  const filteredReports = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return reports.filter(r => {
      if (timeframe === 'today' && r.createdAt !== todayStr) return false
      if (reportFilter !== 'all' && r.status !== reportFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchLoc = r.location?.toLowerCase().includes(query)
        const matchType = r.wasteType?.toLowerCase().includes(query)
        const matchReporter = r.reporterName?.toLowerCase().includes(query)
        const matchCollector = r.collectorName?.toLowerCase().includes(query)
        const matchId = String(r.id).includes(query)
        if (!matchLoc && !matchType && !matchReporter && !matchCollector && !matchId) return false
      }
      return true
    })
  }, [reports, timeframe, reportFilter, searchQuery])

  // Today specific reports
  const todayStr = new Date().toISOString().split('T')[0]
  const todayReportsList = useMemo(() => {
    return reports.filter(r => r.createdAt === todayStr)
  }, [reports, todayStr])

  const pendingReportsQueue = useMemo(() => {
    return reports.filter(r => r.status === 'pending')
  }, [reports])

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-bold tracking-wide">Connecting to Global WasteCHAiN Dispatch Tower...</p>
      </div>
    )
  }

  return (
    <div className="font-manrope space-y-6 pb-12">
      {/* ── TOP OPS DISPATCH BAR (Zomato / Blinkit Dark Fleet Header) ── */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-gray-950 via-[#0a1f14] to-gray-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full">
                FLEET RADAR • {activeDistrict.name.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Admin Command Center
              <span className="text-xs font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                Global Territory v3.0
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Cross-district dispatch tower with territory-conflict protection, real-time GPS synchronization, and fleet management.
            </p>
          </div>

          {/* Action Bar & Global Jurisdiction Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Jurisdiction Switcher */}
            <div className="flex items-center gap-2 bg-black/50 border border-emerald-500/30 rounded-2xl p-1.5 shadow-lg">
              <span className="text-emerald-400 text-xs pl-2 font-bold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Zone:</span>
              </span>
              <select
                value={selectedDistrictId}
                onChange={e => setSelectedDistrictId(e.target.value)}
                className="bg-transparent text-white font-extrabold text-xs py-1.5 px-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="munger" className="bg-gray-900 text-white">📍 Munger District (HQ)</option>
                <option value="patna" className="bg-gray-900 text-white">📍 Patna Division, Bihar</option>
                <option value="bhagalpur" className="bg-gray-900 text-white">📍 Bhagalpur, Bihar</option>
                <option value="delhi" className="bg-gray-900 text-white">📍 Delhi NCR</option>
                <option value="bengaluru" className="bg-gray-900 text-white">📍 Bengaluru Urban</option>
                <option value="mumbai" className="bg-gray-900 text-white">📍 Mumbai Metropolitan</option>
                {gpsCoords && (
                  <option value="gps" className="bg-gray-900 text-emerald-400">
                    📡 GPS: {gpsCity || 'Current Location'}
                  </option>
                )}
                <option value="global" className="bg-gray-900 text-blue-400">🌐 Global (All Districts)</option>
              </select>
            </div>

            {/* GPS Live Locate Button */}
            <button
              onClick={() => handleDetectGPS(false)}
              disabled={gpsDetecting}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Acquire live GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
              <span>{gpsDetecting ? 'Locating...' : 'Live GPS'}</span>
            </button>

            <button
              onClick={() => void loadData()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* ── CONFLICT PROTECTION & TERRITORY AUTHORITY STATUS BANNER ── */}
        <div className="mt-5 p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`p-1.5 rounded-xl ${isAuthorizedForActiveDistrict ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isAuthorizedForActiveDistrict ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </span>
            <div>
              <span className="font-bold text-white">
                Territory Authority: {activeDistrict.name} ·
              </span>
              <span className="text-gray-300 ml-1">
                Official Admin: <span className="font-mono text-emerald-300">{officialAdminOfActive}</span>
              </span>
              {isSuperAdmin && (
                <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Super Sovereign Authority
                </span>
              )}
            </div>
          </div>

          <div className="text-gray-400 font-medium">
            {isAuthorizedForActiveDistrict ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Full Regional Dispatch &amp; Approval Authority Active
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Regional Observer Mode (Authority bound to appointed admin)
              </span>
            )}
          </div>
        </div>

        {/* ── REAL-TIME TICKER STATS (Zomato/Blinkit Ops Ticker) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
              <span>TODAY&apos;S COMPLAINTS</span>
              <span className="text-amber-400 text-lg">⚡</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-white">{metrics?.todayReportsCount ?? todayReportsList.length}</span>
              <span className="text-xs text-amber-300 font-semibold">{pendingReportsQueue.length} pending</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
              <span>ACTIVE RIDERS / FLEET</span>
              <span className="text-emerald-400 text-lg">🛵</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-emerald-400">
                {metrics?.onlineCollectors ?? activeCollectors.filter(c => c.collectorAvailable).length}
              </span>
              <span className="text-xs text-gray-400 font-semibold">/ {activeCollectors.length} onboarded</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
              <span>TODAY RESOLVED</span>
              <span className="text-blue-400 text-lg">✅</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-white">
                {metrics?.todayResolvedCount ?? 0}
              </span>
              <span className="text-xs text-blue-300 font-semibold">{metrics?.todayWasteKg ?? 0} kg collected</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
              <span>PENDING APPROVALS</span>
              <span className="text-red-400 text-lg">🚨</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl lg:text-3xl font-black ${pendingCollectorRequests.length > 0 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {pendingCollectorRequests.length}
              </span>
              <span className="text-xs text-gray-400 font-semibold">requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CRITICAL ALERT: PENDING COLLECTOR APPLICATIONS (ADMIN'S JOB) ── */}
      {pendingCollectorRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
                🚨
              </div>
              <div>
                <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                  {pendingCollectorRequests.length} Collector Partnership Request(s) Awaiting Admin Approval
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  Review applicant profile and approve collector role to enable pickup assignments in {activeDistrict.name}.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              Admin Action Required
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {pendingCollectorRequests.map(applicant => (
              <div
                key={applicant.id}
                className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{applicant.name}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                      Applied
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {applicant.email || 'No email'}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {applicant.phone || 'Phone unverified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleApproveCollector(applicant.id, true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Collector
                  </button>
                  <button
                    onClick={() => handleApproveCollector(applicant.id, false)}
                    className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NAVIGATION TABS (Zomato / Blinkit Control Tower Style) ── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Live Dispatch Map</span>
          <span className="text-[10px] bg-black/20 text-white px-2 py-0.5 rounded-full font-mono">
            {pendingReportsQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Complaints &amp; Orders Feed</span>
          <span className="text-[10px] bg-black/20 text-white px-2 py-0.5 rounded-full font-mono">
            {reports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Rider Fleet &amp; Governance</span>
          {pendingCollectorRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Impact &amp; Trends Analytics</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: LIVE DISPATCH MAP (SWIGGY / BLINKIT DISPATCH TOWER)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Dispatch Map Container */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
            <DispatchMap
              reports={reports}
              users={users}
              districtCenter={activeDistrict.center}
              districtName={activeDistrict.name}
            />
          </div>

          {/* Quick Dispatch Queue (Unassigned Waste Reports) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🚨 Urgent Unassigned Complaints Queue</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                    {pendingReportsQueue.length} Awaiting Dispatch
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Assign available field collectors to pending hotspots in {activeDistrict.name}.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                <span>🛵 Available Riders:</span>
                <span className="font-mono text-sm">{activeCollectors.filter(c => c.collectorAvailable).length}</span>
              </div>
            </div>

            {pendingReportsQueue.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">All Hotspots Dispatched!</p>
                <p className="text-xs text-gray-400 mt-1">There are no pending waste reports waiting for collector assignment in this zone.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReportsQueue.slice(0, 6).map(report => (
                  <div
                    key={report.id}
                    className="border border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                          #REF-{report.id}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                          {report.wasteType}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1.5 truncate">
                        {report.location}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Quantity: <span className="font-semibold text-gray-700 dark:text-gray-300">{report.amount}</span> · Reported by {report.reporterName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/50 dark:border-amber-500/20">
                      {assigningReportId === report.id ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 block uppercase">Choose Collector:</label>
                          <select
                            onChange={e => {
                              const val = Number(e.target.value)
                              if (val > 0) void handleAssignCollector(report.id, val)
                            }}
                            defaultValue=""
                            className="w-full text-xs p-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-medium"
                          >
                            <option value="" disabled>Select active rider...</option>
                            {activeCollectors.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.collectorAvailable ? '🟢 Idle' : '🟡 Busy'}) - {c.phone || c.email}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setAssigningReportId(null)}
                            className="text-[11px] text-gray-500 hover:underline block text-center w-full"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAssigningReportId(report.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Rider</span>
                          </button>
                          {report.hasImage && (
                            <button
                              onClick={() => void handleInspectPhoto(report)}
                              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-emerald-500 cursor-pointer"
                              title="Inspect Photo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: COMPLAINTS & ORDERS FEED (FULL REGISTER)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>District Complaints Register</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {filteredReports.length} records
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Admin coordinates dispatch and assignment for {activeDistrict.name}. Ground verification and collection is completed by the field collector upon physical pickup.
              </p>
            </div>

            {/* Timeframe & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 text-xs font-bold">
                <button
                  onClick={() => setTimeframe('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'today' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  ⚡ Today
                </button>
                <button
                  onClick={() => setTimeframe('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  🌐 All Time
                </button>
              </div>

              <select
                value={reportFilter}
                onChange={e => setReportFilter(e.target.value as 'all' | 'pending' | 'assigned' | 'collected')}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="pending">⚠️ Pending Dispatch</option>
                <option value="assigned">🛵 Assigned / En Route</option>
                <option value="collected">✅ Verified Collected</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search location, citizen, rider..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4">Ref / Date</th>
                  <th className="py-3.5 px-4">Waste Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Reporter</th>
                  <th className="py-3.5 px-4">Assigned Collector</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      No complaints match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-emerald-600">#REF-{report.id}</div>
                        <div className="text-[11px] text-gray-400">{report.createdAt}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {report.wasteType}
                        </span>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{report.amount}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={report.location}>
                          {report.location}
                        </div>
                        {report.latitude && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            {report.latitude.toFixed(4)}, {report.longitude?.toFixed(4)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{report.reporterName}</div>
                        <div className="text-[11px] text-gray-400">{report.reporterPhone || report.reporterEmail || 'Citizen'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {report.collectorName ? (
                          <div>
                            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <span>🛵 {report.collectorName}</span>
                            </div>
                            <div className="text-[10px] text-gray-400">{report.collectorPhone || 'Rider Assigned'}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                            ⚠️ Not Dispatched
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          report.status === 'collected'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : report.status === 'assigned'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {report.status === 'collected' && '✅ Verified'}
                          {report.status === 'assigned' && '🛵 En Route'}
                          {report.status === 'pending' && '⏳ Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {report.status === 'pending' && (
                            <button
                              onClick={() => setAssigningReportId(report.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                          {report.hasImage && (
                            <button
                              onClick={() => void handleInspectPhoto(report)}
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-500 cursor-pointer"
                              title="View photo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3: RIDER FLEET & GOVERNANCE (TERRITORY AUTHORITY MANAGEMENT)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Sovereign Authority & Territory Governance Panel */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    Territory Authority &amp; Zero-Conflict Governance
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                      RBAC Territory Scoped
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Prevents administrative crossover collisions. Each district has a verified appointed administrator.
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-300 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                Super Admin: sudhanshu.ok1802@gmail.com
              </span>
            </div>

            {/* Territory Delegate Box */}
            {isSuperAdmin && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-300">
                  <span className="font-bold text-white">Appoint / Delegate District Authority:</span>
                  <p className="text-gray-400 text-[11px]">Transfer official admin rights for <span className="text-emerald-400 font-bold">{activeDistrict.name}</span> to a designated regional operator.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="Enter delegate email address..."
                    value={delegatingEmail}
                    onChange={e => setDelegatingEmail(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                  />
                  <button
                    onClick={() => handleAppointDistrictAdmin(activeDistrict.id, delegatingEmail)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
                  >
                    Appoint Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Fleet Overview */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activeDistrict.name} Collector Fleet</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    {activeCollectors.length} Verified Riders
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Approved collectors handle physical on-ground waste verification, pickup, and token disbursement.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {activeCollectors.filter(c => c.collectorAvailable).length} Idle &amp; Ready
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  {activeCollectors.filter(c => !c.collectorAvailable).length} On Delivery
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCollectors.map(collector => (
                <div
                  key={collector.id}
                  className="border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                        🛵
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {collector.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-mono">
                          ID: #{collector.id} · {collector.phone || collector.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      collector.collectorAvailable
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {collector.collectorAvailable ? '🟢 Available' : '🟡 On Task'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Pickups</span>
                      <span className="font-black text-gray-800 dark:text-gray-200">{collector.collectionsCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Reward Pts</span>
                      <span className="font-black text-emerald-600">{collector.balance || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {collector.lastLatitude ? `${collector.lastLatitude.toFixed(3)}, ${collector.lastLongitude?.toFixed(3)}` : `${activeDistrict.name} Base`}
                    </span>
                    {isAuthorizedForActiveDistrict && (
                      <button
                        onClick={() => handleApproveCollector(collector.id, false)}
                        className="text-red-500 hover:text-red-600 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Revoke Role
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4: IMPACT & TRENDS ANALYTICS (DAY / WEEK / MONTH VIEW)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activeDistrict.name} Environmental Impact Analytics</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Zone Verified
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Aggregated performance metrics covering waste diversion, citizen incentives, and fleet efficiency.
                </p>
              </div>

              {/* Timeframe switch */}
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 text-xs font-bold">
                {(['today', 'week', 'month', 'all'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                      timeframe === t ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {t === 'today' ? '⚡ Today' : t === 'week' ? '📅 7 Days' : t === 'month' ? '🗓️ 30 Days' : '🌐 All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Waste Diverted</span>
                <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                  {timeframe === 'today' ? `${metrics?.todayWasteKg ?? 0} kg` : `${metrics?.totalWasteKg ?? 0} kg`}
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Diverted from {activeDistrict.name} landfills</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">CO2 Emissions Offset</span>
                <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                  {timeframe === 'today' ? `${Math.round((metrics?.todayWasteKg ?? 0) * 0.5 * 10) / 10} kg` : `${metrics?.co2OffsetKg ?? 0} kg`}
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Net climate impact reduction</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Citizen Rewards Economy</span>
                <div className="mt-2 text-3xl font-black text-amber-600">
                  {timeframe === 'today' ? (metrics?.todayCitizenPoints ?? 0) : (metrics?.citizenPointsEarned ?? 0)} pts
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Distributed for verified complaints</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-5">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Collector Fleet Earnings</span>
                <div className="mt-2 text-3xl font-black text-purple-600">
                  {timeframe === 'today' ? (metrics?.todayCollectorPoints ?? 0) : (metrics?.collectorPointsEarned ?? 0)} pts
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-purple-500" />
                  <span>Paid for fulfilled collections</span>
                </div>
              </div>
            </div>

            {/* Waste Composition Breakdown */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-4">
                Waste Category Breakdown ({activeDistrict.name} Municipal Stream)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'Plastic', pct: '42%', color: 'bg-emerald-500', kg: Math.round((metrics?.totalWasteKg ?? 100) * 0.42) },
                  { name: 'Organic', pct: '31%', color: 'bg-lime-500', kg: Math.round((metrics?.totalWasteKg ?? 100) * 0.31) },
                  { name: 'Metal / E-Waste', pct: '15%', color: 'bg-blue-500', kg: Math.round((metrics?.totalWasteKg ?? 100) * 0.15) },
                  { name: 'Hazardous / Other', pct: '12%', color: 'bg-amber-500', kg: Math.round((metrics?.totalWasteKg ?? 100) * 0.12) },
                ].map(cat => (
                  <div key={cat.name} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>{cat.name}</span>
                      <span className="font-mono">{cat.pct}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: cat.pct }} />
                    </div>
                    <span className="text-xs font-black text-gray-800 dark:text-gray-200 mt-2 block">
                      ~{cat.kg} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO INSPECTOR MODAL ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  Hotspot Evidence · #REF-{selectedReport.id}
                </h4>
                <p className="text-xs text-gray-500">{selectedReport.location}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingPhoto ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Fetching report photograph...</span>
                </div>
              ) : selectedReport.imageUrl ? (
                <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-black">
                  <Image
                    src={selectedReport.imageUrl}
                    alt="Waste report ground evidence"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-bold">No photo attached for this report</p>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs space-y-1">
                <p><span className="font-bold text-gray-600 dark:text-gray-400">Waste Type:</span> {selectedReport.wasteType} ({selectedReport.amount})</p>
                <p><span className="font-bold text-gray-600 dark:text-gray-400">Reporter:</span> {selectedReport.reporterName}</p>
                <p><span className="font-bold text-gray-600 dark:text-gray-400">Collector:</span> {selectedReport.collectorName || 'Not yet dispatched'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
