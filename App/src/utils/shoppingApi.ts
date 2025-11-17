/**
 * Google Shopping API Integration with AI-Enhanced Search
 * Uses Custom Search JSON API with Shopping annotations + AI for better product matching
 * Free tier: 100 requests/day
 * Pricing: $5 per 1000 requests after free tier
 */

import { useGoogleApiStore } from '../state/googleApiStore';
import { useApiUsageStore } from '../state/apiUsageStore';
import { useChatStore } from '../state/chatStore';
import type { GoogleShoppingResponse, GoogleShoppingProduct } from '../types/shopping';

const SHOPPING_API_BASE = 'https://www.googleapis.com/customsearch/v1';

/**
 * Enhanced product search that uses AI to improve query and parse results
 * Supports: product title, description, UPC, model number, ASIN, brand, generic terms
 */
export async function searchProducts(query: string, options?: {
  maxResults?: number;
  country?: string;
  category?: string;
  multiSite?: boolean; // attempt site-filtered fallbacks if first query yields no results
  useAI?: boolean; // Enable AI query enhancement (default: true)
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

  // Use AI to enhance the search query if available (unless disabled)
  const enhancedQuery = (options?.useAI !== false) 
    ? await enhanceSearchQuery(query, options?.category)
    : query;

  // Build query variants (fallbacks) if first query empty
  const variants = buildQueryVariants(query.trim(), enhancedQuery.trim());

  const aggregated: GoogleShoppingProduct[] = [];
  const seenLinks = new Set<string>();
  let performedRequests = 0;

  for (let i = 0; i < variants.length; i++) {
    const q = variants[i];
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q,
      num: String(options?.maxResults || 10),
      ...(options?.country && { gl: options.country }),
    });
    const response = await fetch(`${SHOPPING_API_BASE}?${params}`);
    performedRequests++;

    if (!response.ok) {
      // If first query fails—throw; otherwise continue to next fallback
      if (aggregated.length === 0) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || `Shopping API request failed: ${response.status}`);
      } else {
        continue;
      }
    }

    const data: GoogleShoppingResponse = await response.json();
    const items = data.items || [];
    for (const item of items) {
      if (item.link && !seenLinks.has(item.link)) {
        seenLinks.add(item.link);
        // Annotate which query produced this result for UI context
        (item as any)._sourceQuery = q;
        aggregated.push(item);
      }
    }

    // If we got some results on primary query and multiSite disabled, break
    if (i === 0 && aggregated.length > 0 && options?.multiSite === false) break;
    // If primary query returned results and they exceed threshold, no need for fallbacks
    if (i === 0 && aggregated.length >= Math.min(options?.maxResults || 10, 6)) break;
    // If we have enough results overall, stop
    if (aggregated.length >= (options?.maxResults || 10)) break;
  }

  // Track usage for each performed request
  if (performedRequests > 0) {
    useApiUsageStore.getState().trackUsage('google-shopping', performedRequests);
  }

  // Rank aggregated results
  return await rankProductResults(aggregated, query, options?.category);
}

/**
 * Use AI to enhance search query for better product matching
 * Examples:
 *  - "400w panel" -> "400 watt solar panel photovoltaic module"
 *  - "inv" -> "solar inverter string grid-tie"
 *  - UPC/ASIN detection -> add appropriate search terms
 */
async function enhanceSearchQuery(query: string, category?: string): Promise<string> {
  const trimmedQuery = query.trim();
  
  // Detect if query is a product identifier - use EXACT match, no enhancement
  const isUPC = /^\d{12,14}$/.test(trimmedQuery);
  const isASIN = /^B[0-9A-Z]{9}$/i.test(trimmedQuery);
  const isEAN = /^\d{8,13}$/.test(trimmedQuery);
  
  // If it looks like a specific product code, search literally
  if (isUPC || isEAN) {
    // Just use the exact code - don't add extra terms that might dilute results
    return trimmedQuery;
  }
  if (isASIN) {
    // ASIN searches work best with just the code; we'll add site filters as fallbacks later
    return trimmedQuery;
  }
  
  // Detect model numbers - search more literally
  const isModelNumber = /^[A-Z]{2,}[-\s]?\d{2,}[A-Z0-9-]*$/i.test(trimmedQuery);
  if (isModelNumber) {
    // Model numbers should be searched with minimal modification
    return `"${trimmedQuery}" solar ${category || 'equipment'}`;
  }
  
  // If query has quotes, user wants exact match - respect that
  if (trimmedQuery.startsWith('"') && trimmedQuery.endsWith('"')) {
    return trimmedQuery;
  }
  
  // If query is already specific and long (>25 chars), don't enhance too much
  if (trimmedQuery.length > 25) {
    // Just add solar context if not already present
    const hasContext = /solar|panel|inverter|battery|pv|photovoltaic/i.test(trimmedQuery);
    return hasContext ? trimmedQuery : `${trimmedQuery} solar`;
  }

  // Try to use AI for query enhancement if available
  const { hasProviderKey } = useChatStore.getState();
  
  // Check if any AI provider is available
  if (hasProviderKey('google') || hasProviderKey('openai') || hasProviderKey('anthropic')) {
    try {
      const enhancedQuery = await aiEnhanceQuery(query, category);
      if (enhancedQuery) return enhancedQuery;
    } catch (err) {
      console.warn('AI query enhancement failed, using original:', err);
    }
  }

  // Fallback: add category context
  const categoryMap: Record<string, string> = {
    'solar-panel': 'solar panel photovoltaic module PV',
    'inverter': 'solar inverter string grid-tie microinverter',
    'battery': 'solar battery storage lithium LiFePO4',
    'charge-controller': 'charge controller MPPT PWM solar',
    'mounting': 'solar panel mounting hardware rails brackets',
    'wiring': 'solar cable wire MC4 PV',
    'disconnect': 'solar disconnect switch breaker',
    'meter': 'solar meter monitoring',
  };

  if (category && categoryMap[category]) {
    return `${query} ${categoryMap[category]}`;
  }

  return `${query} solar equipment`;
}

