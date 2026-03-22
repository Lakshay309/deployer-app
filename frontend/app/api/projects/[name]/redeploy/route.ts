import { db } from "@/db"
import { deployments, projects } from "@/db/schema"
import { getAuthUser } from "@/lib/auth"
import axios from "axios"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name } = await params

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
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        if (['pending', 'building', 'uploading'].includes(project.status ?? '')) {
            return NextResponse.json(
                { error: 'A deployment is already in progress' },
                { status: 409 }
            )
        }

        await db
            .update(projects)
            .set({ status: 'pending' })
            .where(eq(projects.name, name))

        const deployResponse = await axios.post(
            `${process.env.API_SERVER_URL}/project`,
            {
                gitURL: project.repoUrl,
                projectId: project.name,
            }
        )

        const { taskId } = deployResponse.data.data
        console.log("Working???")

        await db.insert(deployments).values({
            projectId: project.id,
            taskId,
            status: 'pending',
        })
        return NextResponse.json({ taskId })

    } catch (error) {
        console.error('[projects:redeploy] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}