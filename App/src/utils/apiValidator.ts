/**
 * API Key Validation and Testing
 * 
 * Tests API keys before saving by making actual requests to each provider.
 * Provides detailed error messages for troubleshooting.
 */

import { logError, logWarning } from './errorLogger';

export interface ValidationResult {
  valid: boolean;
  provider: string;
  message: string;
  details?: string;
  statusCode?: number;
  errorType?: 'auth' | 'network' | 'cors' | 'rate-limit' | 'server' | 'unknown';
  suggestedFixes?: string[];
}

/**
 * Validate Google API key (Solar, Maps, Shopping)
 */
export async function validateGoogleApiKey(
  apiKey: string,
  apiType: 'solar' | 'maps' | 'shopping'
): Promise<ValidationResult> {
  try {
    let testEndpoint: string;
    let testParams: Record<string, string>;
    
    switch (apiType) {
      case 'solar':
        // Test with a known location (Google HQ)
        testEndpoint = 'https://solar.googleapis.com/v1/buildingInsights:findClosest';
        testParams = {
          'location.latitude': '37.4220936',
          'location.longitude': '-122.0840777',
          key: apiKey,
        };
        break;
        
      case 'maps':
        // Test with geocoding API
        testEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
        testParams = {
          address: '1600 Amphitheatre Parkway, Mountain View, CA',
          key: apiKey,
        };
        break;
        
      case 'shopping':
        // Test with custom search API
        testEndpoint = 'https://www.googleapis.com/customsearch/v1';
        testParams = {
          q: 'test',
          key: apiKey,
          cx: '000000000000000000000:aaaaaaa', // Placeholder CX
        };
        break;
    }
    
    const url = new URL(testEndpoint);
    Object.entries(testParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    // Check for errors
    if (!response.ok) {
      const errorMessage = data.error?.message || data.error_message || response.statusText;
      const statusCode = response.status;
      
      // Determine error type
      let errorType: ValidationResult['errorType'] = 'unknown';
      let suggestedFixes: string[] = [];
      
      if (statusCode === 401 || statusCode === 403) {
        errorType = 'auth';
        suggestedFixes = [
          'Verify the API key is correct and has not expired',
          `Enable the ${apiType === 'solar' ? 'Solar API' : apiType === 'maps' ? 'Geocoding API' : 'Custom Search API'} in Google Cloud Console`,
          'Check API key restrictions (HTTP referrers, IP addresses, or API restrictions)',
          'Ensure billing is enabled if you\'ve exceeded free tier limits',
        ];
      } else if (statusCode === 429) {
        errorType = 'rate-limit';
        suggestedFixes = [
          'You have exceeded the API rate limit or quota',
          'Wait a few minutes before trying again',
          'Check your quota limits in Google Cloud Console',
          'Consider upgrading your API plan for higher limits',
        ];
      } else if (statusCode >= 500) {
        errorType = 'server';
        suggestedFixes = [
          'The API server is experiencing issues (not your fault)',
          'Try again in a few minutes',
          'Check Google Cloud Status Dashboard for ongoing issues',
        ];
      }
      
      await logError(
        `API key validation failed for ${apiType}: ${errorMessage}`,
        undefined,
        'api',
        `Validating ${apiType} API key`
      );
      
      return {
        valid: false,
        provider: `google-${apiType}`,
        message: `Invalid or unauthorized: ${errorMessage}`,
        details: `Status ${statusCode}: ${errorMessage}`,
        statusCode,
        errorType,
        suggestedFixes,
      };
    }
    
    // Shopping API may fail if CX is not provided, but key is still valid
    if (apiType === 'shopping' && data.error && data.error.message?.includes('cx')) {
      return {
        valid: true,
        provider: 'google-shopping',
        message: 'API key is valid (Custom Search Engine ID required separately)',
        details: 'Key works, but you need to provide a valid CX (Search Engine ID)',
      };
    }
    
    // Success
    return {
      valid: true,
      provider: `google-${apiType}`,
      message: 'API key is valid and working',
      details: 'Successfully connected to the API',
    };
    
  } catch (error: any) {
    // Network or CORS error
    let errorType: ValidationResult['errorType'] = 'network';
    let suggestedFixes: string[] = [];
    
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      errorType = 'network';
      suggestedFixes = [
        'Check your internet connection',
        'Verify that firewall or antivirus is not blocking the request',
        'If on desktop, CORS restrictions should not apply',
        'If on web, ensure your domain is whitelisted in API key restrictions',
      ];
    }
    
    await logError(
      `Network error validating ${apiType} API key: ${error.message}`,
      error,
      'network',
      `Validating ${apiType} API key`
    );
    
    return {
      valid: false,
      provider: `google-${apiType}`,
      message: 'Network error - could not connect to API',
      details: error.message,
      errorType,
      suggestedFixes,
    };
  }
}

