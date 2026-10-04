import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Admin credentials not configured in environment' },
        { status: 500 }
      )
    }

    if (
      email?.trim().toLowerCase() === adminEmail.trim().toLowerCase() &&
      password === adminPassword
    ) {
      return NextResponse.json({
        success: true,
        message: 'Admin authentication successful',
        adminUser: {
          email: adminEmail,
          role: 'SUPER_ADMIN'
        }
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Admin credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error during authentication' },
      { status: 500 }
    )
  }
}
