'use client'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { MapPin, Trash, Coins, Medal, Settings, Home, BarChart3 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface SidebarProps {
  open: boolean
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const sidebarItems = [
    { href: "/", icon: Home, label: t('nav.home') },
    { href: "/report", icon: MapPin, label: t('nav.report') },
    { href: "/collect", icon: Trash, label: t('nav.collect') },
    { href: "/rewards", icon: Coins, label: t('nav.rewards') },
    { href: "/leaderboard", icon: Medal, label: t('nav.leaderboard') },
    { href: "/analytics", icon: BarChart3, label: t('nav.analytics') },
  ]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 pt-16 transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{ background: 'linear-gradient(180deg, #052e16 0%, #0a1f0f 50%, #071a0c 100%)' }}
    >
      {/* Top glow line */}
      <div className="absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

      <nav className="h-full flex flex-col justify-between py-6">
        {/* Nav Items */}
        <div className="px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative
                    ${isActive
                      ? 'bg-green-500/20 text-green-400 glow-green-sm'
                      : 'text-gray-400 hover:bg-white/5 hover:text-green-300'
                    }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-400 rounded-r-full" />
                  )}
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-all duration-200
                      ${isActive ? 'text-green-400' : 'text-gray-500 group-hover:text-green-400'}`}
                  />
                  <span className={`text-sm font-medium ${isActive ? 'text-green-300' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className="px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent mb-4" />
          <Link href="/settings">
            <div
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                ${pathname === '/settings'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-green-300'
                }`}
            >
              <Settings className="h-5 w-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              <span className="text-sm font-medium">{t('nav.settings')}</span>
            </div>
          </Link>

          {/* Brand tag at bottom */}
          <div className="mt-6 mx-2 p-3 rounded-xl bg-green-900/30 border border-green-500/20">
            <p className="text-xs text-green-400/70 text-center font-medium">WASTE-CHAiN</p>
            <p className="text-[10px] text-gray-500 text-center mt-0.5">{t('header.tagline')}</p>
          </div>
        </div>
      </nav>
    </aside>
  )
}