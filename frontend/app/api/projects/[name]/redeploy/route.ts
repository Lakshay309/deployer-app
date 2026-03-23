import { db } from "@/db"
import { deployments, projects } from "@/db/schema"
import { getAuthUser } from "@/lib/auth"
import axios from "axios"
import { and, desc, eq } from "drizzle-orm"
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

        if (['pending', 'building', 'uploading','redeploying'].includes(project.status ?? '')) {
            return NextResponse.json(
                { error: 'A deployment is already in progress' },
                { status: 409 }
            )
        }


        const deployResponse = await axios.post(
            `${process.env.API_SERVER_URL}/project`,
            {
                gitURL: project.repoUrl,
                projectId: project.name,
            }
        )

        const { taskId } = deployResponse.data.data
        console.log("Working???")

        // updating after creating a worker
        await db
            .update(projects)
            .set({ status: 'redeploying' }) // redeploying
            .where(eq(projects.name, name))

        const [lastDeployment]=await db
            .select()
            .from(deployments)
            .where(eq(deployments.projectId,project.id))
            .orderBy(desc(deployments.createdAt))
            .limit(1)
        
        await db
            .update(deployments).
            set({status:"undeployed"}).
            where(eq(deployments.id,lastDeployment.id))
        
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