"use client"

import { motion } from "framer-motion"
import type { Team } from "@/components/typing-game"

interface TeamSelectorProps {
  teams: Team[]
  selectedTeam: Team | null
  onSelectTeam: (team: Team) => void
}

export function TeamSelector({ teams, selectedTeam, onSelectTeam }: TeamSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {teams.map((team) => (
        <motion.div
          key={team.id}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedTeam?.id === team.id
              ? `border-${team.color.split("-")[1]}-600 shadow-md`
              : "border-gray-200 dark:border-gray-700"
          }`}
          onClick={() => onSelectTeam(team)}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: team.id === "yellow" ? 0 : team.id === "blue" ? 0.1 : 0.2,
          }}
        >
          <motion.div
            className={`w-full h-4 ${team.color} rounded mb-2`}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <div className="text-center font-medium">{team.name}</div>
          <motion.div
            className="text-center text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {team.points} points
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
