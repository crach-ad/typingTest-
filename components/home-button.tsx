"use client"

import { Home } from "lucide-react"
import { motion } from "framer-motion"

interface HomeButtonProps {
  onClick: () => void
}

export function HomeButton({ onClick }: HomeButtonProps) {
  return (
    <motion.button
      className="fixed top-4 left-4 z-10 flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      aria-label="Return to home"
    >
      {/* Keyboard key styling */}
      <div className="relative w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)] dark:shadow-[inset_0_-2px_0_rgba(0,0,0,0.4)]">
        <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {/* Top highlight effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white dark:bg-gray-500 opacity-50 rounded-t-md"></div>
      </div>
    </motion.button>
  )
}
