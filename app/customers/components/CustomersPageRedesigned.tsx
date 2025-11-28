'use client'

import { useState, useMemo } from 'react'
import { Customer } from '@/types/customer'
import { searchCustomers, sortCustomers } from '@/types/customer'
import { useLanguage } from '@/contexts/LanguageContext'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { 
  Users, 
  TrendingUp, 
  Search, 
  ArrowUpDown, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileText,
  X,
  User,
  Home,
  BadgeCheck,
  Download,
  Edit,
  Check
} from 'lucide-react'

interface CustomersPageRedesignedProps {
  initialCustomers: Customer[]
}

// Mock/Fake customers for frontend display
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'mock-1',
    name: 'Emma Thompson',
    email: 'emma.thompson@example.com',
    phone: '+1 (555) 123-4567',
    address: '456 Park Avenue',
    city: 'San Francisco',
    country: 'USA',
    licenseNumber: 'CA-DL-789456',
    licenseExpiryDate: new Date('2027-08-15'),
    totalBookings: 12,
    totalSpent: 3450,
    joinedAt: new Date('2023-03-15'),
    lastBookingAt: new Date('2024-11-20'),
    notes: 'Premium customer, prefers luxury sedans'
  },
  {
    id: 'mock-2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 234-5678',
    address: '789 Market Street',
    city: 'Seattle',
    country: 'USA',
    licenseNumber: 'WA-DL-123789',
    licenseExpiryDate: new Date('2026-12-30'),
    totalBookings: 8,
    totalSpent: 2100,
    joinedAt: new Date('2023-06-20'),
    lastBookingAt: new Date('2024-11-15'),
    notes: 'Business traveler, frequent weekend rentals'
  },
  {
    id: 'mock-3',
    name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@example.com',
    phone: '+1 (555) 345-6789',
    address: '321 Ocean Drive',
    city: 'Miami',
    country: 'USA',
    licenseNumber: 'FL-DL-456123',
    licenseExpiryDate: new Date('2028-04-22'),
    totalBookings: 15,
    totalSpent: 4200,
    joinedAt: new Date('2022-11-10'),
    lastBookingAt: new Date('2024-11-25'),
    notes: 'VIP customer, always requests SUVs for family trips'
  },
  {
    id: 'mock-4',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 456-7890',
    address: '654 Broadway',
    city: 'New York',
    country: 'USA',
    licenseNumber: 'NY-DL-789012',
    licenseExpiryDate: new Date('2026-09-18'),
    totalBookings: 5,
    totalSpent: 1850,
    joinedAt: new Date('2024-02-14'),
    lastBookingAt: new Date('2024-10-30'),
    notes: 'New customer, prefers compact cars'
  },
  {
    id: 'mock-5',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@example.com',
    phone: '+1 (555) 567-8901',
    address: '987 Highland Avenue',
    city: 'Austin',
    country: 'USA',
    licenseNumber: 'TX-DL-345678',
    licenseExpiryDate: new Date('2027-11-05'),
    totalBookings: 20,
    totalSpent: 6800,
    joinedAt: new Date('2022-08-25'),
    lastBookingAt: new Date('2024-11-28'),
    notes: 'Long-term customer, excellent payment history'
  },
  {
    id: 'mock-6',
    name: 'Daniel Kim',
    email: 'daniel.kim@example.com',
    phone: '+1 (555) 678-9012',
    address: '159 Tech Boulevard',
    city: 'San Jose',
    country: 'USA',
    licenseNumber: 'CA-DL-901234',
    licenseExpiryDate: new Date('2026-06-12'),
    totalBookings: 7,
    totalSpent: 2450,
    joinedAt: new Date('2023-09-08'),
    lastBookingAt: new Date('2024-11-10'),
    notes: 'Tech professional, prefers electric vehicles'
  },
  {
    id: 'mock-7',
    name: 'Isabella Brown',
    email: 'isabella.brown@example.com',
    phone: '+1 (555) 789-0123',
    address: '753 Lake Shore Drive',
    city: 'Chicago',
    country: 'USA',
    licenseNumber: 'IL-DL-567890',
    licenseExpiryDate: new Date('2028-02-28'),
    totalBookings: 18,
    totalSpent: 5300,
    joinedAt: new Date('2022-12-01'),
    lastBookingAt: new Date('2024-11-22'),
    notes: 'Corporate account, monthly bookings'
  },
  {
    id: 'mock-8',
    name: 'Ryan Anderson',
    email: 'ryan.anderson@example.com',
    phone: '+1 (555) 890-1234',
    address: '852 Desert Road',
    city: 'Phoenix',
    country: 'USA',
    licenseNumber: 'AZ-DL-234567',
    licenseExpiryDate: new Date('2027-07-19'),
    totalBookings: 3,
    totalSpent: 980,
    joinedAt: new Date('2024-07-15'),
    lastBookingAt: new Date('2024-09-28'),
    notes: 'Occasional renter, summer vacations only'
  }
]

