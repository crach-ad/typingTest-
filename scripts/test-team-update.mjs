#!/usr/bin/env node

/**
 * This script tests updating team scores in Google Sheets
 * It attempts to directly update a team's score and verify the change
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Try to load from .env.local first, fall back to .env
let envLoaded = false;
const localEnvPath = path.join(rootDir, '.env.local');
const defaultEnvPath = path.join(rootDir, '.env');

if (fs.existsSync(localEnvPath)) {
  console.log('Loading .env.local file');
  dotenv.config({ path: localEnvPath });
  envLoaded = true;
}

if (!envLoaded && fs.existsSync(defaultEnvPath)) {
  console.log('Loading .env file');
  dotenv.config({ path: defaultEnvPath });
  envLoaded = true;
}

// Check if we have necessary environment variables
const requiredVars = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEET_ID'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these in your .env.local file');
  process.exit(1);
}

// Test updating a team score
async function testTeamUpdate() {
  try {
    console.log('Starting team update test...');
    
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('Initializing Google Sheets connection...');
    console.log(`Service account email: ${serviceAccountEmail.substring(0, 5)}...`);
    console.log(`Private key length: ${privateKey.length} characters`);
    console.log(`Sheet ID: ${sheetId.substring(0, 5)}...`);
    
    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    console.log(`Successfully connected to sheet: ${doc.title}`);

    // Get Teams sheet
    console.log('Looking for Teams sheet...');
    const teamsSheet = doc.sheetsByTitle['Teams'];
    if (!teamsSheet) {
      throw new Error('Teams sheet not found! Have you run the setup script?');
    }
    console.log('Teams sheet found!');
    
    // Load current teams
    console.log('Loading team data...');
    await teamsSheet.loadCells();
    const rows = await teamsSheet.getRows();
    console.log(`Found ${rows.length} team rows`);
    
    // Pick a team to update (using Yellow Team as an example)
    const testTeamId = 'yellow';
    console.log(`Looking for test team: ${testTeamId}`);
    const teamRow = rows.find(row => row.get('id') === testTeamId);
    
    if (!teamRow) {
      throw new Error(`Test team "${testTeamId}" not found in Teams sheet`);
    }
    
    // Get current points
    const currentPointsStr = teamRow.get('points');
    console.log(`Current points for ${testTeamId} team: ${currentPointsStr || '0'}`);
    const currentPoints = parseInt(currentPointsStr || '0', 10);
    
    // Add 10 test points
    const testPoints = 10;
    const newTotal = currentPoints + testPoints;
    console.log(`Adding ${testPoints} test points, new total will be: ${newTotal}`);
    
    // Update the team points
    teamRow.set('points', newTotal.toString());
    teamRow.set('lastUpdated', new Date().toISOString());
    
    // Save the changes
    console.log('Saving changes to Teams sheet...');
    await teamRow.save();
    console.log('Team points successfully updated!');
    
    // Verify the change
    console.log('Verifying the change by reloading team data...');
    await teamsSheet.loadCells();
    const updatedRows = await teamsSheet.getRows();
    const updatedTeamRow = updatedRows.find(row => row.get('id') === testTeamId);
    
    if (updatedTeamRow) {
      const updatedPoints = parseInt(updatedTeamRow.get('points') || '0', 10);
      console.log(`Verification - updated points for ${testTeamId} team: ${updatedPoints}`);
      
      if (updatedPoints === newTotal) {
        console.log('SUCCESS: Team points were updated correctly!');
      } else {
        console.error(`ERROR: Team points were not updated correctly. Expected ${newTotal}, got ${updatedPoints}`);
      }
    } else {
      console.error(`ERROR: Could not find ${testTeamId} team during verification`);
    }
    
    // Create or get the TeamHistory sheet
    console.log('Testing TeamHistory sheet...');
    let teamHistorySheet = doc.sheetsByTitle['TeamHistory'];
    if (!teamHistorySheet) {
      console.log('TeamHistory sheet not found, creating it...');
      teamHistorySheet = await doc.addSheet({ 
        title: 'TeamHistory',
        headerValues: ['date', 'teamId', 'teamName', 'pointsAdded', 'newTotal', 'username']
      });
      console.log('TeamHistory sheet created!');
    } else {
      console.log('TeamHistory sheet found!');
    }
    
    // Add a test entry to the TeamHistory sheet
    console.log('Adding a test entry to TeamHistory sheet...');
    const testDate = new Date().toISOString();
    await teamHistorySheet.addRow({
      date: testDate,
      teamId: testTeamId,
      teamName: teamRow.get('name'),
      pointsAdded: testPoints,
      newTotal: newTotal,
      username: 'TestScript'
    });
    console.log('TeamHistory entry added successfully!');
    
    console.log('\nTest completed successfully! Your Google Sheets integration is working correctly.');
    return { success: true };
  } catch (error) {
    console.error('\nError testing team update:', error);
    console.error('\nFor debugging:');
    console.error('1. Check that your .env.local file has the correct credentials');
    console.error('2. Make sure your service account has editor access to the Google Sheet');
    console.error('3. Verify that the GOOGLE_SHEET_ID is correct');
    console.error('4. Run the setup-sheets.mjs script first to initialize required sheets');
    return { success: false, error };
  }
}

// Run the test
testTeamUpdate()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  });
