import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const refreshToken = request.cookies.get("google_refresh_token")?.value;
    
    if (!refreshToken) {
        return NextResponse.json(
            { error: "No refresh token available" },
            { status: 401 }
        );
    }
    
    const clientId = process.env.GOOGLE_CLOUD_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLOUD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        return NextResponse.json(
            { error: "OAuth not configured" },
            { status: 500 }
        );
    }
    
    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "refresh_token",
            }),
        });
        
        if (!tokenResponse.ok) {
            return NextResponse.json(
                { error: "Failed to refresh token" },
                { status: 401 }
            );
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            return NextResponse.json(
                { error: "No access token in response" },
                { status: 500 }
            );
        }
        
        const response = NextResponse.json({ success: true });
        
        response.cookies.set("google_access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3600, // 1 hour
        });
        
        return response;
    } catch (error: any) {
        console.error("Token refresh error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to refresh token" },
            { status: 500 }
        );
    }
}

