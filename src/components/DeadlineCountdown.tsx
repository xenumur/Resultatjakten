"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface DeadlineCountdownProps {
  date: string
}

export function DeadlineCountdown({ date }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const deadline = new Date(date)
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Passerad")
        setIsExpired(true)
        setIsUrgent(false)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      // Urgent if less than 24 hours left
      const isUrgentNow = diff < 1000 * 60 * 60 * 24
      setIsUrgent(isUrgentNow)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [date])

  if (!timeLeft) return (
    <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
  )

  return (
    <div className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
      isExpired 
        ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800' 
        : isUrgent 
          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 shadow-sm shadow-red-500/10' 
          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm shadow-indigo-500/10'
    }`}>
      <Clock className={`w-3 h-3 ${isUrgent && !isExpired ? 'animate-pulse' : ''}`} />
      <span>{timeLeft}</span>
    </div>
  )
}
