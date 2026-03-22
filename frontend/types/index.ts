export type Project = {
    id: string
    name: string
    repoUrl: string
    deployedUrl: string | null
    status: string | null
    createdAt: string | null
}

export type User = {
    id: string
    email: string
    username: string
}

export type LogMessage = {
    type?: string
    container?: string
    message?: string
    timestamp?: number
}

export type Deployment = {
    id: string
    projectId: string
    taskId: string | null
    status: string | null
    createdAt: string | null
    finishedAt: string | null
}