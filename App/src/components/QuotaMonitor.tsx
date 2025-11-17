/**
 * Real-time API Quota Monitor Component
 * Shows live quota status, remaining requests, and cost estimates
 */

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { queryQuota, type ApiQuota } from '../utils/quotaTracker';
import { useGoogleApiStore } from '../state/googleApiStore';
import { useChatStore } from '../state/chatStore';
import InfoTooltip from './InfoTooltip';

interface QuotaStatus {
  provider: string;
  quota: ApiQuota | null;
  loading: boolean;
  error: string | null;
}

export default function QuotaMonitor() {
  const { apiKeys } = useGoogleApiStore();
  const { providerKeys } = useChatStore();
  const [quotaStatuses, setQuotaStatuses] = useState<Record<string, QuotaStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshQuotas = useCallback(async () => {
    setIsRefreshing(true);
    const newStatuses: Record<string, QuotaStatus> = {};

    // Query OpenAI
    if (providerKeys.openai) {
      newStatuses['openai'] = { provider: 'OpenAI', quota: null, loading: true, error: null };
      try {
        const quota = await queryQuota('openai', providerKeys.openai);
        newStatuses['openai'] = { provider: 'OpenAI', quota, loading: false, error: null };
      } catch (error) {
        newStatuses['openai'] = { provider: 'OpenAI', quota: null, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch quota' };
      }
    }

    // Query Anthropic
    if (providerKeys.anthropic) {
      newStatuses['anthropic'] = { provider: 'Anthropic Claude', quota: null, loading: true, error: null };
      try {
        const quota = await queryQuota('anthropic', providerKeys.anthropic);
        newStatuses['anthropic'] = { provider: 'Anthropic Claude', quota, loading: false, error: null };
      } catch (error) {
        newStatuses['anthropic'] = { provider: 'Anthropic Claude', quota: null, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch quota' };
      }
    }

    // Query Google Gemini (uses 'google' key in chatStore)
    if (providerKeys.google) {
      newStatuses['gemini'] = { provider: 'Google Gemini', quota: null, loading: true, error: null };
      try {
        const quota = await queryQuota('gemini', providerKeys.google);
        newStatuses['gemini'] = { provider: 'Google Gemini', quota, loading: false, error: null };
      } catch (error) {
        newStatuses['gemini'] = { provider: 'Google Gemini', quota: null, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch quota' };
      }
    }

    // Query Google Solar
    const solarKey = apiKeys.unified || apiKeys.solar;
    if (solarKey) {
      newStatuses['google-solar'] = { provider: 'Google Solar API', quota: null, loading: true, error: null };
      try {
        const quota = await queryQuota('google-solar', solarKey);
        newStatuses['google-solar'] = { provider: 'Google Solar API', quota, loading: false, error: null };
      } catch (error) {
        newStatuses['google-solar'] = { provider: 'Google Solar API', quota: null, loading: false, error: error instanceof Error ? error.message : 'Failed to fetch quota' };
      }
    }

    setQuotaStatuses(newStatuses);
    setIsRefreshing(false);
  }, [providerKeys.openai, providerKeys.anthropic, providerKeys.google, apiKeys.unified, apiKeys.solar]);

  useEffect(() => {
    // Initial load with slight delay to avoid cascading renders
    const timeout = setTimeout(refreshQuotas, 0);
    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshQuotas, 5 * 60 * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [refreshQuotas]);

  const getUsagePercentage = (quota: ApiQuota): number => {
    if (!quota.limit.requests || quota.limit.requests === 0) return 0;
    const used = quota.usage.requests;
    return (used / quota.limit.requests) * 100;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (Object.keys(quotaStatuses).length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-400">Configure API keys to monitor quotas in real-time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">📊 Live Quota Monitor</h3>
          <InfoTooltip content="Real-time API quota tracking from provider headers. Updates every 5 minutes or on manual refresh." />
        </div>
        <button
          onClick={refreshQuotas}
          disabled={isRefreshing}
          className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/30 disabled:opacity-50"
        >
          {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Now'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(quotaStatuses).map(([key, status]) => (
          <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-white">{status.provider}</h4>
              {status.loading && <span className="text-xs text-slate-400">Loading...</span>}
            </div>

            {status.error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-xs text-red-300">❌ {status.error}</p>
              </div>
            ) : status.quota ? (
              <div className="space-y-3">
                {/* Tier Info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tier:</span>
                  <span className={clsx('font-semibold', status.quota.tier === 'free' ? 'text-blue-400' : 'text-purple-400')}>
                    {status.quota.tier === 'free' ? '🆓 Free' : '💎 Paid'}
                  </span>
                </div>

                {/* Requests Quota */}
                {status.quota.limit.requests !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Requests ({status.quota.limit.period}):</span>
                      <span className={getUsageColor(getUsagePercentage(status.quota))}>
                        {status.quota.usage.requests.toLocaleString()} / {status.quota.limit.requests.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className={clsx('h-full rounded-full transition-all', getBarColor(getUsagePercentage(status.quota)))}
                        style={{ width: `${getUsagePercentage(status.quota)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tokens Quota */}
                {status.quota.limit.tokens !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Tokens ({status.quota.limit.period}):</span>
                      <span className={getUsageColor((status.quota.usage.tokens / status.quota.limit.tokens) * 100)}>
                        {status.quota.usage.tokens.toLocaleString()} / {status.quota.limit.tokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className={clsx('h-full rounded-full transition-all', getBarColor((status.quota.usage.tokens / status.quota.limit.tokens) * 100))}
                        style={{ width: `${((status.quota.usage.tokens / status.quota.limit.tokens) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Reset Time */}
                <div className="text-xs text-slate-400">
                  Resets: {new Date(status.quota.usage.resetAt).toLocaleString()}
                </div>

                {/* Cost Estimate */}
                {status.quota.cost && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-green-300">Input cost/1M tokens:</span>
                        <span className="font-semibold text-green-400">${status.quota.cost.inputTokens.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-300">Output cost/1M tokens:</span>
                        <span className="font-semibold text-green-400">${status.quota.cost.outputTokens.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {getUsagePercentage(status.quota) > 80 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                    <p className="text-xs text-amber-300">⚠️ High usage detected. Consider upgrading or monitoring closely.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No quota data available</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
        <p className="text-xs text-blue-200">
          <strong>💡 Note:</strong> Quota data is cached for 5 minutes to avoid excessive API calls. 
          Some providers may not expose detailed quota information. Free tier limits may vary by region.
        </p>
      </div>
    </div>
  );
}
