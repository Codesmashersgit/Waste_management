'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Leaf, Loader, ArrowRight, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react'

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

      const web3auth = new Web3Auth({
        clientId: CLIENT_ID,
        web3AuthNetwork: 'sapphire_devnet',
        chainConfig: {
          chainNamespace: 'eip155',
          chainId: '0xaa36a7',
          rpcTarget: 'https://ethereum-sepolia-rpc.publicnode.com',
          displayName: 'Ethereum Sepolia Testnet',
          blockExplorerUrl: 'https://sepolia.etherscan.io',
          ticker: 'ETH',
          tickerName: 'Ethereum',
        },
        uiConfig: {
          appName: 'WasteCHAiN',
          mode: 'dark',
          theme: { primary: '#10b981' },
          loginMethodsOrder: ['google', 'email_passwordless'],
          primaryButton: 'socialLogin',
        },
      })

      await web3auth.initModal()
      const provider = await web3auth.connect()

      if (provider || web3auth.connected) {
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
        if (!email && !idToken) throw new Error('Sign-in did not return a verified email. Please choose Google or social login.')

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
        setErrorMsg(message || 'Social sign-in was interrupted. You can also sign in via Direct Admin Session below.')
      }
    }
  }

  // Backup one-click admin sign-in in case Google OAuth domain whitelisting is pending
  const handleDirectAdminLogin = async () => {
    setStatus('connecting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sudhanshu.ok1802@gmail.com',
          name: 'Sudhanshu (Super Admin)',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to initialize session.')
      localStorage.setItem('userEmail', data.email || 'sudhanshu.ok1802@gmail.com')
      localStorage.setItem('userName', data.name || 'Sudhanshu (Super Admin)')
      setStatus('done')
      router.replace(redirectTo)
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Could not initialize admin session.')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030712] font-sans selection:bg-emerald-500 selection:text-black overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#030712] to-[#030712]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(16, 185, 129, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 border border-emerald-500/25 bg-gray-900/90 backdrop-blur-3xl shadow-[0_0_80px_rgba(16,185,129,0.12)]">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-[0_0_35px_rgba(16,185,129,0.45)]">
            <div className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center">
              <Leaf className="h-8 w-8 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Municipal Command Portal
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              WASTE<span className="text-emerald-400">CHAiN</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Autonomous Sanitation & Dispatch Network</p>
          </div>
        </div>

        {/* Status indicator */}
        {status === 'init' && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wide">
            <Loader className="h-4 w-4 animate-spin" /> Preparing secure gateway...
          </div>
        )}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wide">
            <Loader className="h-4 w-4 animate-spin" /> Authenticating credentials...
          </div>
        )}
        {status === 'done' && (
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wide">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Authorized. Loading Command Radar...
          </div>
        )}

        {/* Action Buttons */}
        {(status === 'ready' || status === 'error') && (
          <div className="w-full flex flex-col gap-3.5">
            {/* Primary Google Login Button */}
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {/* Google SVG Icon */}
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Subtle Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">or admin access</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Direct Admin Session Button (Guarantees login works even if Web3Auth domain origin whitelist is delayed) */}
            <button
              onClick={handleDirectAdminLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-xs text-emerald-400/90 border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 hover:border-emerald-400/60 transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Instant Admin Login (sudhanshu.ok1802@gmail.com)</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="mt-1 text-gray-500 hover:text-gray-300 text-xs font-semibold transition text-center cursor-pointer"
            >
              ← Back to Main Radar
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="w-full p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs text-center leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Trust & Compliance Footer */}
        <div className="pt-2 border-t border-gray-800/80 w-full flex items-center justify-between text-[10px] font-semibold text-gray-500">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Neon PostgreSQL Synced
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#030712]" />}>
      <LoginPageContent />
    </Suspense>
  )
}
