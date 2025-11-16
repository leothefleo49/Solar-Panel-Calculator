/**
 * Google API Keys Store
 * Manages API keys for Google Cloud services (Solar API, Maps, Gemini)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GoogleApiKeys } from '../types/google-apis';

interface GoogleApiState {
  apiKeys: GoogleApiKeys;
  setUnifiedKey: (key: string) => void;
  setSolarKey: (key: string) => void;
  setMapsKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  clearUnifiedKey: () => void;
  clearSolarKey: () => void;
  clearMapsKey: () => void;
  clearGeminiKey: () => void;
  clearAllKeys: () => void;
  hasAnySolarAccess: () => boolean;
  hasMapsAccess: () => boolean;
}

export const useGoogleApiStore = create<GoogleApiState>()(
  persist(
    (set, get) => ({
      apiKeys: {},

      setUnifiedKey: (key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, unified: key },
        })),

      setSolarKey: (key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, solar: key },
        })),

      setMapsKey: (key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, maps: key },
        })),

      setGeminiKey: (key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, gemini: key },
        })),

      clearUnifiedKey: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { unified, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      clearSolarKey: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { solar, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      clearMapsKey: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { maps, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      clearGeminiKey: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { gemini, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      clearAllKeys: () => set({ apiKeys: {} }),

      hasAnySolarAccess: () => {
        const keys = get().apiKeys;
        return !!(keys.unified || keys.solar);
      },

      hasMapsAccess: () => {
        const keys = get().apiKeys;
        return !!(keys.unified || keys.maps);
      },
    }),
    {
      name: 'google-api-storage',
      partialize: (state) => ({ apiKeys: state.apiKeys }),
    }
  )
);
