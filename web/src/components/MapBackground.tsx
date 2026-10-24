'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ClientMapBackground = dynamic(() => import('./ClientMapBackground'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#eef5ee]" />
})

export default function MapBackground({ opacity = 0.6 }: { opacity?: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden" 
      aria-hidden="true"
    >
      <div 
        className="w-full h-full transition-opacity duration-700"
        style={{ opacity: mounted ? opacity : 0 }}
      >
        <ClientMapBackground />
      </div>
      {/* Soft gradient masks to blend cleanly into the page without washing out the center map */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-transparent to-white/50 pointer-events-none" />
    </div>
  )
}
