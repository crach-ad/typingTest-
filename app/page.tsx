import { TypingGame } from "@/components/typing-game"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-64 h-64 mb-4 flex items-center justify-center">
          <svg 
            width="220" 
            height="220" 
            viewBox="0 0 220 220" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]"
          >
            {/* Keyboard Base */}
            <rect x="20" y="140" width="180" height="60" rx="10" stroke="url(#keyboard-gradient)" strokeWidth="2" fill="none" />
            
            {/* Keys */}
            <rect x="30" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="50" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="70" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="90" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="110" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="130" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="150" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="170" y="150" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            
            <rect x="40" y="170" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="60" y="170" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="80" y="170" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="100" y="170" width="60" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            <rect x="165" y="170" width="15" height="15" rx="2" stroke="url(#keys-gradient)" strokeWidth="2" fill="none" />
            
            {/* Flying Keys Animation */}
            <g className="animate-bounce opacity-80" style={{ animationDelay: "0.1s" }}>
              <rect x="40" y="90" width="20" height="20" rx="4" transform="rotate(-15 40 90)" stroke="url(#key1-gradient)" strokeWidth="2" fill="none" />
            </g>
            <g className="animate-bounce opacity-80" style={{ animationDelay: "0.3s" }}>
              <rect x="80" y="70" width="20" height="20" rx="4" transform="rotate(10 80 70)" stroke="url(#key2-gradient)" strokeWidth="2" fill="none" />
            </g>
            <g className="animate-bounce opacity-80" style={{ animationDelay: "0.5s" }}>
              <rect x="120" y="80" width="20" height="20" rx="4" transform="rotate(-5 120 80)" stroke="url(#key3-gradient)" strokeWidth="2" fill="none" />
            </g>
            <g className="animate-bounce opacity-80" style={{ animationDelay: "0.7s" }}>
              <rect x="160" y="95" width="20" height="20" rx="4" transform="rotate(15 160 95)" stroke="url(#key4-gradient)" strokeWidth="2" fill="none" />
            </g>
            
            {/* Gradients */}
            <defs>
              <linearGradient id="keyboard-gradient" x1="20" y1="140" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ec4899" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              
              <linearGradient id="keys-gradient" x1="30" y1="150" x2="185" y2="185" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
              
              <linearGradient id="key1-gradient" x1="40" y1="90" x2="60" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ef4444" />
              </linearGradient>
              
              <linearGradient id="key2-gradient" x1="80" y1="70" x2="100" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ec4899" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              
              <linearGradient id="key3-gradient" x1="120" y1="80" x2="140" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#10b981" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
              
              <linearGradient id="key4-gradient" x1="160" y1="95" x2="180" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Mr C's Typing Speed Challenge
        </h1>
        <p className="text-center text-muted-foreground mb-6">Test your typing skills and earn points for your team!</p>
      </div>
      <TypingGame />
    </main>
  )
}
