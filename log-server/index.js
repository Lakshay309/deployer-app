import { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs'
import { WebSocketServer } from "ws"
import Redis from "ioredis"

const PORT = process.env.PORT || 9000;
const LOG_GROUP = process.env.LOG_GROUP;
const POLL_INTERVAL_MS = 3000;
const PREFIX_BUILDER = process.env.PREFIX_BUILDER;
const PREFIX_UPLOADER= process.env.PREFIX_UPLOADER

const cloudwatch = new CloudWatchLogsClient({
    region:process.env.AWS_REGION || 'ap-south-1',
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    }
})

const wss = WebSocketServer({ port: PORT })

async function getStreams(taskId){
    const response = await cloudwatch.send(new DescribeLogStreamsCommand({
        logGroupName:LOG_GROUP,
        logStreamNamePrefix:`${PREFIX_BUILDER}/${taskId}`,
    }))

    const builderStream = response.logStreams?.[0]?.logStreamName;

    const response2 = await cloudwatch.send(new DescribeLogStreamsCommand({
        logGroupName:LOG_GROUP,
        logStreamNamePrefix:`${PREFIX_UPLOADER}/${taskId}`,
    }));

    const uploadStream = response2.logStreams?.[0]?.logStreamName;

    return {builderStream,uploadStream}
}
console.log(`[log-server] WebSocket server running from a port ${PORT}`)

