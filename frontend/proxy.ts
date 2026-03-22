import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('token')?.value;
    const isAuthRoute = pathname ==='/login' || pathname == '/register';
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if(isDashboardRoute){
        if(!token){
            return NextResponse.redirect(new URL('/login',request.url));
        }
        const payload = await verifyToken(token);
        if (!payload) {
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete('token')
            return response
        }
    }
    
    if(isAuthRoute && token){
        const payload = await verifyToken(token);
        if(payload){
            return NextResponse.redirect(new URL('/dashboard',request.url));
        }

        const response = NextResponse.next();
        request.cookies.delete('token')
        return response;
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register']
}