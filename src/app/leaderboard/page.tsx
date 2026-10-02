'use client'
import { useState, useEffect } from 'react'
import { Medal, Loader, Trophy, Coins } from 'lucide-react'
import { getAllRewards } from '@/utils/db/actions'

export default function LeaderboardPage() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const data = await getAllRewards()
      setRewards(data)
      setLoading(false)
    }
    init()
  }, [])

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500'
    if (index === 1) return 'text-gray-400'
    if (index === 2) return 'text-amber-600'
    return 'text-gray-300'
  }

  const getBgColor = (index: number) => {
    if (index === 0) return 'bg-yellow-50 border-yellow-200'
    if (index === 1) return 'bg-gray-50 border-gray-200'
    if (index === 2) return 'bg-amber-50 border-amber-200'
    return 'bg-white border-gray-100'
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin h-8 w-8 text-green-500" /></div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-gray-800 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        Leaderboard
      </h1>
      <p className="text-gray-500 mb-8">Top contributors in our waste management community.</p>

      {rewards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Medal className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>No data yet. Be the first to earn points!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward, index) => (
            <div key={reward.id} className={`border rounded-2xl p-5 flex items-center gap-4 transition-all ${getBgColor(index)}`}>
              <div className="flex items-center justify-center w-10 h-10">
                {index < 3 ? (
                  <Trophy className={`h-7 w-7 ${getMedalColor(index)}`} />
                ) : (
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{reward.userName || 'Anonymous User'}</p>
                <p className="text-sm text-gray-500">Level {reward.level}</p>
              </div>
              <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                <Coins className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-700">{reward.points}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
