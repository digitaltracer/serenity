'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateSalt, deriveKey, testEncryption } from '@/lib/encryption/client-crypto'

interface EncryptionSetupProps {
  onComplete?: () => void
}

export function EncryptionSetup({ onComplete }: EncryptionSetupProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Test encryption on client side
      const testResult = await testEncryption(password)
      if (!testResult) {
        throw new Error('Encryption test failed')
      }

      // Send to server to store hash
      const response = await fetch('/api/auth/setup-encryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          passwordConfirm,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set up encryption')
      }

      const { salt } = await response.json()

      // Store encryption key in memory for this session
      const key = await deriveKey(password, salt)

      // Store salt in localStorage for future sessions
      localStorage.setItem('encryption_salt', salt)

      // Call completion callback or redirect
      if (onComplete) {
        onComplete()
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set up encryption')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold">Set Up Encryption</h2>
        <p className="text-muted-foreground text-sm">
          Create a password to encrypt your sensitive data. This password never leaves your device.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Encryption Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="Enter a strong password"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="passwordConfirm" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="Confirm your password"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
          <p className="font-medium">Important:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>This password encrypts your data end-to-end</li>
            <li>We cannot recover this password if you forget it</li>
            <li>Choose a strong, memorable password</li>
            <li>Keep it separate from your OAuth login</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up...' : 'Set Up Encryption'}
        </button>
      </form>
    </div>
  )
}
