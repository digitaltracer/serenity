'use client'

import { Provider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'
import { store } from '@serenity/core'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider, ErrorBoundary } from '@serenity/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <Provider store={store}>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </Provider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
