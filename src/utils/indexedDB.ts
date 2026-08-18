import { SavedWord, StreakData, Achievement } from '../types';
import { auth } from '../firebase';

const DB_NAME = 'LingoLiveOfflineDB';
const DB_VERSION = 2;

let isIndexedDBBroken = false;

// Fallback in-memory storage + local storage
const memoryVocabDeck = new Map<string, SavedWord>();
const memoryProgressStore = new Map<string, any>();

// Initialize memory stores from localStorage if available
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const vocabJson = localStorage.getItem('lingolive_fallback_vocab');
    if (vocabJson) {
      const list: SavedWord[] = JSON.parse(vocabJson);
      list.forEach(w => memoryVocabDeck.set(w.id, w));
    }
    
    const progressJson = localStorage.getItem('lingolive_fallback_progress');
    if (progressJson) {
      const progressObj = JSON.parse(progressJson);
      Object.entries(progressObj).forEach(([k, v]) => {
        memoryProgressStore.set(k, v);
      });
    }
  }
} catch (e) {
  console.warn('Fallback storage initialization failed:', e);
}

let onlineListenerRegistered = false;

function ensureOnlineSyncListener(): void {
  if (
    typeof window === 'undefined' ||
    onlineListenerRegistered
  ) {
    return;
  }

  window.addEventListener('online', () => {
    void triggerManualSync();
  });

  onlineListenerRegistered = true;
}

ensureOnlineSyncListener();

function saveToFallbackVocab(word: SavedWord) {
  memoryVocabDeck.set(word.id, word);
  syncFallbackVocabToLS();
}

function deleteFromFallbackVocab(id: string) {
  memoryVocabDeck.delete(id);
  syncFallbackVocabToLS();
}

function saveAllToFallbackVocab(words: SavedWord[]) {
  memoryVocabDeck.clear();
  words.forEach(w => memoryVocabDeck.set(w.id, w));
  syncFallbackVocabToLS();
}

function syncFallbackVocabToLS() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const list = Array.from(memoryVocabDeck.values());
      localStorage.setItem('lingolive_fallback_vocab', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('LocalStorage quota exceeded or unavailable for fallback vocab:', e);
  }
}

function saveToFallbackProgress(key: string, value: any) {
  memoryProgressStore.set(key, value);
  syncFallbackProgressToLS();
}

function syncFallbackProgressToLS() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const obj: Record<string, any> = {};
      memoryProgressStore.forEach((val, k) => {
        obj[k] = val;
      });
      localStorage.setItem('lingolive_fallback_progress', JSON.stringify(obj));
    }
  } catch (e) {
    console.warn('LocalStorage quota exceeded or unavailable for fallback progress:', e);
  }
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (isIndexedDBBroken) {
      reject(new Error('IndexedDB is marked as broken/disabled.'));
      return;
    }
    const globalObj = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null);
    if (!globalObj || !globalObj.indexedDB) {
      isIndexedDBBroken = true;
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    try {
      const request = globalObj.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        isIndexedDBBroken = true;
        reject(request.error || new Error('Failed to open IndexedDB'));
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
        if (!db.objectStoreNames.contains('vocab_sync_outbox')) {
          db.createObjectStore('vocab_sync_outbox', { keyPath: 'id' });
        }
      };
    } catch (e) {
      isIndexedDBBroken = true;
      reject(e);
    }
  });
}

// Vocab deck operations
export async function saveWordToDB(word: SavedWord): Promise<void> {
  if (isIndexedDBBroken) {
    saveToFallbackVocab(word);
    return;
  }
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      transaction.onerror = () => {
        isIndexedDBBroken = true;
        reject(transaction.error);
      };
      const store = transaction.objectStore('vocab_deck');
      const request = store.put(word);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save word to IndexedDB, using fallback:', error);
    saveToFallbackVocab(word);
  }
}

export async function deleteWordFromDB(id: string): Promise<void> {
  if (isIndexedDBBroken) {
    deleteFromFallbackVocab(id);
    return;
  }
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      transaction.onerror = () => {
        isIndexedDBBroken = true;
        reject(transaction.error);
      };
      const store = transaction.objectStore('vocab_deck');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to delete word from IndexedDB, using fallback:', error);
    deleteFromFallbackVocab(id);
  }
}

export async function getWordsFromDB(): Promise<SavedWord[]> {
  try {
    const db = await openDB();
    return await new Promise<SavedWord[]>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readonly');
      const store = transaction.objectStore('vocab_deck');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get words from IndexedDB, using fallback:', error);
    return Array.from(memoryVocabDeck.values());
  }
}

