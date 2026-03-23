'use client'

import { useState } from 'react'
import { ExternalLink, GitBranch, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProjectDetailDialog from '@/components/project-detail-dialog'
import type { Project } from '@/types'

type ProjectCardProps = {
    project: Project
    onRefresh: () => void
}
const protocol = "http"
const reverseProxy = "localhost:8000"

const statusConfig: Record<string, { label: string, className: string }> = {
    idle:        { label: 'Never deployed', className: 'bg-muted text-muted-foreground' },

    pending:     { label: 'Pending',        className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },

    building:    { label: 'Building',       className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },

    uploading:   { label: 'Uploading',      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },

    done:        { label: 'Deployed',       className: 'bg-green-500/10 text-green-600 dark:text-green-400' },

    redeploying: { label: 'Redeploying',    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },

    undeploying: { label: 'Undeploying',    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },

    undeployed:  { label: 'Undeployed',     className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },

    cancelled:   { label: 'Cancelled',      className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },

    failed:      { label: 'Failed',         className: 'bg-destructive/10 text-destructive' },
}

export default function ProjectCard({ project, onRefresh }: ProjectCardProps) {
    const [detailOpen, setDetailOpen] = useState(false)

    const status = statusConfig[project.status ?? 'idle'] ?? statusConfig.idle

    const repoName = project.repoUrl
        .replace('https://github.com/', '')
        .replace('https://gitlab.com/', '')

    const timeAgo = project.createdAt
        ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            Math.round(
                (new Date(project.createdAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            ),
            'day'
          )
        : null

    return (
        <>
            <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailOpen(true)}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold truncate">
                            {project.name}
                        </CardTitle>
                        <Badge className={status.className}>
                            {status.label}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GitBranch className="w-3 h-3 shrink-0" />
                        <span className="truncate">{repoName}</span>
                    </div>

                    {project.status === 'done' && (
                        <div
                            className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                            onClick={(e) => {
                                e.stopPropagation()
                                window.open(`${protocol}://${project.name}.${reverseProxy}`, '_blank')
                            }}
                        >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{project.name}.localhost:8000</span>
                        </div>
                    )}

                    {timeAgo && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Created {timeAgo}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ProjectDetailDialog
                project={project}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onRefresh={onRefresh}
            />
        </>
    )
}