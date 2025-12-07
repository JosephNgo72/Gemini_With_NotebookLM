import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("google_access_token")?.value;
    const userEmail = request.cookies.get("google_user_email")?.value;
    
    return NextResponse.json({
        authenticated: !!accessToken,
        userEmail: userEmail || null,
    });
}

