import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Check if Google Sheets integration is configured
export const isGoogleSheetsConfigured = (): boolean => {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID);
};

// Initialize Google Sheets Document
const initializeGoogleSheets = async () => {
  try {
    // Check if Google Sheets is configured
    if (!isGoogleSheetsConfigured()) {
      throw new Error('Google Sheets API not configured');
    }
    
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
    const sheetId = process.env.GOOGLE_SHEET_ID || '';

    const jwt = new JWT({
      email: serviceAccountEmail || '',
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw error;
  }
};

// Get leaderboard data
export const getLeaderboardData = async () => {
  try {
    const doc = await initializeGoogleSheets();
    const teamsSheet = doc.sheetsByTitle['Teams'];
    
    if (!teamsSheet) {
      throw new Error('Teams sheet not found');
    }
    
    await teamsSheet.loadCells();
    const rows = await teamsSheet.getRows();
    
    return rows.map(row => ({
      id: row.get('id'),
      name: row.get('name'),
      color: row.get('color'),
      points: parseInt(row.get('points') || '0', 10),
    }));
  } catch (error) {
    console.error('Error getting leaderboard data:', error);
    return [];
  }
};

// Save game result
export const saveGameResult = async (result: {
  teamId: string;
  username: string;
  wordsTyped: number;
  correctWords: number;
  accuracy: number;
  wpm: number;
  points: number;
  date: string;
}) => {
  try {
    const doc = await initializeGoogleSheets();
    
    // 1. Add result to the Results sheet
    const resultsSheet = doc.sheetsByTitle['Results'];
    if (!resultsSheet) {
      throw new Error('Results sheet not found');
    }
    
    await resultsSheet.addRow({
      date: result.date,
      teamId: result.teamId,
      username: result.username,
      wordsTyped: result.wordsTyped,
      correctWords: result.correctWords,
      accuracy: result.accuracy,
      wpm: result.wpm,
      points: result.points,
    });
    
    // 2. Update team points in the Teams sheet
    const teamsSheet = doc.sheetsByTitle['Teams'];
    if (!teamsSheet) {
      throw new Error('Teams sheet not found');
    }
    
    // Load cells and get team rows
    await teamsSheet.loadCells();
    const rows = await teamsSheet.getRows();
    const teamRow = rows.find(row => row.get('id') === result.teamId);
    
    // Update team points total with proper handling
    if (teamRow) {
      const currentPoints = parseInt(teamRow.get('points') || '0', 10);
      const newTotalPoints = currentPoints + result.points;
      teamRow.set('points', newTotalPoints.toString());
      teamRow.set('lastUpdated', result.date); // Add timestamp for the update
      await teamRow.save();
      
      // 3. Also add entry to the TeamHistory sheet (create if doesn't exist)
      let teamHistorySheet = doc.sheetsByTitle['TeamHistory'];
      if (!teamHistorySheet) {
        // Create TeamHistory sheet if it doesn't exist
        teamHistorySheet = await doc.addSheet({ 
          title: 'TeamHistory',
          headerValues: ['date', 'teamId', 'teamName', 'pointsAdded', 'newTotal', 'username']
        });
      } else {
        // Ensure sheet has the correct headers
        try {
          await teamHistorySheet.loadHeaderRow();
          const headers = teamHistorySheet.headerValues;
          const requiredHeaders = ['date', 'teamId', 'teamName', 'pointsAdded', 'newTotal', 'username'];
          
          if (headers.length === 0 || requiredHeaders.some(h => !headers.includes(h))) {
            await teamHistorySheet.setHeaderRow(requiredHeaders);
          }
        } catch (error) {
          console.warn('Error checking TeamHistory headers, setting them now:', error);
          await teamHistorySheet.setHeaderRow(['date', 'teamId', 'teamName', 'pointsAdded', 'newTotal', 'username']);
        }
      }
      
      // Add the history entry to track changes
      await teamHistorySheet.addRow({
        date: result.date,
        teamId: result.teamId,
        teamName: teamRow.get('name'),
        pointsAdded: result.points,
        newTotal: newTotalPoints,
        username: result.username
      });
    } else {
      console.warn(`Team ${result.teamId} not found in Teams sheet`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving game result:', error);
    return { success: false, error };
  }
};

// Get user history
export const getUserHistory = async (username: string) => {
  try {
    const doc = await initializeGoogleSheets();
    const resultsSheet = doc.sheetsByTitle['Results'];
    
    if (!resultsSheet) {
      throw new Error('Results sheet not found');
    }
    
    await resultsSheet.loadCells();
    const rows = await resultsSheet.getRows();
    
    return rows
      .filter(row => row.get('username') === username)
      .map(row => ({
        date: row.get('date'),
        teamId: row.get('teamId'),
        wordsTyped: parseInt(row.get('wordsTyped') || '0', 10),
        correctWords: parseInt(row.get('correctWords') || '0', 10),
        accuracy: parseFloat(row.get('accuracy') || '0'),
        wpm: parseFloat(row.get('wpm') || '0'),
        points: parseInt(row.get('points') || '0', 10),
      }));
  } catch (error) {
    console.error('Error getting user history:', error);
    return [];
  }
};

// Get team history (last 20 entries from Results sheet)
export const getTeamHistory = async (teamId: string) => {
  try {
    const doc = await initializeGoogleSheets();
    const resultsSheet = doc.sheetsByTitle['Results'];
    
    if (!resultsSheet) {
      throw new Error('Results sheet not found');
    }
    
    await resultsSheet.loadCells();
    const rows = await resultsSheet.getRows();
    
    return rows
      .filter(row => row.get('teamId') === teamId)
      .map(row => ({
        date: row.get('date'),
        username: row.get('username'),
        wordsTyped: parseInt(row.get('wordsTyped') || '0', 10),
        correctWords: parseInt(row.get('correctWords') || '0', 10),
        accuracy: parseFloat(row.get('accuracy') || '0'),
        wpm: parseFloat(row.get('wpm') || '0'),
        points: parseInt(row.get('points') || '0', 10),
      }))
      .slice(0, 20); // Get only the latest 20 entries
  } catch (error) {
    console.error('Error getting team history:', error);
    return [];
  }
};

// Get team point history (from the TeamHistory sheet)
export const getTeamPointHistory = async (teamId?: string) => {
  try {
    const doc = await initializeGoogleSheets();
    const teamHistorySheet = doc.sheetsByTitle['TeamHistory'];
    
    if (!teamHistorySheet) {
      // If sheet doesn't exist yet, return empty array
      return [];
    }
    
    await teamHistorySheet.loadCells();
    const rows = await teamHistorySheet.getRows();
    
    // Filter by teamId if provided, otherwise return all entries
    let filteredRows = rows;
    if (teamId) {
      filteredRows = rows.filter(row => row.get('teamId') === teamId);
    }
    
    return filteredRows.map(row => ({
      date: row.get('date'),
      teamId: row.get('teamId'),
      teamName: row.get('teamName'),
      pointsAdded: parseInt(row.get('pointsAdded') || '0', 10),
      newTotal: parseInt(row.get('newTotal') || '0', 10),
      username: row.get('username'),
    }));
  } catch (error) {
    console.error('Error getting team point history:', error);
    return [];
  }
};
