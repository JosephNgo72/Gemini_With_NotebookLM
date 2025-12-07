import { GoogleAuth } from "google-auth-library";

interface Notebook {
    title: string;
    notebookId: string;
    emoji: string;
    metadata: {
        userRole: string;
        isShared: boolean;
        isShareable: boolean;
        lastViewed?: string;
        createTime?: string;
    };
    name: string;
}

interface NotebookListResponse {
    notebooks: Notebook[];
}

interface NotebookResponse {
    title: string;
    notebookId: string;
    emoji: string;
    metadata: {
        userRole: string;
        isShared: boolean;
        isShareable: boolean;
        lastViewed?: string;
        createTime?: string;
    };
    name: string;
    sources?: Source[]; // Sources might be included in the notebook response
}

export async function listNotebooks(
    projectNumber: string,
    location: string = "global",
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Notebook[]> {
    try {
        // Get access token - you'll need to implement OAuth or use service account
        // const accessToken = await getAccessToken();
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        // When using us- or eu- endpoint, location should match
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks:listRecentlyViewed`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        console.log("API Response Status:", response.status);
        console.log("API Response URL:", url);

        if (!response.ok) {
            // Read the error response body to get more details
            const errorBody = await response.text();
            let errorMessage = `Failed to list notebooks: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to list notebooks: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data: NotebookListResponse = await response.json();
        console.log("Raw API Response:", JSON.stringify(data, null, 2));
        return data.notebooks || [];
    } catch (error) {
        console.error("Error listing notebooks:", error);
        throw error;
    }
}

export async function getNotebook(
    projectNumber: string,
    location: string,
    notebookId: string,
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<NotebookResponse> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to get notebook: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to get notebook: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("Notebook API Error Response:", errorJson);
            } catch {
                console.error("Notebook API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data: NotebookResponse = await response.json();

        // Log the full notebook response to see if it includes sources
        console.log("Notebook response:", JSON.stringify(data, null, 2));

        return data;
    } catch (error) {
        console.error("Error getting notebook:", error);
        throw error;
    }
}

export async function createNotebook(
    projectNumber: string,
    title: string,
    location: string = "global",
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<NotebookResponse> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to create notebook: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to create notebook: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data: NotebookResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating notebook:", error);
        throw error;
    }
}

