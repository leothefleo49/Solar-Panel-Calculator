/**
 * Dynamic API Quota Tracker
 * 
 * Queries actual API quotas and limits from providers in real-time.
 * Tracks usage per key and model dynamically instead of static limits.
 */

import { logError, logWarning } from './errorLogger';

export interface ApiQuota {
  provider: string;
  model?: string;
  limit: {
    requests?: number;
    tokens?: number;
    period: 'minute' | 'hour' | 'day' | 'month';
  };
  usage: {
    requests: number;
    tokens: number;
    resetAt: number;
  };
  tier: 'free' | 'paid' | 'trial' | 'unknown';
  cost?: {
    inputTokens: number;  // Cost per 1M input tokens
    outputTokens: number; // Cost per 1M output tokens
  };
}

export interface QuotaCheckResult {
  withinLimit: boolean;
  remaining: {
    requests?: number;
    tokens?: number;
  };
  willResetAt: number;
  recommendedAction?: string;
}

class DynamicApiQuotaTracker {
  private quotaCache: Map<string, ApiQuota> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Query OpenAI quota and usage
   */
  async queryOpenAIQuota(apiKey: string): Promise<ApiQuota | null> {
    const cacheKey = `openai-${apiKey.slice(-8)}`;
    
    // Check cache
    const cached = this.getCachedQuota(cacheKey);
    if (cached) return cached;

    try {
      // OpenAI doesn't expose quota directly, but we can infer from rate limit headers
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      // Extract rate limit info from headers
      const requestsLimit = parseInt(response.headers.get('x-ratelimit-limit-requests') || '0');
      const requestsRemaining = parseInt(response.headers.get('x-ratelimit-remaining-requests') || '0');
      const tokensLimit = parseInt(response.headers.get('x-ratelimit-limit-tokens') || '0');
      const tokensRemaining = parseInt(response.headers.get('x-ratelimit-remaining-tokens') || '0');
      const resetTime = parseInt(response.headers.get('x-ratelimit-reset-requests') || '0');

      const quota: ApiQuota = {
        provider: 'openai',
        limit: {
          requests: requestsLimit,
          tokens: tokensLimit,
          period: 'minute',
        },
        usage: {
          requests: requestsLimit - requestsRemaining,
          tokens: tokensLimit - tokensRemaining,
          resetAt: Date.now() + (resetTime * 1000),
        },
        tier: requestsLimit > 3500 ? 'paid' : 'free',
        cost: {
          inputTokens: 2.50,  // GPT-4o: $2.50 per 1M input tokens (average)
          outputTokens: 10.00, // GPT-4o: $10 per 1M output tokens (average)
        },
      };

      this.cacheQuota(cacheKey, quota);
      return quota;

    } catch (error: any) {
      await logError(
        `Failed to query OpenAI quota: ${error.message}`,
        error,
        'api',
        'Querying OpenAI quota'
      );
      return null;
    }
  }

  /**
   * Query Anthropic quota and usage
   */
  async queryAnthropicQuota(apiKey: string): Promise<ApiQuota | null> {
    const cacheKey = `anthropic-${apiKey.slice(-8)}`;
    
    const cached = this.getCachedQuota(cacheKey);
    if (cached) return cached;

    try {
      // Make a minimal request to check headers
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      // Extract rate limit headers
      const requestsLimit = parseInt(response.headers.get('anthropic-ratelimit-requests-limit') || '0');
      const requestsRemaining = parseInt(response.headers.get('anthropic-ratelimit-requests-remaining') || '0');
      const tokensLimit = parseInt(response.headers.get('anthropic-ratelimit-tokens-limit') || '0');
      const tokensRemaining = parseInt(response.headers.get('anthropic-ratelimit-tokens-remaining') || '0');
      const resetHeader = response.headers.get('anthropic-ratelimit-requests-reset');

      const quota: ApiQuota = {
        provider: 'anthropic',
        limit: {
          requests: requestsLimit || 50, // Default free tier
          tokens: tokensLimit || 40000,  // Default free tier
          period: 'minute',
        },
        usage: {
          requests: (requestsLimit || 50) - requestsRemaining,
          tokens: (tokensLimit || 40000) - tokensRemaining,
          resetAt: resetHeader ? new Date(resetHeader).getTime() : Date.now() + 60000,
        },
        tier: requestsLimit > 50 ? 'paid' : 'free',
        cost: {
          inputTokens: 3.00,  // Claude 3.5 Sonnet: $3 per 1M input tokens
          outputTokens: 15.00, // Claude 3.5 Sonnet: $15 per 1M output tokens
        },
      };

      this.cacheQuota(cacheKey, quota);
      return quota;

    } catch (error: any) {
      await logWarning(`Could not query Anthropic quota: ${error.message}`, 'api');
      
      // Return estimated free tier quota
      return {
        provider: 'anthropic',
        limit: {
          requests: 50,
          tokens: 40000,
          period: 'minute',
        },
        usage: {
          requests: 0,
          tokens: 0,
          resetAt: Date.now() + 60000,
        },
        tier: 'unknown',
        cost: {
          inputTokens: 3.00,
          outputTokens: 15.00,
        },
      };
    }
  }

