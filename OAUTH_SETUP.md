# OAuth Setup Instructions

## Complete OAuth Setup Guide

This guide covers all the steps needed to set up Google OAuth for your application.

## Step 1: Configure OAuth Consent Screen

**This is required before you can use OAuth!**

1. **Go to Google Cloud Console**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project

2. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" (unless you have a Google Workspace)
   - Click "CREATE"

3. **Fill in App Information**
   - **App name:** `Gemini NotebookLM Chat` (or your preferred name)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click "SAVE AND CONTINUE"

4. **Add Scopes**
   - Click "ADD OR REMOVE SCOPES"
   - Search for and add: `https://www.googleapis.com/auth/cloud-platform`
   - Click "UPDATE" then "SAVE AND CONTINUE"

5. **Add Test Users** (IMPORTANT for testing)
   - Under "Test users", click "ADD USERS"
   - Add your Google account email (e.g., `joseph.ngo72@gmail.com`)
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

6. **Review and Continue**
   - Review the summary
   - Click "BACK TO DASHBOARD"

## Step 2: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "CREATE CREDENTIALS" > "OAuth client ID"

2. **Configure OAuth Client**
   - **Application type:** Web application
   - **Name:** `NotebookLM Web Client` (or your preferred name)
   - **Authorized redirect URIs:**
     - Click "ADD URI"
     - Add: `http://localhost:3000/api/auth/callback`
     - For production, also add: `https://yourdomain.com/api/auth/callback`
   - Click "CREATE"

3. **Copy Credentials**
   - Copy the **Client ID** and **Client secret**
   - You'll need these for your `.env.local` file

## Step 3: Configure Environment Variables

Create or update your `.env.local` file:

```env
GOOGLE_CLOUD_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLOUD_CLIENT_SECRET=your-client-secret
GOOGLE_CLOUD_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER=your-project-number
GEMINI_API_KEY=your-gemini-api-key
```

**Important:** 
- The `GOOGLE_CLOUD_REDIRECT_URI` must match exactly what you registered
- No trailing slashes
- Use `http://` for localhost (not `https://`)

## Common Errors and Solutions

### Error 400: redirect_uri_mismatch

**Problem:** The redirect URI doesn't match what's registered.

**Solution:**
- Make sure `http://localhost:3000/api/auth/callback` is added to "Authorized redirect URIs" in your OAuth client
- Check for trailing slashes or typos
- Restart your dev server after making changes

### Error 403: access_denied - "has not completed the Google verification process"

**Problem:** The app is in testing mode and your email isn't added as a test user.

**Solution:**
1. Go to "APIs & Services" > "OAuth consent screen"
2. Scroll down to "Test users"
3. Click "ADD USERS"
4. Add your Google account email address
5. Click "ADD"
6. Try signing in again

**Alternative:** If you want to publish the app (not recommended for personal projects):
- Complete the verification process (requires app review for sensitive scopes)
- Or keep it in testing mode and add all users who need access as test users

### App Verification Status

- **Testing:** Only test users can sign in (recommended for development)
- **In production:** Anyone can sign in (requires verification for sensitive scopes)

## Testing

After completing all steps:

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click "Sign in with Google Cloud"

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to the app

## Production Deployment

When deploying to production:

1. Add your production URL to "Authorized redirect URIs":
   - Example: `https://yourdomain.com/api/auth/callback`

2. Update `.env.local` (or your production environment variables):
   ```env
   GOOGLE_CLOUD_REDIRECT_URI=https://yourdomain.com/api/auth/callback
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. Make sure your production domain is verified in Google Cloud Console

