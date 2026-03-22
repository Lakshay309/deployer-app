import { db } from "@/db"
import { deployments, projects } from "@/db/schema"
import { getAuthUser } from "@/lib/auth"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ name: string}> }
) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }


        const { name } = await params
        const { status } = await request.json()

        const [project]=await db
            .update(projects)
            .set({ status })
            .where(
                and(
                    eq(projects.name, name),
                    eq(projects.userId, user.userId)
                )
            ).returning()
        await db
            .update(deployments)
            .set({status})
            .where(
                eq(deployments.projectId,project.id)
            )

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[projects:status] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}