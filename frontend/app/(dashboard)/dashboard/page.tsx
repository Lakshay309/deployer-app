'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { FolderOpen, RefreshCw } from 'lucide-react'
import Navbar from '@/components/navbar'
import ProjectCard from '@/components/project-card'
import NewProjectDialog from '@/components/new-project-dialog'
import { Button } from '@/components/ui/button'
import type { Project, User } from '@/types'

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [userProjects, setUserProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchUserData = useCallback(async () => {
        try {
            const userRes = await axios.get('/api/auth/me')
            setUser(userRes.data.user)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])
    const fetchProjects = async()=>{
        try {
            const projectRes =await axios.get('/api/projects');
            setUserProjects(projectRes.data.projects);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        }
    }

    async function handleRefresh() {
        setIsRefreshing(true)
        await fetchProjects()
        setIsRefreshing(false)
    }

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="border-b h-16" />
                <main className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-2">
                            <div className="h-7 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Navbar username={user?.username ?? ''} />

            <main className="max-w-6xl mx-auto px-4 py-8">
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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <NewProjectDialog onProjectCreated={handleRefresh} />
                    </div>
                </div>

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

                {userProjects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onRefresh={fetchProjects}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}