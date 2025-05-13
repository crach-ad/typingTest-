import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Function to safely process the private key for compatibility with different environments
export function processPrivateKey(privateKey: string): string {
  // If key is undefined or empty, return empty string
  if (!privateKey) return '';
  
  // Step 1: Handle escaped newlines
  let formattedKey = privateKey;
  if (privateKey.includes('\\n')) {
    formattedKey = privateKey.replace(/\\n/g, '\n');
  }
  
  // Step 2: Remove existing headers/footers if present (to avoid duplication)
  formattedKey = formattedKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .trim();
  
  // Step 3: Add proper headers and footers
  formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
  
  return formattedKey;
}

// Create a JWT client with enhanced error handling
export async function createJwtClient() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    if (!privateKey || !clientEmail) {
      throw new Error("Missing Google Sheets credentials");
    }
    
    // Process the key
    const formattedKey = processPrivateKey(privateKey);
    
    // Create JWT with robust error handling
    try {
      console.log('Creating JWT with processed key');
      const jwt = new JWT({
        email: clientEmail,
        key: formattedKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      
      return jwt;
    } catch (err) {
      const jwtError = err as Error;
      console.error('Error creating JWT:', jwtError);
      throw new Error(`JWT creation failed: ${jwtError.message || 'Unknown JWT error'}`);
    }
  } catch (error) {
    console.error('Auth setup error:', error);
    throw error;
  }
}

// Initialize Google Sheets with enhanced error handling
export async function initializeGoogleSheets() {
  try {
    console.log('Starting Google Sheets initialization');
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      throw new Error("Missing Google Sheet ID");
    }
    
    const jwt = await createJwtClient();
    console.log('JWT client created successfully');
    
    try {
      console.log('Connecting to Google Sheets:', sheetId);
      const doc = new GoogleSpreadsheet(sheetId, jwt);
      await doc.loadInfo();
      console.log('Connected to spreadsheet:', doc.title);
      return doc;
    } catch (err) {
      const docError = err as Error;
      console.error('Error loading spreadsheet:', docError);
      throw new Error(`Spreadsheet connection failed: ${docError.message || 'Unknown spreadsheet error'}`);
    }
  } catch (error) {
    console.error('Google Sheets initialization failed:', error);
    throw error;
  }
}
