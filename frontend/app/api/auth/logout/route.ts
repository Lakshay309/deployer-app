import { deleteAuthCookie } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request:NextRequest){
    try {
        await deleteAuthCookie();
        return NextResponse.json({
            message: 'Logged out successfully'
        })

    } catch (error) {
        console.error('[logout] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}
