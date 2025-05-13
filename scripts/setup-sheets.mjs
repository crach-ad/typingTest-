#!/usr/bin/env node

/**
 * This script sets up the Google Sheets for the typing game
 * It creates the necessary sheets and headers
 * 
 * Usage:
 * 1. Make sure your .env.local file has the required Google credentials
 * 2. Run: node scripts/setup-sheets.mjs
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
  dotenv.config({ path: localEnvPath });
  envLoaded = true;
}

if (!envLoaded && fs.existsSync(defaultEnvPath)) {
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

// Initialize Google Sheets
async function setupGoogleSheets() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('Initializing Google Sheets connection...');
    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    console.log(`Successfully connected to sheet: ${doc.title}`);

    // Get or create Teams sheet
    let teamsSheet = doc.sheetsByTitle['Teams'];
    if (!teamsSheet) {
      console.log('Creating Teams sheet...');
      teamsSheet = await doc.addSheet({ title: 'Teams' });
      console.log('Teams sheet created');
    } else {
      console.log('Teams sheet already exists');
    }
    
    // Ensure headers are set
    try {
      await teamsSheet.loadHeaderRow();
      const headers = teamsSheet.headerValues;
      
      // Check if headers are missing or incomplete
      const requiredHeaders = ['id', 'name', 'color', 'points', 'lastUpdated'];
      const missingHeaders = requiredHeaders.some(header => !headers.includes(header));
      
      if (headers.length === 0 || missingHeaders) {
        console.log('Setting Teams sheet headers...');
        await teamsSheet.setHeaderRow(requiredHeaders);
        console.log('Teams sheet headers set successfully');
      } else {
        console.log('Teams sheet headers already set correctly');
      }
    } catch (error) {
      console.log('Error checking headers, setting them now:', error.message);
      await teamsSheet.setHeaderRow(['id', 'name', 'color', 'points', 'lastUpdated']);
    }
    
    // Check if we need to add default teams
    const rows = await teamsSheet.getRows();
    console.log(`Found ${rows.length} existing team rows`);
    
    if (rows.length === 0) {
      console.log('No teams found in Teams sheet, adding default teams...');
      const teams = [
        { id: 'yellow', name: 'Yellow Team', color: 'bg-yellow-500', points: 0, lastUpdated: new Date().toISOString() },
        { id: 'blue', name: 'Blue Team', color: 'bg-blue-600', points: 0, lastUpdated: new Date().toISOString() },
        { id: 'green', name: 'Green Team', color: 'bg-green-600', points: 0, lastUpdated: new Date().toISOString() },
      ];
      
      await teamsSheet.addRows(teams);
      console.log('Default teams added successfully');
    } else {
      // Verify teams and ensure the three required teams exist
      const existingTeamIds = rows.map(row => row.get('id'));
      console.log('Existing team IDs:', existingTeamIds);
      
      const defaultTeams = ['yellow', 'blue', 'green'];
      const missingTeams = defaultTeams.filter(id => !existingTeamIds.includes(id));
      
      if (missingTeams.length > 0) {
        console.log(`Missing teams found: ${missingTeams.join(', ')}. Adding them now...`);
        
        const teamsToAdd = missingTeams.map(id => {
          if (id === 'yellow') return { id: 'yellow', name: 'Yellow Team', color: 'bg-yellow-500', points: 0, lastUpdated: new Date().toISOString() };
          if (id === 'blue') return { id: 'blue', name: 'Blue Team', color: 'bg-blue-600', points: 0, lastUpdated: new Date().toISOString() };
          if (id === 'green') return { id: 'green', name: 'Green Team', color: 'bg-green-600', points: 0, lastUpdated: new Date().toISOString() };
        });
        
        await teamsSheet.addRows(teamsToAdd);
        console.log(`Added missing teams: ${missingTeams.join(', ')}`);
      } else {
        console.log('All required teams exist in the Teams sheet');
      }
    }

    // Get or create Results sheet
    let resultsSheet = doc.sheetsByTitle['Results'];
    if (!resultsSheet) {
      console.log('Creating Results sheet...');
      resultsSheet = await doc.addSheet({ title: 'Results' });
      console.log('Results sheet created');
    } else {
      console.log('Results sheet already exists');
    }
    
    // Ensure headers are set
    try {
      await resultsSheet.loadHeaderRow();
      const headers = resultsSheet.headerValues;
      
      // Check if headers are missing or incomplete
      const requiredHeaders = [
        'date',
        'teamId',
        'username',
        'wordsTyped',
        'correctWords',
        'accuracy',
        'wpm',
        'points'
      ];
      const missingHeaders = requiredHeaders.some(header => !headers.includes(header));
      
      if (headers.length === 0 || missingHeaders) {
        console.log('Setting Results sheet headers...');
        await resultsSheet.setHeaderRow(requiredHeaders);
        console.log('Results sheet headers set successfully');
      } else {
        console.log('Results sheet headers already set correctly');
      }
    } catch (error) {
      console.log('Error checking headers, setting them now:', error.message);
      await resultsSheet.setHeaderRow([
        'date',
        'teamId',
        'username',
        'wordsTyped',
        'correctWords',
        'accuracy',
        'wpm',
        'points'
      ]);
    }

    console.log('Setup completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error setting up Google Sheets:', error);
    return { success: false, error };
  }
}

// Run the setup
setupGoogleSheets()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during setup:', error);
    process.exit(1);
  });
