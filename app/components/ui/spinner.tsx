'use client'

import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'slate' | 'blue' | 'red' | 'green' | 'white'
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
} as const

const strokeClasses = {
  slate: 'stroke-foreground',
  blue: 'stroke-blue-500',
  red: 'stroke-red-500',
  green: 'stroke-emerald-500',
  white: 'stroke-background',
} as const

export function Spinner({ size = 'md', color = 'slate' }: SpinnerProps) {
  return (
    <div aria-label="Loading..." role="status">
      <Loader
        className={cn(
          'animate-spin',
          sizeClasses[size],
          strokeClasses[color]
        )}
      />
    </div>
  )
}
