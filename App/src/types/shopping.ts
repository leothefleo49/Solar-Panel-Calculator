/**
 * Shopping Cart & Product Types
 * Supports Google Shopping API integration and manual product entry
 */

export type ProductCategory =
  | 'solar-panel'
  | 'inverter'
  | 'battery'
  | 'charge-controller'
  | 'mounting'
  | 'wiring'
  | 'disconnect'
  | 'meter'
  | 'other';

export interface ProductSpecs {
  // Common specs
  manufacturer?: string;
  model?: string;
  voltage?: number; // Operating voltage (V)
  voltageRange?: { min: number; max: number }; // Voltage range (V)
  current?: number; // Operating current (A)
  currentMax?: number; // Max current (A)
  power?: number; // Power rating (W)
  efficiency?: number; // Efficiency (0-1)
  
  // Solar panel specific
  cellType?: 'monocrystalline' | 'polycrystalline' | 'thin-film';
  dimensions?: { width: number; height: number; depth: number }; // mm
  weight?: number; // kg
  tempCoeff?: number; // Temperature coefficient (%/°C)
  
  // Inverter specific
  inverterType?: 'string' | 'micro' | 'hybrid' | 'off-grid';
  mpptChannels?: number;
  gridTieCapable?: boolean;
  
  // Battery specific
  capacity?: number; // Ah
  capacityWh?: number; // Wh
  chemistry?: 'lithium-ion' | 'lead-acid' | 'lifepo4';
  cycleLife?: number;
  dod?: number; // Depth of discharge (0-1)
  
  // Wiring specific
  wireGauge?: number; // AWG
  cableLength?: number; // meters
  ampacity?: number; // A
  
  // Code compliance
  ul1741?: boolean; // UL1741 certified (grid-tie inverters)
  ul9540?: boolean; // UL9540 certified (battery systems)
  iecRating?: string;
  necCompliant?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  category: ProductCategory;
  specs: ProductSpecs;
  price?: number;
  currency?: string;
  quantity: number;
  url?: string;
  imageUrl?: string;
  notes?: string;
  addedAt: number;
  
  // Compatibility status
  compatible: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface CompatibilityCheck {
  passed: boolean;
  errors: string[]; // Blocking issues
  warnings: string[]; // Non-blocking concerns
  suggestions: string[]; // Optimization tips
}

export interface ShoppingCartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'addedAt' | 'compatible' | 'warnings' | 'suggestions'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  checkCompatibility: () => CompatibilityCheck;
  getMissingComponents: () => string[];
}

// Google Shopping API types
export interface GoogleShoppingProduct {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  formattedPrice?: string;
  image?: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
  product?: {
    title: string;
    brand?: string;
    condition?: string;
    price?: string;
    availability?: string;
    channel?: string;
    productId?: string;
  };
}

export interface GoogleShoppingResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
  context: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleShoppingProduct[];
}
