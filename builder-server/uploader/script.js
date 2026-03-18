import path from 'node:path'
import { S3Client,PutObjectCommand } from '@aws-sdk/client-s3'
import fs from "fs"
import mime from "mime-types"
import { fileURLToPath } from 'node:url'


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_DIR = path.join(__dirname,"output","dist");

const s3 = new S3Client({
    region:process.env.AWS_REGION || 'ap-south-1' ,
    // credentials:{
    //     accessKeyId:process.env.ACCESS_KEY,
    //     secretAccessKey:process.env.SECRET_ACCESS_KEY,
    // }
});

function getAllFiles(dirPath,fileList=[]){
    const entries = fs.readdirSync(dirPath,{withFileTypes:true});

    for(const entry of entries){
        const fullPath = path.join(dirPath,entry.name);
        if(entry.isDirectory()){
            getAllFiles(fullPath,fileList);
        }else{
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function uploadToS3(files){
    const projectId = process.env.PROJECT_ID.trim();
    const bucket = process.env.BUCKET_NAME.trim();

    console.log(`[uploader] Uploading ${files.length} files`);

    for(const filePath of files){
        const relativePath = path.relative(DIST_DIR,filePath);
        const s3Key = `projects/${projectId}/${relativePath.split(path.sep).join('/')}`;

        const contentType = mime.lookup(filePath) || `application/octet-stream`;
        
        // const fileContent = fs.readFileSync(filePath);
        await s3.send(new PutObjectCommand({
            Bucket:bucket,
            Key:s3Key,
            Body:fs.createReadStream(filePath),
            ContentType:contentType
        }))
        console.log(`[uploader] uploaded: ${s3Key} (${contentType})`)
    }
}

async function init(){
    try {
        if(!fs.existsSync(DIST_DIR)){
            throw new Error(`dist/ directory not found at ${DIST_DIR} - did the builder run successfully`);
        }
        const files = getAllFiles(DIST_DIR);
        if(files.length==0){
            throw new Error(`dist/ directory is empty - nothing to upload`);
        }
        await uploadToS3(files);
        console.log(`[Uploader] Done. ${files.length} files uploaded successfully`);
        process.exit(0)
    } catch (error) {
        console.log(`[Uploader] FATAL:`,error);
        process.exit(1)
    }
}
init();