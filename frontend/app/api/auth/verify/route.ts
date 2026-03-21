import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
    try {
        const {searchParams} = new URL(request.url);
        const token = searchParams.get('token');
        
        if(!token){
            return NextResponse.redirect(
                new URL('/login?error=invalid-token', request.url)
            )
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.verifyToken, token))
            .limit(1)

        if (!user) {
            return NextResponse.redirect(
                new URL('/login?error=invalid-token', request.url)
            )
        }

        if (user.isVerified) {
            return NextResponse.redirect(
                new URL('/login?message=already-verified', request.url)
            )
        }

        if(!user.verifyExpires || user.verifyExpires<new Date()){
            return NextResponse.redirect(
                new URL('/login?error=token-expired', request.url)
            )
        }

        await db
            .update(users)
            .set({
                isVerified: true,
                verifyToken: null,
                verifyExpires: null,
            })
            .where(eq(users.id, user.id))
        
        return NextResponse.redirect(
            new URL('/login?message=verified', request.url)
        )

    } catch (error) {
        console.error('[verify] error:', error)
        return NextResponse.redirect(
            new URL('/login?error=something-went-wrong', request.url)
        )
    }   
}