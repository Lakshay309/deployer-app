import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
    try {
        const payload = await getAuthUser()
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                username: users.username,
            })
            .from(users)
            .where(eq(users.id, payload.userId))
            .limit(1)

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ user })

    } catch (error) {
        console.error('[me] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}