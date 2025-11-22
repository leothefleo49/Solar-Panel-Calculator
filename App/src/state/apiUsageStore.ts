/**
 * API Usage Tracking Store
 * Tracks requests, costs, free tier usage, and prepaid credits
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiProvider, ApiUsageState, MonthlyUsage, UsageRecord } from '../types/api-usage';
import { API_PRICING as PRICING } from '../types/api-usage';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function calculateCost(provider: ApiProvider, requests: number, tokens?: number, model?: string): number {
  let pricing = PRICING[provider];
  
  // Apply model-specific overrides if available
  if (model && pricing.modelOverrides && pricing.modelOverrides[model]) {
    pricing = { ...pricing, ...pricing.modelOverrides[model] } as any;
  }
  
  if (pricing.billingModel === 'per-token' && tokens) {
    return tokens * (pricing.costPerToken || 0);
  }
  
  if (pricing.billingModel === 'per-1000') {
    return (requests / 1000) * (pricing.costPer1000 || 0);
  }
  
  if (pricing.billingModel === 'per-request') {
    return requests * (pricing.costPerRequest || 0);
  }
  
  return 0;
}

export const useApiUsageStore = create<ApiUsageState>()(
  persist(
    (set, get) => ({
      usage: [],
      prepaidCredits: {
        'google-solar': 0,
        'google-maps': 0,
        'google-gemini': 0,
        'google-shopping': 0,
        'openai': 0,
        'anthropic': 0,
        'grok': 0,
      },

      trackUsage: (provider, requests, tokens, model) => {
        const month = getCurrentMonth();
        const cost = calculateCost(provider, requests, tokens, model);
        
        set((state) => {
          const existingMonth = state.usage.find(
            (u) => u.provider === provider && u.month === month
          );

          const record: UsageRecord = {
            timestamp: Date.now(),
            provider,
            requests,
            tokens,
            estimatedCost: cost,
            model,
          };

          // Determine pricing config to use (base or override)
          let pricing = PRICING[provider];
          if (model && pricing.modelOverrides && pricing.modelOverrides[model]) {
            pricing = { ...pricing, ...pricing.modelOverrides[model] } as any;
          }

          if (existingMonth) {
            const newTotalRequests = existingMonth.totalRequests + requests;
            const freeTierUsed = Math.min(newTotalRequests, pricing.freeTierLimit);
            const paidRequests = Math.max(0, newTotalRequests - pricing.freeTierLimit);
            
            return {
              usage: state.usage.map((u) =>
                u.provider === provider && u.month === month
                  ? {
                      ...u,
                      totalRequests: newTotalRequests,
                      totalTokens: (u.totalTokens || 0) + (tokens || 0),
                      freeTierUsed,
                      paidRequests,
                      estimatedCost: u.estimatedCost + cost,
                      records: [...u.records, record],
                    }
                  : u
              ),
            };
          } else {
            const freeTierUsed = Math.min(requests, pricing.freeTierLimit);
            const paidRequests = Math.max(0, requests - pricing.freeTierLimit);

            const newMonth: MonthlyUsage = {
              provider,
              month,
              totalRequests: requests,
              totalTokens: tokens,
              freeTierUsed,
              paidRequests,
              estimatedCost: cost,
              records: [record],
            };

            return {
              usage: [...state.usage, newMonth],
            };
          }
        });

        // Auto-deduct from prepaid credits if available
        if (cost > 0) {
          const prepaid = get().prepaidCredits[provider];
          if (prepaid > 0) {
            const deduction = Math.min(prepaid, cost);
            get().deductPrepaidCredit(provider, deduction);
          }
        }
      },

      addPrepaidCredit: (provider, amount) =>
        set((state) => ({
          prepaidCredits: {
            ...state.prepaidCredits,
            [provider]: state.prepaidCredits[provider] + amount,
          },
        })),

      deductPrepaidCredit: (provider, amount) =>
        set((state) => ({
          prepaidCredits: {
            ...state.prepaidCredits,
            [provider]: Math.max(0, state.prepaidCredits[provider] - amount),
          },
        })),

      getMonthlyUsage: (provider, month) => {
        const targetMonth = month || getCurrentMonth();
        const usage = get().usage.find(
          (u) => u.provider === provider && u.month === targetMonth
        );
        return usage || null;
      },

      getTotalCost: (month) => {
        const targetMonth = month || getCurrentMonth();
        return get().usage
          .filter((u) => u.month === targetMonth)
          .reduce((sum, u) => sum + u.estimatedCost, 0);
      },

      getRemainingFreeTier: (provider) => {
        const month = getCurrentMonth();
        const usage = get().getMonthlyUsage(provider, month);
        const pricing = PRICING[provider];
        
        // Note: This doesn't account for model-specific overrides since we don't know the model here
        // Ideally, we should pass the model to this function if needed
        
        if (!usage) return pricing.freeTierLimit;
        
        return Math.max(0, pricing.freeTierLimit - usage.totalRequests);
      },

      resetUsage: (provider, month) => {
        set((state) => {
          if (provider && month) {
            return {
              usage: state.usage.filter(
                (u) => !(u.provider === provider && u.month === month)
              ),
            };
          } else if (provider) {
            return {
              usage: state.usage.filter((u) => u.provider !== provider),
            };
          } else if (month) {
            return {
              usage: state.usage.filter((u) => u.month !== month),
            };
          } else {
            return { usage: [] };
          }
        });
      },

      exportUsage: () => {
        const state = get();
        const data = {
          usage: state.usage,
          prepaidCredits: state.prepaidCredits,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(data, null, 2);
      },
    }),
    {
      name: 'api-usage-storage',
      partialize: (state) => ({
        usage: state.usage,
        prepaidCredits: state.prepaidCredits,
      }),
    }
  )
);
