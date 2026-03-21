'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordRequirements = [
    { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to change password')
        return
      }

      // Sign out and redirect to login after password change
      await signOut({ redirect: false })
      router.push('/login?message=password-changed')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-md p-8 rounded-lg border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="text-center mb-8">
          <h1
            className="font-mono tracking-widest text-xl mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            TESTLAB
          </h1>
          <p style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold">
            Change Password
          </p>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            You must change your password before continuing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req) => (
                <div
                  key={req.label}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: req.test(newPassword) ? 'var(--passed)' : 'var(--text-muted)' }}
                >
                  <span>{req.test(newPassword) ? '\u2713' : '\u2022'}</span>
                  {req.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
              style={{
                background: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <div
              className="text-sm px-3 py-2 rounded border-l-3"
              style={{ color: 'var(--failed)', borderLeftColor: 'var(--failed)', background: 'rgba(239, 68, 68, 0.1)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--software)', color: 'var(--bg)' }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
