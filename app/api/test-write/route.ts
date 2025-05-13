import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as googleAuth from '@/lib/google-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Test write API route called');
    
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
    
    // Get the log sheet or create it
    let logSheet = doc.sheetsByTitle['WriteTest'];
    if (!logSheet) {
      console.log('Creating WriteTest sheet');
      logSheet = await doc.addSheet({ title: 'WriteTest' });
      await logSheet.setHeaderRow(['timestamp', 'test_id', 'message']);
    }
    
    // Write a test row with timestamp
    const timestamp = new Date().toISOString();
    const testId = `test-${Math.floor(Math.random() * 10000)}`;
    const message = 'This is a test write from the API';
    
    console.log('Adding test row with ID:', testId);
    await logSheet.addRow({
      timestamp,
      test_id: testId,
      message
    });
    
    // Now explicitly check if the row was added
    console.log('Refreshing sheet to verify write');
    await logSheet.loadCells();
    const rows = await logSheet.getRows();
    
    // Find our test row
    const foundRow = rows.find(row => row.get('test_id') === testId);
    
    return NextResponse.json({
      success: true,
      sheetTitle: doc.title,
      writeTest: {
        timestamp,
        testId,
        rowFound: !!foundRow,
        rowCount: rows.length
      },
      sheetInfo: {
        title: doc.title,
        availableSheets: Object.keys(doc.sheetsByTitle)
      }
    });
    
  } catch (error) {
    console.error('Test write error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
