import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import Link from 'next/link'
import CreateUserForm from '@/app/components/domain/admin/create-user-form'

export const dynamic = 'force-dynamic'

/**
 * Admin Dashboard – Create User
 *
 * Only accessible to users with app_metadata.role === 'admin'.
 * Non-admin users are redirected to the partner dashboard.
 */
export default async function AdminPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = (user.app_metadata?.role as string) ?? null
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Admin – Create User</h1>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateUserForm />
      </main>
    </div>
  )
}
