import { NextResponse } from 'next/server';
import { getUserHistory, getTeamHistory, isGoogleSheetsConfigured } from '@/lib/sheets';
import { getLocalTeams } from '@/lib/fallback';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const teamId = searchParams.get('teamId');
    
    if (!username && !teamId) {
      return NextResponse.json({ error: 'Either username or teamId parameter is required' }, { status: 400 });
    }

    // Check if Google Sheets is configured
    if (!isGoogleSheetsConfigured()) {
      console.log('Google Sheets not configured, using fallback data for history');
      
      // Return data from local storage fallback
      if (username) {
        // For user history, return empty array as we don't track per-user in localStorage
        return NextResponse.json({ history: [], useFallback: true });
      } else if (teamId) {
        // For team history, get from localStorage
        const teams = getLocalTeams();
        const team = teams.find(t => t.id === teamId);
        return NextResponse.json({ history: team?.history || [], useFallback: true });
      }
    }
    
    // Use Google Sheets data
    if (username) {
      const history = await getUserHistory(username);
      return NextResponse.json({ history });
    } else if (teamId) {
      const history = await getTeamHistory(teamId);
      return NextResponse.json({ history });
    }
    
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('API error fetching history:', error);
    
    // Fall back to localStorage data
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    if (teamId) {
      const teams = getLocalTeams();
      const team = teams.find(t => t.id === teamId);
      return NextResponse.json({ history: team?.history || [], useFallback: true });
    }
    
    return NextResponse.json({ history: [], useFallback: true });
  }
}
