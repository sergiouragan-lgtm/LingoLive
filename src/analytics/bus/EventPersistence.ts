import { doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { BaseEvent } from '../events/types';

export class EventPersistenceService {
  async persistEvent(event: BaseEvent): Promise<void> {
    if (!auth.currentUser) {
      console.log('EventPersistenceService: Skipping persistence, user not authenticated', event.eventName);
      return;
    }

    const eventDocRef = doc(db, 'analyticsEvents', event.eventId);
    
    // Deeply remove undefined values to avoid Firestore errors
    const removeUndefined = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const cleaned: Record<string, any> = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = removeUndefined(value);
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    };
    
    const cleanedEvent = removeUndefined(event);
    try {
      await setDoc(eventDocRef, cleanedEvent);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `analyticsEvents/${event.eventId}`);
      } catch (err) {
        console.warn("Could not persist event:", err);
      }
    }
  }
}

export const eventPersistenceService = new EventPersistenceService();
