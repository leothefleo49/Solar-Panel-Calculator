export type InverterType = 'String' | 'Micro'

export interface SolarConfig {
  utilityCostPerKwh: number
  netMetering: boolean
  netMeteringSellRate: number
  utilityInflationRate: number
  monthlyUsage: number
  federalTaxCredit: number
  peakSunHours: number
  panelCount: number
  panelWattage: number
  panelEfficiency: number
  panelDegradationRate: number
  costPerPanel: number
  inverterType: InverterType
  inverterEfficiency: number
  inverterCost: number
  cablingLoss: number
  batteryEnabled: boolean
  batteryCapacity: number
  batteryDoD: number
  batteryPower: number
  batteryCost: number
  mountingCost: number
  monitoringCost: number
  laborCost: number
  otherFees: number
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
}

export interface BatterySimulationResult {
  autonomyHours: number
  savingsInExpensiveMonth: number
  coversExpensiveMonth: boolean
}
