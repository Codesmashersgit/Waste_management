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
      setEmail(stored)
      setChecking(false)
    }
  }, [pathname, router])

  return { email, checking }
}
