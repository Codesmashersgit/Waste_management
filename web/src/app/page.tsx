'use client'
import { useState, useEffect } from 'react'
import MarketingLanding from '@/components/MarketingLanding'
import AdminFleetControlDashboard from '@/components/admin/AdminFleetControlDashboard'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const email = localStorage.getItem('userEmail')
    if (email) {
      setLoggedIn(true)
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' })
        if (res.ok) {
          setLoggedIn(true)
        } else if (res.status === 401) {
          if (!localStorage.getItem('userEmail')) {
            setLoggedIn(false)
          }
        }
      } catch {
        // network fallback
      }
    }
    void checkAuth()
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!loggedIn) {
    return <MarketingLanding />
  }

  // Zomato / Swiggy / Blinkit Style Admin Dispatch Command Center
  return <AdminFleetControlDashboard />
}
