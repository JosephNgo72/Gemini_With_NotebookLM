import { NextRequest, NextResponse } from "next/server";
import { listNotebooks, createNotebook } from "@/app/lib/notebooklm";

export async function GET(request: NextRequest) {
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

        const notebooks = await listNotebooks(
            projectNumber,
            location,
            endpointLocation,
            request.cookies
        );
        console.log("Fetched notebooks:", JSON.stringify(notebooks, null, 2));
        return NextResponse.json({ notebooks });
    } catch (error) {
        console.error("Notebooks API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notebooks" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            projectNumber,
            title,
            location = "global",
            endpointLocation = "us",
        } = body;

        if (!projectNumber) {
            return NextResponse.json(
                { error: "projectNumber is required" },
                { status: 400 }
            );
        }

        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: "title is required" },
                { status: 400 }
            );
        }

        const notebook = await createNotebook(
            projectNumber,
            title.trim(),
            location,
            endpointLocation,
            request.cookies
        );
        console.log("Created notebook:", JSON.stringify(notebook, null, 2));
        return NextResponse.json({ notebook });
    } catch (error: any) {
        console.error("Create notebook API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create notebook" },
            { status: 500 }
        );
    }
}
