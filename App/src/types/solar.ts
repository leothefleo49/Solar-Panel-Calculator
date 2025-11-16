export type InverterType = 'String' | 'Micro'
export type PricingMode = 'perUnit' | 'bulk'
export type SunHoursMode = 'daily' | 'yearly'
export type FinancingMode = 'cash' | 'loan'

export interface SolarConfig {
  utilityCostPerKwh: number
  netMetering: boolean
  netMeteringSellRate: number
  utilityInflationRate: number
  monthlyUsage: number
  federalTaxCredit: number
  peakSunHours: number
  sunHoursMode: SunHoursMode
  panelCount: number
  panelWattage: number
  panelEfficiency: number
  panelDegradationRate: number
  
  // Panel pricing
  pricingMode: PricingMode
  costPerPanel: number
  panelBulkCount: number
  panelBulkCost: number
  
  inverterType: InverterType
  inverterEfficiency: number
  
  // Inverter pricing
  inverterPricingMode: PricingMode
  inverterCost: number
  inverterBulkCount: number
  inverterBulkCost: number
  
  cablingLoss: number
  batteryEnabled: boolean
  batteryCapacity: number
  batteryDoD: number
  batteryPower: number
  
  // Battery pricing
  batteryPricingMode: PricingMode
  batteryCost: number
  batteryBulkCount: number
  batteryBulkCost: number
  
  mountingCost: number
  monitoringCost: number
  laborCost: number
  otherFees: number
  
  // Loan financing
  financingMode: FinancingMode
  loanAmount: number
  loanTermYears: number
  loanInterestRate: number
  creditScore: number
}

export interface SimulationInputs {
  criticalLoadWatts: number
  cheapestMonthBill: number
  expensiveMonthBill: number
}

export interface ProjectionYear {
  year: number
  productionKwh: number
  degradationPercent: number
  energySavings: number
  netMeteringIncome: number
  totalBenefit: number
  cumulativeSavings: number
  utilityCostWithoutSolar: number
  solarSystemCumulative: number
}

export interface FinancialSummary {
  totalSavings: number
  breakEvenYear: number | null
  breakEvenLabel: string
  netUpfrontCost: number
  roiPercent: number
  monthlyLoanPayment: number
  totalLoanCost: number
  totalInterestPaid: number
}

export interface BatterySimulationResult {
  autonomyHours: number
  savingsInExpensiveMonth: number
  coversExpensiveMonth: boolean
}
