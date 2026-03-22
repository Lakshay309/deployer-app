import { getAuthUser } from "./auth";
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getCurrentUser(){
    const payload = await getAuthUser();
    if (!payload) redirect('/login')

    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            username: users.username,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)

    if (!user) redirect('/login')
    return user
}