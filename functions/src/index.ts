import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// CORS configuration
const corsHandler = cors({
  origin: [
    'https://lupa-puce.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Apply CORS middleware to all functions
const withCors = (handler: functions.https.HttpsFunction) => {
  return (req: functions.Request, res: functions.Response) => {
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      return;
    }
    corsHandler(req, res, () => handler(req, res));
  };
};

// Helper: verify Firebase ID token
const verifyToken = async (req: functions.Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new functions.https.HttpsError('unauthenticated', 'No token provided');
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid token');
  }
};

// POST /users - Create user (admin only)
export const createUser = functions.https.onRequest(withCors(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, password, displayName, createdByUid } = req.body;

  if (!email || !password || !displayName || !createdByUid) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Verify caller is admin
    const caller = await verifyToken(req);
    if (caller.uid !== createdByUid) {
      res.status(403).json({ error: 'Cannot create user on behalf of another admin' });
      return;
    }

    const creatorDoc = await db.collection('users').doc(createdByUid).get();
    const creatorData = creatorDoc.data();

    if (!creatorDoc.exists || creatorData?.role !== 'admin') {
      res.status(403).json({ error: 'Solo admins pueden crear usuarios' });
      return;
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

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'El correo electrónico ya está en uso' });
    } else {
      res.status(500).json({ error: error.message || 'Error al crear usuario' });
    }
  }
}));

// DELETE /users - Delete user (admin only)
export const deleteUser = functions.https.onRequest(withCors(async (req, res) => {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { targetUid, deletedByUid } = req.query;

  if (!targetUid || !deletedByUid) {
    res.status(400).json({ error: 'Missing targetUid or deletedByUid' });
    return;
  }

  try {
    const caller = await verifyToken(req);
    const callerUid = caller.uid;

    if (callerUid !== deletedByUid) {
      res.status(403).json({ error: 'No puedes eliminar usuarios en nombre de otro' });
      return;
    }

    if (targetUid === deletedByUid) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    const adminDoc = await db.collection('users').doc(deletedByUid as string).get();
    const adminData = adminDoc.data();

    if (!adminDoc.exists || adminData?.role !== 'admin') {
      res.status(403).json({ error: 'Solo admins pueden eliminar usuarios' });
      return;
    }

    const targetDoc = await db.collection('users').doc(targetUid as string).get();
    if (!targetDoc.exists) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await auth.deleteUser(targetUid as string);
    console.log(`Deleted from Firebase Auth: ${targetUid}`);

    await db.collection('users').doc(targetUid as string).delete();
    console.log(`Deleted from Firestore: ${targetUid}`);

    res.json({ success: true, uid: targetUid });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      res.status(500).json({ error: error.message || 'Error al eliminar usuario' });
    }
  }
}));

// GET /diagnostic - Diagnostic info
export const diagnostic = functions.https.onRequest(withCors(async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.json({
      status: 'SUCCESS',
      adminAuthInitialized: !!auth,
      adminDbInitialized: !!db,
      message: 'Firebase Admin is initialized',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'FAILED',
      error: error.message,
    });
  }
}));

// POST /upload-image - Upload image to Cloudinary
export const uploadImage = functions.https.onRequest(withCors(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Expect base64 image in body: { image: base64String, folder?: string }
    const { image, folder = 'lupa' } = req.body;

    if (!image) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    // Configure Cloudinary
    const cloudinaryConfig = {
      cloud_name: functions.config().cloudinary?.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
      api_key: functions.config().cloudinary?.api_key || process.env.CLOUDINARY_API_KEY,
      api_secret: functions.config().cloudinary?.api_secret || process.env.CLOUDINARY_API_SECRET,
    };

    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      res.status(500).json({ error: 'Cloudinary not configured' });
      return;
    }

    cloudinary.config(cloudinaryConfig);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folder,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(image);
    });

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Error uploading image' });
  }
}));