export async function deleteNotebook(
    projectNumber: string,
    location: string,
    notebookId: string,
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined },
    notebookName?: string // Optional: use the full name from notebook object if available
): Promise<void> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks:batchDelete`;

        // Use the provided notebook name if available, otherwise construct it
        // The notebook.name field contains the full resource name like:
        // "projects/PROJECT_NUMBER/locations/LOCATION/notebooks/NOTEBOOK_ID"
        let fullNotebookName: string;
        if (notebookName) {
            fullNotebookName = notebookName;
        } else {
            fullNotebookName = `projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}`;
        }

        console.log("Deleting notebook with name:", fullNotebookName);
        console.log("Delete URL:", url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                names: [fullNotebookName],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to delete notebook: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to delete notebook: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const responseText = await response.text();
        console.log("Delete response status:", response.status);
        console.log("Delete response body:", responseText);

        // batchDelete returns an empty response on success
        return;
    } catch (error) {
        console.error("Error deleting notebook:", error);
        throw error;
    }
}

// Helper function to get access token
async function getAccessToken(cookies?: {
    get: (name: string) => { value: string } | undefined;
}): Promise<string> {
    // Option 0: Check for OAuth token from cookies (highest priority)
    if (cookies) {
        const accessToken = cookies.get("google_access_token")?.value;
        if (accessToken) {
            return accessToken;
        }
    }

    // Option 1: Use environment variable (manual token - for quick testing)
    if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
        const token = process.env.GOOGLE_CLOUD_ACCESS_TOKEN.trim();

        // Decode and log token info for debugging (first part of JWT)
        try {
            const tokenParts = token.split(".");
            if (tokenParts.length >= 2) {
                const payload = JSON.parse(
                    Buffer.from(tokenParts[1], "base64").toString()
                );
                console.log(
                    "Token issued for account:",
                    payload.email || payload.sub || "Unknown"
                );
            }
        } catch (e) {
            // Not a JWT token, that's okay
        }

        return token;
    }

    // Option 2: Use service account JSON file (recommended for production)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const auth = new GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        if (!accessToken.token) {
            throw new Error("Failed to get access token from service account");
        }

        // Log service account email
        const credentials = await auth.getCredentials();
        console.log(
            "Using service account:",
            credentials.client_email || "Unknown"
        );

        return accessToken.token;
    }

    // Option 3: Use service account JSON from environment variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const credentials = JSON.parse(
                process.env.GOOGLE_SERVICE_ACCOUNT_JSON
            );
            const auth = new GoogleAuth({
                credentials,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"],
            });
            const client = await auth.getClient();
            const accessToken = await client.getAccessToken();
            if (!accessToken.token) {
                throw new Error(
                    "Failed to get access token from service account"
                );
            }

            console.log(
                "Using service account:",
                credentials.client_email || "Unknown"
            );

            return accessToken.token;
        } catch (error) {
            console.error("Error parsing service account JSON:", error);
            throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format");
        }
    }

    // Option 4: Try Application Default Credentials (if gcloud was set up)
    try {
        const auth = new GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });
        const client = await auth.getClient();

        // Try to get the account email
        try {
            const credentials = await auth.getCredentials();
            if (credentials.client_email) {
                console.log("Using service account:", credentials.client_email);
            } else {
                console.log(
                    "Using Application Default Credentials (user account)"
                );
            }
        } catch (e) {
            console.log("Using Application Default Credentials");
        }

        const accessToken = await client.getAccessToken();
        if (!accessToken.token) {
            throw new Error("Failed to get access token");
        }
        return accessToken.token;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw new Error(
            "No access token available. Please set up authentication:\n" +
                "1. Run: gcloud auth application-default login (make sure you're logged in with your Google account)\n" +
                "2. Or set GOOGLE_CLOUD_ACCESS_TOKEN=$(gcloud auth application-default print-access-token)\n" +
                "3. Or set GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file), OR\n" +
                "4. Or set GOOGLE_SERVICE_ACCOUNT_JSON (service account JSON as string)"
        );
    }
}

interface Source {
    sourceId: {
        id: string;
    };
    title: string;
    metadata?: {
        wordCount?: number;
        tokenCount?: number;
        [key: string]: any;
    };
    settings?: {
        status?: string;
    };
    name: string; // Full resource name
}

interface SourceListResponse {
    sources?: Source[];
}

interface SourceResponse {
    sourceId: {
        id: string;
    };
    title: string;
    metadata?: {
        wordCount?: number;
        tokenCount?: number;
        [key: string]: any;
    };
    settings?: {
        status?: string;
    };
    name: string;
}

export async function listSources(
    projectNumber: string,
    location: string,
    notebookId: string,
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Source[]> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        // First, try to get sources from the notebook response itself
        // Some APIs include related resources in the main resource response
        try {
            const notebook = await getNotebook(
                projectNumber,
                actualLocation,
                notebookId,
                endpointLocation,
                cookies
            );

            // Check if the notebook response includes sources
            if (
                (notebook as any).sources &&
                Array.isArray((notebook as any).sources)
            ) {
                console.log(
                    "Found sources in notebook response:",
                    (notebook as any).sources
                );
                return (notebook as any).sources;
            }
        } catch (error) {
            console.warn("Could not get notebook to check for sources:", error);
        }

        // Try the list sources endpoint
        // Based on REST conventions, this should list all sources for a notebook
        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}/sources`;

        console.log("Fetching sources from URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        console.log("Sources API response status:", response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Sources API error body:", errorBody);

            let errorMessage = `Failed to list sources: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to list sources: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error(
                    "Sources API Error Response:",
                    JSON.stringify(errorJson, null, 2)
                );
            } catch {
                console.error("Sources API Error Response (raw):", errorBody);
            }

            // If 404 or method not allowed, the endpoint might not exist
            // This is expected if the API doesn't support listing sources directly
            if (response.status === 404 || response.status === 405) {
                console.warn(
                    `Sources list endpoint returned ${response.status}. The endpoint might not be available. Check the browser console for more details.`
                );
                // Return empty array - the user should check the console for details
                return [];
            }
            throw new Error(errorMessage);
        }

        const responseText = await response.text();
        console.log("Sources API response body:", responseText);

        const data: SourceListResponse = JSON.parse(responseText);
        console.log("Parsed sources data:", JSON.stringify(data, null, 2));

        // The response might have sources directly or in a nested structure
        if (data.sources && Array.isArray(data.sources)) {
            return data.sources;
        }

        // Sometimes the response might be an array directly
        if (Array.isArray(data)) {
            return data as Source[];
        }

        // Check if sources are nested differently
        if ((data as any).source && Array.isArray((data as any).source)) {
            return (data as any).source;
        }

        console.warn("Unexpected response format for sources:", data);
        return [];
    } catch (error) {
        console.error("Error listing sources:", error);
        // Return empty array on error rather than throwing, so the app can continue
        return [];
    }
}

export async function getSource(
    projectNumber: string,
    location: string,
    notebookId: string,
    sourceId: string,
    endpointLocation: string = "us",
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<SourceResponse> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}/sources/${sourceId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to get source: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to get source: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data: SourceResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error getting source:", error);
        throw error;
    }
}

export async function batchCreateSources(
    projectNumber: string,
    location: string,
    notebookId: string,
    endpointLocation: string = "us",
    videoUrl?: string,
    googleDriveContent?: {
        documentId: string;
        mimeType: string;
        sourceName: string;
    },
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Source[]> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}/sources:batchCreate`;

        // Build request body based on content type
        let userContent: any;

        if (googleDriveContent) {
            // Google Drive content (Docs or Slides)
            userContent = {
                googleDriveContent: {
                    documentId: googleDriveContent.documentId,
                    mimeType: googleDriveContent.mimeType,
                    sourceName: googleDriveContent.sourceName,
                },
            };
        } else if (videoUrl) {
            // YouTube video - using webContent as videoContent doesn't work
            const videoTitle = `YouTube Video - ${new Date().toLocaleDateString()}`;
            userContent = {
                webContent: {
                    url: videoUrl,
                    sourceName: videoTitle,
                },
            };
        } else {
            throw new Error(
                "Either videoUrl or googleDriveContent must be provided"
            );
        }

        const requestBody = {
            userContents: [userContent],
        };

        console.log(
            "BatchCreate request body:",
            JSON.stringify(requestBody, null, 2)
        );

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        console.log(
            "BatchCreate Sources API Response Status:",
            response.status
        );
        console.log("BatchCreate Sources API Response URL:", url);

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to add source: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to add source: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(
            "BatchCreate Sources API Response:",
            JSON.stringify(data, null, 2)
        );
        return data.sources || [];
    } catch (error) {
        console.error("Error adding source:", error);
        throw error;
    }
}

