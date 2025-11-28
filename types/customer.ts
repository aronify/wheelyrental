/**
 * Customer Types
 * 
 * TypeScript definitions for customer data structures.
 * These will be replaced with Supabase-generated types when connecting to the database.
 */

export interface Customer {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  phone: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: Date
  licenseNumber?: string
  licenseExpiryDate?: Date
  totalBookings?: number
  totalSpent?: number
  joinedAt?: Date
  lastBookingAt?: Date
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Helper function to search customers
 */
export function searchCustomers(customers: Customer[], searchTerm: string): Customer[] {
  if (!searchTerm.trim()) {
    return customers
  }

  const term = searchTerm.toLowerCase()
  return customers.filter(
    (customer) =>
      (customer.name?.toLowerCase().includes(term)) ||
      (customer.firstName?.toLowerCase().includes(term)) ||
      (customer.lastName?.toLowerCase().includes(term)) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term) ||
      customer.licenseNumber?.toLowerCase().includes(term)
  )
}

/**
 * Helper function to sort customers
 */
export function sortCustomers(
  customers: Customer[],
  sortBy: 'name' | 'totalBookings' | 'totalSpent' | 'joinedAt' | 'lastBookingAt',
  order: 'asc' | 'desc' = 'desc'
): Customer[] {
  const sorted = [...customers].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'name':
        aValue = (a.name || `${a.firstName || ''} ${a.lastName || ''}`).trim().toLowerCase()
        bValue = (b.name || `${b.firstName || ''} ${b.lastName || ''}`).trim().toLowerCase()
        break
      case 'totalBookings':
        aValue = a.totalBookings || 0
        bValue = b.totalBookings || 0
        break
      case 'totalSpent':
        aValue = a.totalSpent || 0
        bValue = b.totalSpent || 0
        break
      case 'joinedAt':
        aValue = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
        bValue = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
        break
      case 'lastBookingAt':
        aValue = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0
        bValue = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0
        break
      default:
        return 0
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
}


