import { db } from "@/db"
import { deployments, projects } from "@/db/schema"
import { getAuthUser } from "@/lib/auth"
import { eq, and, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name } = await params

        // verify user owns this project
        const [project] = await db
            .select()
            .from(projects)
            .where(
                and(
                    eq(projects.name, name),
                    eq(projects.userId, user.userId)
                )
            )
            .limit(1)

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
        const id = project.id;
        console.log(id);
        const projectDeployments = await db
            .select()
            .from(deployments)
            .where(eq(deployments.projectId, id))
            .orderBy(desc(deployments.createdAt))
        console.log(projectDeployments)
        return NextResponse.json({ deployments: projectDeployments })

    } catch (error) {
        console.error('[deployments:get] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}