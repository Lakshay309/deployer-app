import { db } from "@/db";
import { deployments, projects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { newProjectSchema } from "@/lib/validations";
import axios from "axios";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request:NextRequest){
    try {
        const user = await getAuthUser();
        if(!user){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.userId,user.userId))
        
        return NextResponse.json({projects:userProjects})

    } catch (error) {
        console.error('[projects:get] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}




export async function POST(request:NextRequest){
    try {
        const user = await getAuthUser();
        if(!user){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json();
        const result= newProjectSchema.safeParse(body);

        if(!result.success){
            return NextResponse.json(
                { error: result.error?.message },
                { status: 400 }
            )
        }

        const {name,repoUrl} =result.data;

        const existing = await db
                .select()
                .from(projects)
                .where(
                    eq(projects.name,name),
                ).limit(1);
            
        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Name already taken' },
                { status: 409 }
            )
        }

        const [project] = await db
            .insert(projects)
            .values({
                userId: user.userId,
                name,
                repoUrl,
                status: 'pending',
            })
            .returning()
        
        const deployResponse = await axios.post(
            `${process.env.API_SERVER_URL}/deploy`,
            {
                gitURL: repoUrl,
                projectId: project.id,
            }
        )

        const { taskId } = deployResponse.data

        await db.insert(deployments).values({
            projectId: project.id,
            taskId,
            status: 'pending',
        })

        return NextResponse.json(
            { project, taskId },
            { status: 201 }
        )
    } catch (error) {
        console.error('[projects:post] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}