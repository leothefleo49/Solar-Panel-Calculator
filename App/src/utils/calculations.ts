import Decimal from 'decimal.js'
import type {
  BatterySimulationResult,
  FinancialSummary,
  ProjectionYear,
  SimulationInputs,
  SolarConfig,
} from '../types/solar'

Decimal.set({ precision: 28 })

const YEARS = 25
const BASELINE_PANEL_EFFICIENCY = 21 // used to scale STC data

const toNumber = (value: Decimal) => Number(value.toSignificantDigits(12).toString())

export const calculateSystemSizeKw = (config: SolarConfig) =>
  toNumber(new Decimal(config.panelCount).times(config.panelWattage).div(1000))

export const calculateAnnualProduction = (config: SolarConfig) => {
  const systemSize = new Decimal(calculateSystemSizeKw(config))
  const inverter = new Decimal(config.inverterEfficiency).div(100)
  const cabling = new Decimal(1).minus(new Decimal(config.cablingLoss).div(100))
  const efficiency = new Decimal(config.panelEfficiency).div(BASELINE_PANEL_EFFICIENCY)
  const hours = new Decimal(config.peakSunHours)

  const annual = systemSize.times(hours).times(365).times(inverter).times(cabling).times(efficiency)
  return toNumber(annual)
}

export const calculateTotalUpfrontCost = (config: SolarConfig) => {
  const panelHardware = new Decimal(config.panelCount).times(config.costPerPanel)
  const batteryCost = config.batteryEnabled ? new Decimal(config.batteryCost) : new Decimal(0)
  const softCosts = new Decimal(config.mountingCost)
    .plus(config.monitoringCost)
    .plus(config.laborCost)
    .plus(config.otherFees)
  const total = panelHardware
    .plus(config.inverterCost)
    .plus(batteryCost)
    .plus(softCosts)
  return toNumber(total)
}

export const calculateNetUpfrontCost = (config: SolarConfig) => {
  const total = new Decimal(calculateTotalUpfrontCost(config))
  const credit = new Decimal(1).minus(new Decimal(config.federalTaxCredit).div(100))
  return toNumber(total.times(credit))
}

const buildProjectionRow = ({
  yearIndex,
  baseProduction,
  config,
  annualConsumption,
  netUpfrontCost,
  previous,
  currentRate,
}: {
  yearIndex: number
  baseProduction: Decimal
  config: SolarConfig
  annualConsumption: Decimal
  netUpfrontCost: Decimal
  previous?: ProjectionYear
  currentRate: Decimal
}): ProjectionYear => {
  const degradationFactor = new Decimal(1).minus(new Decimal(config.panelDegradationRate).div(100)).pow(yearIndex)
  const production = baseProduction.times(degradationFactor)
  const consumedOnSite = Decimal.min(production, annualConsumption)
  const savings = consumedOnSite.times(currentRate)
  const surplus = Decimal.max(production.minus(annualConsumption), 0)
  const netMeterIncome = config.netMetering
    ? surplus.times(new Decimal(config.netMeteringSellRate))
    : new Decimal(0)
  const totalBenefit = savings.plus(netMeterIncome)
  const cumulativeSavings = totalBenefit.plus(previous ? previous.cumulativeSavings : 0)
  const solarSystemCumulative = Decimal.max(netUpfrontCost.minus(cumulativeSavings), 0)
  const utilityCostWithoutSolar = annualConsumption.times(currentRate)

  return {
    year: yearIndex + 1,
    productionKwh: toNumber(production),
    degradationPercent: toNumber(new Decimal(1).minus(degradationFactor).times(100)),
    energySavings: toNumber(savings),
    netMeteringIncome: toNumber(netMeterIncome),
    totalBenefit: toNumber(totalBenefit),
    cumulativeSavings: toNumber(cumulativeSavings),
    utilityCostWithoutSolar: toNumber(utilityCostWithoutSolar),
    solarSystemCumulative: toNumber(solarSystemCumulative),
  }
}

export interface ModelSnapshot {
  projection: ProjectionYear[]
  summary: FinancialSummary
  netUpfrontCost: number
  totalUpfrontCost: number
  annualProduction: number
  systemSizeKw: number
  averageMonthlyProduction: number
}

