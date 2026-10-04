// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Leaf, Loader, ArrowRight } from 'lucide-react'
import { createUser } from '@/utils/db/actions'

const CLIENT_ID = 'BJxBpqjekUHtHmPdxNWbLSt222ZMsm2n7IZIztGMbiynfijSRWhQKpgtEzUJBBfJFTcuaai9SKCkIERQlb-paps'
const NETWORK = 'sapphire_devnet'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [status, setStatus] = useState<'init' | 'ready' | 'connecting' | 'done' | 'error'>('init')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (localStorage.getItem('userEmail')) {
      router.replace(redirectTo)
      return
    }
    setStatus('ready')
  }, [])

  const handleConnect = async () => {
    setStatus('connecting')
    setErrorMsg('')
    try {
      // Dynamic import to avoid any module-level caching issues
      const { Web3Auth } = await import('@web3auth/modal')
      const { CHAIN_NAMESPACES } = await import('@web3auth/base')
      const { EthereumPrivateKeyProvider } = await import('@web3auth/ethereum-provider')

      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: '0xaa36a7',
            rpcTarget: 'https://ethereum-sepolia-rpc.publicnode.com',
            displayName: 'Ethereum Sepolia Testnet',
            blockExplorerUrl: 'https://sepolia.etherscan.io',
            ticker: 'ETH',
            tickerName: 'Ethereum',
          },
        },
      })

      const web3auth = new Web3Auth({
        clientId: CLIENT_ID,
        web3AuthNetwork: 'sapphire_devnet' as any,
        privateKeyProvider,
        uiConfig: {
          appName: 'WasteCHAiN',
          mode: 'dark',
          theme: { primary: '#22c55e' },
          loginMethodsOrder: ['google', 'email_passwordless'],
          primaryButton: 'socialLogin',
        },
      })

      await web3auth.initModal()
      const provider = await web3auth.connect()

      if (provider) {
        const user = await web3auth.getUserInfo()
        if (user.email) {
          localStorage.setItem('userEmail', user.email)
          localStorage.setItem('userName', user.name || '')
          try { await createUser(user.email, user.name || 'User') } catch (_) {}
        }
        setStatus('done')
        router.replace(redirectTo)
      } else {
        setStatus('ready')
      }
    } catch (e: any) {
      console.error(e)
      if (e?.message?.toLowerCase().includes('user closed') || e?.message?.toLowerCase().includes('cancelled')) {
        setStatus('ready')
      } else {
        setStatus('error')
        setErrorMsg(e?.message || 'Something went wrong. Try again.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Dark green background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #022c1a 0%, #053d25 40%, #064a2c 100%)',
      }} />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(74,222,128,0.15)',
          boxShadow: '0 0 60px rgba(74,222,128,0.08), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
            style={{ boxShadow: '0 0 30px rgba(74,222,128,0.4)' }}>
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">WASTE-CHAiN</h1>
            <p className="text-green-400/60 text-xs mt-0.5 uppercase tracking-widest">Decentralized Eco Platform</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm text-center leading-relaxed">
          Login with Google or social account to access the platform.
        </p>

        {(status === 'init') && (
          <div className="flex items-center gap-2 text-green-300 text-sm">
            <Loader className="h-4 w-4 animate-spin" /> Initializing...
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-green-300 text-sm">
            <Loader className="h-4 w-4 animate-spin" /> Opening login...
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Loader className="h-4 w-4 animate-spin" /> Redirecting...
          </div>
        )}

        {(status === 'ready' || status === 'error') && (
          <button onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 0 25px rgba(34,197,94,0.35)',
            }}
          >
            Login with Web3Auth <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
        {status === 'ready' && (
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-400 text-xs">
            ← Go back
          </button>
        )}
      </div>
    </div>
  )
}
