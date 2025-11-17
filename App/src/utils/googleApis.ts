/**
 * Google Cloud API Integration
 * Supports Solar API, Maps Geocoding, and unified API key management
 */

import type { GoogleApiKeys, SolarPotential, GeocodingResult, SolarPotentialRequest } from '../types/google-apis';
import { useApiUsageStore } from '../state/apiUsageStore';

const SOLAR_API_BASE = 'https://solar.googleapis.com/v1';
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode';

/**
 * Get the appropriate API key for a service
 */
export function getApiKey(keys: GoogleApiKeys, service: 'solar' | 'maps' | 'gemini'): string | undefined {
  // Try unified key first, then fall back to service-specific key
  return keys.unified || keys[service];
}

/**
 * Check if Solar API is available (has necessary API key)
 */
export function isSolarApiAvailable(keys: GoogleApiKeys): boolean {
  return !!(keys.unified || keys.solar);
}

/**
 * Check if Maps API is available (has necessary API key)
 */
export function isMapsApiAvailable(keys: GoogleApiKeys): boolean {
  return !!(keys.unified || keys.maps);
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string,
  apiKeys: GoogleApiKeys
): Promise<{ lat: number; lng: number; formatted_address: string }> {
  const apiKey = getApiKey(apiKeys, 'maps');
  
  if (!apiKey) {
    throw new Error('Google Maps API key is required for geocoding');
  }

  const url = `${GEOCODING_API_BASE}/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data: GeocodingResult = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
    
    const result = data.results[0];
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-maps', 1);
    
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get building insights from Google Solar API
 */
export async function getBuildingInsights(
  latitude: number,
  longitude: number,
  apiKeys: GoogleApiKeys
): Promise<SolarPotential['buildingInsights']> {
  const apiKey = getApiKey(apiKeys, 'solar');
  
  if (!apiKey) {
    throw new Error('Google Solar API key is required');
  }

  const url = `${SOLAR_API_BASE}/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch building insights');
    }
    
    const data = await response.json();
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-solar', 1);
    
    return data;
  } catch (error) {
    console.error('Building insights error:', error);
    throw new Error(`Failed to fetch building insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get comprehensive solar potential data from Google Solar API
 */
export async function getSolarPotential(
  latitude: number,
  longitude: number,
  apiKeys: GoogleApiKeys,
  options: Partial<SolarPotentialRequest> = {}
): Promise<SolarPotential> {
  const apiKey = getApiKey(apiKeys, 'solar');
  
  if (!apiKey) {
    throw new Error('Google Solar API key is required');
  }

  const params = new URLSearchParams({
    'location.latitude': latitude.toString(),
    'location.longitude': longitude.toString(),
    key: apiKey,
  });

  // Add optional parameters
  if (options.radiusMeters) {
    params.append('radiusMeters', options.radiusMeters.toString());
  }
  if (options.view) {
    params.append('view', options.view);
  }
  if (options.requiredQuality) {
    params.append('requiredQuality', options.requiredQuality);
  }
  if (options.exactQualityRequired !== undefined) {
    params.append('exactQualityRequired', options.exactQualityRequired.toString());
  }

  const url = `${SOLAR_API_BASE}/dataLayers:get?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch solar potential');
    }
    
    const data = await response.json();
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-solar', 1);
    
    // Also fetch building insights for complete data
    const buildingInsights = await getBuildingInsights(latitude, longitude, apiKeys);
    
    return {
      ...data,
      buildingInsights,
    };
  } catch (error) {
    console.error('Solar potential error:', error);
    throw new Error(`Failed to fetch solar potential: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get solar analysis for an address (geocode + solar potential)
 */
export async function analyzeSolarPotentialByAddress(
  address: string,
  apiKeys: GoogleApiKeys,
  options: Partial<SolarPotentialRequest> = {}
): Promise<{
  address: string;
  coordinates: { lat: number; lng: number };
  solarPotential: SolarPotential;
}> {
  // First, geocode the address
  const geocoded = await geocodeAddress(address, apiKeys);
  
  // Then, get solar potential for those coordinates
  const solarPotential = await getSolarPotential(
    geocoded.lat,
    geocoded.lng,
    apiKeys,
    options
  );
  
  return {
    address: geocoded.formatted_address,
    coordinates: {
      lat: geocoded.lat,
      lng: geocoded.lng,
    },
    solarPotential,
  };
}

/**
 * Format solar data for AI context
 * Provides comprehensive solar information to AI models for recommendations
 */
export function formatSolarDataForAI(solarPotential: SolarPotential): string {
  const building = solarPotential.buildingInsights;
  const wholeRoof = solarPotential.wholeRoofStats;
  
  let context = `# Solar Panel Installation Analysis\n\n`;
  
  // Building information
  if (building) {
    context += `## Building Information\n`;
    context += `- Location: ${building.center.latitude}, ${building.center.longitude}\n`;
    context += `- Postal Code: ${building.postalCode}\n`;
    context += `- Imagery Quality: ${building.imageryQuality}\n`;
    context += `- Imagery Date: ${building.imageryDate.year}-${building.imageryDate.month}-${building.imageryDate.day}\n\n`;
  }
  
  // Roof statistics
  context += `## Roof Analysis\n`;
  context += `- Total Roof Area: ${wholeRoof.areaMeters2.toFixed(2)} m²\n`;
  context += `- Ground Area: ${wholeRoof.groundAreaMeters2.toFixed(2)} m²\n`;
  context += `- Maximum Panels: ${solarPotential.maxArrayPanelsCount}\n`;
  context += `- Maximum Array Area: ${solarPotential.maxArrayAreaMeters2.toFixed(2)} m²\n`;
  context += `- Max Annual Sunshine: ${solarPotential.maxSunshineHoursPerYear.toFixed(0)} hours\n\n`;
  
  // Panel specifications
  context += `## Panel Specifications\n`;
  context += `- Panel Capacity: ${solarPotential.panelCapacityWatts}W\n`;
  context += `- Panel Dimensions: ${solarPotential.panelWidthMeters}m × ${solarPotential.panelHeightMeters}m\n`;
  context += `- Panel Lifetime: ${solarPotential.panelLifetimeYears} years\n`;
  context += `- Carbon Offset: ${solarPotential.carbonOffsetFactorKgPerMwh} kg/MWh\n\n`;
  
  // Roof segments
  if (solarPotential.roofSegmentStats?.length > 0) {
    context += `## Roof Segments (${solarPotential.roofSegmentStats.length} segments)\n`;
    solarPotential.roofSegmentStats.forEach((segment, i) => {
      context += `### Segment ${i + 1}\n`;
      context += `- Pitch: ${segment.pitchDegrees.toFixed(1)}°\n`;
      context += `- Azimuth: ${segment.azimuthDegrees.toFixed(1)}° (${getCardinalDirection(segment.azimuthDegrees)})\n`;
      context += `- Area: ${segment.stats.areaMeters2.toFixed(2)} m²\n`;
      context += `- Height at Center: ${segment.planeHeightAtCenterMeters.toFixed(2)}m\n\n`;
    });
  }
  
  // Solar panel configurations
  if (solarPotential.solarPanelConfigs?.length > 0) {
    context += `## Recommended Configurations (${solarPotential.solarPanelConfigs.length} options)\n`;
    solarPotential.solarPanelConfigs.slice(0, 3).forEach((config, i) => {
      context += `### Configuration ${i + 1}\n`;
      context += `- Total Panels: ${config.panelsCount}\n`;
      context += `- Annual Energy: ${(config.yearlyEnergyDcKwh / 1000).toFixed(2)} MWh (${config.yearlyEnergyDcKwh.toFixed(0)} kWh)\n`;
      if (config.roofSegmentSummaries?.length > 0) {
        context += `- Segments Used: ${config.roofSegmentSummaries.length}\n`;
        config.roofSegmentSummaries.forEach((summary) => {
          context += `  - Segment ${summary.segmentIndex + 1}: ${summary.panelsCount} panels, ${getCardinalDirection(summary.azimuthDegrees)} facing, ${summary.pitchDegrees.toFixed(1)}° pitch\n`;
        });
      }
      context += `\n`;
    });
  }
  
  // Financial analyses
  if (solarPotential.financialAnalyses?.length > 0) {
    context += `## Financial Analysis\n`;
    const analysis = solarPotential.financialAnalyses[0]; // Use first analysis
    const cash = analysis.cashPurchaseSavings;
    const financed = analysis.financedPurchaseSavings;
    
    if (cash) {
      context += `### Cash Purchase\n`;
      context += `- Upfront Cost: ${cash.upfrontCost.currencyCode} ${parseInt(cash.upfrontCost.units).toLocaleString()}\n`;
      context += `- Out of Pocket (after rebates): ${cash.outOfPocketCost.currencyCode} ${parseInt(cash.outOfPocketCost.units).toLocaleString()}\n`;
      context += `- Payback Period: ${cash.paybackYears.toFixed(1)} years\n`;
      context += `- 20-Year Savings: ${cash.savings.savingsYear20.currencyCode} ${parseInt(cash.savings.savingsYear20.units).toLocaleString()}\n`;
      context += `- Lifetime Savings: ${cash.savings.savingsLifetime.currencyCode} ${parseInt(cash.savings.savingsLifetime.units).toLocaleString()}\n\n`;
    }
    
    if (financed) {
      context += `### Financed Purchase\n`;
      context += `- Annual Loan Payment: ${financed.annualLoanPayment.currencyCode} ${parseInt(financed.annualLoanPayment.units).toLocaleString()}\n`;
      context += `- Interest Rate: ${(financed.loanInterestRate * 100).toFixed(2)}%\n`;
      context += `- 20-Year Savings: ${financed.savings.savingsYear20.currencyCode} ${parseInt(financed.savings.savingsYear20.units).toLocaleString()}\n\n`;
    }
  }
  
  return context;
}

/**
 * Convert azimuth degrees to cardinal direction
 */
function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
}

