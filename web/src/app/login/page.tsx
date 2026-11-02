'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Leaf, Loader, ArrowRight, ShieldCheck } from 'lucide-react'

const CLIENT_ID = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || 'BJxBpqjekUHtHmPdxNWbLSt222ZMsm2n7IZIztGMbiynfijSRWhQKpgtEzUJBBfJFTcuaai9SKCkIERQlb-paps'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get('redirect') || '/'
  const redirectTo = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') ? requestedRedirect : '/'
  const [status, setStatus] = useState<'init' | 'ready' | 'connecting' | 'done' | 'error'>('init')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setStatus('ready')
  }, [])

  const handleConnect = async () => {
    setStatus('connecting')
    setErrorMsg('')
    try {
      const { Web3Auth } = await import('@web3auth/modal')
      const { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } = await import('@web3auth/base')
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
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        privateKeyProvider,
        uiConfig: {
          appName: 'WasteCHAiN',
          mode: 'dark',
          theme: { primary: '#10b981' },
          loginMethodsOrder: ['google', 'email_passwordless'] as const,
          primaryButton: 'socialLogin',
        },
      })

      await web3auth.initModal()
      const provider = await web3auth.connect()

      if (provider) {
        const user = await web3auth.getUserInfo()
        let idToken = user.idToken
        if (!idToken) {
          try {
            const auth = await web3auth.authenticateUser()
            idToken = auth?.idToken
          } catch (e) {
            console.warn('authenticateUser not available', e)
          }
        }

        const email = user.email
        if (!email && !idToken) throw new Error('Sign-in did not return a verified email. Please choose Google/social login.')

        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: idToken || undefined,
            email: email || undefined,
            name: user.name || undefined,
          })
        })
        const session = await sessionResponse.json().catch(() => ({}))
        if (!sessionResponse.ok) throw new Error(session.message || 'Could not establish a secure session. Please try again.')

        const finalEmail = session.email || email
        const finalName = session.name || user.name || ''
        if (finalEmail) {
          localStorage.setItem('userEmail', finalEmail)
          localStorage.setItem('userName', finalName)
        }
        setStatus('done')
        router.replace(redirectTo)
      } else {
        setStatus('ready')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      console.error(error)
      if (message.toLowerCase().includes('user closed') || message.toLowerCase().includes('cancelled')) {
        setStatus('ready')
      } else {
        setStatus('error')
        setErrorMsg(message || 'Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 font-sans">

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 border border-emerald-500/20 bg-gray-900 shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <div className="w-full h-full rounded-2xl bg-gray-950 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">
              WASTE<span className="text-emerald-400">CHAiN</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
          </div>
        </div>

        {/* Status */}
        {status === 'init' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <Loader className="h-4 w-4 animate-spin" /> Loading...
          </div>
        )}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <Loader className="h-4 w-4 animate-spin" /> Signing in...
          </div>
        )}
        {status === 'done' && (
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Signed in! Redirecting...
          </div>
        )}

        {/* Login Button */}
        {(status === 'ready' || status === 'error') && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Continue with Google</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-300 text-xs font-semibold transition text-center"
            >
              ← Back to Home
            </button>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="w-full p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs text-center leading-relaxed">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gray-950" />}>
      <LoginPageContent />
    </Suspense>
  )
}
