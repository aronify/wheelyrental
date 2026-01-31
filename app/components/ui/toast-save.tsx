'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Spinner } from '@/app/components/ui/spinner'
import { Button } from '@/app/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToastSaveProps extends React.HTMLAttributes<HTMLDivElement> {
  state: 'initial' | 'loading' | 'success'
  onReset?: () => void
  onSave?: () => void
  loadingText?: string
  successText?: string
  initialText?: string
  resetText?: string
  saveText?: string
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="text-current"
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <circle cx="9" cy="9" r="7.25" />
        <line x1="9" y1="12.819" x2="9" y2="8.25" />
        <path
          d="M9,6.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </svg>
  )
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 1,
}

export function ToastSave({
  state = 'initial',
  onReset,
  onSave,
  loadingText = 'Saving',
  successText = 'Changes saved',
  initialText = 'Unsaved changes',
  resetText = 'Reset',
  saveText = 'Save',
  className,
}: ToastSaveProps) {
  return (
    <motion.div
      className={cn(
        'inline-flex h-10 items-center justify-center overflow-hidden rounded-full',
        'bg-white/95 backdrop-blur',
        'border border-gray-200',
        'shadow-sm',
        className
      )}
      initial={false}
      animate={{ width: 'auto' }}
      transition={springConfig}
    >
      <div className="flex h-full items-center justify-between px-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            className="flex items-center gap-2 text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
          >
            {state === 'loading' && (
              <>
                <Spinner size="sm" color="slate" />
                <span className="text-[13px] font-normal leading-tight whitespace-nowrap">
                  {loadingText}
                </span>
              </>
            )}
            {state === 'success' && (
              <>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 border border-green-200">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-[13px] font-normal leading-tight whitespace-nowrap">
                  {successText}
                </span>
              </>
            )}
            {state === 'initial' && (
              <>
                <span className="text-gray-500">
                  <InfoIcon />
                </span>
                <span className="text-[13px] font-normal leading-tight whitespace-nowrap">
                  {initialText}
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {state === 'initial' && (
            <motion.div
              className="ml-2 flex items-center gap-2"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ ...springConfig, opacity: { duration: 0 } }}
            >
              <Button
                type="button"
                onClick={onReset}
                variant="ghost"
                className="h-7 rounded-full px-3 text-[13px] font-normal hover:bg-gray-100"
              >
                {resetText}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                className="h-7 rounded-full px-3 text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                {saveText}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
