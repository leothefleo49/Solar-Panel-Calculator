/**
 * Google Solar API Integration Component
 * Allows users to configure Google Cloud API keys and analyze solar potential
 */

import { useState } from 'react';
import { useGoogleApiStore } from '../state/googleApiStore';
import { useChatStore } from '../state/chatStore';
import {
  analyzeSolarPotentialByAddress,
  generateAIPromptWithSolarData,
} from '../utils/googleApis';
import type { SolarAnalysisResult } from '../types/google-apis';
import InfoTooltip from './InfoTooltip';

export default function SolarApiIntegration() {
  const {
    apiKeys,
    setUnifiedKey,
    setSolarKey,
    setMapsKey,
    setGeminiKey,
    clearUnifiedKey,
    clearSolarKey,
    clearMapsKey,
    clearGeminiKey,
    hasAnySolarAccess,
    hasMapsAccess,
  } = useGoogleApiStore();

  const { sendMessage } = useChatStore();

  const [keyMode, setKeyMode] = useState<'unified' | 'separate'>(
    apiKeys.unified ? 'unified' : 'separate'
  );
  const [showKeys, setShowKeys] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SolarAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!hasAnySolarAccess() || !hasMapsAccess()) {
      setError('Google Cloud API keys are required for solar analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeSolarPotentialByAddress(address, apiKeys, {
        view: 'IMAGERY_AND_ALL_FLUX_LAYERS',
        requiredQuality: 'HIGH',
      });

      setAnalysisResult({
        ...result,
        aiRecommendations: undefined, // Will be generated via AI chat
      });

      // Automatically send solar data to AI for analysis
      const aiPrompt = generateAIPromptWithSolarData(
        result.solarPotential,
        `Please analyze this solar installation opportunity and provide comprehensive recommendations for optimal panel placement, expected energy production, financial benefits, and any considerations I should be aware of.`
      );

      await sendMessage(aiPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze solar potential');
      console.error('Solar analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-white">Google Solar API</h2>
        <InfoTooltip content="Integrate with Google's Solar API to get real-world roof analysis, sun exposure data, and AI-powered panel placement recommendations for any address." />
      </div>

      {/* API Key Configuration */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-300 font-medium">API Key Mode:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setKeyMode('unified')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                keyMode === 'unified'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-700/30 text-slate-400 border border-slate-600/50 hover:border-slate-500'
              }`}
            >
              Unified Key
            </button>
            <button
              onClick={() => setKeyMode('separate')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                keyMode === 'separate'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-700/30 text-slate-400 border border-slate-600/50 hover:border-slate-500'
              }`}
            >
              Separate Keys
            </button>
          </div>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="ml-auto text-sm text-slate-400 hover:text-slate-300"
          >
            {showKeys ? '🙈 Hide' : '👁️ Show'} Keys
          </button>
        </div>

        {keyMode === 'unified' ? (
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Google Cloud API Key (All Services)
              <InfoTooltip content="A single API key with access to Solar API, Maps API, and optionally Gemini AI. Enable these APIs in your Google Cloud Console." />
            </label>
            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.unified || ''}
                onChange={(e) => setUnifiedKey(e.target.value)}
                placeholder="Enter your Google Cloud API key"
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {apiKeys.unified && (
                <button
                  onClick={clearUnifiedKey}
                  className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Solar API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.solar || ''}
                  onChange={(e) => setSolarKey(e.target.value)}
                  placeholder="Solar API key"
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {apiKeys.solar && (
                  <button
                    onClick={clearSolarKey}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Maps API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.maps || ''}
                  onChange={(e) => setMapsKey(e.target.value)}
                  placeholder="Maps/Geocoding API key"
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {apiKeys.maps && (
                  <button
                    onClick={clearMapsKey}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Gemini AI Key (Optional)
                <InfoTooltip content="Separate Gemini API key for AI chat. If not provided, uses the unified key or your configured chat AI provider." />
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={apiKeys.gemini || ''}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Gemini API key (optional)"
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {apiKeys.gemini && (
                  <button
                    onClick={clearGeminiKey}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Analysis */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Property Address
            <InfoTooltip content="Enter the full address of the property you want to analyze. The Solar API will provide detailed roof analysis, sun exposure, and financial projections." />
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
              disabled={!hasAnySolarAccess() || !hasMapsAccess()}
              className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !hasAnySolarAccess() || !hasMapsAccess()}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {!hasAnySolarAccess() || !hasMapsAccess() ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
            ⚠️ Configure your Google Cloud API keys above to enable solar analysis.
            You need both Solar API and Maps API access.
          </div>
        ) : null}

        {analysisResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg space-y-3">
            <h3 className="text-emerald-400 font-semibold">Analysis Complete!</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p>
                <strong>Address:</strong> {analysisResult.address}
              </p>
              <p>
                <strong>Coordinates:</strong> {analysisResult.coordinates.lat.toFixed(6)},{' '}
                {analysisResult.coordinates.lng.toFixed(6)}
              </p>
              <p>
                <strong>Max Panels:</strong>{' '}
                {analysisResult.solarPotential.maxArrayPanelsCount}
              </p>
              <p>
                <strong>Roof Area:</strong>{' '}
                {analysisResult.solarPotential.wholeRoofStats.areaMeters2.toFixed(2)} m²
              </p>
              <p>
                <strong>Annual Sunshine:</strong>{' '}
                {analysisResult.solarPotential.maxSunshineHoursPerYear.toFixed(0)} hours
              </p>
            </div>
            <p className="text-xs text-slate-400">
              📊 Comprehensive analysis and AI recommendations have been sent to the chat assistant.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Setup Instructions:</h3>
        <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
          <li>
            Get API keys from{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Google Cloud Console
            </a>
          </li>
          <li>Enable Solar API and Maps JavaScript API/Geocoding API</li>
          <li>Choose unified key (all services) or separate keys per service</li>
          <li>Enter property address and click Analyze</li>
          <li>AI will receive all solar data for intelligent recommendations</li>
        </ol>
      </div>
    </div>
  );
}
