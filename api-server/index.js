const express = require("express");
const { generateSlug } = require("random-word-slugs");
const {ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs')
require('dotenv').config()

// const Redis = require('ioredis')

// const publisher = new Redis('http://localhost:6379')


const app =express();
const PORT =8080;

const ecsClient = new ECSClient({
    region:process.env.REGION,
    credentials:{
        accessKeyId:process.env.ACCESS_KEY,
        secretAccessKey:process.env.SECRET_ACCESS_KEY
    }
})
const config={
    CLUSTER:process.env.ECS_CLUSTER,
    TASK:process.env.ECS_TASK
}

app.use(express.json());

function validateGitUrl(url){
    if(!url) 
        throw new Error("GIT_REPOSITORY__URL env variable is not set");
    url = url.trim()
    // github or gitlab urls
    const allowedPattern = /^https:\/\/(github\.com|gitlab\.com)\/[\w.\-]+\/[\w.\-]+(\.git)?$/;
    if(!allowedPattern.test(url)){
        throw new Error(`Rejected git URL: ${url} - only public Github and GitLab HTTPS URLs allowed `);
    }
    return url
}
// function publishLog(log){
//     publisher.pulish(`logs:${log}`)
// }
app.post('/project',async(req,res)=>{
    const projectId = generateSlug();
    const {gitURL}=req.body;
    if(!validateGitUrl(gitURL)){
        return res.json({
            status:"Error",
            data:{
                message:"Incorrect url",
                gitURL,
            }
        })
    }
    const command = new RunTaskCommand({
        cluster:config.CLUSTER,
        taskDefinition:config.TASK,
        launchType:'FARGATE',
        count:1,
        networkConfiguration:{
            awsvpcConfiguration:{
                subnets:[process.env.SUBNET_1,process.env.SUBNET_2,process.env.SUBNET_3],
                securityGroups:[process.env.SECURITY_GROUP],
                assignPublicIp:'ENABLED'
            }
        },
        overrides:{
            containerOverrides: [
                {
                    // builder gets gitURL and projectId
                    name: 'builder',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectId }
                    ]
                },
                {
                    name: 'uploader',
                    environment: [
                        { name: 'PROJECT_ID', value: projectId }
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command);
    return res.json({
        status:'queued',
        data:{
            projectId,
            url:`http://${projectId}.localhost:8000`
        }
    })
})

app.listen(PORT,()=>console.log(`api server working on ${PORT}`))