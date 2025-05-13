"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchLeaderboard, fetchTeamHistory } from "@/lib/api-client"
import { RefreshCw, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [teamHistories, setTeamHistories] = useState<{[teamId: string]: any[]}>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [exportFormat, setExportFormat] = useState("csv")
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Mock admin password - in a real app, this would be environment variable or server-side auth
  const ADMIN_PASSWORD = "MrC2025"

  // Handle admin login
  const handleLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError("")
      localStorage.setItem("typingGameAdminAuth", "true")
    } else {
      setPasswordError("Incorrect password")
    }
  }

  // Load teams and check authentication
  useEffect(() => {
    // Check if already authenticated via localStorage
    const savedAuth = localStorage.getItem("typingGameAdminAuth")
    if (savedAuth === "true") {
      setIsAuthenticated(true)
    }

    // Load teams data if authenticated
    if (isAuthenticated) {
      loadTeamsData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Load teams data from API
  const loadTeamsData = async () => {
    setLoading(true)
    try {
      const teamsData = await fetchLeaderboard()
      if (teamsData && teamsData.length > 0) {
        // Sort teams by points
        const sortedTeams = [...teamsData].sort((a, b) => b.points - a.points)
        setTeams(sortedTeams)
        
        // Load history for each team
        for (const team of sortedTeams) {
          loadTeamHistory(team.id)
        }
      }
    } catch (error) {
      console.error('Failed to load teams data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load team history
  const loadTeamHistory = async (teamId: string) => {
    try {
      const history = await fetchTeamHistory(teamId)
      setTeamHistories(prev => ({
        ...prev,
        [teamId]: history || []
      }))
    } catch (error) {
      console.error(`Failed to load history for team ${teamId}:`, error)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTeamsData()
    setTimeout(() => setRefreshing(false), 500)
  }

  // Export data as CSV or JSON
  const handleExport = () => {
    try {
      let data
      let fileName
      let contentType
      
      if (exportFormat === 'csv') {
        // Create CSV content
        const headers = "Team,Player,Date,Words Typed,Correct Words,Accuracy,WPM,Points\n"
        let csvContent = headers
        
        teams.forEach(team => {
          const teamHistory = teamHistories[team.id] || []
          teamHistory.forEach(entry => {
            const row = [
              team.name,
              entry.username,
              new Date(entry.date).toLocaleString(),
              entry.wordsTyped,
              entry.correctWords,
              entry.accuracy.toFixed(1) + '%',
              entry.wpm.toFixed(1),
              entry.points
            ]
            csvContent += row.join(',') + '\n'
          })
        })
        
        data = csvContent
        fileName = 'typing-game-results.csv'
        contentType = 'text/csv'
      } else {
        // Create JSON with complete data
        const jsonData = teams.map(team => ({
          ...team,
          history: teamHistories[team.id] || []
        }))
        
        data = JSON.stringify(jsonData, null, 2)
        fileName = 'typing-game-results.json'
        contentType = 'application/json'
      }
      
      // Create download link
      const blob = new Blob([data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
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

  // Calculate team statistics
  const getTeamStats = (teamId: string) => {
    const history = teamHistories[teamId] || []
    
    if (history.length === 0) {
      return { totalGames: 0, avgWpm: 0, avgAccuracy: 0, uniquePlayers: 0 }
    }
    
    const uniquePlayers = new Set(history.map(entry => entry.username)).size
    const avgWpm = history.reduce((sum, entry) => sum + entry.wpm, 0) / history.length
    const avgAccuracy = history.reduce((sum, entry) => sum + entry.accuracy, 0) / history.length
    
    return {
      totalGames: history.length,
      avgWpm,
      avgAccuracy,
      uniquePlayers
    }
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Link href="/" className="flex items-center mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Enter the admin password to access detailed game statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={passwordError ? "border-red-500" : ""}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Link>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          
          <div className="flex items-center gap-2">
            <select 
              className="border rounded px-2 py-1 text-sm"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <Button size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Typing Game Admin Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
            <TabsTrigger value="players">Player Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-3">
              {teams.map(team => {
                const stats = getTeamStats(team.id)
                
                return (
                  <Card key={team.id} className={`border-l-4 ${team.color}`}>
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>
                        {stats.uniquePlayers} players, {stats.totalGames} games
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                            <p className="text-2xl font-bold">{team.points}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average WPM</p>
                            <p className="text-2xl font-bold">{stats.avgWpm.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average Accuracy</p>
                            <p className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Unique Players</p>
                            <p className="text-2xl font-bold">{stats.uniquePlayers}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-6">
              {teams.map(team => {
                const history = teamHistories[team.id] || []
                
                return (
                  <Card key={team.id}>
                    <CardHeader className={`bg-${team.color.split('-')[1]}-50 dark:bg-${team.color.split('-')[1]}-900/20`}>
                      <CardTitle>{team.name} - Detailed Results</CardTitle>
                      <CardDescription>
                        {history.length} total games
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-2 text-left">Time</th>
                              <th className="px-4 py-2 text-left">Player</th>
                              <th className="px-4 py-2 text-right">Words</th>
                              <th className="px-4 py-2 text-right">Correct</th>
                              <th className="px-4 py-2 text-right">Accuracy</th>
                              <th className="px-4 py-2 text-right">WPM</th>
                              <th className="px-4 py-2 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.length > 0 ? (
                              [...history]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((result, idx) => (
                                  <tr 
                                    key={idx} 
                                    className="border-b last:border-0 hover:bg-muted/20"
                                  >
                                    <td className="px-4 py-2 text-sm">{formatDate(result.date)}</td>
                                    <td className="px-4 py-2 font-medium">{result.username}</td>
                                    <td className="px-4 py-2 text-right">{result.wordsTyped}</td>
                                    <td className="px-4 py-2 text-right">{result.correctWords}</td>
                                    <td className="px-4 py-2 text-right">{result.accuracy.toFixed(1)}%</td>
                                    <td className="px-4 py-2 text-right">{result.wpm.toFixed(1)}</td>
                                    <td className="px-4 py-2 text-right font-bold">{result.points}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                  No results found for this team
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>
                  Performance statistics for all players across teams
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-left">Team</th>
                        <th className="px-4 py-2 text-right">Games</th>
                        <th className="px-4 py-2 text-right">Avg WPM</th>
                        <th className="px-4 py-2 text-right">Avg Accuracy</th>
                        <th className="px-4 py-2 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Gather all player data across teams
                        const playerMap = new Map()
                        
                        teams.forEach(team => {
                          const history = teamHistories[team.id] || []
                          
                          history.forEach(result => {
                            const playerKey = `${result.username}-${team.id}`
                            
                            if (!playerMap.has(playerKey)) {
                              playerMap.set(playerKey, {
                                username: result.username,
                                teamId: team.id,
                                teamName: team.name,
                                teamColor: team.color,
                                games: 0,
                                totalWpm: 0,
                                totalAccuracy: 0,
                                totalPoints: 0
                              })
                            }
                            
                            const playerData = playerMap.get(playerKey)
                            playerData.games += 1
                            playerData.totalWpm += result.wpm
                            playerData.totalAccuracy += result.accuracy
                            playerData.totalPoints += result.points
                          })
                        })
                        
                        // Convert to array and sort by points
                        const playerArray = Array.from(playerMap.values())
                          .map(player => ({
                            ...player,
                            avgWpm: player.totalWpm / player.games,
                            avgAccuracy: player.totalAccuracy / player.games
                          }))
                          .sort((a, b) => b.totalPoints - a.totalPoints)
                        
                        if (playerArray.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                No player data available
                              </td>
                            </tr>
                          )
                        }
                        
                        return playerArray.map((player, idx) => (
                          <tr 
                            key={`${player.username}-${player.teamId}`}
                            className="border-b last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-4 py-2 font-medium">{player.username}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${player.teamColor}`}></div>
                                {player.teamName}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">{player.games}</td>
                            <td className="px-4 py-2 text-right">{player.avgWpm.toFixed(1)}</td>
                            <td className="px-4 py-2 text-right">{player.avgAccuracy.toFixed(1)}%</td>
                            <td className="px-4 py-2 text-right font-bold">{player.totalPoints}</td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
