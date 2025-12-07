import { NextRequest, NextResponse } from "next/server";
import { getNotebook, deleteNotebook } from "@/app/lib/notebooklm";

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

        // Handle both sync and async params (Next.js 14 vs 15+)
        const resolvedParams = await Promise.resolve(params);
        const notebookId = resolvedParams.notebookId;

        if (!notebookId) {
            return NextResponse.json(
                { error: "notebookId is required" },
                { status: 400 }
            );
        }

        const notebook = await getNotebook(
            projectNumber,
            location,
            notebookId,
            endpointLocation,
            request.cookies
        );

        return NextResponse.json({ notebook });
    } catch (error) {
        console.error("Notebook API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notebook" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ notebookId: string }> | { notebookId: string } }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const projectNumber = searchParams.get("projectNumber");
        const location = searchParams.get("location") || "global";
        const endpointLocation = searchParams.get("endpointLocation") || "us";
        const notebookName = searchParams.get("notebookName"); // Get the full name if provided

        if (!projectNumber) {
            return NextResponse.json(
                { error: "projectNumber is required" },
                { status: 400 }
            );
        }

        // Handle both sync and async params (Next.js 14 vs 15+)
        const resolvedParams = await Promise.resolve(params);
        const notebookId = resolvedParams.notebookId;

        if (!notebookId) {
            return NextResponse.json(
                { error: "notebookId is required" },
                { status: 400 }
            );
        }

        // If notebookName is not provided, try to fetch it first
        let fullNotebookName = notebookName || undefined;
        if (!fullNotebookName) {
            try {
                const notebook = await getNotebook(
                    projectNumber,
                    location,
                    notebookId,
                    endpointLocation,
                    request.cookies
                );
                fullNotebookName = notebook.name;
            } catch (error) {
                console.warn("Could not fetch notebook name, will construct it:", error);
            }
        }

        await deleteNotebook(
            projectNumber,
            location,
            notebookId,
            endpointLocation,
            request.cookies,
            fullNotebookName
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete notebook API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete notebook" },
            { status: 500 }
        );
    }
}