export const buildModelSnapshot = (config: SolarConfig): ModelSnapshot => {
  const annualProduction = new Decimal(calculateAnnualProduction(config))
  const systemSizeKw = calculateSystemSizeKw(config)
  const annualConsumption = new Decimal(config.monthlyUsage).times(12)
  const netUpfrontCost = new Decimal(calculateNetUpfrontCost(config))
  const totalUpfrontCost = calculateTotalUpfrontCost(config)
  const inflation = new Decimal(1).plus(new Decimal(config.utilityInflationRate).div(100))
  let currentRate = new Decimal(config.utilityCostPerKwh)

  const projection: ProjectionYear[] = []
  for (let index = 0; index < YEARS; index += 1) {
    const row = buildProjectionRow({
      yearIndex: index,
      baseProduction: annualProduction,
      config,
      annualConsumption,
      netUpfrontCost,
      previous: projection[index - 1],
      currentRate,
    })
    projection.push(row)
    currentRate = currentRate.times(inflation)
  }

  const summary = buildFinancialSummary(projection, netUpfrontCost.toNumber())

  return {
    projection,
    summary,
    netUpfrontCost: netUpfrontCost.toNumber(),
    totalUpfrontCost,
    annualProduction: annualProduction.toNumber(),
    systemSizeKw,
    averageMonthlyProduction: annualProduction.div(12).toNumber(),
  }
}

export const buildFinancialSummary = (projection: ProjectionYear[], netUpfrontCost: number): FinancialSummary => {
  const breakEvenRow = projection.find((row) => row.cumulativeSavings >= netUpfrontCost)
  let breakEvenYear: number | null = null
  let breakEvenLabel = 'Not reached in 25 years'

  if (breakEvenRow) {
    const previous = projection[breakEvenRow.year - 2]
    const deficit = previous ? netUpfrontCost - previous.cumulativeSavings : netUpfrontCost
    const portion = deficit / breakEvenRow.totalBenefit
    const fractionalYear = previous ? previous.year + portion : portion
    breakEvenYear = Number(fractionalYear.toFixed(2))
    breakEvenLabel = `${fractionalYear.toFixed(1)} years`
  }

  const totalSavings = projection[projection.length - 1]?.cumulativeSavings ?? 0
  const roiPercent = netUpfrontCost > 0 ? (totalSavings / netUpfrontCost) * 100 : 0

  return {
    totalSavings,
    breakEvenYear,
    breakEvenLabel,
    netUpfrontCost,
    roiPercent,
  }
}

export const runBatterySimulation = (
  config: SolarConfig,
  simulation: SimulationInputs,
  snapshot: ModelSnapshot,
): BatterySimulationResult => {
  const usableCapacity = config.batteryEnabled
    ? new Decimal(config.batteryCapacity).times(new Decimal(config.batteryDoD).div(100))
    : new Decimal(0)
  const criticalLoadKw = simulation.criticalLoadWatts > 0 ? new Decimal(simulation.criticalLoadWatts).div(1000) : new Decimal(0)
  const autonomyHours = criticalLoadKw.gt(0) ? usableCapacity.div(criticalLoadKw) : new Decimal(0)

  const avgMonthlyProduction = new Decimal(snapshot.averageMonthlyProduction)
  const monthlyUsage = new Decimal(config.monthlyUsage)
  const baseRate = new Decimal(config.utilityCostPerKwh)

  const selfConsumption = Decimal.min(avgMonthlyProduction, monthlyUsage)
  let monthlySavings = selfConsumption.times(baseRate)
  if (config.netMetering) {
    const surplus = Decimal.max(avgMonthlyProduction.minus(monthlyUsage), 0)
    monthlySavings = monthlySavings.plus(surplus.times(new Decimal(config.netMeteringSellRate)))
  }

  const savingsInExpensiveMonth = Decimal.min(new Decimal(simulation.expensiveMonthBill), monthlySavings)
  const coversExpensiveMonth = monthlySavings.gte(new Decimal(simulation.expensiveMonthBill))

  return {
    autonomyHours: toNumber(autonomyHours),
    savingsInExpensiveMonth: toNumber(savingsInExpensiveMonth),
    coversExpensiveMonth,
  }
}

export const formatCurrency = (value: number, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(value)

export const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)

export const formatPercent = (value: number, maximumFractionDigits = 1) =>
  `${formatNumber(value, maximumFractionDigits)}%`
