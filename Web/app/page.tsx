'use client'

import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "@/components/auth-form"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { PasswordChangeDialog } from "@/components/password-change-dialog"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, hydrated } = useAuth()

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
    <>
      <PasswordChangeDialog />
      <DashboardContent />
    </>
  )
}
