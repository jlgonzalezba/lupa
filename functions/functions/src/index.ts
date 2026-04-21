import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  createdByUid: string;
}

interface DeleteUserRequest {
  targetUid: string;
  deletedByUid: string;
}

export const createUser = onCall(async (request) => {
  const data = request.data as CreateUserRequest;
  const authData = request.auth;

  if (!authData) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { email, password, displayName, createdByUid } = data;

  if (!email || !password || !displayName || !createdByUid) {
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  try {
    const creatorDoc = await db.collection('users').doc(createdByUid).get();
    const creatorData = creatorDoc.data();

    if (!creatorDoc.exists || creatorData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Solo admins pueden crear usuarios');
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'general',
      createdAt: new Date().toISOString(),
      createdBy: createdByUid,
      mustChangePassword: true,
    });

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    };
  } catch (error: unknown) {
    console.error('Error creating user:', error);

    if (error instanceof Error && 'code' in error) {
      const err = error as { code: string };
      if (err.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'El correo electronico ya esta en uso');
      }
    }

    const message = error instanceof Error ? error.message : 'Error al crear usuario';
    throw new HttpsError('internal', message);
  }
});

export const deleteUser = onCall(async (request) => {
  const data = request.data as DeleteUserRequest;
  const authData = request.auth;

  if (!authData) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { targetUid, deletedByUid } = data;

  if (!targetUid || !deletedByUid) {
    throw new HttpsError('invalid-argument', 'Faltan parametros requeridos');
  }

  const callerUid = authData.uid;

  if (callerUid !== deletedByUid) {
    throw new HttpsError('permission-denied', 'No puedes eliminar usuarios en nombre de otro');
  }

  if (targetUid === deletedByUid) {
    throw new HttpsError('invalid-argument', 'No puedes eliminar tu propia cuenta');
  }

  try {
    const adminDoc = await db.collection('users').doc(deletedByUid).get();
    const adminData = adminDoc.data();

    if (!adminDoc.exists || adminData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Solo admins pueden eliminar usuarios');
    }

    const targetDoc = await db.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    await auth.deleteUser(targetUid);
    console.log('Deleted from Firebase Auth:', targetUid);

    await db.collection('users').doc(targetUid).delete();
    console.log('Deleted from Firestore:', targetUid);

    return {
      success: true,
      uid: targetUid,
    };
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    throw new HttpsError('internal', message);
  }
});
