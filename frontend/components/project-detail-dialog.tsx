'use client'

import { useEffect, useState } from 'react'
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
import LogViewer from '@/components/log-viewer'
import type { Project, Deployment } from '@/types'

type Props = {
    project: Project
    open: boolean
    onOpenChange: (open: boolean) => void
    onRefresh: () => void
}

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

export default function ProjectDetailDialog({ project, open, onOpenChange, onRefresh }: Props) {
    const [isDeploying, setIsDeploying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [latestTaskId, setLatestTaskId] = useState<string | null>(null)
    const [deployments, setDeployments] = useState<Deployment[]>([])
    const [refresh,setRefresh]=useState<boolean>(false)
    async function fetchDeployments() {
        try {
            const res = await axios.get(`/api/projects/${project.name}/deployments`)
            console.log(res);
            const deps: Deployment[] = res.data.deployments
            console.log(deps)
            setDeployments(deps)
            console.log(deployments)
            if (deps.length > 0 && deps[0].taskId) {
                setLatestTaskId(deps[0].taskId)
            }
        } catch (err) {
            console.error('Failed to fetch deployments:', err)
        }
    }
    const allRefresh=async()=>{
        try {
            if(!refresh) return;
            setRefresh(false);
            fetchDeployments();
            onRefresh();
            setRefresh(true);
        } catch (err) {
            console.error('Failed to fetch all:', err)
        }
    }
    useEffect(() => {
        if (!open) return
        fetchDeployments()
    }, [open, project.name])

    const status = statusConfig[project.status ?? 'idle'] ?? statusConfig.idle
    const isInProgress = ['pending', 'building', 'uploading'].includes(project.status ?? '')

    // deployed url is just reverse proxy with project name as subdomain
    const deployedUrl = `http://${project.name}.localhost:8000`

    const repoName = project.repoUrl
        .replace('https://github.com/', '')
        .replace('https://gitlab.com/', '')

    async function handleRedeploy() {
        setIsDeploying(true)
        setError(null)

        try {
            const res = await axios.post(`/api/projects/${project.name}/redeploy`)
            // console.log(res)
            const { taskId } = res.data
            // console.log(taskId);
            setLatestTaskId(taskId)
            allRefresh()

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
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val)
            if (!val) {
                setError(null)
                setLatestTaskId(null)
                setDeployments([])
            }
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="text-xl">{project.name}</DialogTitle>
                        <Badge className={status.className}>{status.label}</Badge>
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
                        >
                            <GitBranch className="w-4 h-4" />
                            {repoName}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <Separator />

                    {/* deployed url — always show if status is done */}
                    {project.status === 'done' && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Deployed URL
                            </p>
                            <a
                                href={deployedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {deployedUrl}
                            </a>
                        </div>
                    )}

                    <Separator />

                    {/* redeploy */}
                    <Button
                        className="w-full gap-2"
                        onClick={handleRedeploy}
                        disabled={isDeploying || isInProgress}
                    >
                        {isDeploying
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Deploying...</>
                            : <><RefreshCw className="w-4 h-4" />Deploy again</>
                        }
                    </Button>

                    {isInProgress && (
                        <p className="text-xs text-center text-muted-foreground">
                            A deployment is already in progress
                        </p>
                    )}

                    <Separator />

                    {/* logs */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Deployment logs
                        </p>
                        <LogViewer 
                            taskId={latestTaskId} 
                            projectName={project.name} 
                            onDeploymentDone={allRefresh} 
                        />
                    </div>

                    {/* deployment history */}
                    {deployments.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    History
                                </p>
                                <div className="space-y-2">
                                    {deployments.map((dep) => (
                                        <div key={dep.id} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground text-xs">
                                                {dep.createdAt
                                                    ? new Date(dep.createdAt).toLocaleString()
                                                    : 'Unknown'
                                                }
                                            </span>
                                            <Badge className={statusConfig[dep.status ?? 'pending']?.className}>
                                                {statusConfig[dep.status ?? 'pending']?.label}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}