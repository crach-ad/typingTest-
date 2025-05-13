# Typing Game - Project Context

## Overview
Mr C's Typing Speed Challenge is a web application that allows students to practice and compete in typing challenges. The application tracks typing speed, accuracy, and awards points to teams. The app uses Google Sheets as a backend to store player results and team scores, enabling hundreds of students to contribute to their team scores each week.

## Key Features
- Team-based competition with Yellow, Blue, and Green teams
- 30-second timed typing challenges
- Metrics tracking: words typed, correct words, accuracy, and words per minute (WPM)
- Points calculation based on WPM × Accuracy%
- Google Sheets integration for centralized data storage
- Real-time leaderboard updates
- Game history tracking

## Technical Implementation
- **Frontend**: Next.js, React 19, Tailwind CSS, shadcn/ui components
- **Backend**: Google Sheets API for data storage
- **State Management**: React hooks for local state, API for persistent state
- **Animation**: Framer Motion for smooth UI transitions
- **API**: Server-side API routes for Google Sheets interactions
- **Authentication**: Username-based identification (no authentication yet)

## Data Architecture
The application stores data in Google Sheets with three primary sheets:
1. **Teams Sheet**: Contains team information (id, name, color, points, lastUpdated)
2. **Results Sheet**: Records individual game results (date, teamId, username, wordsTyped, correctWords, accuracy, wpm, points)
3. **TeamHistory Sheet**: Tracks all team score changes (date, teamId, teamName, pointsAdded, newTotal, username)

## Roadmap / Future Features
- User authentication for persistent player profiles
- Weekly/monthly leaderboard resets
- More advanced typing challenges and difficulty levels
- Teacher dashboard for monitoring student progress
- Typing practice mode with customizable content
- Export of results for grading or reporting
