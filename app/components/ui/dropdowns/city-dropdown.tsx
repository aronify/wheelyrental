'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, MapPin } from 'lucide-react'

// Albanian cities list
const ALBANIAN_CITIES = [
  'Tirana',
  'Durres',
  'Vlore',
  'Shkoder',
  'Elbasan',
  'Fier',
  'Korce',
  'Berat',
  'Lushnje',
  'Kavaje',
  'Gjirokaster',
  'Sarande',
  'Kukes',
  'Lezhe',
  'Pogradec',
  'Patos',
  'Ballsh',
  'Burrel',
  'Cerrik',
  'Divjake',
  'Gramsh',
  'Himare',
  'Klos',
  'Kruje',
  'Librazhd',
  'Maliq',
  'Memaliaj',
  'Peqin',
  'Permet',
  'Peshkopi',
  'Prrenjas',
  'Roskovec',
  'Rreshen',
  'Selenice',
  'Tepelene',
  'Ura Vajgurore',
  'Vau i Dejes',
  'Shijak',
  'Bulqize',
  'Delvine',
  'Fushe-Kruje',
  'Fushe-Arrez',
  'Kelcyre',
  'Konispol',
  'Koplik',
  'Krume',
  'Lac',
  'Libohove',
  'Orikum',
  'Polican',
  'Puke',
  'Rubik'
]

interface CityDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  error?: boolean
}

export default function CityDropdown({
  value,
  onChange,
  placeholder = 'Select a city',
  className = '',
  disabled = false,
  required = false,
  error = false,
}: CityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALBANIAN_CITIES
    }
    const query = searchQuery.toLowerCase().trim()
    return ALBANIAN_CITIES.filter(city =>
      city.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Calculate dropdown position to prevent overflow
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const menuHeight = 320 // Approximate height with search
      
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // Clear search when closing
      setSearchQuery('')
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedCity = value || ''

  const handleCitySelect = (city: string) => {
    onChange(city)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white flex items-center justify-between hover:border-blue-400 min-h-[44px] text-base sm:text-sm touch-manipulation ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedCity ? (
            <span className="text-sm font-medium truncate">{selectedCity}</span>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            ref={menuRef}
            className={`absolute z-50 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-slide-in-top ${
              dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="overflow-y-auto max-h-64" style={{ scrollbarWidth: 'thin' }}>
              {filteredCities.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No cities found matching "{searchQuery}"
                </div>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-2.5 hover:bg-blue-50 transition-colors min-h-[44px] touch-manipulation ${
                      value === city
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : 'text-gray-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm truncate">{city}</span>
                    {value === city && (
                      <svg className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