export async function saveAllWordsToDB(words: SavedWord[]): Promise<void> {
  if (isIndexedDBBroken) {
    saveAllToFallbackVocab(words);
    return;
  }
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_deck', 'readwrite');
      transaction.onerror = () => {
        isIndexedDBBroken = true;
        reject(transaction.error);
      };
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
    console.warn('Failed to save all words to IndexedDB, using fallback:', error);
    saveAllToFallbackVocab(words);
  }
}

// Progress operations
export async function saveProgressToDB(key: string, value: any): Promise<void> {
  if (isIndexedDBBroken) {
    saveToFallbackProgress(key, value);
    return;
  }
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('progress_store', 'readwrite');
      transaction.onerror = () => {
        isIndexedDBBroken = true;
        reject(transaction.error);
      };
      const store = transaction.objectStore('progress_store');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn(`Failed to save progress key ${key} to IndexedDB, using fallback:`, error);
    saveToFallbackProgress(key, value);
  }
}

export async function getProgressFromDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction('progress_store', 'readonly');
      const store = transaction.objectStore('progress_store');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? (request.result.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn(`Failed to get progress key ${key} from IndexedDB, using fallback:`, error);
    const fallbackValue = memoryProgressStore.get(key);
    return fallbackValue !== undefined ? (fallbackValue as T) : null;
  }
}

// Clear vocab_deck and progress_store
export async function clearAllOfflineDB(): Promise<void> {
  memoryVocabDeck.clear();
  memoryProgressStore.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('lingolive_fallback_vocab');
      localStorage.removeItem('lingolive_fallback_progress');
    }
  } catch (e) {}

  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['vocab_deck', 'progress_store'], 'readwrite');
      const vocabStore = transaction.objectStore('vocab_deck');
      const progressStore = transaction.objectStore('progress_store');
      
      vocabStore.clear();
      progressStore.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
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

// Outbox operations for Service Worker Background Sync
export async function savePendingSync(userId: string, words: SavedWord[]): Promise<void> {
  if (isIndexedDBBroken) {
    return;
  }
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_sync_outbox', 'readwrite');
      transaction.onerror = () => {
        isIndexedDBBroken = true;
        reject(transaction.error);
      };
      const store = transaction.objectStore('vocab_sync_outbox');
      const request = store.put({ id: userId, userId, words, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save pending sync to IndexedDB:', error);
  }
}

export async function getPendingSyncs(): Promise<any[]> {
  try {
    const db = await openDB();
    return await new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction('vocab_sync_outbox', 'readonly');
      const store = transaction.objectStore('vocab_sync_outbox');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get pending syncs from IndexedDB:', error);
    return [];
  }
}

export async function deletePendingSync(id: string): Promise<void> {
  try {
    const db = await openDB();
    return await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('vocab_sync_outbox', 'readwrite');
      const store = transaction.objectStore('vocab_sync_outbox');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to delete pending sync from IndexedDB:', error);
  }
}

let manualSyncInProgress = false;

export async function triggerManualSync(): Promise<void> {
  if (manualSyncInProgress) {
    return;
  }

  manualSyncInProgress = true;

  try {
    const pendingSyncs = await getPendingSyncs();
    if (pendingSyncs.length === 0) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[Manual Sync] No authenticated user session available for sync fallback.');
      return;
    }

    const token = await currentUser.getIdToken();
    if (!token) {
      console.warn('[Manual Sync] Failed to retrieve Firebase ID Token.');
      return;
    }

    for (const syncJob of pendingSyncs) {
      const { id, userId, words } = syncJob;

      // Ensure the sync job belongs to the currently logged in authenticated user
      if (userId !== currentUser.uid) {
        console.warn('[Manual Sync] Skipping sync job: job user ID does not match authenticated user.');
        continue;
      }

      try {
        const response = await fetch('/api/sync-vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, words }),
        });

        if (response.ok) {
          console.log('[Manual Sync] Vocabulary sync completed.');
          await deletePendingSync(id);
        } else {
          console.error(`[Manual Sync] Sync failed with status: ${response.status}`);
        }
      } catch (err) {
        console.error('[Manual Sync] Error syncing vocabulary:', err);
      }
    }
  } catch (error) {
    console.error('[Manual Sync] triggerManualSync failed:', error);
  } finally {
    manualSyncInProgress = false;
  }
}

export async function registerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await triggerManualSync();
  } catch (error) {
    console.error(
      '[Vocabulary Sync] Authenticated sync attempt failed.'
    );
  }
}

