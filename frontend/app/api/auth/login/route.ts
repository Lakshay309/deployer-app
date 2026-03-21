import { db } from "@/db";
import { users } from "@/db/schema";
import { setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request:NextRequest){
    try {
        const body = await request.json();

        const result = loginSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json(
                { error: result.error?.message || "loginSchema failed" },
                { status: 400 }
            )
        }

        const {email,password} = result.data;
        
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email,email))
            .limit(1);

        if(!user){
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }
        if(!user.isVerified){
            return NextResponse.json(
                { error: 'Please verify your email before logging in.' },
                { status: 403 }
            )
        }
        if (!user.passwordHash) {
            return NextResponse.json(
                { error: 'This account uses Google login. Please sign in with Google.' },
                { status: 400 }
            )
        }

        const passwordMatch = await bcrypt.compare(password,user.passwordHash);
        if(!passwordMatch){
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        await setAuthCookie({
            userId:user.id,
            email:user.email,
            username:user.username,
            isVerified:user.isVerified??false,
        })

        return NextResponse.json({
            message: 'Logged in successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            }
        })

    } catch (error) {
        console.error('[login] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}