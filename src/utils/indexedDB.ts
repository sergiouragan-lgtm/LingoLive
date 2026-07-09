import { SavedWord, StreakData, Achievement } from '../types';

const DB_NAME = 'LingoLiveOfflineDB';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('vocab_deck')) {
        db.createObjectStore('vocab_deck', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('progress_store')) {
        db.createObjectStore('progress_store', { keyPath: 'key' });
      }
    };
  });
}

// Vocab deck operations
export async function saveWordToDB(word: SavedWord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      const store = transaction.objectStore('vocab_deck');
      const request = store.put(word);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save word to IndexedDB:', error);
  }
}

export async function deleteWordFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      const store = transaction.objectStore('vocab_deck');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete word from IndexedDB:', error);
  }
}

export async function getWordsFromDB(): Promise<SavedWord[]> {
  try {
    const db = await openDB();
    return new Promise<SavedWord[]>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readonly');
      const store = transaction.objectStore('vocab_deck');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get words from IndexedDB:', error);
    return [];
  }
}

export async function saveAllWordsToDB(words: SavedWord[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      const store = transaction.objectStore('vocab_deck');
      
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);
      
      clearRequest.onsuccess = () => {
        if (words.length === 0) {
          resolve();
          return;
        }
        
        let completed = 0;
        let failed = false;

        words.forEach((word) => {
          const req = store.put(word);
          req.onsuccess = () => {
            completed++;
            if (completed === words.length && !failed) {
              resolve();
            }
          };
          req.onerror = () => {
            if (!failed) {
              failed = true;
              reject(req.error);
            }
          };
        });
      };
    });
  } catch (error) {
    console.error('Failed to save all words to IndexedDB:', error);
  }
}

// Progress operations
export async function saveProgressToDB(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('progress_store', 'readwrite');
      const store = transaction.objectStore('progress_store');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to save progress key ${key} to IndexedDB:`, error);
  }
}

export async function getProgressFromDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction('progress_store', 'readonly');
      const store = transaction.objectStore('progress_store');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? (request.result.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to get progress key ${key} from IndexedDB:`, error);
    return null;
  }
}

// Clear vocab_deck and progress_store
export async function clearAllOfflineDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['vocab_deck', 'progress_store'], 'readwrite');
      const vocabStore = transaction.objectStore('vocab_deck');
      const progressStore = transaction.objectStore('progress_store');
      
      vocabStore.clear();
      progressStore.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    throw error;
  }
}

export async function getCacheSizeEstimate(): Promise<{ count: number; sizeBytes: number }> {
  try {
    const words = await getWordsFromDB();
    const serialized = JSON.stringify(words);
    const sizeBytes = new Blob([serialized]).size;
    return { count: words.length, sizeBytes };
  } catch (e) {
    return { count: 0, sizeBytes: 0 };
  }
}

