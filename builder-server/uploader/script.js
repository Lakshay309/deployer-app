import path from 'node:path'
import { S3Client,PutObjectCommand } from '@aws-sdk/client-s3'
import fs from "fs"
import mime from "mime-types"
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST_DIR = path.join(__dirname,"output","dist");

const s3 = new S3Client({
    region:process.env.REGION,
    credentials:{
        accessKeyId:process.env.ACCESS_KEY,
        secretAccessKey:process.env.SECRET_ACCESS_KEY,
    }
});