/**
 * Validate Google unified key (tests all APIs)
 */
export async function validateGoogleUnifiedKey(apiKey: string): Promise<{
  solar: ValidationResult;
  maps: ValidationResult;
  shopping: ValidationResult;
}> {
  const [solar, maps, shopping] = await Promise.all([
    validateGoogleApiKey(apiKey, 'solar'),
    validateGoogleApiKey(apiKey, 'maps'),
    validateGoogleApiKey(apiKey, 'shopping'),
  ]);
  
  return { solar, maps, shopping };
}

/**
 * Validate Gemini API key
 */
export async function validateGeminiKey(apiKey: string): Promise<ValidationResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello' }],
        }],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error?.message || response.statusText;
      
      let errorType: ValidationResult['errorType'] = 'auth';
      let suggestedFixes: string[] = [];
      
      if (response.status === 401 || response.status === 403) {
        suggestedFixes = [
          'Verify the API key is correct',
          'Ensure the key is from Google AI Studio (not Google Cloud Console)',
          'Check if the key has been revoked or expired',
        ];
      }
      
      await logError(
        `Gemini API key validation failed: ${errorMessage}`,
        undefined,
        'api',
        'Validating Gemini API key'
      );
      
      return {
        valid: false,
        provider: 'google-gemini',
        message: `Invalid: ${errorMessage}`,
        statusCode: response.status,
        errorType,
        suggestedFixes,
      };
    }
    
    return {
      valid: true,
      provider: 'google-gemini',
      message: 'API key is valid',
    };
    
  } catch (error: any) {
    await logError(
      `Network error validating Gemini API key: ${error.message}`,
      error,
      'network',
      'Validating Gemini API key'
    );
    
    return {
      valid: false,
      provider: 'google-gemini',
      message: 'Network error',
      details: error.message,
      errorType: 'network',
    };
  }
}

/**
 * Validate OpenAI API key
 */
export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error?.message || response.statusText;
      
      await logError(
        `OpenAI API key validation failed: ${errorMessage}`,
        undefined,
        'api',
        'Validating OpenAI API key'
      );
      
      return {
        valid: false,
        provider: 'openai',
        message: `Invalid: ${errorMessage}`,
        statusCode: response.status,
        errorType: 'auth',
        suggestedFixes: [
          'Verify the API key is correct',
          'Ensure the key has not been revoked',
          'Check if billing is set up (OpenAI requires prepaid credits)',
        ],
      };
    }
    
    return {
      valid: true,
      provider: 'openai',
      message: 'API key is valid',
    };
    
  } catch (error: any) {
    await logError(
      `Network error validating OpenAI API key: ${error.message}`,
      error,
      'network',
      'Validating OpenAI API key'
    );
    
    return {
      valid: false,
      provider: 'openai',
      message: 'Network error',
      details: error.message,
      errorType: 'network',
    };
  }
}

/**
 * Validate Anthropic API key
 */
