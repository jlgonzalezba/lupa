'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Loader2, LogIn, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await signIn(formData.email, formData.password)
      toast.success('¡Bienvenido de vuelta!')
    } catch (err) {
      console.error('Error signing in:', err)
      let errorMessage = 'Error al iniciar sesión'
      
      if (err instanceof Error) {
        if (err.message.includes('invalid-credential') || err.message.includes('wrong-password')) {
          errorMessage = 'Correo electrónico o contraseña incorrectos'
        } else if (err.message.includes('user-not-found')) {
          errorMessage = 'No existe una cuenta con este correo electrónico'
        } else if (err.message.includes('too-many-requests')) {
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bienvenido</CardTitle>
        <CardDescription>
          Inicia sesión para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Contraseña</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Iniciar Sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}