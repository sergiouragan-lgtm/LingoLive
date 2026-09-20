/**
 * Firebase Firestore Client Initialization
 * Used by migrations and client-side Firestore operations
 */

import { getFirebaseFirestore } from './firebase.config';

// Export Firestore instance for migrations and client code
export const db = getFirebaseFirestore();
