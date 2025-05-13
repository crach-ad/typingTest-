import { NextResponse } from 'next/server';
import { saveGameResult, isGoogleSheetsConfigured } from '@/lib/sheets';

// Disable Edge Runtime to ensure compatibility with Google Sheets API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
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
