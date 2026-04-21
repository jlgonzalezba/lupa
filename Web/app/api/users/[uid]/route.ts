import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function DELETE(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const targetUid = params.uid
  console.log('[API /users/[uid]] DELETE request for uid:', targetUid)

  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no está configurado' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { deletedByUid } = body

    if (!deletedByUid) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario que elimina' },
        { status: 400 }
      )
    }

    const adminDoc = await adminDb.collection('users').doc(deletedByUid).get()
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado - Se requiere acceso de administrador' },
        { status: 403 }
      )
    }

    const targetDoc = await adminDb.collection('users').doc(targetUid).get()
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (targetUid === deletedByUid) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    await adminAuth.deleteUser(targetUid)
    console.log('[API /users/[uid]] Deleted from Firebase Auth:', targetUid)

    await adminDb.collection('users').doc(targetUid).delete()
    console.log('[API /users/[uid]] Deleted from Firestore:', targetUid)

    return NextResponse.json({ success: true, uid: targetUid })
  } catch (error: any) {
    console.error('[API /users/[uid]] Error deleting user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}