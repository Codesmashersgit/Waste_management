'use client'

import { useState } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem('userEmail'))
    }
    checkLogin()
    setIsMounted(true)
    window.addEventListener('storage', checkLogin)
    const interval = setInterval(checkLogin, 1000)
    return () => {
      window.removeEventListener('storage', checkLogin)
      clearInterval(interval)
    }
  }, [])

  const isLandingPage = (pathname === '/' && !isLoggedIn) || pathname === '/login'

  if (!isMounted) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-black min-h-screen`} />
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {isLandingPage ? (
          <main className="min-h-screen bg-gray-900 text-white">
            {children}
          </main>
        ) : (
          <div className="min-h-screen bg-gray-50/80 flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />
            <div className="flex flex-1">
              <Sidebar open={sidebarOpen} />
              {/* Overlay for mobile */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <main className="flex-1 p-4 lg:p-8 lg:ml-64 transition-all duration-300 min-h-[calc(100vh-4rem)] pt-20 lg:pt-20">
                {children}
              </main>
            </div>
          </div>
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#052e16',
              color: '#d1fae5',
              border: '1px solid rgba(74,222,128,0.2)',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#052e16' },
            },
          }}
        />
      </body>
    </html>
  )
}
