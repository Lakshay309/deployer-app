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
    CLUSTER:process.env.CLUSTER,
    TASK:process.env.TASK
}

app.use(express.json());

function publishLog(log){
    publisher.pulish(`logs:${log}`)
}
app.post('/project',async(req,res)=>{
    const projectSlug = generateSlug();
    const {gitURL}=req.body;

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
            containerOverrides:[
                {
                    name:'builder-image',
                    environment:[
                        {name:'GIT_REPOSITORY__URL',value:gitURL},
                        {name:'PROJECT_ID',value:projectSlug},
                        {name:'BUCKET_NAME',value:process.env.BUCKET_NAME},
                        {name:'REGION',value:process.env.REGION},
                        {name:'ACCESS_KEY',value:process.env.ACCESS_KEY},
                        {name:'SECRET_ACCESS_KEY',value:process.env.SECRET_ACCESS_KEY},
                        {name:'DATABASE_URI',value:process.env.DATABASE_URI}
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command);
    return res.json({
        status:'queued',
        data:{
            projectSlug,
            url:`http://${projectSlug}.localhost:8000`
        }
    })
})

app.listen(PORT,()=>console.log(`api server working on ${PORT}`))