"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { TestResult, Team } from "@/components/typing-game"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResultsProps {
  result: TestResult
  team: Team | null
}

export function Results({ result, team }: ResultsProps) {
  const [countedPoints, setCountedPoints] = useState(0)
  const [countedWPM, setCountedWPM] = useState(0)
  const [countedAccuracy, setCountedAccuracy] = useState(0)

  // Animate the counting of stats
  useEffect(() => {
    const duration = 1500 // ms
    const interval = 15 // ms
    const steps = duration / interval

    const pointsIncrement = result.points / steps
    const wpmIncrement = result.wpm / steps
    const accuracyIncrement = result.accuracy / steps

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++

      setCountedPoints(Math.min(Math.round(pointsIncrement * currentStep), result.points))
      setCountedWPM(Math.min(Number((wpmIncrement * currentStep).toFixed(1)), result.wpm))
      setCountedAccuracy(Math.min(Number((accuracyIncrement * currentStep).toFixed(1)), result.accuracy))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [result])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className={`border-l-4 ${team?.color}`}>
        <CardHeader>
          <CardTitle>Your Results</CardTitle>
          <CardDescription>
            {result.username}, you earned {countedPoints} points for {team?.name}!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-muted-foreground">Words Typed</p>
              <p className="text-2xl font-bold">{result.wordsTyped}</p>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm text-muted-foreground">Correct Words</p>
              <p className="text-2xl font-bold">{result.correctWords}</p>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold">{countedAccuracy.toFixed(1)}%</p>
            </motion.div>
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm text-muted-foreground">WPM</p>
              <p className="text-2xl font-bold">{countedWPM.toFixed(1)}</p>
            </motion.div>
          </div>

          <motion.div
            className="mt-6 p-4 bg-muted rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h3 className="font-semibold mb-2">How Points Are Calculated</h3>
            <p className="text-sm text-muted-foreground">
              Points = WPM × Accuracy% = {countedWPM.toFixed(1)} × {countedAccuracy.toFixed(1)}% = {countedPoints}{" "}
              points
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
