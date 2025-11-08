'use client'

import { Provider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'
import { store } from '@serenity/core'
import { ThemeProvider } from '@/components/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    </SessionProvider>
  )
}
