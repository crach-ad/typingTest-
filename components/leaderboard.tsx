"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Team } from "@/components/typing-game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Trophy, RefreshCw } from "lucide-react"
import { fetchLeaderboard, fetchTeamHistory } from "@/lib/api-client"

interface LeaderboardProps {
  teams: Team[]
}

export function Leaderboard({ teams: initialTeams }: LeaderboardProps) {
  // Refs to prevent state updates causing render loops
  const isMountedRef = useRef(true)
  const isDataFetchingRef = useRef(false)
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fetchedHistoryTeamsRef = useRef<Set<string>>(new Set())
  
  // Component state
  const [teams, setTeams] = useState<Team[]>(initialTeams || [])
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("standings")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [teamHistories, setTeamHistories] = useState<{[teamId: string]: any[]}>({})

  // Fetch team history - defined outside useCallback to avoid dependency issues
  async function fetchTeamHistoryData(teamId: string) {
    // Don't fetch if we've already fetched for this team or we're unmounted
    if (!isMountedRef.current || fetchedHistoryTeamsRef.current.has(teamId)) return
    
    fetchedHistoryTeamsRef.current.add(teamId)
    
    try {
      const history = await fetchTeamHistory(teamId)
      
      if (isMountedRef.current) {
        setTeamHistories(prev => ({
          ...prev,
          [teamId]: history || []
        }))
      }
    } catch (error) {
      console.error(`Error fetching history for team ${teamId}:`, error)
      // Remove from fetched set if error occurs so we can try again
      fetchedHistoryTeamsRef.current.delete(teamId)
    }
  }
  
  // Fetch team history when a team is expanded
  useEffect(() => {
    if (expandedTeam) {
      fetchTeamHistoryData(expandedTeam)
    }
  }, [expandedTeam])

  // Function to refresh leaderboard data
  async function refreshLeaderboardData(showAnimation = false) {
    // Prevent concurrent refreshes
    if (isDataFetchingRef.current || !isMountedRef.current) return
    
    isDataFetchingRef.current = true
    if (showAnimation) setIsRefreshing(true)
    
    try {
      const refreshedTeams = await fetchLeaderboard()
      
      if (isMountedRef.current && refreshedTeams?.length > 0) {
        const formattedTeams = refreshedTeams.map((team: any) => ({
          ...team,
          history: team.history || []
        }))
        setTeams(formattedTeams)
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error)
    } finally {
      isDataFetchingRef.current = false
      if (isMountedRef.current && showAnimation) {
        setTimeout(() => setIsRefreshing(false), 500)
      }
    }
  }
  
  // Set up auto-refresh on mount
  useEffect(() => {
    // Initial data load on mount
    refreshLeaderboardData(false)
    
    // Set up auto-refresh interval (30 seconds)
    const intervalId = setInterval(() => {
      refreshLeaderboardData(false)
    }, 30000)
    
    autoRefreshTimerRef.current = intervalId
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      clearInterval(intervalId)
    }
  }, [])

  // Sort teams by points (highest first)
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points)
  
  // Function for manual refresh - just wraps the callback
  const handleManualRefresh = () => {
    refreshLeaderboardData(true);
  };

  // Toggle team history expansion
  const toggleTeamExpansion = (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
    } else {
      setExpandedTeam(teamId)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get unique players for a team
  const getUniquePlayers = (team: Team) => {
    const uniqueUsernames = new Set(team.history.map((game) => game.username))
    return Array.from(uniqueUsernames)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Leaderboard</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={handleManualRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="standings" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="standings">Team Standings</TabsTrigger>
              <TabsTrigger value="history">Game History</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="standings" className="space-y-4">
                  {sortedTeams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-medium w-6 text-center">{index === 0 ? "🏆" : index + 1}</div>
                        <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                        <div className="font-medium">{team.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="font-bold"
                          key={team.points}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        >
                          {team.points} points
                        </motion.div>
                        <div className="text-xs text-muted-foreground">
                          ({team.history.length} games by {getUniquePlayers(team).length} players)
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  {sortedTeams.map((team, teamIndex) => (
                    <motion.div
                      key={team.id}
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: teamIndex * 0.1 }}
                    >
                      <motion.div
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                        onClick={() => toggleTeamExpansion(team.id)}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                          <div className="font-medium">{team.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold">{team.points} points</div>
                          {expandedTeam === team.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {expandedTeam === team.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="pl-6 pr-2 py-2 border rounded-lg ml-4 space-y-2 max-h-60 overflow-y-auto"
                          >
                            {teamHistories[team.id] && teamHistories[team.id].length > 0 ? (
                              teamHistories[team.id].map((game, idx) => (
                              <motion.div
                                key={idx}
                                className="text-sm grid grid-cols-6 gap-2 p-2 border-b last:border-0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.2 }}
                              >
                                <div className="text-muted-foreground">{formatDate(game.date)}</div>
                                <div className="font-medium">{game.username}</div>
                                <div>{game.wpm.toFixed(1)} WPM</div>
                                <div>{game.accuracy.toFixed(1)}%</div>
                                <div>
                                  {game.correctWords}/{game.wordsTyped}
                                </div>
                                <div className="font-semibold">+{game.points} pts</div>
                              </motion.div>
                            ))
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-center py-4 text-muted-foreground"
                              >
                                No games played yet
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="players" className="space-y-6">
                  {sortedTeams.map((team, teamIndex) => {
                    // Get unique players and their stats
                    const uniquePlayers = getUniquePlayers(team)
                    const playerStats = uniquePlayers
                      .map((username) => {
                        const playerGames = team.history.filter((game) => game.username === username)
                        const totalPoints = playerGames.reduce((sum, game) => sum + game.points, 0)
                        const avgWpm = playerGames.reduce((sum, game) => sum + game.wpm, 0) / playerGames.length
                        const avgAccuracy =
                          playerGames.reduce((sum, game) => sum + game.accuracy, 0) / playerGames.length

                        return {
                          username,
                          games: playerGames.length,
                          totalPoints,
                          avgWpm,
                          avgAccuracy,
                        }
                      })
                      .sort((a, b) => b.totalPoints - a.totalPoints)

                    return (
                      <motion.div
                        key={team.id}
                        className="space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: teamIndex * 0.1 }}
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">({playerStats.length} players)</div>
                        </div>

                        {playerStats.length > 0 ? (
                          <motion.div
                            className="border rounded-lg overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2 text-sm font-medium">Player</th>
                                  <th className="text-center p-2 text-sm font-medium">Games</th>
                                  <th className="text-center p-2 text-sm font-medium">Avg WPM</th>
                                  <th className="text-center p-2 text-sm font-medium">Avg Accuracy</th>
                                  <th className="text-right p-2 text-sm font-medium">Points</th>
                                </tr>
                              </thead>
                              <tbody>
                                {playerStats.map((player, idx) => (
                                  <motion.tr
                                    key={idx}
                                    className="border-t"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.05 }}
                                  >
                                    <td className="p-2 text-sm font-medium">{player.username}</td>
                                    <td className="p-2 text-sm text-center">{player.games}</td>
                                    <td className="p-2 text-sm text-center">{player.avgWpm.toFixed(1)}</td>
                                    <td className="p-2 text-sm text-center">{player.avgAccuracy.toFixed(1)}%</td>
                                    <td className="p-2 text-sm font-semibold text-right">{player.totalPoints}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-lg">No players yet</div>
                        )}
                      </motion.div>
                    )
                  })}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
