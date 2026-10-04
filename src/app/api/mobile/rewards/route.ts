import { NextRequest, NextResponse } from 'next/server'
import { getUserBalance, getAllRewards, getRewardTransactions } from '@/utils/db/actions'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const [balance, transactions] = await Promise.all([
    getUserBalance(parseInt(userId)),
    getRewardTransactions(parseInt(userId))
  ])
  return NextResponse.json({ balance, transactions })
}
