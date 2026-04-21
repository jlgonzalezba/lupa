import * as functions from 'firebase-functions';
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

export const createUser = functions.https.onCall(async (data: CreateUserRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { email, password, displayName, createdByUid } = data;

  if (!email || !password || !displayName || !createdByUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  try {
    const creatorDoc = await db.collection('users').doc(createdByUid).get();
    const creatorData = creatorDoc.data();

    if (!creatorDoc.exists || creatorData?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden crear usuarios');
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
  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'El correo electrónico ya está en uso');
    }

    throw new functions.https.HttpsError('internal', error.message || 'Error al crear usuario');
  }
});

export const deleteUser = functions.https.onCall(async (data: DeleteUserRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { targetUid, deletedByUid } = data;

  if (!targetUid || !deletedByUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros requeridos');
  }

  const callerUid = context.auth.uid;

  if (callerUid !== deletedByUid) {
    throw new functions.https.HttpsError('permission-denied', 'No puedes eliminar usuarios en nombre de otro');
  }

  if (targetUid === deletedByUid) {
    throw new functions.https.HttpsError('invalid-argument', 'No puedes eliminar tu propia cuenta');
  }

  try {
    const adminDoc = await db.collection('users').doc(deletedByUid).get();
    const adminData = adminDoc.data();

    if (!adminDoc.exists || adminData?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden eliminar usuarios');
    }

    const targetDoc = await db.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }

    await auth.deleteUser(targetUid);
    console.log(`Deleted from Firebase Auth: ${targetUid}`);

    await db.collection('users').doc(targetUid).delete();
    console.log(`Deleted from Firestore: ${targetUid}`);

    return {
      success: true,
      uid: targetUid,
    };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error al eliminar usuario');
  }
});
