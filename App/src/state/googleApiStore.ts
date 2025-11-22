/**
 * Google API Keys Store
 * Manages API keys for Google Cloud services (Solar API, Maps, Gemini)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GoogleApiKeys } from '../types/google-apis';

interface GoogleApiState {
  apiKeys: GoogleApiKeys;
  keyMode: 'unified' | 'separate';
  setKeyMode: (mode: 'unified' | 'separate') => void;
  setUnifiedKey: (key: string) => void;
  setSolarKey: (key: string) => void;
  setMapsKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setShoppingKey: (key: string) => void;
  setShoppingCx: (cx: string) => void;
  clearUnifiedKey: () => void;
  clearSolarKey: () => void;
  clearMapsKey: () => void;
  clearGeminiKey: () => void;
  clearShoppingKey: () => void;
  clearShoppingCx: () => void;
  clearAllKeys: () => void;
  hasAnySolarAccess: () => boolean;
  hasMapsAccess: () => boolean;
  hasShoppingAccess: () => boolean;
  getEffectiveKey: (apiType: 'solar' | 'maps' | 'shopping' | 'gemini') => string | null;
}

export const useGoogleApiStore = create<GoogleApiState>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      keyMode: 'unified',

      setKeyMode: (mode: 'unified' | 'separate') =>
        set({ keyMode: mode }),

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

      setShoppingKey: (key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, shopping: key },
        })),

      setShoppingCx: (cx: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, shoppingCx: cx },
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

      clearShoppingKey: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { shopping, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      clearShoppingCx: () =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { shoppingCx, ...rest } = state.apiKeys;
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

      hasShoppingAccess: () => {
        const keys = get().apiKeys;
        return !!((keys.unified || keys.shopping) && keys.shoppingCx);
      },

      // Get the effective API key based on current mode
      getEffectiveKey: (apiType: 'solar' | 'maps' | 'shopping' | 'gemini') => {
        const { apiKeys, keyMode } = get();
        
        // Strict mode enforcement: if separate, NEVER return unified key unless explicitly requested
        if (keyMode === 'separate') {
          switch (apiType) {
            case 'solar': return apiKeys.solar || null;
            case 'maps': return apiKeys.maps || null;
            case 'shopping': return apiKeys.shopping || null;
            case 'gemini': return apiKeys.gemini || null;
            default: return null;
          }
        }
        
        // Unified mode
        if (keyMode === 'unified' && apiKeys.unified) {
          return apiKeys.unified;
        }
        
        return null;
      },
    }),
    {
      name: 'google-api-storage',
      partialize: (state) => ({ 
        apiKeys: state.apiKeys,
        keyMode: state.keyMode 
      }),
    }
  )
);
