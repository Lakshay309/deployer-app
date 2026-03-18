import { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs'
import { WebSocketServer } from "ws"

const PORT = process.env.PORT || 9000;
const LOG_GROUP = process.env.LOG_GROUP;
const POLL_INTERVAL_MS = 3000;
const PREFIX_BUILDER = process.env.PREFIX_BUILDER;
const PREFIX_UPLOADER = process.env.PREFIX_UPLOADER

const cloudwatch = new CloudWatchLogsClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
})

const wss =new  WebSocketServer({ port: PORT })

console.log(`[log-server] WebSocket server running from a port ${PORT}`)

async function getLogStreams(taskId) {
    console.log('[debug] searching builder prefix:', `${PREFIX_BUILDER}/${taskId}`)
    console.log('[debug] searching uploader prefix:', `${PREFIX_UPLOADER}/${taskId}`)

    try {
        const response = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName: LOG_GROUP,
            logStreamNamePrefix: `${PREFIX_BUILDER}/${taskId}`,
        }))

        const builderStream = response.logStreams?.[0]?.logStreamName
        console.log('[debug] builderStream found:', builderStream)

        const response2 = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName: LOG_GROUP,
            logStreamNamePrefix: `${PREFIX_UPLOADER}/${taskId}`,
        }))

        const uploaderStream = response2.logStreams?.[0]?.logStreamName
        console.log('[debug] uploaderStream found:', uploaderStream)

        return { builderStream, uploaderStream }
    } catch (err) {
        console.error('[debug] getLogStreams error:', err.message)  // ← surfaces the real error
        return { builderStream: null, uploaderStream: null }
    }
}

async function pollStream(streamName, nextToken) {
    if (!streamName) return { events: [], nextToken }

    const response = await cloudwatch.send(new GetLogEventsCommand({
        logGroupName: LOG_GROUP,
        logStreamName: streamName,
        nextToken,
        startFromHead: true,
    }))
    return {
        events: response.events || [],
        nextToken: response.nextForwardToken,
    }
}

wss.on('connection', (ws) => {
    console.log(`[log-server] Client connected`);

    let polling = false;
    let pollTimer = null;

    ws.on('message', async (message) => {
        try {
            const { taskId } = JSON.parse(message);
            if(polling){
                console.log('[log-server] Already polling, ignoring duplicate')
                return
            }
            if (!taskId) {
                ws.send(JSON.stringify({ type: 'error', message: 'taskId is required' }))
                return
            }

            console.log(`[log-server] Starting log stream for task: ${taskId}`)

            polling = true
            let builderToken = undefined
            let uploaderToken = undefined
            let builderStream = null
            let uploaderStream = null
            let streamsFetched = false
            let deploymentDone = false

            async function poll() {
                if (!polling || ws.readyState !== ws.OPEN) return;

                try {

                    if (!streamsFetched) {
                        const streams = await getLogStreams(taskId);
                        builderStream = streams.builderStream;
                        uploaderStream = streams.uploadStream;
                        if (builderStream || uploaderStream) {
                            streamsFetched = true;
                        }
                    }

                    if (builderStream) {
                        const result = await pollStream(builderStream, builderToken)
                        for (const event of result.events) {
                            ws.send(JSON.stringify({
                                type: 'log',
                                container: 'builder',
                                message: event.message,
                                timestamp: event.timestamp
                            }))

                            // check if builder is done
                            if (event.message.includes('[builder] Done')) {
                                console.log('[log-server] Builder finished')
                            }
                        }
                        builderToken = result.nextToken
                    }

                    // poll uploader logs
                    if (uploaderStream) {
                        const result = await pollStream(uploaderStream, uploaderToken)
                        for (const event of result.events) {
                            ws.send(JSON.stringify({
                                type: 'log',
                                container: 'uploader',
                                message: event.message,
                                timestamp: event.timestamp
                            }))

                            // check if deployment is complete
                            if (event.message.toLowerCase().includes('[uploader] done')) {
                                deploymentDone = true
                            }
                        }
                        uploaderToken = result.nextToken
                    }

                    // stop polling if deployment is done
                    if (deploymentDone) {
                        polling = false
                        ws.send(JSON.stringify({
                            type: 'done',
                            message: 'Deployment complete!'
                        }))
                        console.log(`[log-server] Deployment done for task: ${taskId}`)
                        return
                    }
                } catch (err) {
                    console.error('[log-server] Poll error:', err.message)
                }

                if (polling) {
                    pollTimer = setTimeout(poll, POLL_INTERVAL_MS)
                }
            }

            poll()

        } catch (err) {
            console.error('[log-server] Error:', err.message)
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
        }
    })

    ws.on('close', () => {
        console.log('[log-server] Client disconnected — stopping poll')
        polling = false
        if (pollTimer) clearTimeout(pollTimer)
    })

    ws.on('error', (err) => {
        console.error('[log-server] WebSocket error:', err.message)
    })
})