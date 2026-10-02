'use client'
import { useState, useEffect } from 'react'
import { Coins, Gift, Loader, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAvailableRewards, getRewardTransactions, getUserByEmail, redeemReward } from '@/utils/db/actions'
import { toast } from 'react-hot-toast'
import { useAuthGuard } from '@/hooks/useAuthGuard'

export default function RewardsPage() {
  const { email: guardEmail, checking } = useAuthGuard()
  const [rewards, setRewards] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)

  useEffect(() => {
    if (!guardEmail) return
    const init = async () => {
      const u = await getUserByEmail(guardEmail)
      if (!u) return
      setUser(u)
      const [r, t] = await Promise.all([getAvailableRewards(u.id), getRewardTransactions(u.id)])
      setRewards(r)
      setTransactions(t)
      setLoading(false)
    }
    init()
  }, [guardEmail])

  const handleRedeem = async (rewardId: number) => {
    if (!user) return
    setRedeemingId(rewardId)
    try {
      await redeemReward(user.id, rewardId)
      toast.success('Reward redeemed successfully! 🎁')
      const [r, t] = await Promise.all([getAvailableRewards(user.id), getRewardTransactions(user.id)])
      setRewards(r)
      setTransactions(t)
    } catch (e: any) {
      toast.error(e.message || 'Failed to redeem reward.')
    } finally {
      setRedeemingId(null)
    }
  }

  const userPoints = rewards.find(r => r.id === 0)?.cost ?? 0

  if (checking) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin h-8 w-8 text-green-500" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2 text-gray-800">Rewards</h1>
      <p className="text-gray-500 mb-8">Redeem your earned points for rewards!</p>

      {/* Points Balance */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
        <div className="bg-green-100 p-4 rounded-full">
          <Coins className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-green-700 font-medium">Your Total Points</p>
          <p className="text-4xl font-bold text-green-800">{userPoints}</p>
        </div>
      </div>

      {/* Available Rewards */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Available Rewards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {rewards.filter(r => r.id !== 0).length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-400">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No rewards available yet. Keep reporting waste to earn points!</p>
          </div>
        ) : (
          rewards.filter(r => r.id !== 0).map(reward => (
            <div key={reward.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800">{reward.name}</h3>
                <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{reward.cost} pts</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{reward.description || reward.collectionInfo}</p>
              <Button
                onClick={() => handleRedeem(reward.id)}
                disabled={userPoints < reward.cost || redeemingId === reward.id}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                {redeemingId === reward.id ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                {userPoints < reward.cost ? 'Not enough points' : 'Redeem'}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Transaction History */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" /> Transaction History
      </h2>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No transactions yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type.startsWith('earned') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'earned_report' ? 'Report' : t.type === 'earned_collect' ? 'Collect' : 'Redeemed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    {t.type.startsWith('earned') ? '+' : '-'}{t.amount} pts
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
