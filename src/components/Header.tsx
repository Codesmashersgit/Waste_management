// @ts-nocheck
'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"

const clientId = "BKBqODxDa2gDj_q0u-8u_E0_MXKMXWCPDF06Lbkrx4__vluHu-N9wcy3UGzIKjp8Ex44eYvflt7kf7Ymsj--QYY";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.sapphire_devnet,
  privateKeyProvider,
});

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<any[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [balance, setBalance] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);
        if (web3auth.connected) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try { await createUser(user.email, user.name || 'Anonymous User'); } catch (e) {}
          }
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
    const fetchNotifications = async () => {
      if (userInfo?.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) setNotifications(await getUnreadNotifications(user.id));
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userInfo]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (userInfo?.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) setBalance(await getUserBalance(user.id));
      }
    };
    fetchBalance();
    const handleBalanceUpdate = (e: CustomEvent) => setBalance(e.detail);
    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    return () => window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
  }, [userInfo]);

  const login = async () => {
    if (!web3auth) return;
    try {
      const p = await web3auth.connect();
      setProvider(p);
      setLoggedIn(true);
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try { await createUser(user.email, user.name || 'Anonymous User'); } catch (e) {}
      }
    } catch (error) { console.error("Login error:", error); }
  };

  const logout = async () => {
    if (!web3auth) return;
    try {
      await web3auth.logout();
      setProvider(null); setLoggedIn(false); setUserInfo(null);
      localStorage.removeItem('userEmail');
    } catch (error) { console.error("Logout error:", error); }
  };

  const handleNotificationClick = async (id: number) => {
    await markNotificationAsRead(id);
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
              <span className="text-[9px] text-gray-400 font-medium">Transparent & Decentralized</span>
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
                placeholder="Search locations, waste types..."
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
                <p className="text-sm font-semibold text-gray-700">Notifications</p>
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
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Balance Badge */}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
            <Coins className="h-4 w-4 text-green-600" />
            <span className="font-bold text-sm text-green-700">{balance.toFixed(0)}</span>
            <span className="text-xs text-green-500 hidden sm:inline">pts</span>
          </div>

          {/* Auth */}
          {!loggedIn ? (
            <button
              onClick={login}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-green-200 hover:shadow-md"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-sm font-medium px-3 py-2 rounded-xl transition-all duration-200">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {userInfo?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border border-gray-100">
                <div className="p-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-800 truncate">{userInfo?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{userInfo?.email || ''}</p>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer m-1 rounded-xl">
                  <Link href="/settings">👤 Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer m-1 rounded-xl">
                  <Link href="/rewards">🪙 Rewards</Link>
                </DropdownMenuItem>
                <div className="border-t border-gray-50 mt-1 pt-1">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer m-1 rounded-xl text-red-500 hover:bg-red-50 focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}