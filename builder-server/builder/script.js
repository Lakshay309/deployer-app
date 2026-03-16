import path from 'node:path'
import {exec} from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BUILD_TIMEOUT_MS = 5*60*1000;
const OUTPUT_DIR = path.join(__dirname,'output');
const DIST_DIR = path.join(OUTPUT_DIR,'dist');

function validateGitUrl(url){
    if(!url) 
        throw new Error("GIT_REPOSITORY__URL env variable is not set");
    
    // github or gitlab urls
    const allowedPattern = /^https:\/\/(github\.com|gitlab\.com)\/[\w.\-]+\/[\w.\-]+(\.git)?$/;
    if(!allowedPattern.test(url)){
        throw new Error(`Rejected git URL: ${url} - only public Github and GitLab HTTPS URLs allowed `);
    }
}
function cloneRepo(repoUrl){
    return new Promise((res,rej)=>{
        console.log(`[Builder] Cloning ${repoUrl}`);

        const gitProcess = exec(
            `git clone --depth 1 ${repoUrl} ${OUTPUT_DIR}`,
            {timeout:40_000}
        );

        gitProcess.stdout.on('data',d=>process.stdout.write(d));
        gitProcess.stderr.on('data',d=>process.stderr.write(d));
        gitProcess.on('close',code=>{
            if(code!==0) rej(new Error(`git clone Failed with exit code ${code}`))
            else res()
        });
        gitProcess.on('error',rej);
    })
}

function runBuild(){
    return new Promise((res,rej)=>{
        console.log(`[builder] Running npm install && npm run build`);

        let killed =false;
        const timer = setTimeout(()=>{
            killed=true;
            buildProcess.kill('SIGKILL');
            rej(new Error(`Build Timed Out after ~${BUILD_TIMEOUT_MS/1000}s - possible infinite loop or malicious build script`));
        },BUILD_TIMEOUT_MS);

        const buildProcess=exec(
            'npm install && npm run build',
            {
                cwd:OUTPUT_DIR,
                env: {
                    ...process.env,
                    // strip AWS credentials from the build environment completely
                    AWS_ACCESS_KEY_ID: undefined,
                    AWS_SECRET_ACCESS_KEY: undefined,
                    AWS_SESSION_TOKEN: undefined,
                    AWS_CONTAINER_CREDENTIALS_RELATIVE_URI: undefined,  // blocks ECS metadata endpoint
                    NODE_ENV: 'production',
                },
                maxBuffer: 10 * 1024 * 1024  
            },
        );
        buildProcess.stdout.on('data',d=>process.stdout.write(d));
        buildProcess.stderr.on('data',d=>process.stderr.write(d));

        buildProcess.on('close',code=>{
            if(killed) return ;
            clearTimeout(timer);
            if(code!==0){
                rej(new Error(`Build failed with exit code ${code}`));
            }
            else res();
        })

        buildProcess.on('error',err=>{
            clearTimeout(timer);
            rej(err);
        })
    })
}

function verifyDistExists(){
    if(!fs.existsSync(DIST_DIR)){
        throw new Error(`Build completed but no dist/ directory found at ${DIST_DIR} - check your build output config`);
    }
    console.log(`[builder] dist/ directory confirmed`);
}

async function init(){
    try {
        const repoURL = process.env.GIT_REPOSITORY__URL;
        validateGitUrl(repoURL);
        await cloneRepo(repoURL);
        await runBuild();
        verifyDistExists();
        console.log('[builder] Done. dist/ is ready for uploader.')
        process.exit(0)
    } catch (error) {
        console.log(`[Builder] FATAL: `,error)        
        process.exit(1)
    }
}

init();