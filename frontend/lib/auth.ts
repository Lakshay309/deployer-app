import {SignJWT,jwtVerify} from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = 'token';
const JWT_EXPIRES_IN = '7d';

export type JWTPayload={
    userId:string,
    email:string,
    username:string,
    isVerified:boolean
}


export async function signToken(payload:JWTPayload):Promise<string>{
    return await new SignJWT({...payload})
        .setProtectedHeader({alg:'HS256'})
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET)
}

export async function verifyToken(token:string):Promise<JWTPayload|null>{
    try {
        const {payload} = await jwtVerify(token,JWT_SECRET);
        return payload as JWTPayload
    } catch (error) {
        return null;
    }
}

export async function getAuthUser():Promise<JWTPayload|null>{
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if(!token){
        return null;
    } 
    return await verifyToken(token);
}

export async function deleteAuthCookie(){
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export function generateToken():string{
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array,byte=>byte.toString(16).padStart(2,'0')).join('')
}