"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Send,
    BookOpen,
    X,
    Plus,
    Trash2,
    LogOut,
    Cloud,
    RefreshCw,
    ChevronUp,
    ChevronDown,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

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
    name: string;
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [selectedNotebooks, setSelectedNotebooks] = useState<Notebook[]>([]);
    const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
    const [notebooksLoaded, setNotebooksLoaded] = useState(false);
    const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newNotebookTitle, setNewNotebookTitle] = useState("");
    const [projectNumber, setProjectNumber] = useState(
        process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER || ""
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(
        null
    );
    const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
    const [isDeletingNotebook, setIsDeletingNotebook] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null
    );
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [notebookSources, setNotebookSources] = useState<
        Record<string, Source[]>
    >({});
    const [loadingSources, setLoadingSources] = useState<
        Record<string, boolean>
    >({});
    const [
        isSelectedNotebooksSectionMinimized,
        setIsSelectedNotebooksSectionMinimized,
    ] = useState(false);
    const [expandedNotebookSources, setExpandedNotebookSources] = useState<
        Record<string, boolean>
    >({});
    const [showNotebookSelectionModal, setShowNotebookSelectionModal] =
        useState(false);
    const [isInitialNotebookLoad, setIsInitialNotebookLoad] = useState(false);
    const [loadingDots, setLoadingDots] = useState(".");
    const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
    const [notebookForSource, setNotebookForSource] = useState<Notebook | null>(
        null
    );
    const [newSourceUrl, setNewSourceUrl] = useState("");
    const [isAddingSource, setIsAddingSource] = useState(false);
    const [addSourceTab, setAddSourceTab] = useState<"url" | "upload">("url");
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        checkAuthStatus();

        // Check for OAuth callback errors in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        if (error) {
            let errorMessage = `Authentication error: ${error}`;
            if (error === "redirect_uri_mismatch") {
                errorMessage = `OAuth Configuration Error: The redirect URI doesn't match Google Cloud Console settings. Please add "http://localhost:3000/api/auth/callback" to your OAuth 2.0 Client ID's authorized redirect URIs in Google Cloud Console. See OAUTH_SETUP.md for detailed instructions.`;
            } else if (error === "access_denied") {
                errorMessage = `OAuth Access Denied: The app is in testing mode. Please add your email (${
                    userEmail || "your email"
                }) as a test user in Google Cloud Console. Go to "APIs & Services" > "OAuth consent screen" > "Test users" and add your email address. See OAUTH_SETUP.md for detailed instructions.`;
            }
            setSuccessMessage(errorMessage);
            // Clean up URL
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        } else {
            // If no error, check if we just came back from OAuth (check for success)
            // Refresh auth status to get updated email
            const hasCode = urlParams.get("code");
            if (hasCode) {
                // We just came back from OAuth, refresh auth status after a short delay
                setTimeout(() => {
                    checkAuthStatus();
                }, 500);
            }
        }
    }, []);

    // Animate loading dots
    useEffect(() => {
        if (!isLoading) {
            setLoadingDots(".");
            return;
        }

        const interval = setInterval(() => {
            setLoadingDots((prev) => {
                if (prev === ".") return "..";
                if (prev === "..") return "...";
                return ".";
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isLoading]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch("/api/auth/status");
            const data = await response.json();
            setIsAuthenticated(data.authenticated);
            setUserEmail(data.userEmail);
        } catch (error) {
            console.error("Error checking auth status:", error);
            setIsAuthenticated(false);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const handleLogin = () => {
        window.location.href = "/api/auth/login";
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setIsAuthenticated(false);
            setUserEmail(null);
            setSelectedNotebooks([]);
            setNotebooks([]);
            setMessages([]);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const loadNotebooks = async () => {
        if (!projectNumber) {
            alert("Please set your Google Cloud Project Number first");
            return;
        }

        setIsLoadingNotebooks(true);
        try {
            const response = await fetch(
                `/api/notebooks?projectNumber=${projectNumber}&location=global&endpointLocation=us`
            );
            if (!response.ok) throw new Error("Failed to load notebooks");
            const data = await response.json();
            setNotebooks(data.notebooks || []);
            setNotebooksLoaded(true); // Mark notebooks as loaded

            // If no notebooks are selected yet, show the modal and mark as initial load
            if (selectedNotebooks.length === 0) {
                setShowNotebookSelectionModal(true);
                setIsInitialNotebookLoad(true);
            }
        } catch (error) {
            console.error("Error loading notebooks:", error);
            alert("Failed to load notebooks. Please check your configuration.");
        } finally {
            setIsLoadingNotebooks(false);
        }
    };

    const loadSourcesForNotebook = async (notebookId: string) => {
        if (!projectNumber) return;
        if (loadingSources[notebookId]) return; // Already loading

        setLoadingSources((prev) => ({ ...prev, [notebookId]: true }));
        try {
            const response = await fetch(
                `/api/notebooks/${notebookId}/sources?projectNumber=${projectNumber}&location=global&endpointLocation=us`
            );
            if (!response.ok) {
                // If sources endpoint doesn't exist or fails, just continue without sources
                console.warn(
                    `Failed to load sources for notebook ${notebookId}`
                );
                setNotebookSources((prev) => ({ ...prev, [notebookId]: [] }));
                return;
            }
            const data = await response.json();
            setNotebookSources((prev) => ({
                ...prev,
                [notebookId]: data.sources || [],
            }));
        } catch (error) {
            console.error(
                `Error loading sources for notebook ${notebookId}:`,
                error
            );
            setNotebookSources((prev) => ({ ...prev, [notebookId]: [] }));
        } finally {
            setLoadingSources((prev) => ({ ...prev, [notebookId]: false }));
        }
    };

    const handleAddSource = async () => {
        if (!notebookForSource || !newSourceUrl.trim() || !projectNumber) {
            alert("Please enter a valid URL");
            return;
        }

        const url = newSourceUrl.trim();

        // Detect URL type
        const youtubeRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        const googleDriveRegex =
            /docs\.google\.com\/(document|presentation)\/d\/([a-zA-Z0-9-_]+)/;

        const isYouTube = youtubeRegex.test(url);
        const googleDriveMatch = url.match(googleDriveRegex);

        if (!isYouTube && !googleDriveMatch) {
            alert(
                "Please enter a valid YouTube URL or Google Drive (Docs/Slides) URL"
            );
            return;
        }

        setIsAddingSource(true);
        try {
            // Prepare request body based on URL type
            const requestBody: any = {
                projectNumber,
                location: "global",
                endpointLocation: "us",
            };

            if (isYouTube) {
                requestBody.videoUrl = url;
            } else if (googleDriveMatch) {
                const fileType = googleDriveMatch[1]; // "document" or "presentation"
                const documentId = googleDriveMatch[2];
                const mimeType =
                    fileType === "document"
                        ? "application/vnd.google-apps.document"
                        : "application/vnd.google-apps.presentation";
                const sourceName = `${
                    fileType === "document" ? "Google Doc" : "Google Slide"
                } - ${new Date().toLocaleDateString()}`;

                requestBody.googleDriveContent = {
                    documentId,
                    mimeType,
                    sourceName,
                };
            }

            const response = await fetch(
                `/api/notebooks/${notebookForSource.notebookId}/sources`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add source");
            }

            const data = await response.json();

            // Reload sources for this notebook
            await loadSourcesForNotebook(notebookForSource.notebookId);

            setShowAddSourceDialog(false);
            setNewSourceUrl("");
            setNotebookForSource(null);

            setSuccessMessage(
                `Source added successfully to "${notebookForSource.title}"!`
            );
        } catch (error: any) {
            console.error("Error adding source:", error);
            alert(
                error.message ||
                    "Failed to add source. Please check your configuration."
            );
        } finally {
            setIsAddingSource(false);
        }
    };

    const handleFileUpload = async () => {
        if (!notebookForSource || !selectedFile || !projectNumber) {
            alert("Please select a file to upload");
            return;
        }

        setIsAddingSource(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("projectNumber", projectNumber);
            formData.append("location", "global");
            formData.append("endpointLocation", "us");

            const response = await fetch(
                `/api/notebooks/${notebookForSource.notebookId}/sources/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload file");
            }

            const data = await response.json();

            // Reload sources for this notebook
            await loadSourcesForNotebook(notebookForSource.notebookId);

            setShowAddSourceDialog(false);
            setSelectedFile(null);
            setNotebookForSource(null);
            setAddSourceTab("url");

            setSuccessMessage(
                `File "${selectedFile.name}" added successfully to "${notebookForSource.title}"!`
            );
        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert(
                error.message ||
                    "Failed to upload file. Please check your configuration."
            );
        } finally {
            setIsAddingSource(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const getContentType = (filename: string): string => {
        const ext = filename.toLowerCase().split(".").pop();
        const contentTypes: Record<string, string> = {
            // Documents
            pdf: "application/pdf",
            txt: "text/plain",
            md: "text/markdown",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            // Audio
            "3g2": "audio/3gpp2",
            "3gp": "audio/3gpp",
            aac: "audio/aac",
            aif: "audio/aiff",
            aifc: "audio/aiff",
            aiff: "audio/aiff",
            amr: "audio/amr",
            au: "audio/basic",
            avi: "video/x-msvideo",
            cda: "application/x-cdf",
            m4a: "audio/m4a",
            mid: "audio/midi",
            midi: "audio/midi",
            mp3: "audio/mpeg",
            mp4: "video/mp4",
            mpeg: "audio/mpeg",
            ogg: "audio/ogg",
            opus: "audio/ogg",
            ra: "audio/vnd.rn-realaudio",
            ram: "audio/vnd.rn-realaudio",
            snd: "audio/basic",
            wav: "audio/wav",
            weba: "audio/webm",
            wma: "audio/x-ms-wma",
            // Images
            png: "image/png",
            jpg: "image/jpg",
            jpeg: "image/jpeg",
        };
        return contentTypes[ext || ""] || "application/octet-stream";
    };

    const handleCreateNotebook = async () => {
        if (!projectNumber) {
            alert("Please set your Google Cloud Project Number first");
            return;
        }

        if (!newNotebookTitle.trim()) {
            alert("Please enter a notebook title");
            return;
        }

        setIsCreatingNotebook(true);
        try {
            const response = await fetch("/api/notebooks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectNumber,
                    title: newNotebookTitle.trim(),
                    location: "global",
                    endpointLocation: "us",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create notebook");
            }

            const data = await response.json();
            const newNotebook = data.notebook;

            // Add the new notebook to the list and select it
            setNotebooks((prev) => [newNotebook, ...prev]);
            setSelectedNotebooks((prev) => [...prev, newNotebook]);
            // Ensure sources are minimized by default for new notebook
            setExpandedNotebookSources((prev) => ({
                ...prev,
                [newNotebook.notebookId]: false,
            }));
            // Load sources for the newly created notebook
            loadSourcesForNotebook(newNotebook.notebookId);
            setShowCreateDialog(false);
            setNewNotebookTitle("");

            setSuccessMessage(
                `Notebook "${newNotebook.title}" created successfully!`
            );
        } catch (error: any) {
            console.error("Error creating notebook:", error);
            alert(
                error.message ||
                    "Failed to create notebook. Please check your configuration."
            );
        } finally {
            setIsCreatingNotebook(false);
        }
    };

    const handleDeleteNotebook = async () => {
        if (!notebookToDelete) return;

        if (!projectNumber) {
            alert("Please set your Google Cloud Project Number first");
            return;
        }

        if (deleteConfirmationName !== notebookToDelete.title) {
            alert(
                "The name you entered does not match the notebook name. Please try again."
            );
            return;
        }

        setIsDeletingNotebook(true);
        try {
            // Include the notebook name in the request if available
            const params = new URLSearchParams({
                projectNumber,
                location: "global",
                endpointLocation: "us",
            });
            if (notebookToDelete.name) {
                params.append("notebookName", notebookToDelete.name);
            }

            const response = await fetch(
                `/api/notebooks/${
                    notebookToDelete.notebookId
                }?${params.toString()}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete notebook");
            }

            // Remove the notebook from the list
            setNotebooks((prev) =>
                prev.filter((n) => n.notebookId !== notebookToDelete.notebookId)
            );

            // Remove the deleted notebook from selected notebooks
            setSelectedNotebooks((prev) =>
                prev.filter((n) => n.notebookId !== notebookToDelete.notebookId)
            );

            setShowDeleteDialog(false);
            const deletedTitle = notebookToDelete.title;
            setNotebookToDelete(null);
            setDeleteConfirmationName("");

            setSuccessMessage(
                `Notebook "${deletedTitle}" deleted successfully!`
            );
        } catch (error: any) {
            console.error("Error deleting notebook:", error);
            alert(
                error.message ||
                    "Failed to delete notebook. Please check your configuration."
            );
        } finally {
            setIsDeletingNotebook(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: currentInput,
                    chatHistory: messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    notebookIds: selectedNotebooks.map((n) => n.notebookId),
                    projectNumber: projectNumber || undefined,
                    location: "global",
                    endpointLocation: "us",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Format message content to highlight source names and titles
    const formatMessageContent = (content: string) => {
        // Split by title markers (<<<title>>> or ### Title), then by source name markers (**)
        // Regex: (<<<[^>]+>>>|###\s+[^\n]+|\*\*[^*]+\*\*)
        const parts = content.split(
            /(<<<[^>]+>>>|###\s+[^\n]+|\*\*[^*]+\*\*)/g
        );

        return parts.map((part, index) => {
            // Check if this part is a title (wrapped in <<<>>>)
            if (part.startsWith("<<<") && part.endsWith(">>>")) {
                const titleText = part.slice(3, -3); // Remove the <<<>>> markers
                return (
                    <span
                        key={index}
                        className="text-lg font-bold text-gray-900 dark:text-gray-100 block mt-3 mb-2"
                    >
                        {titleText}
                    </span>
                );
            }
            // Check if this part is a markdown header (### Title)
            if (part.startsWith("###")) {
                const titleText = part.replace(/^###\s+/, ""); // Remove the ### and leading space
                return (
                    <span
                        key={index}
                        className="text-lg font-bold text-gray-900 dark:text-gray-100 block mt-3 mb-2"
                    >
                        {titleText}
                    </span>
                );
            }
            // Check if this part is a source name (wrapped in **)
            if (part.startsWith("**") && part.endsWith("**")) {
                const sourceName = part.slice(2, -2); // Remove the ** markers
                return (
                    <span
                        key={index}
                        className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"
                    >
                        {sourceName}
                    </span>
                );
            }
            // Regular text
            return <span key={index}>{part}</span>;
        });
    };

    // Show loading state while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <div className="text-center mb-6">
                            <Cloud className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Connect to Google Cloud
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Sign in with your Google Cloud account to access
                                NotebookLM and start chatting with Gemini.
                            </p>
                        </div>
                        <Button
                            onClick={handleLogin}
                            className="w-full"
                            size="lg"
                        >
                            <Cloud className="h-5 w-5 mr-2" />
                            Sign in with Google Cloud
                        </Button>
                        {successMessage && (
                            <div
                                className={`mt-4 p-3 border rounded-md ${
                                    successMessage.includes("error") ||
                                    successMessage.includes("Error")
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                }`}
                            >
                                <p
                                    className={`text-sm ${
                                        successMessage.includes("error") ||
                                        successMessage.includes("Error")
                                            ? "text-red-700 dark:text-red-300"
                                            : "text-green-700 dark:text-green-300"
                                    }`}
                                >
                                    {successMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show "Connect to NotebookLM" screen if authenticated but notebooks not loaded
    if (isAuthenticated && !notebooksLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <div className="text-center mb-6">
                            <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Connect to NotebookLM
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This application integrates Google Gemini AI
                                with NotebookLM Enterprise API, allowing you to
                                chat with Gemini using your NotebookLM
                                notebooks.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Connect to load your notebooks and start
                                chatting!
                            </p>
                        </div>
                        <Button
                            onClick={loadNotebooks}
                            className="w-full"
                            size="lg"
                            disabled={isLoadingNotebooks}
                        >
                            <BookOpen className="h-5 w-5 mr-2" />
                            {isLoadingNotebooks
                                ? "Connecting..."
                                : "Connect to NotebookLM"}
                        </Button>
                        {successMessage && (
                            <div
                                className={`mt-4 p-3 border rounded-md ${
                                    successMessage.includes("error") ||
                                    successMessage.includes("Error")
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                }`}
                            >
                                <p
                                    className={`text-sm ${
                                        successMessage.includes("error") ||
                                        successMessage.includes("Error")
                                            ? "text-red-700 dark:text-red-300"
                                            : "text-green-700 dark:text-green-300"
                                    }`}
                                >
                                    {successMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Gemini Chat with NotebookLM
                    </h1>
                    <div className="flex items-center gap-2">
                        {userEmail && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                {userEmail}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Selected Notebooks Section */}
            {notebooksLoaded && (
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                    <div className="max-w-4xl mx-auto">
                        {selectedNotebooks.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Selected Notebooks:
                                        </span>

                                        {(() => {
                                            const totalSources =
                                                selectedNotebooks.reduce(
                                                    (total, notebook) => {
                                                        const sources =
                                                            notebookSources[
                                                                notebook
                                                                    .notebookId
                                                            ] || [];
                                                        return (
                                                            total +
                                                            sources.length
                                                        );
                                                    },
                                                    0
                                                );
                                            return (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {selectedNotebooks.length}{" "}
                                                    notebook
                                                    {selectedNotebooks.length !==
                                                        1 && "s"}
                                                    {" • "}
                                                    {totalSources} source
                                                    {totalSources !== 1 && "s"}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setShowNotebookSelectionModal(
                                                    true
                                                );
                                                setIsInitialNotebookLoad(false);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Select Notebooks
                                        </Button>
                                        <button
                                            onClick={() =>
                                                setIsSelectedNotebooksSectionMinimized(
                                                    (prev) => !prev
                                                )
                                            }
                                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                            title={
                                                isSelectedNotebooksSectionMinimized
                                                    ? "Expand"
                                                    : "Minimize"
                                            }
                                        >
                                            {isSelectedNotebooksSectionMinimized ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronUp className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {!isSelectedNotebooksSectionMinimized && (
                                    <div className="space-y-3">
                                        {selectedNotebooks.map((notebook) => {
                                            const sources =
                                                notebookSources[
                                                    notebook.notebookId
                                                ] || [];
                                            const isLoading =
                                                loadingSources[
                                                    notebook.notebookId
                                                ];
                                            const isSourcesExpanded =
                                                expandedNotebookSources[
                                                    notebook.notebookId
                                                ] || false;
                                            return (
                                                <div
                                                    key={notebook.notebookId}
                                                    className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">
                                                                {notebook.title}
                                                            </span>
                                                            {isLoading && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Loading
                                                                    sources...
                                                                </span>
                                                            )}
                                                            {!isLoading &&
                                                                !isSourcesExpanded &&
                                                                sources.length >
                                                                    0 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        (
                                                                        {
                                                                            sources.length
                                                                        }{" "}
                                                                        source
                                                                        {sources.length !==
                                                                            1 &&
                                                                            "s"}
                                                                        )
                                                                    </span>
                                                                )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {!isLoading &&
                                                                sources.length >
                                                                    0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setExpandedNotebookSources(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [notebook.notebookId]:
                                                                                        !isSourcesExpanded,
                                                                                })
                                                                            );
                                                                        }}
                                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                                                        title={
                                                                            isSourcesExpanded
                                                                                ? "Hide sources"
                                                                                : "Show sources"
                                                                        }
                                                                    >
                                                                        {isSourcesExpanded ? (
                                                                            <ChevronUp className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedNotebooks(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.filter(
                                                                                (
                                                                                    n
                                                                                ) =>
                                                                                    n.notebookId !==
                                                                                    notebook.notebookId
                                                                            )
                                                                    );
                                                                    // Remove sources when deselecting
                                                                    setNotebookSources(
                                                                        (
                                                                            prevSources
                                                                        ) => {
                                                                            const newSources =
                                                                                {
                                                                                    ...prevSources,
                                                                                };
                                                                            delete newSources[
                                                                                notebook
                                                                                    .notebookId
                                                                            ];
                                                                            return newSources;
                                                                        }
                                                                    );
                                                                    // Remove expanded state
                                                                    setExpandedNotebookSources(
                                                                        (
                                                                            prev
                                                                        ) => {
                                                                            const newExpanded =
                                                                                {
                                                                                    ...prev,
                                                                                };
                                                                            delete newExpanded[
                                                                                notebook
                                                                                    .notebookId
                                                                            ];
                                                                            return newExpanded;
                                                                        }
                                                                    );
                                                                }}
                                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                                                title="Remove notebook"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {!isLoading &&
                                                        sources.length ===
                                                            0 && (
                                                            <div className="ml-6 mt-2 flex items-center gap-2">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    No sources
                                                                    found
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-xs px-2"
                                                                    onClick={() => {
                                                                        setNotebookForSource(
                                                                            notebook
                                                                        );
                                                                        setShowAddSourceDialog(
                                                                            true
                                                                        );
                                                                        setNewSourceUrl(
                                                                            ""
                                                                        );
                                                                    }}
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Add Source
                                                                </Button>
                                                            </div>
                                                        )}
                                                    {isSourcesExpanded && (
                                                        <div className="ml-6 mt-2">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Sources (
                                                                    {
                                                                        sources.length
                                                                    }
                                                                    ):
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-xs px-2"
                                                                    onClick={() => {
                                                                        setNotebookForSource(
                                                                            notebook
                                                                        );
                                                                        setShowAddSourceDialog(
                                                                            true
                                                                        );
                                                                        setNewSourceUrl(
                                                                            ""
                                                                        );
                                                                    }}
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Add Source
                                                                </Button>
                                                            </div>
                                                            {sources.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {sources.map(
                                                                        (
                                                                            source
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    source
                                                                                        .sourceId
                                                                                        .id
                                                                                }
                                                                                className="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 rounded border border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-300"
                                                                            >
                                                                                {
                                                                                    source.title
                                                                                }
                                                                                {source
                                                                                    .metadata
                                                                                    ?.wordCount && (
                                                                                    <span className="text-gray-500 dark:text-gray-500 ml-1">
                                                                                        (
                                                                                        {
                                                                                            source
                                                                                                .metadata
                                                                                                .wordCount
                                                                                        }{" "}
                                                                                        words)
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                    <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        No notebook selected
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowNotebookSelectionModal(true);
                                        setIsInitialNotebookLoad(false);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Select Notebooks
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Message Card */}
            {successMessage && (
                <div className="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex justify-between items-center max-w-4xl mx-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {successMessage}
                            </p>
                        </div>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                            aria-label="Close notification"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Create Notebook Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Create New Notebook
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setNewNotebookTitle("");
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notebook Title
                                </label>
                                <Input
                                    value={newNotebookTitle}
                                    onChange={(e) =>
                                        setNewNotebookTitle(e.target.value)
                                    }
                                    placeholder="Enter notebook title..."
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handleCreateNotebook();
                                        }
                                    }}
                                    disabled={isCreatingNotebook}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateDialog(false);
                                        setNewNotebookTitle("");
                                    }}
                                    disabled={isCreatingNotebook}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateNotebook}
                                    disabled={
                                        isCreatingNotebook ||
                                        !newNotebookTitle.trim()
                                    }
                                >
                                    {isCreatingNotebook
                                        ? "Creating..."
                                        : "Create"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Notebook Confirmation Dialog */}
            {showDeleteDialog && notebookToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                                Delete Notebook
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setNotebookToDelete(null);
                                    setDeleteConfirmationName("");
                                }}
                                disabled={isDeletingNotebook}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                This action cannot be undone. This will
                                permanently delete the notebook{" "}
                                <span className="font-semibold">
                                    "{notebookToDelete.title}"
                                </span>
                                .
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type the notebook name to confirm deletion:
                                </label>
                                <Input
                                    value={deleteConfirmationName}
                                    onChange={(e) =>
                                        setDeleteConfirmationName(
                                            e.target.value
                                        )
                                    }
                                    placeholder={notebookToDelete.title}
                                    disabled={isDeletingNotebook}
                                    autoFocus
                                    className={
                                        deleteConfirmationName &&
                                        deleteConfirmationName !==
                                            notebookToDelete.title
                                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                            : ""
                                    }
                                />
                                {deleteConfirmationName &&
                                    deleteConfirmationName !==
                                        notebookToDelete.title && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            The name does not match
                                        </p>
                                    )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteDialog(false);
                                        setNotebookToDelete(null);
                                        setDeleteConfirmationName("");
                                    }}
                                    disabled={isDeletingNotebook}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteNotebook}
                                    disabled={
                                        isDeletingNotebook ||
                                        deleteConfirmationName !==
                                            notebookToDelete.title
                                    }
                                >
                                    {isDeletingNotebook
                                        ? "Deleting..."
                                        : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Source Dialog */}
            {showAddSourceDialog && notebookForSource && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50"
                    onClick={() => {
                        if (!isAddingSource) {
                            setShowAddSourceDialog(false);
                            setNewSourceUrl("");
                            setNotebookForSource(null);
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Add Source
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowAddSourceDialog(false);
                                    setNewSourceUrl("");
                                    setNotebookForSource(null);
                                }}
                                disabled={isAddingSource}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notebook: {notebookForSource.title}
                                </label>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setAddSourceTab("url");
                                        setSelectedFile(null);
                                    }}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        addSourceTab === "url"
                                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    From URL
                                </button>
                                <button
                                    onClick={() => {
                                        setAddSourceTab("upload");
                                        setNewSourceUrl("");
                                    }}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        addSourceTab === "upload"
                                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    Upload File
                                </button>
                            </div>

                            {/* URL Tab */}
                            {addSourceTab === "url" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Source URL
                                    </label>
                                    <Input
                                        value={newSourceUrl}
                                        onChange={(e) =>
                                            setNewSourceUrl(e.target.value)
                                        }
                                        placeholder="YouTube URL or Google Drive (Docs/Slides) URL"
                                        disabled={isAddingSource}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                handleAddSource();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Enter a YouTube video URL or Google
                                        Drive (Docs/Slides) URL to add as a
                                        source
                                    </p>
                                </div>
                            )}

                            {/* Upload Tab */}
                            {addSourceTab === "upload" && (
                                <div>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                            dragActive
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={handleFileInput}
                                            disabled={isAddingSource}
                                            accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.3g2,.3gp,.aac,.aif,.aifc,.aiff,.amr,.au,.avi,.cda,.m4a,.mid,.midi,.mp3,.mp4,.mpeg,.ogg,.opus,.ra,.ram,.snd,.wav,.weba,.wma,.png,.jpg,.jpeg"
                                        />
                                        {selectedFile ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(
                                                        selectedFile.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedFile(null)
                                                    }
                                                    disabled={isAddingSource}
                                                >
                                                    Change File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Drag and drop a file here,
                                                    or
                                                </p>
                                                <label
                                                    htmlFor="file-upload"
                                                    className="cursor-pointer"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        type="button"
                                                        disabled={
                                                            isAddingSource
                                                        }
                                                        onClick={() => {
                                                            document
                                                                .getElementById(
                                                                    "file-upload"
                                                                )
                                                                ?.click();
                                                        }}
                                                    >
                                                        Browse Files
                                                    </Button>
                                                </label>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    Supported: PDF, TXT, MD,
                                                    DOCX, PPTX, XLSX, Audio,
                                                    Images
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddSourceDialog(false);
                                        setNewSourceUrl("");
                                        setSelectedFile(null);
                                        setNotebookForSource(null);
                                        setAddSourceTab("url");
                                    }}
                                    disabled={isAddingSource}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={
                                        addSourceTab === "url"
                                            ? handleAddSource
                                            : handleFileUpload
                                    }
                                    disabled={
                                        isAddingSource ||
                                        (addSourceTab === "url"
                                            ? !newSourceUrl.trim()
                                            : !selectedFile)
                                    }
                                >
                                    {isAddingSource
                                        ? "Adding..."
                                        : "Add Source"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notebook Selection Modal */}
            {showNotebookSelectionModal && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50"
                    onClick={() => {
                        // Only allow closing if at least one notebook is selected or not initial load
                        if (
                            !isInitialNotebookLoad ||
                            selectedNotebooks.length > 0
                        ) {
                            setShowNotebookSelectionModal(false);
                            setIsInitialNotebookLoad(false);
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Select Notebooks
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadNotebooks}
                                    disabled={isLoadingNotebooks}
                                    title="Refresh notebooks"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 mr-1 ${
                                            isLoadingNotebooks
                                                ? "animate-spin"
                                                : ""
                                        }`}
                                    />
                                    Refresh
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        // Only allow closing if at least one notebook is selected
                                        if (selectedNotebooks.length > 0) {
                                            setShowNotebookSelectionModal(
                                                false
                                            );
                                            setIsInitialNotebookLoad(false);
                                        }
                                    }}
                                    disabled={
                                        isInitialNotebookLoad &&
                                        selectedNotebooks.length === 0
                                    }
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {isInitialNotebookLoad && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Get started by selecting some of your
                                    notebooks!
                                </p>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {notebooks.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">
                                    No notebooks found.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {notebooks.map((notebook) => {
                                        const isSelected =
                                            selectedNotebooks.some(
                                                (n) =>
                                                    n.notebookId ===
                                                    notebook.notebookId
                                            );
                                        return (
                                            <div
                                                key={notebook.notebookId}
                                                className={`group relative p-3 rounded-lg border transition-colors ${
                                                    isSelected
                                                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setSelectedNotebooks(
                                                            (prev) => {
                                                                const isSelected =
                                                                    prev.some(
                                                                        (n) =>
                                                                            n.notebookId ===
                                                                            notebook.notebookId
                                                                    );
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    // Remove sources when deselecting
                                                                    setNotebookSources(
                                                                        (
                                                                            prevSources
                                                                        ) => {
                                                                            const newSources =
                                                                                {
                                                                                    ...prevSources,
                                                                                };
                                                                            delete newSources[
                                                                                notebook
                                                                                    .notebookId
                                                                            ];
                                                                            return newSources;
                                                                        }
                                                                    );
                                                                    return prev.filter(
                                                                        (n) =>
                                                                            n.notebookId !==
                                                                            notebook.notebookId
                                                                    );
                                                                } else {
                                                                    // Ensure sources are minimized by default when selecting
                                                                    setExpandedNotebookSources(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [notebook.notebookId]:
                                                                                false,
                                                                        })
                                                                    );
                                                                    // Load sources when selecting
                                                                    loadSourcesForNotebook(
                                                                        notebook.notebookId
                                                                    );
                                                                    return [
                                                                        ...prev,
                                                                        notebook,
                                                                    ];
                                                                }
                                                            }
                                                        );
                                                    }}
                                                    className="text-left w-full pr-10"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                                isSelected
                                                                    ? "border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400"
                                                                    : "border-gray-300 dark:border-gray-600"
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <svg
                                                                    className="w-3 h-3 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-2xl flex-shrink-0">
                                                            {notebook.emoji ||
                                                                "📓"}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p
                                                                className={`text-xs font-medium truncate ${
                                                                    isSelected
                                                                        ? "text-blue-900 dark:text-blue-100"
                                                                        : "text-gray-900 dark:text-gray-100"
                                                                }`}
                                                            >
                                                                {notebook.title}
                                                            </p>
                                                            {notebook.metadata
                                                                .lastViewed && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Last viewed:{" "}
                                                                    {new Date(
                                                                        notebook.metadata.lastViewed
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNotebookToDelete(
                                                            notebook
                                                        );
                                                        setShowDeleteDialog(
                                                            true
                                                        );
                                                        setDeleteConfirmationName(
                                                            ""
                                                        );
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete notebook"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {isInitialNotebookLoad && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={() => {
                                        if (selectedNotebooks.length > 0) {
                                            setShowNotebookSelectionModal(
                                                false
                                            );
                                            setIsInitialNotebookLoad(false);
                                        }
                                    }}
                                    disabled={selectedNotebooks.length === 0}
                                >
                                    Continue
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat History Section */}
            {selectedNotebooks.length > 0 && (
                <>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-4xl mx-auto space-y-4 h-full">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full min-h-[400px]">
                                    <div className="text-center">
                                        <div className="text-gray-500 dark:text-gray-400">
                                            <p className="mb-3">
                                                Chatting with context from:
                                            </p>
                                            <div className="space-y-1">
                                                {selectedNotebooks.map(
                                                    (notebook) => (
                                                        <p
                                                            key={
                                                                notebook.notebookId
                                                            }
                                                            className="text-gray-600 dark:text-gray-300"
                                                        >
                                                            {notebook.title}
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.role === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                message.role === "user"
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                            }`}
                                        >
                                            <div className="text-sm whitespace-pre-wrap">
                                                {formatMessageContent(
                                                    message.content
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin w-5 h-5 flex-shrink-0">
                                                <svg
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 16 16"
                                                    className="w-full h-full"
                                                >
                                                    <path
                                                        d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
                                                        fill="url(#prefix__paint0_radial_980_20147)"
                                                    />
                                                    <defs>
                                                        <radialGradient
                                                            id="prefix__paint0_radial_980_20147"
                                                            cx="0"
                                                            cy="0"
                                                            r="1"
                                                            gradientUnits="userSpaceOnUse"
                                                            gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"
                                                        >
                                                            <stop
                                                                offset=".067"
                                                                stopColor="#9168C0"
                                                            />
                                                            <stop
                                                                offset=".343"
                                                                stopColor="#5684D1"
                                                            />
                                                            <stop
                                                                offset=".672"
                                                                stopColor="#1BA1E3"
                                                            />
                                                        </radialGradient>
                                                    </defs>
                                                </svg>
                                            </div>
                                            <p
                                                className="font-medium"
                                                style={{
                                                    background:
                                                        "linear-gradient(90deg, #9168C0, #5684D1, #1BA1E3)",
                                                    backgroundSize: "200% 200%",
                                                    WebkitBackgroundClip:
                                                        "text",
                                                    WebkitTextFillColor:
                                                        "transparent",
                                                    backgroundClip: "text",
                                                    animation:
                                                        "rainbow 3s ease infinite",
                                                }}
                                            >
                                                Thinking about your notebooks
                                                {loadingDots}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex gap-2 max-w-4xl mx-auto">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