export async function uploadFile(
    projectNumber: string,
    location: string,
    notebookId: string,
    endpointLocation: string = "us",
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Source> {
    try {
        const accessToken = await getAccessToken(cookies);

        // Ensure location matches endpointLocation for regional endpoints
        let actualLocation = location;
        if (endpointLocation === "us" && location === "global") {
            actualLocation = "us";
        } else if (endpointLocation === "eu" && location === "global") {
            actualLocation = "eu";
        }

        const url = `https://${endpointLocation}-discoveryengine.googleapis.com/upload/v1alpha/projects/${projectNumber}/locations/${actualLocation}/notebooks/${notebookId}/sources:uploadFile`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Goog-Upload-File-Name": fileName,
                "X-Goog-Upload-Protocol": "raw",
                "Content-Type": contentType,
            },
            body: new Uint8Array(fileBuffer),
        });

        console.log("Upload File API Response Status:", response.status);
        console.log("Upload File API Response URL:", url);

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Failed to upload file: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = `Failed to upload file: ${
                    errorJson.error?.message ||
                    errorJson.message ||
                    response.statusText
                }`;
                console.error("API Error Response:", errorJson);
            } catch {
                console.error("API Error Response (raw):", errorBody);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Upload File API Response:", JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export type { Notebook, NotebookResponse, Source, SourceResponse };
