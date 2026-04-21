import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore'

let adminAuth: Auth | null = null
let adminDb: Firestore | null = null
let initializationAttempted = false
let initializationError: string | null = null

function initializeFirebaseAdmin() {
  if (initializationAttempted) {
    return
  }
  initializationAttempted = true
  
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''
  
  console.log('[Firebase Admin] Starting lazy initialization...')
  console.log('[Firebase Admin] clientEmail:', clientEmail ? 'SET' : 'NOT SET')
  console.log('[Firebase Admin] privateKey length:', privateKey.length)
  
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.split('\\n').join('\n')
    console.log('[Firebase Admin] Replaced escaped newlines, new length:', privateKey.length)
  }
  
  privateKey = privateKey.trim()
  
  const hasHeader = privateKey.includes('-----BEGIN PRIVATE KEY-----')
  console.log('[Firebase Admin] Has BEGIN header:', hasHeader)
  console.log('[Firebase Admin] Key starts with:', privateKey.substring(0, 40))
  console.log('[Firebase Admin] Key ends with:', privateKey.substring(privateKey.length - 40))
  
  if (!clientEmail || !privateKey || !hasHeader) {
    console.log('[Firebase Admin] MISSING CREDENTIALS - skipping initialization')
    initializationError = 'Missing credentials: clientEmail=' + !!clientEmail + ', privateKey=' + !!privateKey + ', hasHeader=' + hasHeader
    return
  }
  
  try {
    console.log('[Firebase Admin] Creating Firebase Admin app...')
    const app = initializeApp({
      credential: cert({
        projectId: 'innergy-a55ba',
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
    })
    console.log('[Firebase Admin] App initialized, getting services...')
    
    adminAuth = getAdminAuth(app)
    adminDb = getAdminFirestore(app)
    
    console.log('[Firebase Admin] SUCCESS - adminAuth:', !!adminAuth, 'adminDb:', !!adminDb)
  } catch (error: any) {
    console.error('[Firebase Admin] FAILED:', error.message)
    console.error('[Firebase Admin] Error code:', error.code)
    initializationError = error.message
  }
}

initializeFirebaseAdmin()

export { adminAuth, adminDb, initializationError }