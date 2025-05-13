import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as googleAuth from '@/lib/google-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Schema check API route called');
    
    // Check that credentials are configured
    if (!process.env.GOOGLE_PRIVATE_KEY || 
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
        !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing credentials',
        available: {
          privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          clientEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          sheetId: !!process.env.GOOGLE_SHEET_ID
        }
      });
    }
    
    // Use our enhanced Google authentication module
    console.log('Initializing Google Sheets with enhanced auth');
    const doc = await googleAuth.initializeGoogleSheets();
    console.log('Connected to sheet:', doc.title);
    
    // Get the schema info for Teams sheet
    const teamsSheet = doc.sheetsByTitle['Teams'];
    if (!teamsSheet) {
      return NextResponse.json({
        success: false,
        error: 'Teams sheet not found'
      });
    }
    
    // Load header row and first team
    await teamsSheet.loadHeaderRow();
    const headers = teamsSheet.headerValues;
    
    // Get a sample row
    await teamsSheet.loadCells();
    const rows = await teamsSheet.getRows();
    
    let sampleRow = null;
    let rowAccessTest = null;
    
    if (rows.length > 0) {
      // Get a sample of first row data
      sampleRow = {};
      
      // Get all values by header
      for (const header of headers) {
        sampleRow[header] = rows[0].get(header);
      }
      
      // Test directly with different field names (id vs teamId)
      rowAccessTest = {
        id: rows[0].get('id'),
        teamId: rows[0].get('teamId'),
        name: rows[0].get('name'),
        points: rows[0].get('points'),
        score: rows[0].get('score'),
        lastUpdated: rows[0].get('lastUpdated')
      };
    }
    
    // Get the schema info for Results sheet
    const resultsSheet = doc.sheetsByTitle['Results'];
    let resultsHeaders = null;
    
    if (resultsSheet) {
      await resultsSheet.loadHeaderRow();
      resultsHeaders = resultsSheet.headerValues;
    }
    
    // Try to manually update a team score to test permissions
    let writeTest = {
      attempted: false,
      success: false,
      error: null
    };
    
    if (rows.length > 0) {
      try {
        writeTest.attempted = true;
        
        // Get current score/points value
        const row = rows[0];
        const currentPoints = parseInt(row.get('points') || '0', 10);
        const currentScore = parseInt(row.get('score') || '0', 10);
        
        // Add 1 to the current score
        if ('points' in row) {
          row.set('points', (currentPoints + 1).toString());
        } else if ('score' in row) {
          row.set('score', (currentScore + 1).toString());
        }
        
        // Update the lastUpdated field
        if ('lastUpdated' in row) {
          row.set('lastUpdated', new Date().toISOString());
        }
        
        // Save the row
        await row.save();
        writeTest.success = true;
      } catch (error) {
        writeTest.error = String(error);
      }
    }
    
    return NextResponse.json({
      success: true,
      sheetTitle: doc.title,
      teams: {
        headers,
        rowCount: rows.length,
        sampleRow,
        rowAccessTest
      },
      results: {
        headers: resultsHeaders
      },
      writeTest,
      allSheets: Object.keys(doc.sheetsByTitle)
    });
    
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
