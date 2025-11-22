'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Github,
  RefreshCw,
  Check,
  ExternalLink,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

interface IntegrationStatus {
  connected: boolean
  enabled: boolean
  lastSyncAt: string | null
  connectedAt?: string
}

interface IntegrationsState {
  google_calendar: IntegrationStatus
  github: IntegrationStatus
}

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationsState>({
    google_calendar: { connected: false, enabled: false, lastSyncAt: null },
    github: { connected: false, enabled: false, lastSyncAt: null },
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch integrations status
  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations)
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  // Handle OAuth callback URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const urlError = params.get('error')

    if (success) {
      if (success === 'google_connected') {
        setSuccessMessage('Google Calendar connected successfully!')
      } else if (success === 'github_connected') {
        setSuccessMessage('GitHub connected successfully!')
      }
      // Refresh integrations data
      fetchIntegrations()
      // Clear URL params
      window.history.replaceState({}, document.title, '/integrations')
    }

    if (urlError) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Authorization was denied',
        no_code: 'No authorization code received',
        token_exchange_failed: 'Failed to exchange authorization code',
        token_error: 'Failed to obtain access token',
        callback_failed: 'OAuth callback failed',
      }
      setError(errorMessages[urlError] || 'Authentication failed')
      // Clear URL params
      window.history.replaceState({}, document.title, '/integrations')
    }
  }, [fetchIntegrations])

  const connectGoogle = async () => {
    setConnecting('google')
    setError(null)
    try {
      const response = await fetch('/api/integrations/google/auth')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to initiate Google authentication')
        setConnecting(null)
      }
    } catch (err) {
      setError('Failed to connect to Google')
      setConnecting(null)
    }
  }

  const connectGitHub = async () => {
    setConnecting('github')
    setError(null)
    try {
      const response = await fetch('/api/integrations/github/auth')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to initiate GitHub authentication')
        setConnecting(null)
      }
    } catch (err) {
      setError('Failed to connect to GitHub')
      setConnecting(null)
    }
  }

  const disconnect = async (provider: 'google_calendar' | 'github') => {
    setError(null)
    try {
      const endpoint = provider === 'google_calendar'
        ? '/api/integrations/google/auth'
        : '/api/integrations/github/auth'

      const response = await fetch(endpoint, { method: 'DELETE' })
      if (response.ok) {
        setSuccessMessage(`${provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'} disconnected`)
        fetchIntegrations()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to disconnect')
      }
    } catch (err) {
      setError('Failed to disconnect integration')
    }
  }

  const toggleEnabled = async (provider: 'google_calendar' | 'github') => {
    const current = integrations[provider]
    try {
      const response = await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, enabled: !current.enabled }),
      })

      if (response.ok) {
        setIntegrations(prev => ({
          ...prev,
          [provider]: { ...prev[provider], enabled: !prev[provider].enabled },
        }))
      }
    } catch (err) {
      setError('Failed to update integration')
    }
  }

  const syncNow = async (provider: 'google_calendar' | 'github') => {
    setSyncing(provider)
    setError(null)
    try {
      const endpoint = provider === 'google_calendar'
        ? '/api/integrations/google/sync'
        : '/api/integrations/github/sync'

      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(`Synced ${data.syncedCount} items from ${provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'}`)
        fetchIntegrations()
      } else {
        setError(data.error || 'Sync failed')
      }
    } catch (err) {
      setError('Failed to sync')
    } finally {
      setSyncing(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Connect your favorite tools to sync tasks and events
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Google Calendar
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sync calendar events as tasks
                  </p>
                </div>
              </div>
              {integrations.google_calendar.connected && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}
            </div>

            {integrations.google_calendar.connected ? (
              <div className="mt-6 space-y-4">
                {/* Sync Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto-sync enabled</span>
                  <button
                    onClick={() => toggleEnabled('google_calendar')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {integrations.google_calendar.enabled ? (
                      <ToggleRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                {/* Last Sync */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last synced</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDate(integrations.google_calendar.lastSyncAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => syncNow('google_calendar')}
                    disabled={syncing === 'google_calendar'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncing === 'google_calendar' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sync Now
                  </button>
                  <button
                    onClick={() => disconnect('google_calendar')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={connectGoogle}
                  disabled={connecting === 'google'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {connecting === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5" />
                  )}
                  Connect Google Calendar
                </button>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  We&apos;ll import your upcoming events as tasks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* GitHub */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <Github className="w-6 h-6 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    GitHub
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sync issues and PRs as tasks
                  </p>
                </div>
              </div>
              {integrations.github.connected && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}
            </div>

            {integrations.github.connected ? (
              <div className="mt-6 space-y-4">
                {/* Sync Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto-sync enabled</span>
                  <button
                    onClick={() => toggleEnabled('github')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {integrations.github.enabled ? (
                      <ToggleRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                {/* Last Sync */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last synced</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDate(integrations.github.lastSyncAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => syncNow('github')}
                    disabled={syncing === 'github'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncing === 'github' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sync Now
                  </button>
                  <button
                    onClick={() => disconnect('github')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={connectGitHub}
                  disabled={connecting === 'github'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {connecting === 'github' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5" />
                  )}
                  Connect GitHub
                </button>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  We&apos;ll import your assigned issues and PRs
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How integrations work
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Connected integrations will sync your data as tasks in Serenity Notes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Google Calendar events from the next 30 days will be imported</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>GitHub issues and PRs assigned to you will be synced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>You can manually sync anytime or enable auto-sync for automatic updates</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default IntegrationsPage
