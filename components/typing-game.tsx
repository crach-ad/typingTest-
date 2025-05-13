"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TeamSelector } from "@/components/team-selector"
import { TypingTest } from "@/components/typing-test"
import { Results } from "@/components/results"
import { HomeButton } from "@/components/home-button"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Leaderboard } from "@/components/leaderboard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLeaderboard, saveResult } from "@/lib/api-client"

// Define team types
export type Team = {
  id: string
  name: string
  color: string
  points: number
  history: GameResult[]
}

// Define result types
export type TestResult = {
  wordsTyped: number
  correctWords: number
  accuracy: number
  wpm: number
  points: number
  teamId: string
  username: string
}

// Define game result for history
export type GameResult = {
  date: string
  wordsTyped: number
  correctWords: number
  accuracy: number
  wpm: number
  points: number
  username: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// Initial team data
const initialTeams: Team[] = [
  { id: "yellow", name: "Yellow Team", color: "bg-yellow-500", points: 0, history: [] },
  { id: "blue", name: "Blue Team", color: "bg-blue-600", points: 0, history: [] },
  { id: "green", name: "Green Team", color: "bg-green-600", points: 0, history: [] },
]

export function TypingGame() {
  // Use refs to track state without triggering re-renders
  const initialDataLoadedRef = useRef(false)
  const resultSavedRef = useRef(false)
  const isMountedRef = useRef(true)
  
  // Game states
  const [gameState, setGameState] = useState<"select" | "play" | "results">("select")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [savedUsername, setSavedUsername] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Load teams data only once on component mount
  useEffect(() => {
    // Load initial data
    async function loadInitialData() {
      if (initialDataLoadedRef.current) return
      initialDataLoadedRef.current = true
      
      try {
        const teamsData = await fetchLeaderboard()
        if (teamsData && teamsData.length > 0 && isMountedRef.current) {
          const formattedTeams = teamsData.map((team: any) => ({
            ...team,
            history: team.history || []
          }))
          setTeams(formattedTeams)
        }
      } catch (error) {
        console.error('Failed to fetch teams data:', error)
        if (isMountedRef.current) {
          setTeams(initialTeams)
        }
      }
      
      // Load saved username
      const storedUsername = localStorage.getItem("typingGameUsername")
      if (storedUsername && isMountedRef.current) {
        setUsername(storedUsername)
        setSavedUsername(storedUsername)
      }
    }
    
    loadInitialData()
    
    // Clean up on unmount
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle username input change
  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value)
    setUsernameError("")
  }
  
  // Handle team selection
  function handleTeamSelect(team: Team) {
    setSelectedTeam(team)
  }

  // Handle game start 
  function handleStartGame() {
    // Validate username
    if (!username.trim()) {
      setUsernameError("Please enter your name")
      return
    }

    // Reset any previous result
    resultSavedRef.current = false
    setTestResult(null)
    
    // Save username and start game
    const trimmedUsername = username.trim()
    localStorage.setItem("typingGameUsername", trimmedUsername)
    setSavedUsername(trimmedUsername)
    setUsernameError("")
    setGameState("play")
  }

  // Handle game completion 
  async function handleGameComplete(result: TestResult) {
    // Set result state
    setTestResult(result)
    
    // Only proceed if we haven't already saved this result
    if (resultSavedRef.current) {
      setGameState("results")
      return
    }
    
    // Mark as saved to prevent duplicate saves
    resultSavedRef.current = true
    
    // Create a game history entry 
    const gameResult: GameResult = {
      date: new Date().toISOString(),
      wordsTyped: result.wordsTyped,
      correctWords: result.correctWords,
      accuracy: result.accuracy,
      wpm: result.wpm,
      points: result.points,
      username: savedUsername,
    }
    
    // Create the payload for the API
    const finalResult = {
      teamId: selectedTeam?.id as string,
      wordsTyped: result.wordsTyped,
      correctWords: result.correctWords,
      accuracy: result.accuracy,
      wpm: result.wpm,
      points: result.points,
      username: savedUsername,
    }
    
    // Update local team state for immediate UI feedback
    setTeams(currentTeams => 
      currentTeams.map(team => 
        team.id === selectedTeam?.id
          ? {
              ...team,
              points: team.points + finalResult.points,
              history: [...team.history, gameResult],
            }
          : team
      )
    )
    
    // Save to Google Sheets
    try {
      await saveResult(finalResult)
      console.log('Game result saved to Google Sheets successfully')
    } catch (error) {
      console.error('Failed to save game result to Google Sheets:', error)
    }
    
    // Update game state
    setGameState("results")
  }

  // Handle play again 
  async function handlePlayAgain() {
    // Reset flags
    resultSavedRef.current = false
    
    // Reset result state
    setTestResult(null)

    // Refresh team data
    try {
      const teamsData = await fetchLeaderboard()
      if (teamsData?.length > 0 && isMountedRef.current) {
        // Ensure proper formatting
        const formattedTeams = teamsData.map((team: any) => ({
          ...team,
          history: team.history || []
        }))
        setTeams(formattedTeams)
      }
    } catch (error) {
      console.error('Failed to refresh teams data:', error)
    }
    
    // Reset the game state
    setGameState("select")
  }

  // Handle home button click
  function handleHomeClick() {
    // Home click behavior depends on game state
    if (gameState === "results") {
      // If on results page, just go back to select
      setGameState("select")
    } else if (gameState === "play") {
      // If playing, show confirm dialog
      setShowConfirmDialog(true)
    }
  }

  // Function to cancel current game and return to select
  function handleConfirmExit() {
    setShowConfirmDialog(false)
    setGameState("select")
    setSelectedTeam(null)
  }

  return (
    <div className="space-y-8">
      {/* Home button - visible on all pages except select */}
      {gameState !== "select" && <HomeButton onClick={handleHomeClick} />}
      
      {/* Confirm dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to return to the home page? Your current game progress will be lost.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogAction>
            <AlertDialogAction onClick={handleConfirmExit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AnimatePresence mode="wait">
        {gameState === "select" && (
          <motion.div
            key="select"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Join Mr C's Typing Challenge</CardTitle>
                  <CardDescription>Enter your name and choose your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Your Name</Label>
                    <Input
                      id="username"
                      placeholder="Enter your name"
                      value={username}
                      onChange={handleUsernameChange}
                      className={usernameError ? "border-red-500" : ""}
                    />
                    {usernameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {usernameError}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Select Your Team</Label>
                    <TeamSelector teams={teams} selectedTeam={selectedTeam} onSelectTeam={handleTeamSelect} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleStartGame}
                    disabled={!selectedTeam}
                    className="w-full" 
                    asChild
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start Typing Challenge
                    </motion.button>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Leaderboard teams={teams} />
            </motion.div>
          </motion.div>
        )}

        {gameState === "play" && selectedTeam && (
          <motion.div
            key="play"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <TypingTest team={selectedTeam} onComplete={handleGameComplete} duration={30} username={savedUsername} />
          </motion.div>
        )}

        {gameState === "results" && testResult && (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <Results result={testResult} team={selectedTeam} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Leaderboard teams={teams} />
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-center">
              <Button onClick={handlePlayAgain} asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Again
                </motion.button>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
