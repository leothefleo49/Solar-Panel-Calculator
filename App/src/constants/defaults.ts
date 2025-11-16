import type { SimulationInputs, SolarConfig } from '../types/solar'

export const defaultSolarConfig: SolarConfig = {
  utilityCostPerKwh: 0.18,
  netMetering: true,
  netMeteringSellRate: 0.08,
  utilityInflationRate: 3,
  monthlyUsage: 900,
  federalTaxCredit: 30,
  peakSunHours: 5.2,
  sunHoursMode: 'daily',
  panelCount: 24,
  panelWattage: 400,
  panelEfficiency: 21,
  panelDegradationRate: 0.5,
  
  // Panel pricing
  pricingMode: 'perUnit',
  costPerPanel: 280,
  panelBulkCount: 1,
  panelBulkCost: 6720,
  
  inverterType: 'String',
  inverterEfficiency: 97,
  
  // Inverter pricing
  inverterPricingMode: 'perUnit',
  inverterCost: 3500,
  inverterBulkCount: 1,
  inverterBulkCost: 3500,
  
  cablingLoss: 2,
  batteryEnabled: true,
  batteryCapacity: 13.5,
  batteryDoD: 90,
  batteryPower: 5,
  
  // Battery pricing
  batteryPricingMode: 'perUnit',
  batteryCost: 12000,
  batteryBulkCount: 1,
  batteryBulkCost: 12000,
  
  mountingCost: 2500,
  monitoringCost: 800,
  laborCost: 6000,
  otherFees: 1000,
  
  // Loan financing
  financingMode: 'cash',
  loanAmount: 0,
  loanTermYears: 25,
  loanInterestRate: 6.5,
  creditScore: 720,
}

export const defaultSimulationInputs: SimulationInputs = {
  criticalLoadWatts: 600,
  cheapestMonthBill: 110,
  expensiveMonthBill: 260,
}
