// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Leaf, LogIn, Globe, Recycle, Coins, Shield } from 'lucide-react'
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { createUser } from '@/utils/db/actions'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ weight: ['400', '600', '700'], subsets: ['latin'], display: 'swap' })

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0xaa36a7',
  rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
  displayName: 'Ethereum Sepolia Testnet',
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
  logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
}

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } })
const web3auth = new Web3Auth({
  clientId: 'BKBqODxDa2gDj_q0u-8u_E0_MXKMXWCPDF06Lbkrx4__vluHu-N9wcy3UGzIKjp8Ex44eYvflt7kf7Ymsj--QYY',
  web3AuthNetwork: WEB3AUTH_NETWORK.sapphire_devnet,
  privateKeyProvider,
})

const features = [
  { icon: Globe, label: 'Report Waste Anywhere' },
  { icon: Coins, label: 'Earn Reward Tokens' },
  { icon: Recycle, label: 'Track Collections' },
  { icon: Shield, label: 'Blockchain Verified' },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal()
        if (web3auth.connected) {
          router.replace(redirectTo)
        }
      } catch (e) {
        console.error('Web3Auth init error:', e)
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      await web3auth.connect()
      const user = await web3auth.getUserInfo()
      if (user.email) {
        localStorage.setItem('userEmail', user.email)
        try { await createUser(user.email, user.name || 'Anonymous User') } catch (_) {}
      }
      router.replace(redirectTo)
    } catch (e) {
      console.error('Login error:', e)
      setLoading(false)
    }
  }

  return (
    <div className={`${poppins.className} fixed inset-0 z-50 flex items-center justify-center`}>

      {/* ── Blurred Background ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 35%, #166534 65%, #0f4c23 100%)',
        }}
      />

      <div className="absolute top-0 left-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-600/10 rounded-full blur-2xl" />

      {/* Floating feature pills */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {features.map((f, i) => (
          <div
            key={f.label}
            className="absolute flex items-center gap-2 glass-dark text-green-300 text-xs font-medium px-4 py-2 rounded-full"
            style={{
              top: `${20 + i * 18}%`,
              left: i % 2 === 0 ? '5%' : '75%',
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <f.icon className="h-3.5 w-3.5 text-green-400" />
            {f.label}
          </div>
        ))}
      </div>

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mb-4 glow-green">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-glow">WASTE-CHAiN</h1>
            <p className="text-green-300/70 text-sm mt-1">Transparent & Decentralized</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome Back! 👋</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Login to report waste, collect, earn rewards and make a difference.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">Login with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || initializing}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading || initializing
                ? 'rgba(74,222,128,0.3)'
                : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: '#052e16',
              boxShadow: '0 8px 32px rgba(74,222,128,0.3)',
            }}
          >
            {initializing ? (
              <>
                <div className="w-5 h-5 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                Initializing...
              </>
            ) : loading ? (
              <>
                <div className="w-5 h-5 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Login with Web3Auth
              </>
            )}
          </button>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-5 h-5 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-3 w-3 text-green-400" />
                </div>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
