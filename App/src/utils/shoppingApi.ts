/**
 * Google Shopping API Integration
 * Uses Custom Search JSON API with Shopping annotations
 * Free tier: 100 requests/day
 * Pricing: $5 per 1000 requests after free tier
 */

import { useGoogleApiStore } from '../state/googleApiStore';
import { useApiUsageStore } from '../state/apiUsageStore';
import type { GoogleShoppingResponse, GoogleShoppingProduct } from '../types/shopping';

const SHOPPING_API_BASE = 'https://www.googleapis.com/customsearch/v1';

/**
 * Search for solar equipment products via Google Shopping API
 */
export async function searchProducts(query: string, options?: {
  maxResults?: number;
  country?: string;
}): Promise<GoogleShoppingProduct[]> {
  const { apiKeys } = useGoogleApiStore.getState();
  const apiKey = apiKeys.shopping || apiKeys.unified;
  const cx = apiKeys.shoppingCx;

  if (!apiKey) {
    throw new Error('Google Shopping API key not configured. Add key in APIs tab.');
  }

  if (!cx) {
    throw new Error('Custom Search Engine ID (CX) not configured. See APIs tab for setup instructions.');
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: cx,
    q: query,
    num: String(options?.maxResults || 10),
    ...(options?.country && { gl: options.country }),
  });

  const response = await fetch(`${SHOPPING_API_BASE}?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `Shopping API request failed: ${response.status}`);
  }

  const data: GoogleShoppingResponse = await response.json();
  
  // Track usage
  useApiUsageStore.getState().trackUsage('google-shopping', 1);
  
  return data.items || [];
}

/**
 * Extract product specs from Shopping API result and page content
 * Uses AI to parse specs if available, otherwise manual extraction
 */
export async function extractProductSpecs(product: GoogleShoppingProduct): Promise<{
  manufacturer?: string;
  model?: string;
  power?: number;
  voltage?: number;
  current?: number;
  efficiency?: number;
  category?: string;
}> {
  // Basic extraction from title/snippet
  const text = `${product.title} ${product.snippet}`.toLowerCase();
  
  const specs: any = {
    manufacturer: product.product?.brand,
    model: extractModel(product.title),
  };

  // Extract power rating (watts)
  const powerMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:w|watt|watts|kw)/i);
  if (powerMatch) {
    const value = parseFloat(powerMatch[1]);
    specs.power = text.includes('kw') ? value * 1000 : value;
  }

  // Extract voltage
  const voltageMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:v|volt|volts)/i);
  if (voltageMatch) {
    specs.voltage = parseFloat(voltageMatch[1]);
  }

  // Extract current (amps)
  const currentMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:a|amp|amps)/i);
  if (currentMatch) {
    specs.current = parseFloat(currentMatch[1]);
  }

  // Extract efficiency
  const efficiencyMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*efficienc/i);
  if (efficiencyMatch) {
    specs.efficiency = parseFloat(efficiencyMatch[1]) / 100;
  }

  // Categorize product
  if (text.includes('solar panel') || text.includes('photovoltaic') || text.includes('pv module')) {
    specs.category = 'solar-panel';
  } else if (text.includes('inverter')) {
    specs.category = 'inverter';
  } else if (text.includes('battery')) {
    specs.category = 'battery';
  } else if (text.includes('charge controller') || text.includes('mppt')) {
    specs.category = 'charge-controller';
  } else if (text.includes('mount') || text.includes('rail') || text.includes('bracket')) {
    specs.category = 'mounting';
  } else if (text.includes('wire') || text.includes('cable')) {
    specs.category = 'wiring';
  } else if (text.includes('disconnect') || text.includes('breaker')) {
    specs.category = 'disconnect';
  }

  return specs;
}

/**
 * Extract model number from product title
 */
function extractModel(title: string): string | undefined {
  // Common model number patterns
  const patterns = [
    /model\s*[:#]?\s*([A-Z0-9-]+)/i,
    /\b([A-Z]{2,}\d{2,}[A-Z0-9-]*)\b/,
    /\b([A-Z]\d{3,}[A-Z0-9-]*)\b/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

/**
 * Parse product URL to fetch detailed specs
 * Falls back to manual input if scraping fails
 */
export async function fetchProductDetails(url: string): Promise<{
  name?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  specs?: Record<string, any>;
} | null> {
  try {
    // For MVP: just return URL metadata
    // Future: implement Puppeteer/Playwright scraping or use AI to parse page
    const urlObj = new URL(url);
    return {
      name: `Product from ${urlObj.hostname}`,
      specs: {},
    };
  } catch {
    return null;
  }
}
