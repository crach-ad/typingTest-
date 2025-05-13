import { NextResponse } from 'next/server';
import { initializeGoogleSheets } from '@/lib/sheets';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Debug API route called');
    
    // Check environment variables
    const envCheck = {
      hasServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
    };
    
    let sheetsInfo = null;
    let error = null;
    
    try {
      // Try to initialize Google Sheets
      const doc = await initializeGoogleSheets();
      
      // Get basic information about the spreadsheet
      const sheetInfo = {
        title: doc.title,
        sheetCount: doc.sheetCount,
        availableSheets: Object.keys(doc.sheetsByTitle),
      };
      
      // Try to load teams data
      const teamsSheet = doc.sheetsByTitle['Teams'];
      let teamData = [];
      
      if (teamsSheet) {
        await teamsSheet.loadHeaderRow();
        const rows = await teamsSheet.getRows();
        teamData = rows.map(row => ({
          id: row.get('id'),
          name: row.get('name'),
          points: row.get('points'),
        })).slice(0, 5); // Just get first 5 teams for diagnosis
      }
      
      sheetsInfo = {
        sheetInfo,
        teamData,
      };
    } catch (err) {
      console.error('Error accessing Google Sheets:', err);
      error = {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      };
    }
    
    // Return debug info
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      sheetsInfo,
      error,
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