/**
 * Generate AI prompt with solar data context
 */
export function generateAIPromptWithSolarData(
  solarPotential: SolarPotential,
  userQuery: string
): string {
  const solarContext = formatSolarDataForAI(solarPotential);
  
  return `You are a solar energy expert helping a homeowner with their solar panel installation. You have access to comprehensive solar potential data from Google's Solar API.

${solarContext}

Based on this detailed analysis, please provide expert recommendations for the following question:

${userQuery}

Please consider:
1. Optimal panel placement based on roof segments, pitch, and azimuth
2. Potential shading issues or obstructions
3. Maximum energy production configuration
4. Cost-benefit analysis and ROI
5. Any structural considerations
6. Installation best practices

Provide specific, actionable recommendations tailored to this property's unique characteristics.`;
}

/**
 * Search for nearby places using Google Places API (New)
 * Useful for finding nearby electrical contractors, solar installers, etc.
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  type: string,
  radius: number = 5000,
  apiKeys: GoogleApiKeys
): Promise<any[]> {
  const apiKey = getApiKey(apiKeys, 'maps');
  
  if (!apiKey) {
    throw new Error('Google Places API key is required');
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message || 'Failed to search nearby places');
    }
    
    const data = await response.json();
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-maps', 1);
    
    return data.results || [];
  } catch (error) {
    console.error('Places API error:', error);
    throw new Error(`Failed to search nearby places: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get place details using Google Places API
 */
