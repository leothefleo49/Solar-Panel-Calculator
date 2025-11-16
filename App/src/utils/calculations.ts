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
  
  // Support both daily and yearly sun hours
  const annualSunHours = config.sunHoursMode === 'yearly' 
    ? new Decimal(config.peakSunHours)
    : new Decimal(config.peakSunHours).times(365)

  const annual = systemSize.times(annualSunHours).times(inverter).times(cabling).times(efficiency)
  return toNumber(annual)
}

/**
 * Calculate effective cost per panel based on pricing mode
 */
const getEffectivePanelCost = (config: SolarConfig): Decimal => {
  if (config.pricingMode === 'bulk') {
    // Bulk: total cost / quantity
    return new Decimal(config.panelBulkCost).div(config.panelBulkCount || 1)
  }
  return new Decimal(config.costPerPanel)
}

/**
 * Calculate effective cost per inverter based on pricing mode
 */
const getEffectiveInverterCost = (config: SolarConfig): Decimal => {
  if (config.inverterPricingMode === 'bulk') {
    // Bulk: total cost / quantity  
    return new Decimal(config.inverterBulkCost).div(config.inverterBulkCount || 1)
  }
  return new Decimal(config.inverterCost)
}

/**
 * Calculate effective cost per battery based on pricing mode
 */
const getEffectiveBatteryCost = (config: SolarConfig): Decimal => {
  if (!config.batteryEnabled) return new Decimal(0)
  
  if (config.batteryPricingMode === 'bulk') {
    // Bulk: total cost / quantity
    return new Decimal(config.batteryBulkCost).div(config.batteryBulkCount || 1)
  }
  return new Decimal(config.batteryCost)
}

export const calculateTotalUpfrontCost = (config: SolarConfig) => {
  const panelHardware = new Decimal(config.panelCount).times(getEffectivePanelCost(config))
  const inverterCost = config.inverterType === 'Micro' 
    ? new Decimal(config.panelCount).times(getEffectiveInverterCost(config))
    : getEffectiveInverterCost(config)
  const batteryCost = getEffectiveBatteryCost(config)
  const softCosts = new Decimal(config.mountingCost)
    .plus(config.monitoringCost)
    .plus(config.laborCost)
    .plus(config.otherFees)
  const total = panelHardware
    .plus(inverterCost)
    .plus(batteryCost)
    .plus(softCosts)
  return toNumber(total)
}

export const calculateNetUpfrontCost = (config: SolarConfig) => {
  const total = new Decimal(calculateTotalUpfrontCost(config))
  const credit = new Decimal(1).minus(new Decimal(config.federalTaxCredit).div(100))
  return toNumber(total.times(credit))
}

/**
 * Calculate monthly loan payment using amortization formula
 */
export const calculateMonthlyLoanPayment = (principal: number, annualRate: number, years: number): number => {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate === 0) return principal / (years * 12)
  
  const monthlyRate = annualRate / 100 / 12
  const numPayments = years * 12
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1)
  return payment
}

/**
 * Estimate loan interest rate based on credit score
 * This is a simplified model - actual rates vary by lender, market conditions, etc.
 */
export const estimateLoanRate = (creditScore: number): number => {
  if (creditScore >= 780) return 5.5
  if (creditScore >= 740) return 6.5
  if (creditScore >= 700) return 7.5
  if (creditScore >= 660) return 8.5
  if (creditScore >= 620) return 10.0
  return 12.0 // Below 620
}

const buildProjectionRow = ({
  yearIndex,
  baseProduction,
  config,
  annualConsumption,
  netUpfrontCost,
  previous,
  currentRate,
  annualLoanPayment,
}: {
  yearIndex: number
  baseProduction: Decimal
  config: SolarConfig
  annualConsumption: Decimal
  netUpfrontCost: Decimal
  previous?: ProjectionYear
  currentRate: Decimal
  annualLoanPayment: Decimal
}): ProjectionYear => {
  const degradationFactor = new Decimal(1).minus(new Decimal(config.panelDegradationRate).div(100)).pow(yearIndex)
  const production = baseProduction.times(degradationFactor)
  const consumedOnSite = Decimal.min(production, annualConsumption)
  const savings = consumedOnSite.times(currentRate)
  const surplus = Decimal.max(production.minus(annualConsumption), 0)
  const netMeterIncome = config.netMetering
    ? surplus.times(new Decimal(config.netMeteringSellRate))
    : new Decimal(0)
  
  // For loan financing, subtract annual loan payment from benefits
  const totalBenefit = config.financingMode === 'loan' && yearIndex < config.loanTermYears
    ? savings.plus(netMeterIncome).minus(annualLoanPayment)
    : savings.plus(netMeterIncome)
    
  const cumulativeSavings = totalBenefit.plus(previous ? previous.cumulativeSavings : 0)
  
  // For cash purchase, compare against net upfront cost
  // For loan, the "cost" is the down payment (if any) since monthly payments are deducted from benefits
  const effectiveUpfrontCost = config.financingMode === 'loan' 
    ? netUpfrontCost.minus(new Decimal(config.loanAmount))
    : netUpfrontCost
    
  const solarSystemCumulative = Decimal.max(effectiveUpfrontCost.minus(cumulativeSavings), 0)
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

  // Calculate loan payment if financing
  const monthlyPayment = config.financingMode === 'loan' && config.loanAmount > 0
    ? calculateMonthlyLoanPayment(config.loanAmount, config.loanInterestRate, config.loanTermYears)
    : 0
  const annualLoanPayment = new Decimal(monthlyPayment).times(12)

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
      annualLoanPayment,
    })
    projection.push(row)
    currentRate = currentRate.times(inflation)
  }

  const summary = buildFinancialSummary(projection, netUpfrontCost.toNumber(), config, monthlyPayment)

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

export const buildFinancialSummary = (
  projection: ProjectionYear[], 
  netUpfrontCost: number,
  config: SolarConfig,
  monthlyLoanPayment: number
): FinancialSummary => {
  // For loan financing, the effective upfront cost is what you pay upfront (down payment)
  const effectiveUpfrontCost = config.financingMode === 'loan' 
    ? netUpfrontCost - config.loanAmount
    : netUpfrontCost
    
  const breakEvenRow = projection.find((row) => row.cumulativeSavings >= effectiveUpfrontCost)
  let breakEvenYear: number | null = null
  let breakEvenLabel = 'Not reached in 25 years'

  if (breakEvenRow) {
    const previous = projection[breakEvenRow.year - 2]
    const deficit = previous ? effectiveUpfrontCost - previous.cumulativeSavings : effectiveUpfrontCost
    const portion = deficit / breakEvenRow.totalBenefit
    const fractionalYear = previous ? previous.year + portion : portion
    breakEvenYear = Number(fractionalYear.toFixed(2))
    breakEvenLabel = `${fractionalYear.toFixed(1)} years`
  }

  const totalSavings = projection[projection.length - 1]?.cumulativeSavings ?? 0
  const roiPercent = effectiveUpfrontCost > 0 ? (totalSavings / effectiveUpfrontCost) * 100 : 0

  // Loan calculations
  const totalLoanCost = monthlyLoanPayment * config.loanTermYears * 12
  const totalInterestPaid = totalLoanCost - config.loanAmount

  return {
    totalSavings,
    breakEvenYear,
    breakEvenLabel,
    netUpfrontCost,
    roiPercent,
    monthlyLoanPayment,
    totalLoanCost,
    totalInterestPaid,
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