export default function CustomersPageRedesigned({ initialCustomers }: CustomersPageRedesignedProps) {
  const { t, language } = useLanguage()
  
  // Combine real customers with mock customers
  const allCustomers = [...initialCustomers, ...MOCK_CUSTOMERS]
  const [customers, setCustomers] = useState<Customer[]>(allCustomers)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalBookings' | 'totalSpent' | 'joinedAt' | 'lastBookingAt'>('name')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = searchCustomers(customers, searchTerm)
    result = sortCustomers(result, sortBy, 'desc')
    return result
  }, [customers, searchTerm, sortBy])

  // Handle opening customer details
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditingNotes(customer.notes || '')
    setIsEditingNotes(false)
  }

  // Handle saving notes
  const handleSaveNotes = async () => {
    if (!selectedCustomer) return
    
    setIsSavingNotes(true)
    try {
      // Update customer notes in state
      const updatedCustomers = customers.map(c => 
        c.id === selectedCustomer.id ? { ...c, notes: editingNotes } : c
      )
      setCustomers(updatedCustomers)
      setSelectedCustomer({ ...selectedCustomer, notes: editingNotes })
      setIsEditingNotes(false)
      
      // TODO: Add API call to save notes to database if needed
      // await updateCustomerNotes(selectedCustomer.id, editingNotes)
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Handle download license
  const handleDownloadLicense = (customer: Customer) => {
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer'
    // Create a simple text file with license information
    const licenseData = `
DRIVER'S LICENSE INFORMATION
============================

Customer Name: ${customerName}
License Number: ${customer.licenseNumber}
Expiry Date: ${formatDate(customer.licenseExpiryDate)}
Date of Birth: ${customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'N/A'}

Contact Information:
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address || 'N/A'}
City: ${customer.city}
Country: ${customer.country}

Downloaded on: ${new Date().toLocaleString()}
    `.trim()

    // Create blob and download
    const blob = new Blob([licenseData], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `license-${customerName.replace(/\s+/g, '-')}-${customer.licenseNumber}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Calculate stats
  const totalCustomers = customers.length

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white/90 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{t.customers}</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base md:text-lg mb-4 sm:mb-6">{t.customersSubtitle || 'Manage your customer database'}</p>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-2xl sm:text-3xl font-bold text-white/90">{totalCustomers}</span>
              <span className="text-blue-100 text-xs sm:text-sm">{t.customers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchCustomers || 'Search customers...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-56">
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none text-sm"
              >
                <option value="name">{t.sortByName || 'Sort by Name'}</option>
                <option value="joinedAt">{t.sortByJoined || 'Sort by Joined'}</option>
                <option value="lastBookingAt">{t.sortByLastBooking || 'Sort by Last Booking'}</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noCustomersFound || 'No customers found'}</h3>
          <p className="text-gray-500">{t.noCustomersFound || 'Try adjusting your search'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-400 cursor-pointer overflow-hidden"
              onClick={() => handleCustomerClick(customer)}
            >
              <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-5">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform">
                    {(customer.name || customer.firstName || customer.email || 'C').charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="truncate">{customer.city}, {customer.country}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.lastBookingAt && (
                      <div className="flex items-center gap-1.5 text-gray-500 w-full sm:w-auto">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs">{t.lastBookingAt || 'Last'}: {customer.lastBookingAt ? formatDate(customer.lastBookingAt) : 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCustomerClick(customer)
                    }}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-800 transition-all flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t.viewDetails || 'View'}</span>
                    <span className="sm:hidden">View</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                      {(selectedCustomer.name || selectedCustomer.firstName || selectedCustomer.email || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.customerDetails || 'Customer Details'}</h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">{selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      {t.contactInformation || 'Personal Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const fullName = selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()
                        const nameParts = fullName ? fullName.trim().split(/\s+/) : []
                        const firstName = selectedCustomer.firstName || nameParts[0] || ''
                        const surname = selectedCustomer.lastName || nameParts.slice(1).join(' ') || ''
                        return (
                          <>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.fullName || 'First Name'}</p>
                              <p className="text-gray-900 font-medium">{firstName || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.surname || 'Surname'}</p>
                              <p className="text-gray-900 font-medium">{surname || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.dateOfBirth || 'Date of Birth'}</p>
                              <p className="text-gray-900 font-medium">
                                {selectedCustomer.dateOfBirth ? formatDate(selectedCustomer.dateOfBirth) : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.nationality || 'Nationality'}</p>
                              <p className="text-gray-900 font-medium">{selectedCustomer.country || 'N/A'}</p>
                            </div>
                            {selectedCustomer.dateOfBirth && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.age || 'Age'}</p>
                                <p className="text-gray-900 font-medium">
                                  {(() => {
                                    const today = new Date()
                                    const birthDate = new Date(selectedCustomer.dateOfBirth!)
                                    let age = today.getFullYear() - birthDate.getFullYear()
                                    const monthDiff = today.getMonth() - birthDate.getMonth()
                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                      age--
                                    }
                                    return age
                                  })()} {t.years || 'years'}
                                </p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      {t.contactInformation || 'Contact Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.email || 'Email'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.phone || 'Phone'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      {t.location || 'Location'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.city || 'City'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.city}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.country || 'Country'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.country}</p>
                      </div>
                      {selectedCustomer.address && (
                        <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.address || 'Address'}</p>
                          <p className="text-gray-900 font-medium">{selectedCustomer.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* License Information */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-orange-600" />
                        {t.licenseNumber || 'License Information'}
                      </h4>
                      <button
                        onClick={() => handleDownloadLicense(selectedCustomer)}
                        className="group relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white font-semibold rounded-xl px-5 py-2.5 hover:from-blue-800 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2.5 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Download className="w-4 h-4 relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10 text-sm">{t.downloadLicense || 'Download License'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.licenseNumber || 'License Number'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.licenseNumber}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.licenseExpiryDate || 'Expiry Date'}</p>
                        <p className="text-gray-900 font-medium">{formatDate(selectedCustomer.licenseExpiryDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      {t.dates || 'Important Dates'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.joinedAt || 'Joined'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.joinedAt ? formatDate(selectedCustomer.joinedAt) : 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.lastBookingAt || 'Last Booking'}</p>
                        <p className="text-gray-900 font-medium">{selectedCustomer.lastBookingAt ? formatDate(selectedCustomer.lastBookingAt) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes - Editable */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        {t.notes || 'Notes'}
                      </h4>
                      {!isEditingNotes && (
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <Edit className="w-4 h-4" />
                          {t.edit || 'Edit'}
                        </button>
                      )}
                    </div>
                    
                    {isEditingNotes ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          placeholder={t.addNotes || 'Add notes about this customer...'}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white shadow-sm transition-all"
                          rows={5}
                          autoFocus
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="group relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white font-semibold rounded-xl px-6 py-2.5 hover:from-blue-800 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <Check className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{isSavingNotes ? (t.saving || 'Saving...') : (t.save || 'Save')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingNotes(false)
                              setEditingNotes(selectedCustomer?.notes || '')
                            }}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                          >
                            {t.cancel || 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingNotes(true)}
                        className="group relative bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 min-h-[120px]"
                      >
                        {editingNotes || selectedCustomer?.notes ? (
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {editingNotes || selectedCustomer?.notes}
                          </p>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileText className="w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                            <p className="text-gray-500 text-sm group-hover:text-blue-600 transition-colors">
                              {t.clickToAddNotes || 'Click to add notes about this customer...'}
                            </p>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-blue-900 text-white p-2 rounded-lg shadow-lg">
                            <Edit className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors text-sm sm:text-base"
                  >
                    {t.close || 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

