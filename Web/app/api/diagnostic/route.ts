import { NextResponse } from 'next/server'
import { adminAuth, adminDb, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''
  
  let keyValid = false
  let keyError = null
  
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.split('\\n').join('\n')
  }
  privateKey = privateKey.trim()
  
  const hasHeader = privateKey.includes('-----BEGIN PRIVATE KEY-----')
  const hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----')
  
  if (hasHeader && hasEndMarker) {
    try {
      const crypto = require('crypto')
      const keyContent = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '')
      Buffer.from(keyContent, 'base64')
      keyValid = true
    } catch (e: any) {
      keyError = e.message
    }
  }
  
  const diagnostics = {
    status: initializationError ? 'FAILED' : (adminAuth ? 'SUCCESS' : 'NOT_INITIALIZED'),
    environmentVariables: {
      FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail ? 'SET' : 'NOT SET',
      FIREBASE_ADMIN_PRIVATE_KEY: privateKey ? 'SET' : 'NOT SET',
    },
    privateKey: {
      hasHeader: hasHeader,
      hasEndMarker: hasEndMarker,
      base64Valid: keyValid,
      base64Error: keyError,
      length: privateKey.length,
      startsWith: privateKey.substring(0, 45),
      endsWith: privateKey.substring(Math.max(0, privateKey.length - 45)),
    },
    initializationError: initializationError,
    adminAuthInitialized: !!adminAuth,
    adminDbInitialized: !!adminDb,
    nodeEnv: process.env.NODE_ENV,
    suggestion: initializationError?.includes('parse') || initializationError?.includes('ASN') 
      ? 'The private key appears to be invalid. Go to Firebase Console → Project Settings → Service Accounts → Generate new private key'
      : null,
  }
  
  return NextResponse.json(diagnostics)
}