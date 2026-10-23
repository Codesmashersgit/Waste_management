'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Loader, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: number; email: string | null; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' })
        if (!response.ok) throw new Error('Could not load your profile. Please sign in again.')
        const data = await response.json()
        setUser(data.user)
        setName(data.user.name)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load your profile.')
      } finally { setLoading(false) }
    }
    init()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/web/account', {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save your profile.')
      setUser(data)
      setName(data.name)
      localStorage.setItem('userName', data.name)
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your profile.')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin h-8 w-8 text-green-500" /></div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-gray-800">Settings</h1>
      <p className="text-gray-500 mb-8">Manage your account and preferences.</p>

      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>

        {user ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={user.email ?? ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email is managed by Web3Auth and cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <p className="text-gray-600 text-sm">ID: {user.id}</p>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Please log in to see your profile settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
