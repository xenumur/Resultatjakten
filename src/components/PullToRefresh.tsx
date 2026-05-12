'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const pullThreshold = 100

  useEffect(() => {
    // Check if we just refreshed
    const justRefreshed = sessionStorage.getItem('pull_refreshed')
    if (justRefreshed) {
      toast.success('Innehållet har uppdaterats!')
      sessionStorage.removeItem('pull_refreshed')
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we are at the very top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].pageY
      } else {
        startY.current = 0
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0 || isRefreshing) return

      const currentY = e.touches[0].pageY
      const distance = currentY - startY.current

      if (distance > 0) {
        // Apply resistance (move less than finger)
        const newDistance = Math.min(distance * 0.4, pullThreshold + 20)
        setPullDistance(newDistance)
        
        // If we've started pulling down, prevent the default browser bounce
        if (distance > 10) {
          if (e.cancelable) e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (startY.current === 0 || isRefreshing) return

      if (pullDistance >= pullThreshold) {
        setIsRefreshing(true)
        sessionStorage.setItem('pull_refreshed', 'true')
        // Give the spinner a moment to show before reloading
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        setPullDistance(0)
      }
      startY.current = 0
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing])

  if (pullDistance <= 0 && !isRefreshing) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none pt-4"
      style={{ 
        transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
        opacity: Math.min(pullDistance / 40, 1),
        transition: isRefreshing ? 'none' : pullDistance === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none'
      }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-2.5 shadow-2xl ring-4 ring-indigo-500/10">
        <Loader2 
          className={`w-6 h-6 text-indigo-600 dark:text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} 
          style={{ 
            transform: isRefreshing ? 'none' : `rotate(${pullDistance * 3}deg)`,
            transition: isRefreshing ? 'none' : 'none'
          }}
        />
      </div>
    </div>
  )
}
