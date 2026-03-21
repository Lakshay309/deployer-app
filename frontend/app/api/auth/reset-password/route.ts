import { db } from "@/db";
import { users } from "@/db/schema";
import { resetPasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request:NextRequest){
    try {
        const {searchParams} = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Reset token is missing' },
                { status: 400 }
            )
        }

        const body = await request.json();

        const result = resetPasswordSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: result.error?.message || "Error in resetpassword"},
                { status: 400 }
            )
        }

        const { password } = result.data;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.resetToken,token))
            .limit(1);
        
        if(!user){
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            )
        }

        if(!user.resetExpires || user.resetExpires<new Date()){
            return NextResponse.json(
                { error: 'Reset token has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        const passwordHash = await bcrypt.hash(password,12);

        await db
            .update(users)
            .set({passwordHash,resetExpires:null,resetToken:null})
            .where(eq(users.id,user.id));
        
        return NextResponse.json({
            message: 'Password reset successfully. You can now log in with your new password.'
        })

    } catch (error) {
        console.error('[reset-password] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}