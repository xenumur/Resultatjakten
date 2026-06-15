'use client'

import { useEffect } from 'react'

export function HapticFeedback() {
  useEffect(() => {
    // Check if the device and browser support the vibration API
    if (typeof window === 'undefined' || !('vibrate' in navigator)) {
      return
    }

    const handleTouchStart = (e: TouchEvent) => {
      try {
        const target = e.target as HTMLElement
        // Identify if the touched element or its ancestors are interactive buttons, links or fields
        const interactive = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]')
        
        if (interactive) {
          // Check if it's not disabled
          const isDisabled = 
            interactive.hasAttribute('disabled') || 
            interactive.classList.contains('cursor-not-allowed') ||
            (interactive as any).disabled
            
          if (!isDisabled) {
            // Trigger a very short, crisp 10ms haptic tick
            navigator.vibrate(10)
          }
        }
      } catch (err) {
        // Silently fail if vibration is blocked or fails
      }
    }

    // Capture touch start for responsive mobile haptics
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  return null
}