export async function validateAnthropicKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hi',
        }],
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error?.message || response.statusText;
      
      await logError(
        `Anthropic API key validation failed: ${errorMessage}`,
        undefined,
        'api',
        'Validating Anthropic API key'
      );
      
      return {
        valid: false,
        provider: 'anthropic',
        message: `Invalid: ${errorMessage}`,
        statusCode: response.status,
        errorType: 'auth',
        suggestedFixes: [
          'Verify the API key is correct',
          'Ensure billing is set up (Anthropic requires prepaid credits)',
          'Check if the key has proper permissions',
        ],
      };
    }
    
    return {
      valid: true,
      provider: 'anthropic',
      message: 'API key is valid',
    };
    
  } catch (error: any) {
    await logError(
      `Network error validating Anthropic API key: ${error.message}`,
      error,
      'network',
      'Validating Anthropic API key'
    );
    
    return {
      valid: false,
      provider: 'anthropic',
      message: 'Network error',
      details: error.message,
      errorType: 'network',
    };
  }
}

/**
 * Validate xAI (Grok) API key
 */
export async function validateGrokKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{
          role: 'user',
          content: 'Hi',
        }],
        max_tokens: 10,
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error?.message || response.statusText;
      
      await logError(
        `xAI API key validation failed: ${errorMessage}`,
        undefined,
        'api',
        'Validating xAI API key'
      );
      
      return {
        valid: false,
        provider: 'grok',
        message: `Invalid: ${errorMessage}`,
        statusCode: response.status,
        errorType: 'auth',
      };
    }
    
    return {
      valid: true,
      provider: 'grok',
      message: 'API key is valid',
    };
    
  } catch (error: any) {
    await logError(
      `Network error validating xAI API key: ${error.message}`,
      error,
      'network',
      'Validating xAI API key'
    );
    
    return {
      valid: false,
      provider: 'grok',
      message: 'Network error',
      details: error.message,
      errorType: 'network',
    };
  }
}

/**
 * Validate all configured API keys
 */
export async function validateAllKeys(keys: {
  google?: { unified?: string; solar?: string; maps?: string; shopping?: string };
  gemini?: string;
  openai?: string;
  anthropic?: string;
  grok?: string;
}): Promise<Record<string, ValidationResult>> {
  const results: Record<string, ValidationResult> = {};
  
  const validations: Promise<void>[] = [];
  
  if (keys.google?.unified) {
    validations.push(
      validateGoogleUnifiedKey(keys.google.unified).then((res) => {
        results['google-solar'] = res.solar;
        results['google-maps'] = res.maps;
        results['google-shopping'] = res.shopping;
      })
    );
  } else {
    if (keys.google?.solar) {
      validations.push(
        validateGoogleApiKey(keys.google.solar, 'solar').then((res) => {
          results['google-solar'] = res;
        })
      );
    }
    if (keys.google?.maps) {
      validations.push(
        validateGoogleApiKey(keys.google.maps, 'maps').then((res) => {
          results['google-maps'] = res;
        })
      );
    }
    if (keys.google?.shopping) {
      validations.push(
        validateGoogleApiKey(keys.google.shopping, 'shopping').then((res) => {
          results['google-shopping'] = res;
        })
      );
    }
  }
  
  if (keys.gemini) {
    validations.push(
      validateGeminiKey(keys.gemini).then((res) => {
        results['gemini'] = res;
      })
    );
  }
  
  if (keys.openai) {
    validations.push(
      validateOpenAIKey(keys.openai).then((res) => {
        results['openai'] = res;
      })
    );
  }
  
  if (keys.anthropic) {
    validations.push(
      validateAnthropicKey(keys.anthropic).then((res) => {
        results['anthropic'] = res;
      })
    );
  }
  
  if (keys.grok) {
    validations.push(
      validateGrokKey(keys.grok).then((res) => {
        results['grok'] = res;
      })
    );
  }
  
  await Promise.all(validations);
  
  return results;
}
