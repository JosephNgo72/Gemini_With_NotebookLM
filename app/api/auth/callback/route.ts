import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const storedState = request.cookies.get("oauth_state")?.value;

    // Verify state
    if (!state || state !== storedState) {
        return NextResponse.redirect(
            new URL("/?error=invalid_state", request.url)
        );
    }

    if (error) {
        return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(new URL("/?error=no_code", request.url));
    }

    const clientId = process.env.GOOGLE_CLOUD_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLOUD_CLIENT_SECRET;
    const redirectUri =
        process.env.GOOGLE_CLOUD_REDIRECT_URI ||
        `${request.nextUrl.origin}/api/auth/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            new URL("/?error=config_missing", request.url)
        );
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
            }
        );

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error("Token exchange error:", errorData);
            return NextResponse.redirect(
                new URL("/?error=token_exchange_failed", request.url)
            );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        if (!accessToken) {
            return NextResponse.redirect(
                new URL("/?error=no_access_token", request.url)
            );
        }

        // Get user info - try multiple endpoints
        let userEmail = "Unknown";

        // Try OAuth2 userinfo endpoint
        try {
            const userResponse = await fetch(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (userResponse.ok) {
                const userData = await userResponse.json();
                userEmail = userData.email || userData.name || "Unknown";
                console.log("User info from userinfo endpoint:", userData);
            } else {
                console.error(
                    "Userinfo endpoint error:",
                    userResponse.status,
                    await userResponse.text()
                );
            }
        } catch (error) {
            console.error("Error fetching userinfo:", error);
        }

        // If email is still Unknown, try to decode from access token (JWT)
        if (userEmail === "Unknown" && accessToken) {
            try {
                const tokenParts = accessToken.split(".");
                if (tokenParts.length >= 2) {
                    const payload = JSON.parse(
                        Buffer.from(tokenParts[1], "base64").toString()
                    );
                    userEmail =
                        payload.email ||
                        payload.sub ||
                        payload.name ||
                        "Unknown";
                    console.log("User email from token:", userEmail);
                }
            } catch (e) {
                console.error("Error decoding token:", e);
            }
        }

        // If still Unknown, try the newer userinfo endpoint
        if (userEmail === "Unknown") {
            try {
                const userResponse = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userEmail = userData.email || userData.name || "Unknown";
                    console.log("User info from v3 endpoint:", userData);
                }
            } catch (error) {
                console.error("Error fetching userinfo v3:", error);
            }
        }

        // Store tokens in httpOnly cookies
        const response = NextResponse.redirect(new URL("/", request.url));

        response.cookies.set("google_access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3600, // 1 hour (access tokens typically expire in 1 hour)
        });

        if (refreshToken) {
            response.cookies.set("google_refresh_token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 30, // 30 days
            });
        }

        response.cookies.set("google_user_email", userEmail, {
            httpOnly: false, // Allow client-side access for display
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Clear OAuth state cookie
        response.cookies.delete("oauth_state");

        return response;
    } catch (error: any) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(error.message)}`, request.url)
        );
    }
}
