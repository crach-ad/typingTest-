/**
 * API client for typing game frontend components to interact with Google Sheets backend
 * Includes fallback to localStorage when Google Sheets is not configured
 */
import { getLocalTeams, saveLocalResult } from '@/lib/fallback';

// Fetch team leaderboard data
export async function fetchLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard data');
    }
    const data = await response.json();
    
    if (data.useFallback) {
      // API indicated we should use fallback data
      return getLocalTeams();
    }
    
    return data.teams;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Fall back to local storage if API call fails
    return getLocalTeams();
  }
}

// Save game result to backend
export async function saveResult(result: {
  teamId: string;
  username: string;
  wordsTyped: number;
  correctWords: number;
  accuracy: number;
  wpm: number;
  points: number;
}) {
  try {
    const response = await fetch('/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      const data = await response.json();
      
      // If the API indicates we should use fallback
      if (data.useFallback) {
        // Save to localStorage instead
        saveLocalResult(result);
        return { success: true, usedFallback: true };
      }
      
      throw new Error('Failed to save result');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving result:', error);
    
    // Fall back to localStorage if API call fails
    saveLocalResult(result);
    return { success: true, usedFallback: true, error };
  }
}

// Fetch user history
export async function fetchUserHistory(username: string) {
  try {
    const response = await fetch(`/api/history?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user history');
    }
    const data = await response.json();
    return data.history;
  } catch (error) {
    console.error('Error fetching user history:', error);
    return [];
  }
}

// Fetch team history
export async function fetchTeamHistory(teamId: string) {
  try {
    const response = await fetch(`/api/history?teamId=${encodeURIComponent(teamId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch team history');
    }
    const data = await response.json();
    
    if (data.useFallback) {
      // API indicated we should use fallback data
      // Get history from local storage
      const teams = getLocalTeams();
      const team = teams.find(t => t.id === teamId);
      return team ? team.history : [];
    }
    
    return data.history;
  } catch (error) {
    console.error('Error fetching team history:', error);
    
    // Fall back to local storage
    const teams = getLocalTeams();
    const team = teams.find(t => t.id === teamId);
    return team ? team.history : [];
  }
}
