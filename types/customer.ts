/**
 * Customer Types
 * 
 * TypeScript definitions for customer data structures.
 * These will be replaced with Supabase-generated types when connecting to the database.
 */

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: Date
  licenseNumber?: string
  licenseExpiryDate?: Date
  totalBookings: number
  totalSpent: number
  joinedAt: Date
  lastBookingAt?: Date
  notes?: string
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
      customer.name.toLowerCase().includes(term) ||
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
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'totalBookings':
        aValue = a.totalBookings
        bValue = b.totalBookings
        break
      case 'totalSpent':
        aValue = a.totalSpent
        bValue = b.totalSpent
        break
      case 'joinedAt':
        aValue = new Date(a.joinedAt).getTime()
        bValue = new Date(b.joinedAt).getTime()
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


