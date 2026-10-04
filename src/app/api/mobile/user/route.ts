import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/utils/db/actions'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const user = await getUserByEmail(email)
  return NextResponse.json(user)
}

export async function POST(req: NextRequest) {
  const { email, name } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const user = await createUser(email, name || 'Anonymous')
  return NextResponse.json(user)
}