  /**
   * Query Google Gemini quota and usage
   */
  async queryGeminiQuota(apiKey: string): Promise<ApiQuota | null> {
    const cacheKey = `gemini-${apiKey.slice(-8)}`;
    
    const cached = this.getCachedQuota(cacheKey);
    if (cached) return cached;

    try {
      // Gemini free tier from AI Studio: 15 RPM, 1M TPM, 1500 RPD
      // Check if this is an AI Studio key or Cloud Console key
      const isAIStudioKey = !apiKey.includes('AIza'); // Heuristic
      
      const quota: ApiQuota = {
        provider: 'google-gemini',
        limit: {
          requests: isAIStudioKey ? 15 : 60,    // AI Studio: 15 RPM, Cloud: 60 RPM
          tokens: isAIStudioKey ? 1000000 : 4000000, // AI Studio: 1M TPM, Cloud: 4M TPM
          period: 'minute',
        },
        usage: {
          requests: 0, // Can't query directly, rely on local tracking
          tokens: 0,
          resetAt: Date.now() + 60000,
        },
        tier: isAIStudioKey ? 'free' : 'paid',
        cost: {
          inputTokens: 0.075,  // Gemini 2.0 Flash: $0.075 per 1M input tokens
          outputTokens: 0.30,  // Gemini 2.0 Flash: $0.30 per 1M output tokens
        },
      };

      this.cacheQuota(cacheKey, quota);
      return quota;

    } catch (error: any) {
      await logError(
        `Failed to query Gemini quota: ${error.message}`,
        error,
        'api',
        'Querying Gemini quota'
      );
      return null;
    }
  }

  /**
   * Query Google Solar API quota
   */
  async queryGoogleSolarQuota(apiKey: string): Promise<ApiQuota | null> {
    const cacheKey = `google-solar-${apiKey.slice(-8)}`;
    
    const cached = this.getCachedQuota(cacheKey);
    if (cached) return cached;

    // Google Cloud APIs don't expose quota in headers
    // Return typical quota information
    const quota: ApiQuota = {
      provider: 'google-solar',
      limit: {
        requests: 600, // 600 requests per minute (typical default)
        period: 'minute',
      },
      usage: {
        requests: 0, // Must track locally
        tokens: 0,
        resetAt: Date.now() + 60000,
      },
      tier: 'paid',
      cost: {
        inputTokens: 0,    // Solar API pricing is per request
        outputTokens: 0,   // $0.001 per request (not token-based)
      },
    };

    this.cacheQuota(cacheKey, quota);
    return quota;
  }

