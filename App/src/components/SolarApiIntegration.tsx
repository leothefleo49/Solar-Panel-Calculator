/**
 * Google Solar API Integration Component
 * Allows users to analyze solar potential for any address
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
  const { apiKeys, hasAnySolarAccess, hasMapsAccess } = useGoogleApiStore();
  const { sendMessage } = useChatStore();

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
      setError('Google Cloud API keys are required for solar analysis. Configure them in the APIs tab.');
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
        <h2 className="text-xl font-semibold text-white">Google Solar API Analysis</h2>
        <InfoTooltip content="Analyze real-world roof potential, sun exposure data, and get AI-powered panel placement recommendations for any address using Google's Solar API." />
      </div>
      
      <p className="text-sm text-slate-300 mb-6">Enter a property address below to get detailed solar analysis. Make sure your API keys are configured in the APIs tab first.</p>

      {/* Address Analysis */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-medium">
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
            ⚠️ Configure your Google Cloud API keys in the <strong>APIs tab</strong> to enable solar analysis.
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
        <h3 className="text-sm font-semibold text-slate-300 mb-2">How It Works:</h3>
        <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
          <li>
            Configure API keys in the <strong>APIs tab</strong> (Solar API and Maps/Geocoding required)
          </li>
          <li>Enter a property address in the field above</li>
          <li>Click <strong>Analyze</strong> to fetch real-world solar data from Google</li>
          <li>Review roof analysis, sun exposure, and panel capacity results</li>
          <li>AI assistant automatically receives all data for intelligent recommendations</li>
        </ol>
        <p className="text-xs text-slate-500 mt-3">
          Need API keys? Visit <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >Google Cloud Console</a> and enable Solar API + Maps API.
        </p>
      </div>
    </div>
  );
}
