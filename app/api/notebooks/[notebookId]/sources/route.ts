import { NextRequest, NextResponse } from "next/server";
import { listSources, batchCreateSources } from "@/app/lib/notebooklm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ notebookId: string }> | { notebookId: string } }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const projectNumber = searchParams.get("projectNumber");
        const location = searchParams.get("location") || "global";
        const endpointLocation = searchParams.get("endpointLocation") || "us";

        if (!projectNumber) {
            return NextResponse.json(
                { error: "projectNumber is required" },
                { status: 400 }
            );
        }

        // Handle both sync and async params (Next.js 14 vs 15)
        const resolvedParams = await Promise.resolve(params);
        const notebookId = resolvedParams.notebookId;

        console.log("Sources API route - notebookId:", notebookId);
        console.log("Sources API route - params:", resolvedParams);

        if (!notebookId) {
            console.error("Sources API route - notebookId is missing!");
            return NextResponse.json(
                { error: "notebookId is required" },
                { status: 400 }
            );
        }

        const sources = await listSources(
            projectNumber,
            location,
            notebookId,
            endpointLocation,
            request.cookies
        );

        console.log("Sources API route - found sources:", sources.length);
        return NextResponse.json({ sources });
    } catch (error: any) {
        console.error("Sources API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch sources" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ notebookId: string }> | { notebookId: string } }
) {
    try {
        const body = await request.json();
        const { projectNumber, location, endpointLocation, videoUrl, googleDriveContent } = body;

        if (!projectNumber) {
            return NextResponse.json(
                { error: "projectNumber is required" },
                { status: 400 }
            );
        }

        if (!videoUrl && !googleDriveContent) {
            return NextResponse.json(
                { error: "Either videoUrl or googleDriveContent is required" },
                { status: 400 }
            );
        }

        // Handle both sync and async params (Next.js 14 vs 15)
        const resolvedParams = await Promise.resolve(params);
        const notebookId = resolvedParams.notebookId;

        if (!notebookId) {
            return NextResponse.json(
                { error: "notebookId is required" },
                { status: 400 }
            );
        }

        const actualLocation = location || "global";
        const actualEndpointLocation = endpointLocation || "us";

        const sources = await batchCreateSources(
            projectNumber,
            actualLocation,
            notebookId,
            actualEndpointLocation,
            videoUrl,
            googleDriveContent,
            request.cookies
        );

        console.log("Add Source API route - created sources:", sources.length);
        return NextResponse.json({ sources });
    } catch (error: any) {
        console.error("Add Source API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to add source" },
            { status: 500 }
        );
    }
}

