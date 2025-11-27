'use client'

import { Search, Filter } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { BookingStatus } from '@/types/booking'
import DatePicker from '@/app/components/DatePicker'

interface BookingsFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: BookingStatus | 'all'
  onStatusChange: (status: BookingStatus | 'all') => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export default function BookingsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: BookingsFilterBarProps) {
  const { t } = useLanguage()

  const statusOptions: Array<{ value: BookingStatus | 'all'; label: string }> = [
    { value: 'all', label: t.all },
    { value: 'pending', label: t.statusPending },
    { value: 'confirmed', label: t.statusConfirmed },
    { value: 'picked_up', label: t.statusPickedUp },
    { value: 'returned', label: t.statusReturned },
    { value: 'cancelled', label: t.statusCancelled },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="inline w-4 h-4 mr-1" />
            {t.searchByCustomerOrCar}
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchByCustomerOrCar}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="inline w-4 h-4 mr-1" />
            {t.filterByStatus}
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as BookingStatus | 'all')}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all text-gray-900 bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
          <div className="sm:w-56">
            <DatePicker
              label={t.from}
              value={dateFrom}
              onChange={onDateFromChange}
              placeholder={t.selectDate || 'Select date'}
            />
          </div>
          <div className="sm:w-56">
            <DatePicker
              label={t.to}
              value={dateTo}
              onChange={onDateToChange}
              placeholder={t.selectDate || 'Select date'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

