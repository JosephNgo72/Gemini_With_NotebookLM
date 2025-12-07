import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLOUD_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CLOUD_REDIRECT_URI || 
        `${request.nextUrl.origin}/api/auth/callback`;
    
    // Log the redirect URI for debugging
    console.log("=== OAuth Login ===");
    console.log("Redirect URI being used:", redirectUri);
    console.log("Request origin:", request.nextUrl.origin);
    console.log("GOOGLE_CLOUD_REDIRECT_URI env var:", process.env.GOOGLE_CLOUD_REDIRECT_URI || "not set");
    console.log("===================");
    
    if (!clientId) {
        return NextResponse.json(
            { error: "GOOGLE_CLOUD_CLIENT_ID not configured" },
            { status: 500 }
        );
    }

    // Include Google Drive scope for accessing Google Docs and Slides
    const scope = "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/drive.readonly openid email profile";
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in cookie for verification
    const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`
    );
    
    response.cookies.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
    });
    
    return response;
}

