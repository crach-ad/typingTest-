import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Test write API route called');
    
    // Get credentials from environment variables
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!privateKey || !clientEmail || !sheetId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing credentials',
        available: {
          privateKey: !!privateKey,
          clientEmail: !!clientEmail,
          sheetId: !!sheetId
        }
      });
    }
    
    // Format the key correctly
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    
    // Create JWT
    const jwt = new JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // Initialize the document
    console.log('Connecting to sheet:', sheetId);
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
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
