import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface QueuedEvidence {
  tempId: string;
  verificationId: string;
  filename: string;
  fileBase64: string;
  mimeType: string;
  description: string;
  queuedAt: string;
  synced: boolean;
}

interface OfflineQueueState {
  queue: QueuedEvidence[];
  isSyncing: boolean;
  addToQueue: (item: Omit<QueuedEvidence, 'tempId' | 'queuedAt' | 'synced'>) => void;
  syncQueue: () => Promise<{ successCount: number; failCount: number }>;
  clearQueue: () => void;
}

const STORAGE_KEY = 'inspectra_offline_evidence_queue';

function loadFromStorage(): QueuedEvidence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(queue: QueuedEvidence[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  queue: loadFromStorage(),
  isSyncing: false,

  addToQueue: (item) => {
    const newItem: QueuedEvidence = {
      ...item,
      tempId: 'temp_' + Math.random().toString(36).substring(2, 9),
      queuedAt: new Date().toISOString(),
      synced: false
    };
    const updated = [...get().queue, newItem];
    set({ queue: updated });
    saveToStorage(updated);
  },

  syncQueue: async () => {
    const { queue } = get();
    if (queue.length === 0) return { successCount: 0, failCount: 0 };

    set({ isSyncing: true });
    let successCount = 0;
    let failCount = 0;
    const remaining: QueuedEvidence[] = [];

    for (const item of queue) {
      try {
        // Convert Base64 back to Blob
        const byteCharacters = atob(item.fileBase64.split(',')[1] || item.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: item.mimeType });

        const formData = new FormData();
        formData.append('verification_id', item.verificationId);
        formData.append('description', item.description);
        formData.append('file', blob, item.filename);

        await apiClient.post('/evidence/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      } catch (err) {
        console.error('Failed to sync item', item.filename, err);
        failCount++;
        remaining.push(item);
      }
    }

    set({ queue: remaining, isSyncing: false });
    saveToStorage(remaining);
    return { successCount, failCount };
  },

  clearQueue: () => {
    set({ queue: [] });
    localStorage.removeItem(STORAGE_KEY);
  }
}));
