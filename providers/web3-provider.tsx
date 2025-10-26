'use client'

/**
 * Web3 Provider for PayVVM Frontend
 *
 * Wraps the app with:
 * - WagmiConfig for wallet connection
 * - QueryClientProvider for React Query
 * - RainbowKitProvider for wallet UI
 */

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/wagmi-config'
import { useTheme } from 'next-themes'
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds
    },
  },
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const { theme } = useTheme()

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            theme === 'dark'
              ? darkTheme({
                  accentColor: '#00FF7F', // Cyber green accent
                  accentColorForeground: 'black',
                  borderRadius: 'small',
                  fontStack: 'system',
                })
              : lightTheme({
                  accentColor: '#00FF7F',
                  accentColorForeground: 'black',
                  borderRadius: 'small',
                  fontStack: 'system',
                })
          }
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
