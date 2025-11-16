/**
 * API Usage Tracking Types
 * Supports free tier, prepaid credits, and live billing tracking
 */

export type ApiProvider = 
  | 'google-solar'
  | 'google-maps'
  | 'google-gemini'
  | 'google-shopping'
  | 'openai'
  | 'anthropic'
  | 'grok';

export interface ApiPricing {
  freeTierLimit: number; // Free requests per month
  costPerRequest?: number; // Cost per request after free tier (USD)
  costPer1000?: number; // Cost per 1000 requests (USD)
  costPerToken?: number; // Cost per token (for AI models, USD)
  billingModel: 'per-request' | 'per-token' | 'per-1000';
}

export interface UsageRecord {
  timestamp: number;
  provider: ApiProvider;
  requests: number;
  tokens?: number; // For AI models
  estimatedCost: number; // USD
  model?: string; // Specific model used (e.g., gpt-4, gemini-pro)
}

export interface MonthlyUsage {
  provider: ApiProvider;
  month: string; // YYYY-MM format
  totalRequests: number;
  totalTokens?: number;
  freeTierUsed: number;
  paidRequests: number;
  estimatedCost: number;
  records: UsageRecord[];
}

export interface ApiUsageState {
  usage: MonthlyUsage[];
  prepaidCredits: Record<ApiProvider, number>; // USD balance per provider
  trackUsage: (provider: ApiProvider, requests: number, tokens?: number, model?: string) => void;
  addPrepaidCredit: (provider: ApiProvider, amount: number) => void;
  deductPrepaidCredit: (provider: ApiProvider, amount: number) => void;
  getMonthlyUsage: (provider: ApiProvider, month?: string) => MonthlyUsage | null;
  getTotalCost: (month?: string) => number;
  getRemainingFreeTier: (provider: ApiProvider) => number;
  resetUsage: (provider?: ApiProvider, month?: string) => void;
  exportUsage: () => string;
}

// API Pricing constants (as of Nov 2024)
export const API_PRICING: Record<ApiProvider, ApiPricing> = {
  'google-solar': {
    freeTierLimit: 100, // 100 requests/month free
    costPer1000: 5, // $5 per 1000 requests
    billingModel: 'per-1000',
  },
  'google-maps': {
    freeTierLimit: 200, // $200 monthly credit ≈ 40,000 requests at $0.005 each
    costPerRequest: 0.005, // $5 per 1000 requests
    billingModel: 'per-request',
  },
  'google-gemini': {
    freeTierLimit: 60, // 60 requests/min free tier (rate limit, not quota)
    costPer1000: 0, // Gemini 1.5 Flash is free up to rate limits; Pro has token pricing
    billingModel: 'per-request',
  },
  'google-shopping': {
    freeTierLimit: 100, // 100 queries/day free
    costPer1000: 5, // $5 per 1000 queries
    billingModel: 'per-1000',
  },
  'openai': {
    freeTierLimit: 0, // No free tier
    costPerToken: 0.000002, // GPT-4o: ~$2.50/1M input tokens, varies by model
    billingModel: 'per-token',
  },
  'anthropic': {
    freeTierLimit: 0, // No free tier
    costPerToken: 0.000003, // Claude 3.5 Sonnet: ~$3/1M tokens
    billingModel: 'per-token',
  },
  'grok': {
    freeTierLimit: 0, // No free tier
    costPerToken: 0.000002, // Grok-2: ~$2/1M tokens (estimated)
    billingModel: 'per-token',
  },
};
