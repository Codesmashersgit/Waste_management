import { NextRequest, NextResponse } from 'next/server'
import { getRecentReports, createReport } from '@/utils/db/actions'

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  const reports = await getRecentReports(limit)
  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, location, wasteType, amount, imageUrl, verificationResult } = body
  if (!userId || !location || !wasteType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const report = await createReport(userId, location, wasteType, amount, imageUrl, verificationResult)
  return NextResponse.json(report)
}
