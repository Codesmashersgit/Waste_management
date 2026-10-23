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
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useLanguage } from "@/contexts/LanguageContext"

const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || "BJxBpqjekUHtHmPdxNWbLSt222ZMsm2n7IZIztGMbiynfijSRWhQKpgtEzUJBBfJFTcuaai9SKCkIERQlb-paps";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://ethereum-sepolia-rpc.publicnode.com",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

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
        await web3auth.initModal();
        if (web3auth.connected) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          if (user && user.email) {
            localStorage.setItem('userEmail', user.email);
            if (user.name) localStorage.setItem('userName', user.name);
            setUserInfo({ email: user.email, name: user.name || undefined });
          }
        }
        const response = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setLoggedIn(true);
          setUserInfo(data.user);
          setBalance(data.balance);
          setNotifications(data.notifications);
          localStorage.setItem('userEmail', data.user.email || '');
          localStorage.setItem('userName', data.user.name || '');
        } else if (response.status === 401) {
          setLoggedIn(false);
          setUserInfo(null);
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
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
      setNotifications(data.notifications);
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
      if (web3auth && web3auth.connected) {
        await web3auth.logout();
      }
    } catch (error) { console.error("Logout error:", error); }
    try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
    setLoggedIn(false); 
    setUserInfo(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const handleNotificationClick = async (id: number) => {
    await fetch('/api/web/account', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: id }) });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 animate-pulse" />
          <div className="w-24 h-4 rounded bg-green-100 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-50 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 gap-3">

        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-xl bg-green-600 group-hover:bg-green-700 transition-colors">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-bold text-gray-900 text-base tracking-tight">WASTE-CHAiN</span>
              <span className="text-[9px] text-gray-400 font-medium">{t('header.tagline')}</span>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        {!isMobile && (
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('header.search')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile search */}
          {isMobile && (
            <button className="p-2 rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all">
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* 🌐 Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs font-bold text-gray-600 hover:text-green-700"
            title="Switch Language"
          >
            🌐 {lang === 'en' ? 'हिं' : 'EN'}
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl shadow-xl border border-gray-100">
              <div className="p-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700">{t('header.notifications')}</p>
              </div>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    className="p-3 cursor-pointer hover:bg-green-50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">{n.type}</span>
                      <span className="text-sm text-gray-600">{n.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {t('header.no_notifications')}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Balance Badge */}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
            <Coins className="h-4 w-4 text-green-600" />
            <span className="font-bold text-sm text-green-700">{balance.toFixed(0)}</span>
            <span className="text-xs text-green-500 hidden sm:inline">{t('header.pts')}</span>
          </div>

          {/* Auth */}
          {!loggedIn ? (
            <Link href="/login">
              <button className="cursor-pointer flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-green-200 hover:shadow-md">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('header.login')}</span>
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 bg-green-50/80 border border-green-200/80 hover:bg-green-100 text-green-900 text-sm font-medium px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shadow-xs">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                      {(userInfo?.name?.[0] || userInfo?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="font-semibold text-xs text-gray-800 max-w-[120px] truncate">
                        {userInfo?.name || userInfo?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-[10px] text-green-600 font-medium">{t('header.logged_in')}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border border-gray-100 p-1.5">
                  <div className="p-3 border-b border-gray-100 bg-gray-50/50 rounded-xl mb-1">
                    <p className="text-sm font-bold text-gray-800 truncate">{userInfo?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{userInfo?.email || ''}</p>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer m-1 rounded-xl">
                    <Link href="/settings">👤 {t('header.profile')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer m-1 rounded-xl">
                    <Link href="/rewards">🪙 {t('header.rewards')}</Link>
                  </DropdownMenuItem>
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer m-1 rounded-xl text-red-500 hover:bg-red-50 focus:text-red-500 font-medium"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> {t('header.sign_out')}
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
