'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, GitBranch, Loader2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type Project = {
    id: string
    name: string
    repoUrl: string
    deployedUrl: string | null
    status: string | null
    createdAt: Date | null
}

type Props = {
    project: Project
    open: boolean
    onOpenChange: (open: boolean) => void
}

const statusConfig: Record<string, { label: string, className: string }> = {
    idle:      { label: 'Never deployed',  className: 'bg-muted text-muted-foreground' },
    pending:   { label: 'Pending',         className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    building:  { label: 'Building',        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    uploading: { label: 'Uploading',       className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    done:      { label: 'Deployed',        className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    failed:    { label: 'Failed',          className: 'bg-destructive/10 text-destructive' },
}

export default function ProjectDetailDialog({ project, open, onOpenChange }: Props) {
    const router = useRouter()
    const [isDeploying, setIsDeploying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const status = statusConfig[project.status ?? 'idle'] ?? statusConfig.idle

    const repoName = project.repoUrl
        .replace('https://github.com/', '')
        .replace('https://gitlab.com/', '')

    async function handleRedeploy() {
        setIsDeploying(true)
        setError(null)

        try {
            await axios.post(`/api/projects/${project.id}/deploy`)
            router.refresh()
            onOpenChange(false)

        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? 'Something went wrong.')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setIsDeploying(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="text-xl">
                            {project.name}
                        </DialogTitle>
                        <Badge className={status.className}>
                            {status.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4">

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* repo */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Repository
                        </p>
                        <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GitBranch className="w-4 h-4" />
                            {repoName}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <Separator />

                    {/* deployed url */}
                    {project.deployedUrl && project.status === 'done' && (
                        <>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    Deployed URL
                                </p>
                                <a
                                    href={project.deployedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {project.deployedUrl}
                                </a>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* redeploy button */}
                    <Button
                        className="w-full gap-2"
                        onClick={handleRedeploy}
                        disabled={
                            isDeploying ||
                            project.status === 'building' ||
                            project.status === 'uploading' ||
                            project.status === 'pending'
                        }
                    >
                        {isDeploying
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Deploying...</>
                            : <><RefreshCw className="w-4 h-4" />Deploy again</>
                        }
                    </Button>

                    {(project.status === 'building' ||
                      project.status === 'uploading' ||
                      project.status === 'pending') && (
                        <p className="text-xs text-center text-muted-foreground">
                            A deployment is already in progress
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}