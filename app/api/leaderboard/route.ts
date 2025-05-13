import { NextResponse } from 'next/server';
import { getLeaderboardData, isGoogleSheetsConfigured } from '@/lib/sheets';
import { fallbackTeams } from '@/lib/fallback';

export async function GET() {
  try {
    // Check if Google Sheets is configured
    if (!isGoogleSheetsConfigured()) {
      console.log('Google Sheets not configured, using fallback data');
      return NextResponse.json({ teams: fallbackTeams, useFallback: true });
    }

    const leaderboardData = await getLeaderboardData();
    return NextResponse.json({ teams: leaderboardData });
  } catch (error) {
    console.error('API error fetching leaderboard:', error);
    // Return fallback data instead of error
    return NextResponse.json({ teams: fallbackTeams, useFallback: true });
  }
}
