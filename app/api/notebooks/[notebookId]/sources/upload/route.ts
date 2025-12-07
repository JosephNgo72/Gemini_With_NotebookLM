import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/app/lib/notebooklm";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ notebookId: string }> | { notebookId: string } }
) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const projectNumber = formData.get("projectNumber") as string;
        const location = formData.get("location") as string;
        const endpointLocation = formData.get("endpointLocation") as string;

        if (!projectNumber) {
            return NextResponse.json(
                { error: "projectNumber is required" },
                { status: 400 }
            );
        }

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
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

        // Get content type from file or determine from extension
        const getContentType = (filename: string, defaultType: string): string => {
            if (defaultType && defaultType !== "application/octet-stream") {
                return defaultType;
            }
            const ext = filename.toLowerCase().split('.').pop();
            const contentTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'txt': 'text/plain',
                'md': 'text/markdown',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '3g2': 'audio/3gpp2',
                '3gp': 'audio/3gpp',
                'aac': 'audio/aac',
                'aif': 'audio/aiff',
                'aifc': 'audio/aiff',
                'aiff': 'audio/aiff',
                'amr': 'audio/amr',
                'au': 'audio/basic',
                'avi': 'video/x-msvideo',
                'cda': 'application/x-cdf',
                'm4a': 'audio/m4a',
                'mid': 'audio/midi',
                'midi': 'audio/midi',
                'mp3': 'audio/mpeg',
                'mp4': 'video/mp4',
                'mpeg': 'audio/mpeg',
                'ogg': 'audio/ogg',
                'opus': 'audio/ogg',
                'ra': 'audio/vnd.rn-realaudio',
                'ram': 'audio/vnd.rn-realaudio',
                'snd': 'audio/basic',
                'wav': 'audio/wav',
                'weba': 'audio/webm',
                'wma': 'audio/x-ms-wma',
                'png': 'image/png',
                'jpg': 'image/jpg',
                'jpeg': 'image/jpeg',
            };
            return contentTypes[ext || ''] || 'application/octet-stream';
        };

        const contentType = getContentType(file.name, file.type);
        const fileBuffer = await file.arrayBuffer();
        const source = await uploadFile(
            projectNumber,
            actualLocation,
            notebookId,
            actualEndpointLocation,
            file.name,
            Buffer.from(fileBuffer),
            contentType,
            request.cookies
        );

        console.log("Upload File API route - created source:", source);
        return NextResponse.json({ source });
    } catch (error: any) {
        console.error("Upload File API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}

