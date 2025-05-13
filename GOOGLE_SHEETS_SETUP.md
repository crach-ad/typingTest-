# Google Sheets Integration Setup

This document explains how to set up the Google Sheets integration for the Typing Speed Challenge app, allowing hundreds of players to contribute to team scores each week.

## Overview

The app uses Google Sheets as a backend database to store:
1. Team information and scores
2. Player typing results
3. Game history

## Prerequisites

- A Google account
- A Google Cloud Platform project with the Google Sheets API enabled
- A service account with appropriate permissions

## Step-by-Step Setup

### 1. Create a Google Cloud Platform Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click "NEW PROJECT"
4. Name your project (e.g., "Typing Game") and click "CREATE"
5. Select your new project from the project selector

### 2. Enable the Google Sheets API

1. Go to the [API Library](https://console.cloud.google.com/apis/library) in your GCP project
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "ENABLE"

### 3. Create a Service Account

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "CREATE CREDENTIALS" and select "Service account"
3. Enter a service account name (e.g., "typing-game-service")
4. Click "CREATE AND CONTINUE"
5. For the role, select "Project" > "Editor" (or a more specific role like "Cloud Datastore User")
6. Click "CONTINUE" and then "DONE"

### 4. Create a Key for the Service Account

1. In the Credentials page, click on your new service account
2. Go to the "KEYS" tab
3. Click "ADD KEY" > "Create new key"
4. Choose "JSON" and click "CREATE"
5. The key file will be downloaded to your computer
6. Keep this file secure and **do not commit it to version control**

### 5. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Rename it to something like "Typing Game Database"
4. Note the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - The ID is the long string between `/d/` and `/edit`

### 6. Share the Sheet with the Service Account

1. Click the "Share" button in your Google Sheet
2. Add the service account email (it's in the key file you downloaded, or visible in the GCP console)
3. Give it "Editor" permissions
4. Uncheck "Notify people" and click "Share"

### 7. Configure Your Environment Variables

1. Create or update your `.env.local` file in the project root with:

```
# Google Sheets API credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="your-spreadsheet-id"
```

The private key should include the entire key from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts. Make sure to replace newlines with `\n`.

### 8. Run the Setup Script

Initialize your Google Sheet with the required structure:

```bash
node scripts/setup-sheets.mjs
```

This script will:
1. Create a "Teams" sheet with columns for id, name, color, and points
2. Create a "Results" sheet for storing game results
3. Populate the Teams sheet with the default teams (Yellow, Blue, Green)

## Verifying the Setup

After setting everything up:

1. Start the application: `pnpm dev`
2. Play a typing test game
3. Submit your results
4. Check your Google Sheet to verify the data has been saved

## Troubleshooting

### Common Issues:

1. **Permission Denied Errors**:
   - Ensure you've shared the Google Sheet with your service account
   - Check that the service account has Editor permissions

2. **Invalid Credentials**:
   - Verify your `.env.local` contains the correct values
   - Ensure the private key is properly formatted with `\n` for line breaks

3. **API Not Enabled**:
   - Make sure you've enabled the Google Sheets API in your GCP project
   - The service account should have appropriate permissions

4. **Sheet Not Found**:
   - Check that the sheet ID in your `.env.local` is correct
   - Try running the setup script again

For more detailed help, check the [google-spreadsheet package documentation](https://www.npmjs.com/package/google-spreadsheet).
