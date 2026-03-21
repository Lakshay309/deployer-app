import { db } from "@/db";
import { betaEmails, users } from "@/db/schema";
import { registerSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs'
import { generateToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request:NextRequest){
    try {
        const body = await  request.json();

        const result = registerSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json(
                { error: result.error?.message },
                { status: 400 }
            )
        }
        const {email,password,username}=result.data;

        const existingUsername = await db
            .select()
            .from(users)
            .where(and(eq(users.username,username),eq(users.isVerified,true)))
            .limit(1);
        if(existingUsername.length>0){
            return NextResponse.json(
                { error: 'This username is already taken' },
                { status: 409 }
            )
        }

        const existingEmail = await db
            .select()
            .from(users)
            .where(and(eq(users.email,email),eq(users.isVerified,true)))
            .limit(1)
        
        if(existingEmail.length>0){
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        const betaUser = await db
            .select()
            .from(betaEmails)
            .where(eq(betaEmails.email, email))
            .limit(1)

        if (betaUser.length === 0) {
            return NextResponse.json(
                { error: 'This email is not on the beta list. Please request access.' },
                { status: 403 }
            )
        }

        const passwordHash = await bcrypt.hash(password,12);
        const verifyToken = generateToken();
        const verifyExpires = new Date(Date.now()+24*60*60*1000);
        
        const previousRegister =  await db
            .select()
            .from(users)
            .where(eq(users.email,email))
            .limit(1)
        let userId;

        if(previousRegister.length){
            const [updatedUser] = await db
                .update(users)
                .set({ username, passwordHash, verifyExpires, verifyToken, isVerified: false })
                .where(eq(users.email, email))
                .returning();
            userId = updatedUser.id;
        }else{
            const [newUser] = await db
            .insert(users)
            .values({
                email,
                username,
                passwordHash,
                verifyToken,
                verifyExpires,
                isVerified: false,
            })
            .returning();
            userId = newUser.id
        }
        
        await sendVerificationEmail(email,verifyToken);

        return NextResponse.json(
            {
                message: 'Account created! Please check your email to verify your account.',
                userId: userId
            },
            { status: 201 }
        )

    } catch (error) {
        console.error('[register] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}