export async function getPlaceDetails(
  placeId: string,
  apiKeys: GoogleApiKeys
): Promise<any> {
  const apiKey = getApiKey(apiKeys, 'maps');
  
  if (!apiKey) {
    throw new Error('Google Places API key is required');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,reviews,opening_hours&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message || 'Failed to get place details');
    }
    
    const data = await response.json();
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-maps', 1);
    
    return data.result || null;
  } catch (error) {
    console.error('Place details error:', error);
    throw new Error(`Failed to get place details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate distance and travel time using Distance Matrix API
 * Useful for calculating distances between solar installation sites
 */
export async function calculateDistance(
  origins: string[],
  destinations: string[],
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving',
  apiKeys: GoogleApiKeys
): Promise<any> {
  const apiKey = getApiKey(apiKeys, 'maps');
  
  if (!apiKey) {
    throw new Error('Google Distance Matrix API key is required');
  }

  const originsParam = origins.map(o => encodeURIComponent(o)).join('|');
  const destinationsParam = destinations.map(d => encodeURIComponent(d)).join('|');
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&mode=${mode}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_message || 'Failed to calculate distance');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${data.status}`);
    }
    
    // Track usage
    useApiUsageStore.getState().trackUsage('google-maps', origins.length * destinations.length);
    
    return data;
  } catch (error) {
    console.error('Distance Matrix error:', error);
    throw new Error(`Failed to calculate distance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced geocoding with place details and nearby context
 */
export async function enhancedGeocode(
  address: string,
  apiKeys: GoogleApiKeys
): Promise<{
  coordinates: { lat: number; lng: number };
  formatted_address: string;
  placeDetails?: any;
  nearbySolarInstallers?: any[];
}> {
  // First, geocode the address
  const geocodeResult = await geocodeAddress(address, apiKeys);
  
  const result: any = {
    coordinates: { lat: geocodeResult.lat, lng: geocodeResult.lng },
    formatted_address: geocodeResult.formatted_address,
  };

  // Try to get nearby solar installers (optional, fails gracefully)
  try {
    const installers = await searchNearbyPlaces(
      geocodeResult.lat,
      geocodeResult.lng,
      'electrician', // Or 'general_contractor' for broader results
      10000, // 10km radius
      apiKeys
    );
    result.nearbySolarInstallers = installers.slice(0, 5); // Top 5 results
  } catch (error) {
    console.warn('Could not fetch nearby installers:', error);
  }

  return result;
}
