'use client'

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
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
    await signInWithEmailAndPassword(auth, email, password)
    
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
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        displayName,
        role: 'general',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        mustChangePassword: true,
      })
    }
  }

  const deleteUser = async (uid: string) => {
    if (!user || role !== 'admin') {
      throw new Error('No tienes permisos para eliminar usuarios')
    }

    const userDocRef = doc(db, 'users', uid)
    await deleteDoc(userDocRef)
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