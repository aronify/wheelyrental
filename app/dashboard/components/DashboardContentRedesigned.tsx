'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Booking } from '@/types/booking'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardContentProps {
  userEmail: string
  bookings: Booking[]
  agencyName?: string
}

export default function DashboardContentRedesigned({ userEmail, bookings, agencyName }: DashboardContentProps) {
  const { t } = useLanguage()

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'picked_up').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    
    const todayBookings = bookings.filter(b => {
      const pickupDate = new Date(b.pickupDate)
      const dropoffDate = new Date(b.dropoffDate)
      return (pickupDate >= today && pickupDate < new Date(today.getTime() + 86400000)) ||
             (dropoffDate >= today && dropoffDate < new Date(today.getTime() + 86400000))
    }).length

    const thisMonthBookings = bookings.filter(b => {
      const pickupDate = new Date(b.pickupDate)
      return pickupDate >= thisMonth
    }).length

    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

    const thisMonthRevenue = bookings
      .filter(b => {
        const pickupDate = new Date(b.pickupDate)
        return pickupDate >= thisMonth && (b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned')
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      todayBookings,
      thisMonthBookings,
      totalRevenue,
      thisMonthRevenue,
    }
  }, [bookings])

  // Get recent bookings
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [bookings])

  // Get upcoming pickups
  const upcomingPickups = useMemo(() => {
    const now = new Date()
    return bookings
      .filter(b => new Date(b.pickupDate) > now && (b.status === 'confirmed' || b.status === 'pending'))
      .sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime())
      .slice(0, 3)
  }, [bookings])

  // Chart Data: Revenue over last 6 months
  const revenueChartData = useMemo(() => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const year = date.getFullYear()
      
      const monthRevenue = bookings
        .filter(b => {
          const pickupDate = new Date(b.pickupDate)
          return pickupDate.getMonth() === date.getMonth() && 
                 pickupDate.getFullYear() === date.getFullYear() &&
                 (b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned')
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      
      months.push({
        month: `${monthName} '${year.toString().slice(-2)}`,
        revenue: Math.round(monthRevenue),
      })
    }
    
    return months
  }, [bookings])

  // Chart Data: Bookings by status
  const statusChartData = useMemo(() => {
    const statusCounts = {
      confirmed: 0,
      pending: 0,
      picked_up: 0,
      returned: 0,
      cancelled: 0,
    }
    
    bookings.forEach(b => {
      if (statusCounts[b.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[b.status as keyof typeof statusCounts]++
      }
    })
    
    return [
      { name: t.statusConfirmed || 'Confirmed', value: statusCounts.confirmed, color: '#10b981' },
      { name: t.statusPending || 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: t.statusPickedUp || 'Picked Up', value: statusCounts.picked_up, color: '#3b82f6' },
      { name: t.statusReturned || 'Returned', value: statusCounts.returned, color: '#8b5cf6' },
      { name: t.statusCancelled || 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' },
    ].filter(item => item.value > 0)
  }, [bookings, t])

  // Chart Data: Bookings per month (last 6 months)
  const bookingsChartData = useMemo(() => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const year = date.getFullYear()
      
      const monthBookings = bookings.filter(b => {
        const pickupDate = new Date(b.pickupDate)
        return pickupDate.getMonth() === date.getMonth() && 
               pickupDate.getFullYear() === date.getFullYear()
      }).length
      
      months.push({
        month: `${monthName} '${year.toString().slice(-2)}`,
        bookings: monthBookings,
      })
    }
    
    return months
  }, [bookings])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'picked_up':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'returned':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t.statusConfirmed
      case 'pending':
        return t.statusPending
      case 'picked_up':
        return t.statusPickedUp
      case 'returned':
        return t.statusReturned
      case 'cancelled':
        return t.statusCancelled
      default:
        return status
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const quickActions = [
    {
      title: t.addCar || 'Add Car',
      description: t.addNewCarToFleet || 'Add a new car to your fleet',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/cars',
      color: 'from-blue-600 to-blue-800',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-900',
    },
    {
      title: t.bookings || 'Bookings',
      description: t.manageAllBookings || 'Manage all your bookings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/bookings',
      color: 'from-green-600 to-green-800',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-900',
    },
    {
      title: t.calendar || 'Calendar',
      description: t.checkAvailability || 'Check car availability',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/calendar',
      color: 'from-purple-600 to-purple-800',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-900',
    },
    {
      title: t.customers || 'Customers',
      description: t.manageCustomers || 'View customer information',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/customers',
      color: 'from-orange-600 to-orange-800',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-900',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                {t.allTime || 'All Time'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalBookings}</p>
            <p className="text-sm text-gray-600">{t.totalBookings}</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-orange-900 bg-orange-100 px-3 py-1 rounded-full">
                {t.today || 'Today'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.todayBookings}</p>
            <p className="text-sm text-gray-600">{t.todayBookings || "Today's Activity"}</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
                {t.thisMonth || 'This Month'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.thisMonthBookings}</p>
            <p className="text-sm text-gray-600">{t.monthlyBookings || 'Monthly Bookings'}</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-green-900 bg-green-100 px-3 py-1 rounded-full">
                {t.thisMonth || 'This Month'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">€{stats.thisMonthRevenue.toFixed(0)}</p>
            <p className="text-sm text-gray-600">{t.monthlyRevenue || 'Monthly Revenue'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {t.quickActions || 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${action.bgColor} rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="relative">
                  <div className={`w-16 h-16 ${action.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={action.iconColor}>
                      {action.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-blue-900 font-semibold text-sm">
                    {t.goTo || 'Go to'} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {t.analytics || 'Analytics'}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.revenueOverTime || 'Revenue Over Time'}</h3>
                  <p className="text-sm text-gray-600">{t.last6Months || 'Last 6 months'}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e3a8a', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [`€${value}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings Status Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.bookingsByStatus || 'Bookings by Status'}</h3>
                  <p className="text-sm text-gray-600">{t.allTimeDistribution || 'All-time distribution'}</p>
                </div>
              </div>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e3a8a', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-400">
                  <p>{t.noDataAvailable || 'No data available'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bookings Bar Chart - Full Width */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.bookingsTrend || 'Bookings Trend'}</h3>
                <p className="text-sm text-gray-600">{t.last6Months || 'Last 6 months'}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e3a8a', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [value, 'Bookings']}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="#f97316" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {t.recentBookings}
              </h2>
              <Link
                href="/bookings"
                className="text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors"
              >
                {t.viewAll} →
              </Link>
            </div>

            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">{t.noBookingsYet || 'No bookings yet'}</p>
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.car?.make} {booking.car?.model}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">€{booking.totalPrice?.toFixed(0)}</p>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Pickups */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {t.upcomingPickups || 'Upcoming Pickups'}
              </h2>
              <Link
                href="/calendar"
                className="text-sm font-semibold text-green-900 hover:text-green-700 transition-colors"
              >
                {t.viewCalendar} →
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingPickups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">{t.noUpcomingPickups || 'No upcoming pickups'}</p>
                </div>
              ) : (
                upcomingPickups.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border-l-4 border-green-500"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.car?.make} {booking.car?.model}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(booking.pickupDate)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

