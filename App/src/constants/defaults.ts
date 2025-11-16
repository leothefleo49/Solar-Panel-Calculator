import type { SimulationInputs, SolarConfig } from '../types/solar'

export const defaultSolarConfig: SolarConfig = {
  utilityCostPerKwh: 0.18,
  netMetering: true,
  netMeteringSellRate: 0.08,
  utilityInflationRate: 3,
  monthlyUsage: 900,
  federalTaxCredit: 30,
  peakSunHours: 5.2,
  panelCount: 24,
  panelWattage: 400,
  panelEfficiency: 21,
  panelDegradationRate: 0.5,
  costPerPanel: 280,
  inverterType: 'String',
  inverterEfficiency: 97,
  inverterCost: 3500,
  cablingLoss: 2,
  batteryEnabled: true,
  batteryCapacity: 13.5,
  batteryDoD: 90,
  batteryPower: 5,
  batteryCost: 12000,
  mountingCost: 2500,
  monitoringCost: 800,
  laborCost: 6000,
  otherFees: 1000,
}

export const defaultSimulationInputs: SimulationInputs = {
  criticalLoadWatts: 600,
  cheapestMonthBill: 110,
  expensiveMonthBill: 260,
}
