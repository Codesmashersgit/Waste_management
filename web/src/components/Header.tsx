'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Coins, Leaf, Search, Bell, ChevronDown, LogIn, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useLanguage } from "@/contexts/LanguageContext"

type HeaderNotification = { id: number; type: string; message: string };
type HeaderUser = { email?: string; name?: string };

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<HeaderUser | null>(null);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [balance, setBalance] = useState(0)
  const { lang, setLang, t } = useLanguage()

  useEffect(() => {
    const cachedEmail = localStorage.getItem('userEmail');
    const cachedName = localStorage.getItem('userName');
    if (cachedEmail) {
      setLoggedIn(true);
      setUserInfo({ email: cachedEmail, name: cachedName || cachedEmail.split('@')[0] });
    }

    const init = async () => {
      try {
        const response = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setLoggedIn(true);
          setUserInfo(data.user);
          setBalance(data.balance);
          setNotifications(data.notifications || []);
          localStorage.setItem('userEmail', data.user.email || '');
          localStorage.setItem('userName', data.user.name || '');
        } else if (response.status === 401) {
          if (!cachedEmail) {
            setLoggedIn(false);
            setUserInfo(null);
          }
        }
      } catch (error) {
        console.error("Error loading account:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const refreshAccount = async () => {
      if (!loggedIn) return;
      const response = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      setBalance(data.balance);
      setNotifications(data.notifications || []);
    };
    const interval = setInterval(() => void refreshAccount(), 30000);
    const handleBalanceUpdate = (e: CustomEvent) => setBalance(e.detail);
    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    return () => {
      clearInterval(interval)
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener)
    }
  }, [loggedIn]);

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {}
    setLoggedIn(false); 
    setUserInfo(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const handleNotificationClick = async (id: number) => {
    await fetch('/api/web/account', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <header className="h-16 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 sticky top-0 z-50 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="w-24 h-4 rounded bg-emerald-500/20 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/80 fixed top-0 w-full z-50 shadow-lg">
      <div className="flex items-center justify-between h-full px-4 gap-3">

        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-emerald-400 transition-all duration-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 group-hover:scale-105 transition-all shadow-md shadow-emerald-500/20">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-extrabold text-white text-base tracking-tight">
                WASTE<span className="text-emerald-400">CHAiN</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                {t('header.tagline') || 'Smart Municipal Grid'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        {!isMobile && (
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder={t('header.search') || 'Search reports, fleet, districts...'}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-900/90 border border-gray-800 text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Mobile search */}
          {isMobile && (
            <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-emerald-400 transition-all">
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-800 bg-gray-900/80 hover:bg-gray-800 hover:border-emerald-500/40 transition-all duration-200 text-xs font-bold text-gray-300 hover:text-emerald-300"
            title="Switch Language"
          >
            <span>🌐</span>
            <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-emerald-400 transition-all duration-200">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border border-gray-800 bg-gray-900 text-gray-100 p-2">
              <div className="p-3 border-b border-gray-800/80">
                <p className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">{t('header.notifications') || 'Alerts & Telemetry'}</p>
              </div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    className="p-3 cursor-pointer hover:bg-gray-800/80 rounded-xl transition"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{n.type}</span>
                      <span className="text-sm text-gray-300">{n.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30 text-emerald-400" />
                  {t('header.no_notifications') || 'No new notifications'}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Balance Badge */}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-1.5 shadow-sm">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span className="font-extrabold text-sm text-emerald-300">{balance.toFixed(0)}</span>
            <span className="text-[11px] text-emerald-400/80 font-bold hidden sm:inline">{t('header.pts') || 'PTS'}</span>
          </div>

          {/* Auth Button */}
          {!loggedIn ? (
            <Link href="/login">
              <button className="cursor-pointer flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95">
                <LogIn className="h-4 w-4" />
                <span>{t('header.login') || 'Sign In'}</span>
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 bg-gray-900 border border-gray-800 hover:border-emerald-500/40 text-gray-200 text-sm font-medium px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                      {(userInfo?.name?.[0] || userInfo?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="font-bold text-xs text-white max-w-[120px] truncate">
                        {userInfo?.name || userInfo?.email?.split('@')[0] || 'Admin'}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">{t('header.logged_in') || 'Active'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border border-gray-800 bg-gray-900 text-gray-200 p-2">
                  <div className="p-3 border-b border-gray-800 bg-gray-950/60 rounded-xl mb-1.5">
                    <p className="text-xs font-bold text-white truncate">{userInfo?.name || 'Administrator'}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{userInfo?.email || ''}</p>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer m-0.5 rounded-xl text-xs hover:bg-gray-800 hover:text-emerald-300">
                    <Link href="/settings">👤 Profile & Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer m-0.5 rounded-xl text-xs hover:bg-gray-800 hover:text-emerald-300">
                    <Link href="/rewards">🪙 Eco-Token Rewards</Link>
                  </DropdownMenuItem>
                  <div className="border-t border-gray-800 mt-1.5 pt-1.5">
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer m-0.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 font-bold"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> {t('header.sign_out') || 'Sign Out'}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
