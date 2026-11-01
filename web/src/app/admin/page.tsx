'use client'

import { Suspense } from 'react'
import AdminFleetControlDashboard from '@/components/admin/AdminFleetControlDashboard'

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-3xl bg-gray-900/40" />}>
        <AdminFleetControlDashboard />
      </Suspense>
    </div>
  )
}
