'use client'

import { useState, useMemo } from 'react'
import { Customer } from '@/types/customer'
import { searchCustomers, sortCustomers } from '@/types/customer'
import { useLanguage } from '@/contexts/LanguageContext'
import BackButton from '@/app/components/BackButton'
import Breadcrumbs from '@/app/components/Breadcrumbs'

interface CustomersPageProps {
  initialCustomers: Customer[]
}

export default function CustomersPage({ initialCustomers }: CustomersPageProps) {
  const { t, language } = useLanguage()
  const [customers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalBookings' | 'totalSpent' | 'joinedAt' | 'lastBookingAt'>('totalSpent')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = searchCustomers(customers, searchTerm)
    result = sortCustomers(result, sortBy, 'desc')
    return result
  }, [customers, searchTerm, sortBy])

  // Calculate stats
  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgSpentPerCustomer = totalRevenue / totalCustomers
  const topCustomers = sortCustomers(customers, 'totalSpent', 'desc').slice(0, 5)

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
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label={t.back} />
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.customers}</h1>
        <p className="text-gray-600">{t.customersSubtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.customers}</p>
              <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.totalRevenue}</p>
              <p className="text-3xl font-bold text-gray-900">€{totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-green-50 text-green-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg. {t.totalSpent}</p>
              <p className="text-3xl font-bold text-gray-900">€{avgSpentPerCustomer.toFixed(0)}</p>
            </div>
            <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.totalBookings}</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + c.totalBookings, 0)}
              </p>
            </div>
            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.searchCustomers}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t.searchCustomers}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.sortBy}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="totalSpent">{t.sortBySpent}</option>
              <option value="totalBookings">{t.sortByBookings}</option>
              <option value="name">{t.sortByName}</option>
              <option value="joinedAt">{t.sortByJoined}</option>
              <option value="lastBookingAt">{t.sortByLastBooking}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noCustomersFound}</h3>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.customerName}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.email}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.phone}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.totalBookings}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.totalSpent}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.lastBookingAt}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{customer.phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          {customer.totalBookings}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        €{customer.totalSpent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(customer.lastBookingAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {t.viewDetails}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">€{customer.totalSpent.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">{customer.totalBookings} {t.bookings.toLowerCase()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                  >
                    {t.viewDetails}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedCustomer(null)}
            />

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t.customerDetails}</h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h4>
                    <p className="text-gray-500">{selectedCustomer.city}, {selectedCustomer.country}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.email}</p>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.phone}</p>
                    <p className="text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.totalBookings}</p>
                    <p className="text-gray-900 font-semibold">{selectedCustomer.totalBookings}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.totalSpent}</p>
                    <p className="text-gray-900 font-semibold">€{selectedCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.joinedAt}</p>
                    <p className="text-gray-900">{formatDate(selectedCustomer.joinedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.lastBookingAt}</p>
                    <p className="text-gray-900">{formatDate(selectedCustomer.lastBookingAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.licenseNumber}</p>
                    <p className="text-gray-900">{selectedCustomer.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.licenseExpiryDate}</p>
                    <p className="text-gray-900">{formatDate(selectedCustomer.licenseExpiryDate)}</p>
                  </div>
                </div>

                {selectedCustomer.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.address}</p>
                    <p className="text-gray-900">{selectedCustomer.address}</p>
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t.notes}</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


