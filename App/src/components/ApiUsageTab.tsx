/**
 * API Usage Dashboard Tab
 * Track API requests, costs, free tier usage, and prepaid credits
 */

import { useState } from 'react';
import { useApiUsageStore } from '../state/apiUsageStore';
import { API_PRICING } from '../types/api-usage';
import type { ApiProvider } from '../types/api-usage';
import { formatCurrency } from '../utils/calculations';
import InfoTooltip from './InfoTooltip';

const PROVIDER_LABELS: Record<ApiProvider, string> = {
  'google-solar': 'Google Solar API',
  'google-maps': 'Google Maps/Geocoding',
  'google-gemini': 'Google Gemini AI',
  'google-shopping': 'Google Shopping API',
  'openai': 'OpenAI',
  'anthropic': 'Anthropic Claude',
  'grok': 'xAI Grok',
};

export default function ApiUsageTab() {
  const {
    usage,
    prepaidCredits,
    addPrepaidCredit,
    getTotalCost,
    getRemainingFreeTier,
    resetUsage,
    exportUsage,
  } = useApiUsageStore();

  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | 'all'>('all');
  const [creditAmount, setCreditAmount] = useState<Record<ApiProvider, string>>({
    'google-solar': '',
    'google-maps': '',
    'google-gemini': '',
    'google-shopping': '',
    'openai': '',
    'anthropic': '',
    'grok': '',
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalMonthlyCost = getTotalCost();

  const filteredUsage = selectedProvider === 'all'
    ? usage.filter(u => u.month === currentMonth)
    : usage.filter(u => u.provider === selectedProvider && u.month === currentMonth);

  const handleAddCredit = (provider: ApiProvider) => {
    const amount = parseFloat(creditAmount[provider]);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    addPrepaidCredit(provider, amount);
    setCreditAmount({ ...creditAmount, [provider]: '' });
  };

  const handleExport = () => {
    const data = exportUsage();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const providers: ApiProvider[] = [
    'google-solar',
    'google-maps',
    'google-gemini',
    'google-shopping',
    'openai',
    'anthropic',
    'grok',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">API Usage Tracking</h3>
          <p className="mt-1 text-sm text-slate-300">
            Monitor your API usage, costs, free tier limits, and prepaid credits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Export JSON
          </button>
          <button
            onClick={() => {
              if (confirm('Reset all usage data for the current month?')) {
                resetUsage(undefined, currentMonth);
              }
            }}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            Reset Month
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Cost (Month)</p>
            <InfoTooltip content="Estimated cost for all API usage this month (after free tier)." />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(totalMonthlyCost)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Requests</p>
            <InfoTooltip content="Total API requests made this month across all providers." />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">
            {filteredUsage.reduce((sum, u) => sum + u.totalRequests, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Free Tier Used</p>
            <InfoTooltip content="Requests covered by free tier limits this month." />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">
            {filteredUsage.reduce((sum, u) => sum + u.freeTierUsed, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Paid Requests</p>
            <InfoTooltip content="Requests billed beyond free tier this month." />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">
            {filteredUsage.reduce((sum, u) => sum + u.paidRequests, 0)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white">Filter by Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as ApiProvider | 'all')}
          className="w-full max-w-xs rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white focus:border-accent focus:outline-none"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {/* Provider Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Provider Breakdown</h4>
        {providers.map((provider) => {
          const monthlyUsage = usage.find(u => u.provider === provider && u.month === currentMonth);
          const pricing = API_PRICING[provider];
          const remaining = getRemainingFreeTier(provider);
          const prepaid = prepaidCredits[provider];
          const paidCost = monthlyUsage ? monthlyUsage.estimatedCost : 0;
          const netCost = Math.max(0, paidCost - prepaid);

          return (
            <div key={provider} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-white">{PROVIDER_LABELS[provider]}</h5>
                    {monthlyUsage && monthlyUsage.totalRequests > 0 && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                        {monthlyUsage.totalRequests} requests
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-slate-400">Free Tier Remaining</p>
                      <p className="font-semibold text-white">
                        {remaining} / {pricing.freeTierLimit}
                      </p>
                      {remaining < pricing.freeTierLimit * 0.2 && remaining > 0 && (
                        <p className="text-xs text-orange-400">⚠️ Low</p>
                      )}
                      {remaining === 0 && pricing.freeTierLimit > 0 && (
                        <p className="text-xs text-red-400">❌ Exhausted</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-400">Paid Requests</p>
                      <p className="font-semibold text-white">
                        {monthlyUsage?.paidRequests || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Estimated Cost</p>
                      <p className="font-semibold text-white">
                        {formatCurrency(paidCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Prepaid Balance</p>
                      <p className="font-semibold text-green-400">
                        {formatCurrency(prepaid)}
                      </p>
                    </div>
                  </div>
                  {netCost > 0 && (
                    <p className="mt-2 text-xs text-yellow-300">
                      💳 Net cost after prepaid: {formatCurrency(netCost)}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-slate-400">
                    Pricing: {pricing.billingModel === 'per-1000' && `$${pricing.costPer1000}/1000 requests`}
                    {pricing.billingModel === 'per-request' && `$${pricing.costPerRequest}/request`}
                    {pricing.billingModel === 'per-token' && `$${pricing.costPerToken}/token`}
                    {pricing.freeTierLimit > 0 && ` (${pricing.freeTierLimit} free/month)`}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={creditAmount[provider]}
                    onChange={(e) => setCreditAmount({ ...creditAmount, [provider]: e.target.value })}
                    placeholder="$0.00"
                    className="w-24 rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-sm text-white"
                  />
                  <button
                    onClick={() => handleAddCredit(provider)}
                    className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent/90"
                  >
                    Add Credit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage History */}
      {filteredUsage.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-white">Recent Usage</h4>
          <div className="modern-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredUsage.map((u) => (
              <div key={`${u.provider}-${u.month}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{PROVIDER_LABELS[u.provider]}</p>
                    <p className="text-xs text-slate-400">
                      {u.totalRequests} requests • {u.freeTierUsed} free • {u.paidRequests} paid
                      {u.totalTokens && ` • ${u.totalTokens.toLocaleString()} tokens`}
                    </p>
                  </div>
                  <p className="font-semibold text-accent">{formatCurrency(u.estimatedCost)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
        <p className="font-semibold">💡 How It Works</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>• <strong>Free Tier:</strong> Each API has monthly free limits. Usage within limits is $0.</li>
          <li>• <strong>Paid Usage:</strong> Requests beyond free tier are billed at listed rates (estimates).</li>
          <li>• <strong>Prepaid Credits:</strong> Add balance per provider. Costs are auto-deducted from credits.</li>
          <li>• <strong>Net Cost:</strong> Actual billing = Paid cost - Prepaid balance.</li>
          <li>• Resets monthly. Export JSON to track historical usage.</li>
        </ul>
      </div>
    </div>
  );
}
