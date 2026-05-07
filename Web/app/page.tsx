'use client'

import { useEffect } from 'react'
import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "@/components/auth-form"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, hydrated } = useAuth()

  useEffect(() => {
    if (hydrated && user) {
      window.location.href = '/formularios'
    }
  }, [hydrated, user])

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}