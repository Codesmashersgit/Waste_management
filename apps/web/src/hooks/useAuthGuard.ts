import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAuthGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('userEmail')
    if (!stored) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else {
      void (async () => {
        try {
          const response = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' })
          if (response.status === 401) {
            localStorage.removeItem('userEmail')
            localStorage.removeItem('userName')
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
            return
          }
          if (response.ok) {
            const data = await response.json()
            setEmail(data.user.email || stored)
          } else {
            setEmail(stored)
          }
        } catch {
          setEmail(stored)
        } finally {
          setChecking(false)
        }
      })()
    }
  }, [pathname, router])

  return { email, checking }
}
