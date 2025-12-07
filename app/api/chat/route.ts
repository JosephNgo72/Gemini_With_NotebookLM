import { NextRequest, NextResponse } from "next/server";
import { generateResponse } from "@/app/lib/gemini";
import { getNotebook, listSources } from "@/app/lib/notebooklm";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            message,
            chatHistory,
            notebookIds,
            projectNumber,
            location,
            endpointLocation,
        } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // If notebookIds are provided, fetch notebook contexts and sources
        let notebookContext = "";
        if (notebookIds && Array.isArray(notebookIds) && notebookIds.length > 0 && projectNumber) {
            try {
                const actualLocation = location || "global";
                const actualEndpointLocation = endpointLocation || "us";
                
                // Fetch notebooks - sources are included in the notebook response
                const notebookPromises = notebookIds.map(async (notebookId: string) => {
                    try {
                        const notebook = await getNotebook(
                            projectNumber,
                            actualLocation,
                            notebookId,
                            actualEndpointLocation,
                            request.cookies
                        );
                        
                        // Sources are included in the notebook response
                        const sources = (notebook as any).sources || [];
                        
                        // If no sources in notebook response, try listSources as fallback
                        let finalSources = sources;
                        if (sources.length === 0) {
                            try {
                                finalSources = await listSources(
                                    projectNumber,
                                    actualLocation,
                                    notebookId,
                                    actualEndpointLocation,
                                    request.cookies
                                );
                            } catch (error) {
                                console.warn(`Failed to load sources for notebook ${notebookId}:`, error);
                                finalSources = [];
                            }
                        }
                        
                        return { notebook, sources: finalSources };
                    } catch (error) {
                        console.error(`Failed to get notebook ${notebookId}:`, error);
                        // Try to get sources even if notebook fetch fails
                        try {
                            const sources = await listSources(
                                projectNumber,
                                actualLocation,
                                notebookId,
                                actualEndpointLocation,
                                request.cookies
                            );
                            return { 
                                notebook: { 
                                    title: `Notebook ${notebookId}`, 
                                    notebookId,
                                    emoji: "📓",
                                    metadata: { userRole: "", isShared: false, isShareable: false },
                                    name: `projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}`
                                }, 
                                sources 
                            };
                        } catch (sourceError) {
                            console.error(`Failed to get sources for notebook ${notebookId}:`, sourceError);
                            return { 
                                notebook: { 
                                    title: `Notebook ${notebookId}`, 
                                    notebookId,
                                    emoji: "📓",
                                    metadata: { userRole: "", isShared: false, isShareable: false },
                                    name: `projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}`
                                }, 
                                sources: [] 
                            };
                        }
                    }
                });
                
                const notebookData = await Promise.all(notebookPromises);
                
                // Log what we fetched
                console.log("=== Fetched Notebook Data ===");
                notebookData.forEach(({ notebook, sources }, index) => {
                    console.log(`Notebook ${index + 1}: "${notebook.title}"`);
                    console.log(`  Sources found: ${sources.length}`);
                    sources.forEach((source, i) => {
                        console.log(`    ${i + 1}. "${source.title}"`);
                    });
                });
                console.log("=============================");
                
                // Build context from all notebooks and their sources
                notebookContext = `You are an AI assistant helping a user who has selected ${notebookData.length} NotebookLM notebook${notebookData.length > 1 ? "s" : ""} with the following sources. You have access to information about these sources and MUST provide helpful responses based on this information.\n\n`;
                notebookContext += `CRITICAL INSTRUCTIONS:\n`;
                notebookContext += `- You MUST always work with the source information provided below\n`;
                notebookContext += `- NEVER say you cannot access the sources or that you don't have access to them\n`;
                notebookContext += `- Use the source titles to understand what topics they cover\n`;
                notebookContext += `- Provide detailed, helpful responses based on the source titles and your knowledge of those topics\n`;
                notebookContext += `- When asked about sources, list them, describe what they likely contain based on their titles, and provide relevant information\n`;
                notebookContext += `- Be confident and helpful - act as if you have access to this information\n`;
                notebookContext += `- FORMATTING: Whenever you mention a source name, surround it with double asterisks like this: **source name**. This helps highlight source references in the response.\n`;
                notebookContext += `- TITLE FORMATTING: For section titles and headers (like "From your notebook..." or any major section headers), use markdown header syntax with ### followed by the title text. For example: ### From your notebook "Notebook Name":. This helps format titles to be larger and bolder in the response.\n\n`;
                
                notebookData.forEach(({ notebook, sources }, index) => {
                    notebookContext += `=== Notebook ${index + 1}: "${notebook.title}" ===\n`;
                    notebookContext += `Notebook ID: ${notebook.notebookId}\n`;
                    
                    if (sources && sources.length > 0) {
                        notebookContext += `This notebook contains ${sources.length} source${sources.length !== 1 ? "s" : ""}:\n\n`;
                        sources.forEach((source, sourceIndex) => {
                            notebookContext += `${sourceIndex + 1}. "${source.title || 'Untitled Source'}"`;
                            if (source.metadata?.wordCount) {
                                notebookContext += ` (${source.metadata.wordCount} words)`;
                            }
                            if (source.metadata?.tokenCount) {
                                notebookContext += ` (${source.metadata.tokenCount} tokens)`;
                            }
                            notebookContext += `\n`;
                        });
                        notebookContext += `\n`;
                    } else {
                        notebookContext += `No sources have been added to this notebook yet.\n\n`;
                    }
                });
                
                // Add a summary of all sources across all notebooks
                const allSources = notebookData.flatMap(({ notebook, sources }) => 
                    sources.map(source => ({ notebookTitle: notebook.title, source }))
                );
                
                if (allSources.length > 0) {
                    notebookContext += `\n=== SUMMARY: All Sources Across All Notebooks ===\n`;
                    allSources.forEach(({ notebookTitle, source }, index) => {
                        notebookContext += `${index + 1}. "${source.title || 'Untitled Source'}" (from notebook: "${notebookTitle}")`;
                        if (source.metadata?.wordCount) {
                            notebookContext += ` - ${source.metadata.wordCount} words`;
                        }
                        notebookContext += `\n`;
                    });
                    notebookContext += `\n`;
                }
                
                notebookContext += `\nWhen the user asks about their sources:\n`;
                notebookContext += `- List all sources from all notebooks\n`;
                notebookContext += `- Describe what each source likely contains based on its title\n`;
                notebookContext += `- Provide relevant information, insights, or summaries based on the source topics\n`;
                notebookContext += `- Reference specific source names when discussing them - ALWAYS wrap source names in **double asterisks** like **source name**\n`;
                notebookContext += `- For section titles and headers (like "From your notebook..." headers), use ### followed by the title text\n`;
                notebookContext += `- Be helpful and informative - never refuse to help or say you don't have access\n`;
                notebookContext += `- Remember: Every time you mention a source title, format it as **source title**. For section headers, use ### Header Text\n\n`;
            } catch (error) {
                console.error("Error fetching notebook contexts:", error);
                // Continue without context if fetch fails
            }
        }

        // Enhance the message with notebook context
        const enhancedMessage = notebookContext
            ? `${notebookContext}\n\nUser question: ${message}`
            : message;

        // Log the context being sent to Gemini for debugging
        console.log("=== Context being sent to Gemini ===");
        console.log(notebookContext ? `Context length: ${notebookContext.length} characters` : "No context");
        if (notebookContext) {
            console.log("Full context:", notebookContext);
        }
        console.log("User message:", message);
        console.log("Full enhanced message:", enhancedMessage);
        console.log("====================================");

        const response = await generateResponse(
            enhancedMessage,
            chatHistory || []
        );

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Failed to process chat message" },
            { status: 500 }
        );
    }
}
