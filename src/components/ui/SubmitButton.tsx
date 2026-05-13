'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loadingText?: string
}

export function SubmitButton({ children, loadingText = 'Sparar...', className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`relative inline-flex items-center justify-center transition-all ${className} ${pending ? 'opacity-80 cursor-not-allowed scale-[0.98]' : ''}`}
    >
      {pending && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? loadingText : children}
      </span>
    </button>
  )
}
