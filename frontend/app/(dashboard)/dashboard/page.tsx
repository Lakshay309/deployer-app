import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/session'
import Navbar from '@/components/navbar'
import ProjectCard from '@/components/project-card'
import NewProjectDialog from '@/components/new-project-dialog'
import { FolderOpen } from 'lucide-react'

export default async function DashboardPage() {
    // get current user — redirects to login if not authenticated
    const user = await getCurrentUser()

    // get all projects for this user
    const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, user.id))
        .orderBy(projects.createdAt)

    return (
        <div className="min-h-screen">
            <Navbar username={user.username} />

            <main className="max-w-6xl mx-auto px-4 py-8">

                {/* header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold">Projects</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {userProjects.length === 0
                                ? 'No projects yet'
                                : `${userProjects.length} project${userProjects.length === 1 ? '' : 's'}`
                            }
                        </p>
                    </div>
                    <NewProjectDialog />
                </div>

                {/* empty state */}
                {userProjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                        <h2 className="text-lg font-medium mb-2">No projects yet</h2>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Deploy your first React app by clicking the button above.
                            Just paste a GitHub or GitLab URL and we'll handle the rest.
                        </p>
                    </div>
                )}

                {/* projects grid */}
                {userProjects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}