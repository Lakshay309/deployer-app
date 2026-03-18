const express = require('express')
const httpProxy = require('http-proxy')
require('dotenv').config() 

const app = express()
const PORT = 8000
const BASE_PATH = process.env.BASE_PATH

const proxy = httpProxy.createProxy();

app.use((req,res)=>{
    const hostName = req.hostname;
    const subDomain = hostName.split(".")[0];
    const resolveTo =`${BASE_PATH}/${subDomain}`
    const url= req.url;
    if(url=='/'){
        req.url="/index.html";
    }
    proxy.web(req,res,{target:resolveTo,changeOrigin:true})
})


app.listen(PORT,()=>console.log(`reverse Proxy working on ${PORT}`))
