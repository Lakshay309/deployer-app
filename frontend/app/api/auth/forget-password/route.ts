import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request:NextRequest){
    try {
        const body = await request.json();

        const result = forgotPasswordSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json(
                { error: result.error?.message||"error in schema" },
                { status: 400 }
            )
        }

        const {email} = result.data;
        const successResponse = NextResponse.json({
            message: 'If an account exists with this email you will receive a password reset link shortly.'
        })

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email,email))
            .limit(1);
        
        if(!user) return successResponse;

        if(!user.passwordHash) return successResponse;

        if(!user.isVerified) return successResponse;

        const resetToken = generateToken();
        const resetExpires = new Date(Date.now()+60*60*1000);

        await db
            .update(users)
            .set({resetToken,resetExpires})
            .where(eq(users.email,email));

        await sendPasswordResetEmail(email,resetToken);

        return successResponse;
        
    } catch (error) {
        console.error('[forgot-password] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}