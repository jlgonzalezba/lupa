import { getAuth } from 'firebase/auth';

const CLOUD_FUNCTIONS_BASE = 'https://us-central1-innergy-a55ba.cloudfunctions.net';

/**
 * Call a Cloud Function via HTTP REST
 */
export async function callFunction<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken(true);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${CLOUD_FUNCTIONS_BASE}${path}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new user (admin only)
 */
export const createUserFunction = (data: {
  email: string;
  password: string;
  displayName: string;
  createdByUid: string;
}) => callFunction('/users', 'POST', data);

/**
 * Delete a user (admin only)
 */
export const deleteUserFunction = (targetUid: string, deletedByUid: string) => 
  callFunction(`/users?targetUid=${encodeURIComponent(targetUid)}&deletedByUid=${encodeURIComponent(deletedByUid)}`, 'DELETE');

/**
 * Get diagnostic information
 */
export const diagnosticFunction = () => callFunction('/diagnostic', 'GET');

/**
 * Upload image to Cloudinary
 */
export const uploadImageFunction = (base64Image: string, folder?: string) =>
  callFunction('/upload-image', 'POST', { image: base64Image, folder });