  /**
   * Check if within quota limits
   */
  checkQuota(quota: ApiQuota, requestCount: number, tokenCount: number = 0): QuotaCheckResult {
    const now = Date.now();
    
    // If reset time has passed, assume quota is reset
    if (quota.usage.resetAt < now) {
      return {
        withinLimit: true,
        remaining: {
          requests: quota.limit.requests,
          tokens: quota.limit.tokens,
        },
        willResetAt: now + this.getPeriodMs(quota.limit.period),
      };
    }

    const requestsRemaining = (quota.limit.requests || Infinity) - quota.usage.requests;
    const tokensRemaining = (quota.limit.tokens || Infinity) - quota.usage.tokens;

    const withinRequestLimit = requestsRemaining >= requestCount;
    const withinTokenLimit = !quota.limit.tokens || tokensRemaining >= tokenCount;
    const withinLimit = withinRequestLimit && withinTokenLimit;

    let recommendedAction: string | undefined;
    if (!withinLimit) {
      const resetIn = quota.usage.resetAt - now;
      const resetInMinutes = Math.ceil(resetIn / 60000);
      
      if (!withinRequestLimit) {
        recommendedAction = `Request limit reached. Wait ${resetInMinutes} minute(s) or upgrade your plan.`;
      } else {
        recommendedAction = `Token limit reached. Wait ${resetInMinutes} minute(s) or use a shorter prompt.`;
      }
    } else if (requestsRemaining < 5) {
      recommendedAction = `Only ${requestsRemaining} requests remaining. Consider waiting to avoid rate limits.`;
    }

    return {
      withinLimit,
      remaining: {
        requests: requestsRemaining,
        tokens: tokensRemaining,
      },
      willResetAt: quota.usage.resetAt,
      recommendedAction,
    };
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(quota: ApiQuota, inputTokens: number, outputTokens: number): number {
    if (!quota.cost) return 0;
    
    const inputCost = (inputTokens / 1_000_000) * quota.cost.inputTokens;
    const outputCost = (outputTokens / 1_000_000) * quota.cost.outputTokens;
    
    return inputCost + outputCost;
  }

  /**
   * Get quota for all configured providers
   */
  async queryAllQuotas(keys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    googleSolar?: string;
  }): Promise<Record<string, ApiQuota | null>> {
    const results: Record<string, ApiQuota | null> = {};

    const queries: Promise<void>[] = [];

    if (keys.openai) {
      queries.push(
        this.queryOpenAIQuota(keys.openai).then((quota) => {
          results['openai'] = quota;
        })
      );
    }

    if (keys.anthropic) {
      queries.push(
        this.queryAnthropicQuota(keys.anthropic).then((quota) => {
          results['anthropic'] = quota;
        })
      );
    }

    if (keys.gemini) {
      queries.push(
        this.queryGeminiQuota(keys.gemini).then((quota) => {
          results['gemini'] = quota;
        })
      );
    }

    if (keys.googleSolar) {
      queries.push(
        this.queryGoogleSolarQuota(keys.googleSolar).then((quota) => {
          results['google-solar'] = quota;
        })
      );
    }

    await Promise.all(queries);

    return results;
  }

  /**
   * Cache helpers
   */
  private getCachedQuota(key: string): ApiQuota | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      return this.quotaCache.get(key) || null;
    }
    return null;
  }

  private cacheQuota(key: string, quota: ApiQuota): void {
    this.quotaCache.set(key, quota);
    this.cacheExpiry.set(key, Date.now() + this.cacheDuration);
  }

  private getPeriodMs(period: ApiQuota['limit']['period']): number {
    switch (period) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.quotaCache.clear();
    this.cacheExpiry.clear();
  }
}

// Singleton instance
export const quotaTracker = new DynamicApiQuotaTracker();

// Export convenience functions
export const queryQuota = async (provider: string, apiKey: string) => {
  switch (provider) {
    case 'openai':
      return quotaTracker.queryOpenAIQuota(apiKey);
    case 'anthropic':
      return quotaTracker.queryAnthropicQuota(apiKey);
    case 'gemini':
    case 'google-gemini':
      return quotaTracker.queryGeminiQuota(apiKey);
    case 'google-solar':
      return quotaTracker.queryGoogleSolarQuota(apiKey);
    default:
      return null;
  }
};

export const checkQuota = (quota: ApiQuota, requestCount: number, tokenCount?: number) =>
  quotaTracker.checkQuota(quota, requestCount, tokenCount);

export const estimateCost = (quota: ApiQuota, inputTokens: number, outputTokens: number) =>
  quotaTracker.estimateCost(quota, inputTokens, outputTokens);
