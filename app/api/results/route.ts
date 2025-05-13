import { NextResponse } from 'next/server';
import { saveGameResult, isGoogleSheetsConfigured } from '@/lib/sheets';

// Disable Edge Runtime to ensure compatibility with Google Sheets API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('API route /api/results called');
    
    // Verify environment variables are available in this context
    const envCheck = {
      hasServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
    };
    console.log('Environment variables check:', envCheck);
    
    if (!envCheck.hasServiceAccountEmail || !envCheck.hasPrivateKey || !envCheck.hasSheetId) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing Google Sheets credentials' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    console.log('Received result data:', { teamId: data.teamId, username: data.username });
    
    // Validate required fields
    const requiredFields = ['teamId', 'username', 'wordsTyped', 'correctWords', 'accuracy', 'wpm', 'points'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Add date if not provided
    if (!data.date) {
      data.date = new Date().toISOString();
    }
    
    // Check if Google Sheets is configured
    if (!isGoogleSheetsConfigured()) {
      console.log('Google Sheets not configured, using fallback storage');
      return NextResponse.json({ success: true, useFallback: true });
    }
    
    const result = await saveGameResult(data);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      // If Google Sheets save fails, tell client to use fallback
      return NextResponse.json({ success: false, useFallback: true }, { status: 200 });
    }
  } catch (error) {
    console.error('API error saving result:', error);
    // Tell client to use fallback instead of returning error
    return NextResponse.json({ success: false, useFallback: true }, { status: 200 });
  }
}
