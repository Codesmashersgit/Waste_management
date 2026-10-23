'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useAuthGuard } from '@/hooks/useAuthGuard'

type Task = {
  id: number
  location: string
  wasteType: string
  amount: string
  status: string
  date: string
  collectorId: number | null
}

export default function CollectPage() {
  const { email: guardEmail, checking } = useAuthGuard()
  const [tasks, setTasks] = useState<Task[]>([])
  const [collectingId, setCollectingId] = useState<number | null>(null)

  useEffect(() => {
    if (!guardEmail) return
    const init = async () => {
      try {
        const response = await fetch('/api/web/collect', { cache: 'no-store', credentials: 'include' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load collection tasks.')
        setTasks(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load collection tasks.')
      }
    }
    init()
  }, [guardEmail])

  const handleCollect = async (task: Task) => {
    setCollectingId(task.id)
    try {
      const response = await fetch('/api/web/collect', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: task.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not confirm this pickup.')
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'collected' } : t))
      
      try {
        const accountResponse = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' })
        if (accountResponse.ok) {
          const account = await accountResponse.json()
          window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: account.balance }))
        }
      } catch {}

      toast.success('Waste collected! You earned 20 points 🎉')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to collect waste.')
    } finally {
      setCollectingId(null)
    }
  }

  if (checking) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin h-8 w-8 text-green-500" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Collect Waste</h1>
      <p className="text-gray-600 mb-8">Pick up waste reported by community members and earn reward points!</p>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No waste collection tasks available right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-gray-800">{task.location}</span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Type: <span className="font-medium text-gray-700">{task.wasteType}</span></p>
                  <p>Amount: <span className="font-medium text-gray-700">{task.amount}</span></p>
                  <p>Reported: <span className="font-medium text-gray-700">{task.date}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {task.status === 'collected' ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="h-5 w-5" /> Collected
                  </span>
                ) : (
                  <Button
                    onClick={() => handleCollect(task)}
                    disabled={collectingId === task.id}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    {collectingId === task.id ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Collect (+20 pts)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
