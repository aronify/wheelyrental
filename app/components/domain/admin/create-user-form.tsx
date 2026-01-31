'use client'

import { useState, useEffect, FormEvent } from 'react'

const GENERIC_ERROR = 'Unable to create user. Please check inputs or permissions.'

type CompanyOption = { id: string; name: string }

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'member', label: 'Partner (member)' },
  { value: 'admin', label: 'Company admin' },
  { value: 'owner', label: 'Owner' },
]

export default function CreateUserForm() {
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('member')
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/admin/companies')
        if (!res.ok) {
          if (!cancelled) setCompanies([])
          return
        }
        const data = await res.json()
        if (!cancelled && Array.isArray(data.companies)) {
          setCompanies(data.companies)
          if (data.companies.length > 0) {
            setCompanyId((prev) => (prev ? prev : data.companies[0].id))
          }
        }
      } catch {
        if (!cancelled) setCompanies([])
      } finally {
        if (!cancelled) setLoadingCompanies(false)
      }
    }
    fetchCompanies()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          company_id: companyId,
          role, // company_members.role: member | admin | owner
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'User created. They will receive an email to set their password.' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: data.error || GENERIC_ERROR })
      }
    } catch {
      setMessage({ type: 'error', text: GENERIC_ERROR })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email (required)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none disabled:bg-gray-50"
            placeholder="user@company.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
            Company (required)
          </label>
          <select
            id="company_id"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            disabled={submitting || loadingCompanies}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none disabled:bg-gray-50"
          >
            {loadingCompanies ? (
              <option value="">Loading…</option>
            ) : companies.length === 0 ? (
              <option value="">No companies</option>
            ) : (
              companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role (optional)
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none disabled:bg-gray-50"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || loadingCompanies || companies.length === 0}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  )
}
