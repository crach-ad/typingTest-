/**
 * Fallback data and functions for when Google Sheets integration is not available
 * This ensures the app can still function in development or when sheets are not configured
 */

import type { Team, GameResult } from "@/components/typing-game";

// Initial team data - used when Google Sheets is not available
export const fallbackTeams: Team[] = [
  { id: "yellow", name: "Yellow Team", color: "bg-yellow-500", points: 0, history: [] },
  { id: "blue", name: "Blue Team", color: "bg-blue-600", points: 0, history: [] },
  { id: "green", name: "Green Team", color: "bg-green-600", points: 0, history: [] },
];

// Get teams from localStorage if available
export const getLocalTeams = (): Team[] => {
  if (typeof window === 'undefined') return fallbackTeams;
  
  try {
    const storedTeams = localStorage.getItem("typingGameTeams");
    if (storedTeams) {
      const parsedTeams = JSON.parse(storedTeams);
      // Validate the parsed data
      if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
        return parsedTeams;
      }
    }
    return fallbackTeams;
  } catch (error) {
    console.error("Error loading teams from localStorage:", error);
    return fallbackTeams;
  }
};

// Save teams to localStorage
export const saveLocalTeams = (teams: Team[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem("typingGameTeams", JSON.stringify(teams));
  } catch (error) {
    console.error("Error saving teams to localStorage:", error);
  }
};

// Save game result to localStorage
export const saveLocalResult = (
  result: {
    teamId: string;
    username: string;
    wordsTyped: number;
    correctWords: number;
    accuracy: number;
    wpm: number;
    points: number;
  }
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get current teams
    const teams = getLocalTeams();
    
    // Create a game result entry for history
    const gameResult: GameResult = {
      date: new Date().toISOString(),
      wordsTyped: result.wordsTyped,
      correctWords: result.correctWords,
      accuracy: result.accuracy,
      wpm: result.wpm,
      points: result.points,
      username: result.username,
    };
    
    // Update team points and history
    const updatedTeams = teams.map((team) =>
      team.id === result.teamId
        ? {
            ...team,
            points: team.points + result.points,
            history: [...team.history, gameResult],
          }
        : team
    );
    
    // Save updated teams
    saveLocalTeams(updatedTeams);
    
    return;
  } catch (error) {
    console.error("Error saving result to localStorage:", error);
  }
};

// Check if Google Sheets integration is configured
export const isGoogleSheetsConfigured = (): boolean => {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID
  );
};
