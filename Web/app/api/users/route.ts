import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  console.log('[API /users] Request received')
  console.log('[API /users] adminAuth available:', !!adminAuth)
  console.log('[API /users] adminDb available:', !!adminDb)

  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no está configurado. Verifica las variables de entorno.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { email, password, displayName, createdByUid } = body

    if (!email || !password || !displayName || !createdByUid) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const creatorDoc = await adminDb.collection('users').doc(createdByUid).get()
    
    if (!creatorDoc.exists || creatorDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado - Se requiere acceso de administrador' },
        { status: 403 }
      )
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    })

    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'general',
      createdAt: new Date().toISOString(),
      createdBy: createdByUid,
      mustChangePassword: true,
    })

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    })
  } catch (error: any) {
    console.error('[API /users] Error creating user:', error)
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'El correo electrónico ya está en uso' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}