import { redirect } from 'next/navigation'

/**
 * Root page - redirects to login
 * 
 * This is a server component that redirects immediately.
 * No async operations are performed to prevent streaming errors.
 */
export default function HomePage() {
  redirect('/login')
}

