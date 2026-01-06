'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  values: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  error?: boolean
  icon?: React.ReactNode
}

export default function MultiSelectDropdown({
  values,
  onChange,
  options,
  placeholder = 'Select options',
  className = '',
  disabled = false,
  required = false,
  error = false,
  icon,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [maxHeight, setMaxHeight] = useState(240)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate menu position and available space (like color dropdown - fixed positioning)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const calculatePosition = () => {
        if (!buttonRef.current) return
        const buttonRect = buttonRef.current.getBoundingClientRect()
        if (!buttonRect) return

        // Calculate position for fixed dropdown (overlays content like color dropdown)
        // getBoundingClientRect() returns viewport-relative coordinates
        // For fixed positioning, we use these directly (no scroll offset needed)
        setMenuPosition({
          top: buttonRect.bottom + 4, // 4px gap below button (viewport-relative)
          left: buttonRect.left, // Viewport-relative
          width: buttonRect.width
        })

        // Calculate max height based on viewport space
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - buttonRect.bottom - 16
        const spaceAbove = buttonRect.top - 16
        
        // Use space below if available, otherwise space above
        const availableSpace = spaceBelow > 100 ? spaceBelow : spaceAbove
        
        // Ensure minimum height and maximum constraint
        const calculatedHeight = Math.max(120, Math.min(300, availableSpace))
        setMaxHeight(calculatedHeight)
      }

      calculatePosition()

      // Recalculate on scroll/resize
      const handleResize = () => calculatePosition()
      window.addEventListener('scroll', handleResize, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleResize, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Use a small delay to allow option clicks to register first
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && menuRef.current) {
      const optionElement = menuRef.current.querySelector(
        `[data-option-index="${highlightedIndex}"]`
      ) as HTMLElement
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex(0)
      return
    }

    if (!isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => {
        const next = prev + 1
        return next >= options.length ? 0 : next
      })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => {
        const next = prev - 1
        return next < 0 ? options.length - 1 : next
      })
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        toggleOption(options[highlightedIndex].value)
      }
    }
  }

  // Reset highlight when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(options.length > 0 ? 0 : -1)
    } else {
      setHighlightedIndex(-1)
    }
  }, [isOpen, options.length])

  const toggleOption = (value: string) => {
    if (disabled) return
    
    const newValues = values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value]
    
    onChange(newValues)
  }

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const newValues = values.filter(v => v !== value)
    onChange(newValues)
  }

  const selectedOptions = options.filter(opt => values.includes(opt.value))

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg border transition-all duration-200
          flex items-center justify-between gap-3 min-h-[48px]
          bg-white
          ${error 
            ? 'border-red-300 bg-red-50/50' 
            : isOpen
              ? 'border-blue-500/60 shadow-sm'
              : 'border-gray-200 hover:border-gray-300'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          }
        `}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {icon && (
            <span className={`flex-shrink-0 transition-colors ${
              selectedOptions.length === 0 ? 'text-gray-400' : 'text-blue-600'
            }`}>
              {icon}
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
            {selectedOptions.length === 0 ? (
              <span className="text-sm font-medium text-gray-400">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200"
                  >
                    <span className="truncate max-w-[120px]">{opt.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-800 focus:outline-none transition-colors cursor-pointer"
                      onClick={(e) => removeOption(opt.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          removeOption(opt.value, e as any)
                        }
                      }}
                      aria-label={`Remove ${opt.label}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </span>
                ))}
                {selectedOptions.length > 2 && (
                  <span className="text-xs text-gray-600 font-semibold px-2">
                    +{selectedOptions.length - 2} {selectedOptions.length === 3 ? 'more' : 'more'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
            isOpen 
              ? 'rotate-180 text-blue-600' 
              : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop - like color dropdown */}
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOpen(false)}
          />
          {/* Fixed positioned menu - overlays content like color dropdown */}
          {/* Using very high z-index to ensure it appears above modal and all content */}
          <div
            ref={menuRef}
            className="fixed z-[99999] bg-white rounded-lg shadow-2xl border-2 border-gray-300 overflow-hidden"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              maxHeight: `${maxHeight}px`
            }}
          >
            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: `${maxHeight}px` }}>
            <div className="py-1.5">
              {options.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  No options available
                </div>
              ) : (
                options.map((option, idx) => {
                  const isSelected = values.includes(option.value)
                  const isHighlighted = highlightedIndex === idx
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-option-index={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleOption(option.value)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                      }}
                      className={`
                        w-full text-left px-4 py-2.5 rounded-md transition-all duration-150
                        flex items-center gap-3 min-h-[44px]
                        cursor-pointer
                        ${isSelected 
                          ? 'bg-blue-50 text-blue-900' 
                          : isHighlighted
                            ? 'bg-gray-50 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      {/* Checkbox */}
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                        transition-all duration-150
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg 
                            className="w-2.5 h-2.5 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={3.5} 
                              d="M5 13l4 4L19 7" 
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate ${
                        isSelected ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
