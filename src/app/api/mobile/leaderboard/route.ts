import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/utils/db/actions'

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  const leaderboard = await getLeaderboard(limit)
  return NextResponse.json(leaderboard)
}
