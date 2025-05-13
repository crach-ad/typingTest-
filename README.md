# Mr C's Typing Speed Challenge

A competitive typing game application that uses Google Sheets as a backend to store player results and team scores, allowing hundreds of students to contribute to their team's score each week.

## Features

- Team-based competition with Yellow, Blue, and Green teams
- 30-second timed typing challenges
- Metrics tracking: words typed, correct words, accuracy, and WPM
- Points calculation based on WPM × Accuracy%
- Google Sheets integration for centralized data storage
- Real-time leaderboard with automatic refresh
- Game history tracking
- Admin dashboard for teachers to monitor student progress
- Export results in CSV or JSON format

## Technology Stack

- **Frontend**: Next.js, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Framer Motion for animations
- **Backend**: Google Sheets API for data storage
- **API**: Server-side API routes for Google Sheets interactions

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Google account (for Google Sheets integration)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd typing-game
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up Google Sheets integration (optional but recommended):
   - Follow the instructions in [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
   - Run the setup script: `node scripts/setup-sheets.mjs`

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### For Students

1. Enter your name and select your team
2. Type the highlighted words as quickly and accurately as possible
3. Press space or enter after each word
4. View your results and see how many points you've contributed to your team

### For Teachers

1. Access the admin dashboard at `/admin` (password: MrC2025)
2. View team standings and detailed student results
3. Track individual student performance
4. Export data for grading or reporting in CSV or JSON format

## Offline Mode

The application works seamlessly even without Google Sheets configuration:

- In development environments
- When Google Sheets API credentials are not provided
- When there's no internet connection

Data is stored in localStorage as a fallback to ensure the game is always playable.

## Project Structure

- `/app` - Next.js application routes
- `/components` - React components
- `/lib` - Utility functions and API clients
- `/scripts` - Setup scripts
- `/public` - Static assets

## Customization

### Modifying Teams

Edit the `initialTeams` array in `/lib/fallback.ts` to change team names, colors, or add/remove teams.

### Changing Word List

Modify the `wordList` array in `/components/typing-test.tsx` to change the list of words used in the typing challenge.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- shadcn/ui for the component library
- Framer Motion for animations
- Next.js team for the React framework
