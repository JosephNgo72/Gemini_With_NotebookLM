import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateResponse(
    prompt: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "You are a helpful AI assistant working with NotebookLM notebooks. When users ask about sources in their notebooks, you MUST provide helpful responses based on the source information provided to you in the conversation. Always use the source information that is explicitly provided in the user's messages. Never say you cannot access sources or that you don't have access to them. Always work with the information you are given and provide detailed, informative responses about the sources based on their titles and metadata. If source information is provided in the current message, that takes priority over any previous conversation context."
        });

        // Convert chat history to Gemini format
        // Limit history to last 10 messages to avoid context issues
        const recentHistory = chatHistory.slice(-10).map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        // Start a chat session with history
        const chat = model.startChat({
            history: recentHistory.length > 0 ? recentHistory : undefined,
        });

        // Send the message
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate response from Gemini");
    }
}
