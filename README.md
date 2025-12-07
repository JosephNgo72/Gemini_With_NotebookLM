# Gemini NotebookLM Chat Application

A full-stack Next.js application that integrates Google's NotebookLM API with Gemini AI to create an intelligent chat interface for managing and querying NotebookLM notebooks. This application allows users to authenticate with Google Cloud, manage their NotebookLM notebooks, add sources (YouTube videos, Google Drive documents, or file uploads), and have contextual conversations with an AI assistant powered by Gemini 2.5 Flash.

## 🎥 Demo Video

Watch a live demonstration of the application in action:

[![Demo Video](https://img.youtube.com/vi/XoDDa44GfhE/maxresdefault.jpg)](https://www.youtube.com/watch?v=XoDDa44GfhE)

[Watch on YouTube](https://www.youtube.com/watch?v=XoDDa44GfhE)

## 🎯 Project Overview

This project demonstrates a production-ready integration between Google's NotebookLM (Discovery Engine) API and Google's Gemini AI. It provides a modern web interface for users to:

- **Authenticate** securely with Google Cloud using OAuth 2.0
- **Manage NotebookLM Notebooks** - create, list, view, and delete notebooks
- **Add Sources** to notebooks from multiple sources:
  - YouTube video URLs
  - Google Drive documents (Docs, Slides)
  - File uploads (PDFs, text files, etc.)
- **Chat with AI** using Gemini 2.5 Flash, with full context awareness of selected notebook sources
- **Multi-Notebook Support** - select and query across multiple notebooks simultaneously

The application showcases modern web development practices, secure authentication flows, API integration patterns, and AI-powered user experiences.

## ✨ Key Features

### Authentication & Security
- **OAuth 2.0 Integration** with Google Cloud Platform
- Secure token management using httpOnly cookies
- Automatic token refresh handling
- User session management with email display

### Notebook Management
- **List Notebooks** - View all recently accessed NotebookLM notebooks
- **Create Notebooks** - Create new notebooks with custom titles
- **Delete Notebooks** - Remove notebooks with confirmation dialogs
- **Notebook Selection** - Select multiple notebooks for context-aware chat
- **Source Visualization** - View all sources within each notebook

### Source Management
- **YouTube Integration** - Add YouTube videos as sources via URL
- **Google Drive Integration** - Link Google Docs and Slides as sources
- **File Upload** - Upload files directly to notebooks (drag & drop support)
- **Source Metadata** - View word counts, token counts, and source status
- **Batch Source Creation** - Add multiple sources efficiently

### AI Chat Interface
- **Gemini 2.5 Flash Integration** - Powered by Google's latest AI model
- **Context-Aware Responses** - AI has full knowledge of selected notebook sources
- **Multi-Notebook Context** - Chat across multiple notebooks simultaneously
- **Conversation History** - Maintains chat context across messages
- **Source-Aware Formatting** - AI responses highlight source references
- **Real-time Streaming** - Smooth chat experience with loading indicators

### User Experience
- **Modern UI** - Built with Tailwind CSS and Radix UI components
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Loading States** - Clear feedback during async operations
- **Error Handling** - Comprehensive error messages and recovery
- **Modal Dialogs** - Intuitive interfaces for notebook and source management
- **Collapsible Sections** - Organized UI with expandable/collapsible panels

## 🛠️ Technologies Used

### Frontend
- **Next.js 16.0.7** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Google Auth Library** - OAuth 2.0 and authentication
- **Google Generative AI SDK** - Gemini API integration

### APIs & Services
- **Google NotebookLM Discovery Engine API** - Notebook and source management
- **Google Gemini API** - AI chat functionality
- **Google OAuth 2.0** - User authentication

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before setting up this project, ensure you have:

1. **Node.js** (v18 or higher) and npm installed
2. **Google Cloud Platform Account** with:
   - A GCP project created
   - NotebookLM API enabled
   - OAuth 2.0 credentials configured
   - Gemini API enabled
3. **Google Cloud Project Number** (not project ID)
4. **API Keys**:
   - Gemini API key
   - OAuth 2.0 Client ID and Client Secret

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gemini_notebookLM_v1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google Cloud Platform

#### Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Enable the following APIs:
   - **Discovery Engine API** (for NotebookLM)
   - **Generative Language API** (for Gemini)
   - **Google Drive API** (for Drive document access)

#### Set Up OAuth 2.0

Follow the detailed instructions in [`OAUTH_SETUP.md`](./OAUTH_SETUP.md) for complete OAuth configuration. Here's a quick summary:

1. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" (unless you have Google Workspace)
   - Add app information and required scopes:
     - `https://www.googleapis.com/auth/cloud-platform`
     - `https://www.googleapis.com/auth/drive.readonly`
   - Add test users (your email address)

2. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: Web application
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback`

3. **Get Your Project Number**:
   - In Google Cloud Console, go to your project settings
   - Copy the **Project Number** (not the Project ID)

#### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Save it for the environment variables

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Cloud OAuth Configuration
GOOGLE_CLOUD_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLOUD_CLIENT_SECRET=your-client-secret
GOOGLE_CLOUD_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Google Cloud Project Configuration
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER=your-project-number

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key
```

**Important Notes:**
- The `GOOGLE_CLOUD_REDIRECT_URI` must match exactly what you registered in OAuth credentials
- No trailing slashes in URLs
- Use `http://` for localhost (not `https://`)
- The project number is different from the project ID

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Authenticate

1. Click "Sign in with Google Cloud"
2. Complete the OAuth flow
3. Ensure your email is added as a test user in the OAuth consent screen

## 📁 Project Structure

```
gemini_notebookLM_v1/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/        # OAuth callback handler
│   │   │   ├── login/           # OAuth login initiation
│   │   │   ├── logout/          # Logout handler
│   │   │   ├── refresh/         # Token refresh
│   │   │   └── status/          # Auth status check
│   │   ├── chat/                # Gemini chat API endpoint
│   │   └── notebooks/
│   │       ├── route.ts         # List and create notebooks
│   │       └── [notebookId]/
│   │           ├── route.ts     # Get and delete notebook
│   │           └── sources/
│   │               ├── route.ts # List and add sources
│   │               └── upload/  # File upload endpoint
│   ├── lib/
│   │   ├── gemini.ts            # Gemini API integration
│   │   └── notebooklm.ts        # NotebookLM API client
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main application page
│   └── globals.css              # Global styles
├── components/
│   └── ui/                      # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
├── OAUTH_SETUP.md              # Detailed OAuth setup guide
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate OAuth login
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status

### Notebooks
- `GET /api/notebooks?projectNumber={number}&location={location}&endpointLocation={location}` - List notebooks
- `POST /api/notebooks` - Create a new notebook
- `GET /api/notebooks/[notebookId]` - Get notebook details
- `DELETE /api/notebooks/[notebookId]` - Delete a notebook

### Sources
- `GET /api/notebooks/[notebookId]/sources` - List sources in a notebook
- `POST /api/notebooks/[notebookId]/sources` - Add source (YouTube or Google Drive)
- `POST /api/notebooks/[notebookId]/sources/upload` - Upload file as source

### Chat
- `POST /api/chat` - Send message to Gemini with notebook context

## 🎨 Key Implementation Details

### Authentication Flow
- OAuth 2.0 with PKCE-like state verification
- Access tokens stored in httpOnly cookies for security
- Automatic token refresh handling
- Support for multiple authentication methods (OAuth, service account, ADC)

### NotebookLM Integration
- Full CRUD operations for notebooks
- Support for multiple source types (YouTube, Google Drive, file uploads)
- Regional endpoint support (us, eu, global)
- Comprehensive error handling and logging

### Gemini AI Integration
- Context-aware prompts with notebook source information
- Conversation history management (last 10 messages)
- Custom system instructions for NotebookLM-specific behavior
- Source-aware response formatting

### State Management
- React hooks for local state
- Cookie-based authentication state
- Optimistic UI updates
- Error boundary handling

## 🚢 Production Deployment

When deploying to production:

1. **Update OAuth Redirect URI**:
   - Add your production URL to OAuth credentials
   - Update `GOOGLE_CLOUD_REDIRECT_URI` in environment variables

2. **Environment Variables**:
   - Set all environment variables in your hosting platform
   - Use secure, production-ready values
   - Enable HTTPS for secure cookie transmission

3. **Build the Application**:
   ```bash
   npm run build
   npm start
   ```

4. **OAuth Consent Screen**:
   - Consider publishing your app (requires verification for sensitive scopes)
   - Or keep in testing mode and add all users as test users

## 🐛 Troubleshooting

### Common Issues

**OAuth redirect_uri_mismatch**
- Ensure the redirect URI in `.env.local` matches exactly what's in Google Cloud Console
- Check for trailing slashes or typos
- Restart the dev server after changes

**Access Denied / Not a Test User**
- Add your email as a test user in OAuth consent screen
- See `OAUTH_SETUP.md` for detailed instructions

**Notebook API Errors**
- Verify your project number (not project ID) is correct
- Ensure Discovery Engine API is enabled
- Check that you're authenticated with the correct Google account

**Gemini API Errors**
- Verify your API key is valid
- Check API quota and billing status
- Ensure Generative Language API is enabled

## 📝 Development Notes

- The application uses Next.js App Router with Server Components and API Routes
- All API routes are server-side only for security
- Authentication tokens are never exposed to the client
- The chat interface maintains conversation context across messages
- Source information is dynamically fetched and included in AI prompts

## 🔒 Security Considerations

- OAuth tokens stored in httpOnly cookies (not accessible to JavaScript)
- Secure flag enabled in production for cookies
- State parameter verification for OAuth flow
- Server-side API key management
- No sensitive data in client-side code

## 📄 License

This project is a demonstration/portfolio piece. Please ensure you comply with Google's API terms of service when using this code.

## 🤝 Contributing

This is a portfolio/demonstration project. For questions or improvements, please open an issue or submit a pull request.

## 📧 Contact

For questions about this implementation, please refer to the code comments or open an issue in the repository.

---

**Built with ❤️ using Next.js, React, TypeScript, and Google Cloud APIs**

