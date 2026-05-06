'use client'

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { createUserFunction, deleteUserFunction } from '@/lib/functions-client'
import { isAdminEmail } from '@/lib/admins'

type UserRole = 'admin' | 'general'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  hydrated: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  createUserByAdmin: (email: string, password: string, displayName: string) => Promise<void>
  deleteUser: (uid: string) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  mustChangePassword: boolean
  updateMustChangePassword: (value: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    setHydrated(true)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          setRole(userDoc.data().role as UserRole)
          setMustChangePassword(userDoc.data().mustChangePassword || false)
        } else {
          const isAdmin = isAdminEmail(user.email)
          const newRole: UserRole = isAdmin ? 'admin' : 'general'
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || 'Usuario',
            role: newRole,
            createdAt: serverTimestamp(),
            createdBy: isAdmin ? 'system' : user.uid,
            mustChangePassword: isAdmin ? false : true,
          })
          setRole(newRole)
          setMustChangePassword(isAdmin ? false : true)
        }
      } else {
        setRole(null)
        setMustChangePassword(false)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      if (!credential.user) return
      
      const user = credential.user
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        setRole(userDoc.data().role as UserRole)
        setMustChangePassword(userDoc.data().mustChangePassword || false)
      } else {
        const isAdmin = isAdminEmail(user.email)
        const newRole: UserRole = isAdmin ? 'admin' : 'general'
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || 'Usuario',
          role: newRole,
          createdAt: serverTimestamp(),
          createdBy: isAdmin ? 'system' : user.uid,
          mustChangePassword: isAdmin ? false : true,
        })
        setRole(newRole)
        setMustChangePassword(isAdmin ? false : true)
      }
    } catch (error: unknown) {
      console.error('Error signIn:', error)
      const err = error as { code?: string; message?: string }
      throw new Error(err.code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos'
        : 'Error al iniciar sesión', { cause: error })
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    
    const user = auth.currentUser
    if (user) {
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        setRole(userDoc.data().role as UserRole)
        setMustChangePassword(userDoc.data().mustChangePassword || false)
      } else {
        const isAdmin = isAdminEmail(user.email)
        const newRole: UserRole = isAdmin ? 'admin' : 'general'
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || 'Usuario',
          role: newRole,
          createdAt: serverTimestamp(),
          createdBy: isAdmin ? 'system' : user.uid,
          mustChangePassword: isAdmin ? false : true,
        })
        setRole(newRole)
        setMustChangePassword(isAdmin ? false : true)
      }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setRole(null)
    setMustChangePassword(false)
  }

  const createUserByAdmin = async (email: string, password: string, displayName: string) => {
    if (!user || role !== 'admin') {
      throw new Error('No tienes permisos para crear usuarios')
    }
    
    // Call Cloud Function
    const result = await createUserFunction({
      email,
      password,
      displayName,
      createdByUid: user.uid,
    })
    
    return result
  }

  const deleteUser = async (uid: string) => {
    if (!user || role !== 'admin') {
      throw new Error('No tienes permisos para eliminar usuarios')
    }

    // Call Cloud Function
    const result = await deleteUserFunction(uid, user.uid)
    return result
  }

  const changePassword = async (newPassword: string) => {
    if (!user) {
      throw new Error('No hay usuario autenticado')
    }
    
    await updatePassword(user, newPassword)
    await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false })
    setMustChangePassword(false)
  }

  const updateMustChangePassword = async (value: boolean) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: value })
    setMustChangePassword(value)
  }

  const value = {
    user,
    role,
    loading,
    hydrated,
    isAdmin: role === 'admin',
    signIn,
    signInWithGoogle,
    logout,
    createUserByAdmin,
    deleteUser,
    changePassword,
    mustChangePassword,
    updateMustChangePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}