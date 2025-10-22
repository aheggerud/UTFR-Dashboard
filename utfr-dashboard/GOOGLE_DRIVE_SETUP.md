# Google Drive Integration Setup Guide

## Overview
This guide will help you set up Google Drive integration for the UTFR Data Management Dashboard, allowing automatic sync of test day folders and XRK files.

## Prerequisites
- Google account with access to Google Drive
- Google Cloud Console access
- Test day folders organized in the following structure:
  ```
  YYYY-MM-DD - Venue/
  └── data dump/
      ├── run1.xrk
      ├── run2.xrk
      └── run3.xrk
  ```

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## Step 2: Configure OAuth 2.0

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Set application type to "Web application"
5. Add authorized origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/google/callback`

## Step 3: Get API Credentials

1. After creating the OAuth client, you'll get:
   - Client ID
   - Client Secret
2. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Restrict the key to Google Drive API

## Step 4: Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyAmtxF78OFo2sy4epiCDK3GuPfLY_39LJE
NEXT_PUBLIC_GOOGLE_CLIENT_ID=Client ID
766435327880-f6jdhint5eehn9flus8meatoqek0i4ip.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-hhPo9jYSNmP0k_R4xDj-
rrcAEEp8
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Step 5: Folder Structure

Organize your Google Drive with the following structure:

```
UTFR Test Data/
├── 2024-03-15 - Brechin Motorsport Park/
│   └── data dump/
│       ├── shakedown_run1.xrk
│       ├── brake_test_run2.xrk
│       └── autocross_run3.xrk
├── 2024-03-22 - Shannonville Motorsport Park/
│   └── data dump/
│       ├── endurance_run1.xrk
│       └── sprint_run2.xrk
└── 2024-04-05 - Mosport International Raceway/
    └── data dump/
        ├── qualifying_run1.xrk
        └── race_run2.xrk
```

## Step 6: Permissions

The dashboard will request the following permissions:
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access to your Google Drive
- This allows the dashboard to:
  - List folders and files
  - Download XRK files for processing
  - Read file metadata (size, modification date, etc.)

## Step 7: Usage

1. Start the dashboard: `npm run dev`
2. Go to the "DRIVE SYNC" tab
3. Click "CONNECT TO GOOGLE DRIVE"
4. Authorize the application
5. Click "SCAN FOR TEST DAYS" to find your test day folders
6. Click "SYNC XRK FILES" to download and process the data
7. Check the "RUNS" tab to see your imported data

## Troubleshooting

### Common Issues:

1. **"Google Drive API not available"**
   - Ensure you've enabled the Google Drive API in your project
   - Check that your API key is correct

2. **"Authentication failed"**
   - Verify your OAuth client ID is correct
   - Check that your domain is in authorized origins
   - Ensure the redirect URI matches exactly

3. **"No test day folders found"**
   - Verify your folder naming convention: `YYYY-MM-DD - Venue` (e.g., `2025-04-06 - Molson`)
   - Check that you have a "data dump" subfolder
   - Ensure the folders are not in the trash

4. **"Failed to process files"**
   - Check that your XRK files are not corrupted
   - Verify file permissions in Google Drive
   - Check browser console for detailed error messages

### Security Notes:

- Never commit your `.env.local` file to version control
- Use environment-specific API keys for production
- Regularly rotate your API keys
- Monitor API usage in Google Cloud Console

## Advanced Configuration

### Custom Folder Structure
If you use a different folder structure, you can modify the search query in `GoogleDriveSync.tsx`:

```typescript
// Modify this line to match your naming convention
const testDayMatch = folderName.match(/^(\d{4}-\d{2}-\d{2})\s*[-_]\s*(.+)$/);
```

### Batch Processing
For large numbers of files, consider implementing:
- Pagination for folder listings
- Background processing with web workers
- Progress indicators for individual files
- Error handling and retry logic

### Real-time Sync
To enable real-time sync when new files are added:
- Set up Google Drive webhooks
- Implement push notifications
- Use Google Drive API change notifications
