'use client'

import React, { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface HydrationSafeProps {
  children: ReactNode
  fallback?: ReactNode
}

export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const { hydrated } = useAuth()

  // No renderizar nada hasta que se complete la hidratación
  if (!hydrated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}