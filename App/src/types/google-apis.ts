/**
 * Google Cloud API Types
 * Supports Google Solar API, Maps Geocoding, and Gemini AI
 */

export interface GoogleApiKeys {
  unified?: string; // Single Google Cloud API key for all services
  solar?: string; // Separate Solar API key
  maps?: string; // Separate Maps API key
  gemini?: string; // Separate Gemini AI key
}

export interface SolarPotentialRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  radiusMeters?: number;
  view?: 'FULL_LAYERS' | 'DSM_LAYER' | 'IMAGERY_LAYER' | 'IMAGERY_AND_ANNUAL_FLUX_LAYERS' | 'IMAGERY_AND_ALL_FLUX_LAYERS';
  requiredQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
  exactQualityRequired?: boolean;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: Array<{
    pitchDegrees: number;
    azimuthDegrees: number;
    panelsCount: number;
    yearlyEnergyDcKwh: number;
    segmentIndex: number;
  }>;
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panelLifetimeYears: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  roofSegmentStats: Array<{
    pitchDegrees: number;
    azimuthDegrees: number;
    stats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    center: {
      latitude: number;
      longitude: number;
    };
    boundingBox: {
      sw: { latitude: number; longitude: number };
      ne: { latitude: number; longitude: number };
    };
    planeHeightAtCenterMeters: number;
  }>;
  solarPanelConfigs: SolarPanelConfig[];
  financialAnalyses: Array<{
    monthlyBill: {
      currencyCode: string;
      units: string;
    };
    defaultBill: boolean;
    averageKwhPerMonth: number;
    panelConfigIndex: number;
    financialDetails: {
      initialAcKwhPerYear: number;
      remainingLifetimeUtilityBill: {
        currencyCode: string;
        units: string;
      };
      federalIncentive: {
        currencyCode: string;
        units: string;
      };
      stateIncentive: {
        currencyCode: string;
        units: string;
      };
      utilityIncentive: {
        currencyCode: string;
        units: string;
      };
      lifetimeSrecTotal: {
        currencyCode: string;
        units: string;
      };
      costOfElectricityWithoutSolar: {
        currencyCode: string;
        units: string;
      };
      netMeteringAllowed: boolean;
      solarPercentage: number;
      percentageExportedToGrid: number;
    };
    leasingSavings: {
      leasesAllowed: boolean;
      leasesSupported: boolean;
      annualLeasingCost: {
        currencyCode: string;
        units: string;
      };
      savings: {
        savingsYear1: {
          currencyCode: string;
          units: string;
        };
        savingsYear20: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsYear20: {
          currencyCode: string;
          units: string;
        };
        savingsLifetime: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsLifetime: {
          currencyCode: string;
          units: string;
        };
      };
    };
    cashPurchaseSavings: {
      outOfPocketCost: {
        currencyCode: string;
        units: string;
      };
      upfrontCost: {
        currencyCode: string;
        units: string;
      };
      rebateValue: {
        currencyCode: string;
        units: string;
      };
      paybackYears: number;
      savings: {
        savingsYear1: {
          currencyCode: string;
          units: string;
        };
        savingsYear20: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsYear20: {
          currencyCode: string;
          units: string;
        };
        savingsLifetime: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsLifetime: {
          currencyCode: string;
          units: string;
        };
      };
    };
    financedPurchaseSavings: {
      annualLoanPayment: {
        currencyCode: string;
        units: string;
      };
      rebateValue: {
        currencyCode: string;
        units: string;
      };
      loanInterestRate: number;
      savings: {
        savingsYear1: {
          currencyCode: string;
          units: string;
        };
        savingsYear20: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsYear20: {
          currencyCode: string;
          units: string;
        };
        savingsLifetime: {
          currencyCode: string;
          units: string;
        };
        presentValueOfSavingsLifetime: {
          currencyCode: string;
          units: string;
        };
      };
    };
  }>;
  buildingInsights?: {
    name: string;
    center: {
      latitude: number;
      longitude: number;
    };
    boundingBox: {
      sw: { latitude: number; longitude: number };
      ne: { latitude: number; longitude: number };
    };
    imageryDate: {
      year: number;
      month: number;
      day: number;
    };
    imageryProcessedDate: {
      year: number;
      month: number;
      day: number;
    };
    postalCode: string;
    administrativeArea: string;
    statisticalArea: string;
    regionCode: string;
    imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface GeocodingResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
}

export interface SolarAnalysisResult {
  solarPotential: SolarPotential;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  aiRecommendations?: {
    panelPlacement: string;
    optimizations: string[];
    warnings: string[];
    estimatedSavings: string;
  };
}
