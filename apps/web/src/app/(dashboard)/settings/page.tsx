'use client'

import React from 'react'
import { useDispatch } from 'react-redux'
import { addCredential, type AIProviderCredentialInput } from '@serenity/core'
import { SettingsPage as SharedSettingsPage } from '@serenity/ui/pages'

/**
 * Web-specific Settings Page wrapper
 * Provides REST API callbacks and web-specific configuration
 */
export default function SettingsPageWrapper() {
  const dispatch = useDispatch()

  // Web-specific handlers using REST APIs
  const handleLoadUsage = async () => {
    try {
      const response = await fetch('/api/ai/usage')
      if (response.ok) {
        const data = await response.json()
        return { success: data.success, usage: data.usage }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to load AI usage:', error)
      return { success: false }
    }
  }

  const handleTestCredential = async (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    try {
      const response = await fetch('/api/ai/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, action: 'test' }),
      })
      const data = await response.json()
      return { valid: data.success, error: data.error }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  const handleAddCredential = async (credentialData: AIProviderCredentialInput) => {
    // Save via API
    const response = await fetch('/api/ai/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: credentialData.provider,
        apiKey: credentialData.apiKey,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to save API key')
    }

    // Also update Redux
    await (dispatch as any)(addCredential(credentialData)).unwrap()
  }

  // Web credentials are stored server-side, no client-side loading needed
  const handleLoadCredentials = async () => {
    // No-op for web - credentials are managed server-side
    // The Redux store will show an empty list, but that's fine
    // since the server handles the actual API key storage
  }

  // Web-specific footer note
  const platformNote = (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <strong>Note:</strong> The web app uses cloud storage for your data. Database configuration is available in the desktop app for local storage options.
      </p>
    </div>
  )

  return (
    <SharedSettingsPage
      onLoadUsage={handleLoadUsage}
      onLoadCredentials={handleLoadCredentials}
      onTestCredential={handleTestCredential}
      onAddCredential={handleAddCredential}
      platformNote={platformNote}
      privacyNoticeText="Your data is sent to the selected AI provider for analysis. API keys are stored securely in your account."
    />
  )
}