/**
 * Build query variants for multi-site/fallback searching.
 * Order matters: primary enhanced query first, then targeted site filters for identifiers.
 */
function buildQueryVariants(original: string, enhanced: string): string[] {
  const variants: string[] = [enhanced];

  const isUPC = /^\d{12,14}$/.test(original);
  const isEAN = /^\d{8,13}$/.test(original);
  const isASIN = /^B[0-9A-Z]{9}$/i.test(original);

  // Identifier-specific site targeting (Amazon/Walmart/HomeDepot/etc.)
  if (isASIN) {
    variants.push(`${original} site:amazon.com`);
    variants.push(`${original} site:amazon.co.uk`);
    variants.push(`${original} site:ebay.com`);
  } else if (isUPC || isEAN) {
    variants.push(`${original} site:amazon.com`);
    variants.push(`${original} site:walmart.com`);
    variants.push(`${original} site:homedepot.com`);
    variants.push(`${original} site:lowes.com`);
  }

  // If user supplied brand + model style (two tokens with letters+digits) add quoted exact match
  if (/\b[A-Z]{2,}[- ]?\d{2,}[A-Z0-9-]*\b/.test(original)) {
    variants.push(`"${original}"`);
  }

  // Generic fallback with broader e-commerce context if still empty later
  variants.push(`${original} solar product price`);

  // Deduplicate preserving order
  return Array.from(new Set(variants));
}

/**
 * Use AI to enhance query via LLM
 */
async function aiEnhanceQuery(query: string, category?: string): Promise<string | null> {
  const { providerKeys, provider } = useChatStore.getState();
  const key = providerKeys[provider];
  
  if (!key) return null;

  const prompt = `You are a solar equipment search expert. Convert this user query into an optimal product search query for finding solar equipment. Be specific and include relevant technical terms.

User query: "${query}"
Category: ${category || 'any'}

Respond with ONLY the enhanced search query, no explanation. Keep it under 100 characters.`;

  try {
    if (provider === 'google') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0.3 }
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
    // Add support for other providers if needed
  } catch (err) {
    console.error('AI enhancement error:', err);
  }

  return null;
}

/**
 * Use AI to rank and filter product results for better relevance
 */
async function rankProductResults(
  results: GoogleShoppingProduct[],
  originalQuery: string,
  category?: string
): Promise<GoogleShoppingProduct[]> {
  if (results.length <= 3) return results; // No need to rank few results

  // Simple relevance scoring for now
  // TODO: Use AI for more sophisticated ranking
  return results.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const queryLower = originalQuery.toLowerCase();
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();

    // Exact query match in title gets highest score
    if (titleA.includes(queryLower)) scoreA += 10;
    if (titleB.includes(queryLower)) scoreB += 10;

    // Category match
    if (category) {
      if (titleA.includes(category.replace('-', ' '))) scoreA += 5;
      if (titleB.includes(category.replace('-', ' '))) scoreB += 5;
    }

    // Has price information
    if (a.product?.price) scoreA += 3;
    if (b.product?.price) scoreB += 3;

    // Has image
    if (a.image?.thumbnailLink) scoreA += 1;
    if (b.image?.thumbnailLink) scoreB += 1;

    return scoreB - scoreA;
  });
}

/**
 * Extract product specs from Shopping API result and page content
 * Uses AI to parse specs if available and enabled, otherwise manual extraction
 */
export async function extractProductSpecs(product: GoogleShoppingProduct, _useAI: boolean = true): Promise<{
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
