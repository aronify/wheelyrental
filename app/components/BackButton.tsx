'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
}

export default function BackButton({ href, label, className = '' }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
        />
      </svg>
      {label || 'Back'}
    </button>
  )
}


