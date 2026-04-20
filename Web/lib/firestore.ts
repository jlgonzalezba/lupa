import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Generic CRUD operations for Firestore
export class FirestoreService {
  // Create a document
  static async create<T extends DocumentData>(
    collectionName: string,
    data: T
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  }

  // Read a single document
  static async getById(collectionName: string, id: string): Promise<DocumentData | null> {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id))
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  }

  // Update a document
  static async update(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  // Delete a document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  // Get all documents from a collection
  static async getAll(collectionName: string): Promise<DocumentData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error getting documents:', error)
      throw error
    }
  }

  // Query documents with conditions
  static async query(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<DocumentData[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error querying documents:', error)
      throw error
    }
  }

  // Real-time listener for a collection
  static subscribeToCollection(
    collectionName: string,
    callback: (docs: DocumentData[]) => void,
    constraints: QueryConstraint[] = []
  ) {
    const q = query(collection(db, collectionName), ...constraints)
    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      callback(docs)
    })
  }

  // Real-time listener for a single document
  static subscribeToDocument(
    collectionName: string,
    id: string,
    callback: (doc: DocumentData | null) => void
  ) {
    return onSnapshot(doc(db, collectionName, id), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() })
      } else {
        callback(null)
      }
    })
  }
}

// Helper functions for common queries
export const firestoreQueries = {
  where,
  orderBy,
  limit,
}