'use client'

import axios from 'axios'
import { useEffect, useRef, useState } from 'react'


export type LogMessage = {
    type?: string
    container?: string
    message?: string
    timestamp?: number
}

type Props = {
    taskId: string | null
    projectName: string   // needed to call the status API
    onDeploymentDone: () => void  // optional callback to refresh dashboard
}

export default function LogViewer({ taskId ,projectName, onDeploymentDone }: Props) {
    const [logs, setLogs] = useState<LogMessage[]>([])
    const [connected, setConnected] = useState(false)
    const [done, setDone] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!taskId) return

        setLogs([])
        setDone(false)
        setConnected(false)

        const url = process.env.NEXT_PUBLIC_LOG_SERVER_URL || 'ws://localhost:9000'
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            setConnected(true)
            ws.send(JSON.stringify({ taskId }))
        }

        ws.onmessage = async(event) => {
            try {
                const data: LogMessage = JSON.parse(event.data)

                if (data.type === 'done') {
                    setDone(true)
                    setLogs(prev => [...prev, {
                        type: 'done',
                        message: 'Deployment complete!'
                    }])
                    ws.close()
                    await axios.patch(`/api/projects/${projectName}/status`, {
                        status: 'done'
                    })
                    console.log("deployed???")
                    // refresh dashboard cards
                    onDeploymentDone()
                    console.log("deployed???")
                    return
                }

                setLogs(prev => [...prev, data])
                console.log(setLogs)
            } catch (err) {
                console.error('[log-viewer] parse error:', err)
            }
        }

        ws.onerror = () => {
            setLogs(prev => [...prev, {
                type: 'error',
                message: 'Failed to connect to log server'
            }])
        }

        ws.onclose = () => setConnected(false)

        return () => ws.close()

    }, [taskId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    if (!taskId) {
        return (
            <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground text-center">
                No deployment found
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                    done ? 'bg-green-500'
                    : connected ? 'bg-blue-500 animate-pulse'
                    : 'bg-muted'
                }`} />
                <span className="text-xs text-muted-foreground">
                    {done ? 'Deployment complete'
                    : connected ? 'Streaming logs...'
                    : 'Connecting...'}
                </span>
            </div>

            <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
                {logs.length === 0 && (
                    <p className="text-gray-500">Waiting for logs...</p>
                )}
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`leading-5 ${
                            log.type === 'done' ? 'text-green-400 font-medium'
                            : log.type === 'error' ? 'text-red-400'
                            : log.container === 'uploader' ? 'text-blue-300'
                            : 'text-gray-300'
                        }`}
                    >
                        {log.container && (
                            <span className="text-gray-500 mr-2">[{log.container}]</span>
                        )}
                        {log.message}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}