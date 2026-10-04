import { NextRequest, NextResponse } from 'next/server'
import { getWasteCollectionTasks, updateTaskStatus, getUserBalance } from '@/utils/db/actions'

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  const tasks = await getWasteCollectionTasks(limit)
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const { reportId, collectorId } = await req.json()
  if (!reportId || !collectorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  await updateTaskStatus(reportId, 'collected', collectorId)
  const newBalance = await getUserBalance(collectorId)
  return NextResponse.json({ success: true, newBalance })
}
