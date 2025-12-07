import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ success: true });
    
    // Clear all auth cookies
    response.cookies.delete("google_access_token");
    response.cookies.delete("google_refresh_token");
    response.cookies.delete("google_user_email");
    response.cookies.delete("oauth_state");
    
    return response;
}

