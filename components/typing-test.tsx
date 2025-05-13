"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Team, TestResult } from "@/components/typing-game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Word list for typing test
const wordList = [
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "I",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
]

interface TypingTestProps {
  team: Team
  onComplete: (result: TestResult) => void
  duration: number
  username: string
}

export function TypingTest({ team, onComplete, duration, username }: TypingTestProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [currentWords, setCurrentWords] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [wordsTyped, setWordsTyped] = useState(0)
  const [correctWords, setCorrectWords] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [wordHistory, setWordHistory] = useState<{ word: string; correct: boolean; id: number }[]>([])
  const [wordCounter, setWordCounter] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Generate multiple random words
  const getRandomWords = (count: number) => {
    const words: string[] = []
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * wordList.length)
      words.push(wordList[randomIndex])
    }
    return words
  }

  // Start the game
  useEffect(() => {
    setCurrentWords(getRandomWords(3))
    inputRef.current?.focus()
  }, [])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Calculate results when time is up
      const accuracy = wordsTyped > 0 ? (correctWords / wordsTyped) * 100 : 0
      const wpm = (correctWords / duration) * 60

      // Calculate points: (WPM × Accuracy%) rounded to nearest integer
      const points = Math.round(wpm * (accuracy / 100))

      onComplete({
        wordsTyped,
        correctWords,
        accuracy,
        wpm,
        points,
        teamId: team.id,
        username: username,
      })
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, wordsTyped, correctWords, onComplete, team.id, duration, username])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive && timeLeft > 0) {
      setIsActive(true)
    }

    setInputValue(e.target.value)
  }

  // Handle word submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()

      if (inputValue.trim() !== "") {
        // Check if the input matches the first word (must type in order)
        const typedWord = inputValue.trim().toLowerCase()
        const currentWord = currentWords[0].toLowerCase()
        const isCorrect = typedWord === currentWord

        // Update stats
        setWordsTyped((prev) => prev + 1)
        if (isCorrect) {
          setCorrectWords((prev) => prev + 1)
        }

        // Add to history with a unique ID
        setWordHistory((prev) => [
          { word: currentWords[0], correct: isCorrect, id: wordCounter },
          ...prev.slice(0, 9), // Keep the last 10 words
        ])
        setWordCounter((prev) => prev + 1)

        // Reset input
        setInputValue("")

        // Shift words and add a new one at the end
        const newWords = [...currentWords.slice(1)]
        newWords.push(getRandomWords(1)[0])
        setCurrentWords(newWords)
      }
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={`border-l-4 ${team.color}`}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>{team.name}</span>
              <span className="text-sm font-normal text-muted-foreground">({username})</span>
            </div>
            <motion.span
              className="text-2xl font-bold"
              key={timeLeft}
              initial={{ scale: 1.2, color: timeLeft <= 5 ? "#ef4444" : "#000000" }}
              animate={{ scale: 1, color: timeLeft <= 5 ? "#ef4444" : "#000000" }}
              transition={{ duration: 0.3 }}
            >
              {timeLeft}s
            </motion.span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center gap-4 flex-wrap">
              <AnimatePresence mode="popLayout">
                {currentWords.map((word, index) => (
                  <motion.div
                    key={`${word}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`text-3xl font-bold px-3 py-1 border rounded-md transition-all ${
                      index === 0
                        ? `bg-${team.color.split("-")[1]}-100 border-${team.color.split("-")[1]}-300 dark:bg-${team.color.split("-")[1]}-900/30 dark:border-${team.color.split("-")[1]}-700`
                        : "bg-background"
                    }`}
                  >
                    {word}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type the highlighted word and press space or enter"
              className="text-center text-lg"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              disabled={timeLeft === 0}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time remaining</span>
              <span>{Math.floor((timeLeft / duration) * 100)}%</span>
            </div>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / duration) * 100}%` }}
              transition={{ type: "tween", ease: "linear", duration: 1 }}
              className={`h-2 bg-primary rounded-full ${timeLeft <= 5 ? "bg-red-500" : ""}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Words Typed</div>
              <motion.div
                className="text-2xl font-bold"
                key={wordsTyped}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {wordsTyped}
              </motion.div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Correct Words</div>
              <motion.div
                className="text-2xl font-bold"
                key={correctWords}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {correctWords}
              </motion.div>
            </div>
          </div>

          {wordHistory.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Recent Words:</div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {wordHistory.map((item) => (
                    <motion.span
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`px-2 py-1 rounded text-sm ${
                        item.correct
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {item.word}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
