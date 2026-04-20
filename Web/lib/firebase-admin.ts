import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

console.log('=== Firebase Admin Debug ===')

let app = null

try {
  const serviceAccountPath = path.join(process.cwd(), 'innergy-a55ba-firebase-adminsdk-fbsvc-c3cb224d4f.json')
  
  console.log('Looking for service account at:', serviceAccountPath)
  console.log('File exists:', fs.existsSync(serviceAccountPath))
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    
    console.log('CLIENT_EMAIL:', serviceAccount.client_email)
    console.log('PRIVATE_KEY: SET (from file)')
    
    app = initializeApp({
      credential: cert(serviceAccount),
    })
    console.log('Firebase Admin initialized successfully from JSON file')
  } else {
    console.error('Service account file not found!')
  }
} catch (error: any) {
  console.error('Error initializing Firebase Admin:', error.message)
  app = null
}

export const adminAuth = app ? getAdminAuth(app) : null
export const adminDb = app ? getAdminFirestore(app) : null
export default app