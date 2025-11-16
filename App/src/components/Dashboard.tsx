import { type ReactNode, useMemo, useState, useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import clsx from 'clsx'
import { useSolarStore } from '../state/solarStore'
import type { SolarStoreState } from '../state/solarStore'
import SolarApiIntegration from './SolarApiIntegration'
import ApisTab from './ApisTab.tsx'
import ShoppingCart from './ShoppingCart'
import {
  buildModelSnapshot,
  formatCurrency,
  formatNumber,
  formatPercent,
  runBatterySimulation,
} from '../utils/calculations'
import type { ProjectionYear } from '../types/solar'

const TAB_DEFINITION = [
  { id: 'financial', label: 'Financial Summary' },
  { id: 'production', label: 'Production & Performance' },
  { id: 'battery', label: 'Battery & Outage Simulation' },
  { id: 'shopping', label: 'Shopping Cart' },
  { id: 'apis', label: 'APIs' },
  { id: 'solarIntegration', label: 'Google Solar Integration' },
  { id: 'datasheet', label: '25-Year Data Sheet' },
  { id: 'aiOverview', label: 'AI Overview' },
] as const

type TabId = (typeof TAB_DEFINITION)[number]['id']

const Dashboard = () => {
  const config = useSolarStore((state) => state.config)
  const simulation = useSolarStore((state) => state.simulation)
  const setSimulationValue = useSolarStore((state) => state.setSimulationValue)
  const [activeTab, setActiveTab] = useState<TabId>('financial')

  // Listen for global UI events (e.g., ChatAssistant requesting APIs tab)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ tab?: TabId }>
      if (custom.detail?.tab && TAB_DEFINITION.some(t => t.id === custom.detail.tab)) {
        setActiveTab(custom.detail.tab)
      }
    }
    window.addEventListener('open-dashboard-tab', handler)
    return () => window.removeEventListener('open-dashboard-tab', handler)
  }, [])

  const snapshot = useMemo(() => buildModelSnapshot(config), [config])
  const batteryResult = useMemo(() => runBatterySimulation(config, simulation, snapshot), [config, simulation, snapshot])

  const crossoverData = useMemo(
    () =>
      snapshot.projection.map((row) => ({
        year: row.year,
        utility: row.utilityCostWithoutSolar,
        solar: row.solarSystemCumulative,
        cumulativeSavings: row.cumulativeSavings,
      })),
    [snapshot],
  )

  const panelChartData = useMemo(
    () => snapshot.projection.map((row) => ({ year: row.year, production: row.productionKwh })),
    [snapshot.projection],
  )

  const monthlyComparisonData = useMemo(
    () => [
      {
        label: 'Average Month',
        production: snapshot.averageMonthlyProduction,
        consumption: config.monthlyUsage,
      },
    ],
    [config.monthlyUsage, snapshot.averageMonthlyProduction],
  )

  return (
    <section className="glass-panel h-full rounded-[28px] p-6 text-white">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold">Solar System Financial & Technical Analysis</h2>
          <p className="text-sm text-slate-300">
            Every visualization updates instantly as you tweak the configurator. Use the tabs to explore finances,
            production, resilience, and the full amortization schedule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-full border border-white/10 px-3 py-1 text-white/80">
            Array Size: {formatNumber(snapshot.systemSizeKw, 2)} kWdc
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-white/80">
            Annual Production: {formatNumber(snapshot.annualProduction, 0)} kWh
          </div>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap gap-3">
        {TAB_DEFINITION.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'tab-pill text-sm',
              activeTab === tab.id ? 'tab-pill--active' : 'tab-pill--idle',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === 'financial' && (
          <FinancialSummaryTab snapshot={snapshot} crossoverData={crossoverData} />
        )}
        {activeTab === 'production' && (
          <ProductionTab panelChartData={panelChartData} monthlyData={monthlyComparisonData} />
        )}
        {activeTab === 'battery' && (
          <BatteryTab
            simulation={simulation}
            setSimulationValue={setSimulationValue}
            result={batteryResult}
            netMetering={config.netMetering}
          />
        )}
        {activeTab === 'shopping' && <ShoppingCart />}
        {activeTab === 'apis' && <ApisTab />}
        {activeTab === 'solarIntegration' && <SolarIntegrationTab />}
        {activeTab === 'datasheet' && <DataSheetTab rows={snapshot.projection} />}
        {activeTab === 'aiOverview' && <AIOverviewTab snapshot={snapshot} config={config} />}
      </div>
    </section>
  )
}
import { callGeminiFlash, callOpenAI, callClaude } from '../utils/aiProviders'
import { useChatStore } from '../state/chatStore'
type AIOverviewTabProps = {
  snapshot: ReturnType<typeof buildModelSnapshot>
  config: SolarStoreState['config']
}

const AIOverviewTab = ({ snapshot, config }: AIOverviewTabProps) => {
  const { apiKey, provider, model, addMessage } = useChatStore()
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const missingFields: string[] = []
  Object.entries(config).forEach(([k, v]) => {
    if (v === 0 || v === '' || v === null) missingFields.push(k)
  })

  const performAnalysis = async () => {
    if (!apiKey) {
      setAnalysis('No API key provided. Add one in the Chat Assistant panel.')
      return
    }
    setLoading(true)
    try {
      const context = `System Summary:\nArray Size: ${snapshot.systemSizeKw.toFixed(2)} kWdc\nAnnual Production: ${snapshot.annualProduction.toFixed(0)} kWh\nBreak-Even: ${snapshot.summary.breakEvenYear ?? 'Not reached'}\n25-Year Savings: $${snapshot.summary.totalSavings.toFixed(0)}\nROI: ${(snapshot.summary.roiPercent * 100).toFixed(1)}%\nNet Upfront Cost: $${snapshot.summary.netUpfrontCost.toFixed(0)}\nMissing/Zero Fields: ${missingFields.length ? missingFields.join(', ') : 'None'}\nNet Metering: ${config.netMetering ? 'Enabled' : 'Disabled'}\n`;
      const prompt = `Evaluate this residential solar design. Provide: \n1) Overall Rating (Poor/Fair/Good/Excellent) with justification.\n2) Strengths (bullet list).\n3) Weaknesses / Risks.\n4) Actionable Improvement Tips (prioritized).\n5) Advanced Insight: highlight any anomalies that simple cash-flow math might miss.\n6) If missing fields are listed, explain why they matter.\n7) Offer a short call-to-action telling the user they can ask the Chat Assistant for live guidance.\nKeep it concise yet specific.`
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: 'You are a friendly yet elite solar PV design reviewer. Be encouraging and precise, celebrating strengths while gently flagging concerns.' },
        { role: 'system', content: context },
        { role: 'user', content: prompt },
      ]
      let result
      if (provider === 'google') {
        result = await callGeminiFlash(apiKey, model, messages)
      } else if (provider === 'anthropic') {
        result = await callClaude(apiKey, model, messages)
      } else {
        result = await callOpenAI(apiKey, model, messages)
      }
      if (!result.ok) {
        setAnalysis(`Error: ${result.error}`)
      } else {
        setAnalysis(result.content)
      }
    } catch (e) {
      setAnalysis(`Failed: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendToChat = () => {
    if (!analysis) return
    addMessage('assistant', `AI Overview Summary:\n${analysis}`)
    // Suggest the user to open chat.
    addMessage('assistant', 'Use the chat panel for adjustments—ask for sizing tweaks or deeper risk analysis.')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold">AI System Overview</h3>
        <p className="text-sm text-slate-300">Run an automated design & financial health review. The AI considers production, ROI, missing data, and resilience factors.</p>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={performAnalysis}
            disabled={loading}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-40"
          >
            {loading ? 'Analyzing...' : 'Analyze Design'}
          </button>
          <button
            type="button"
            onClick={sendToChat}
            disabled={!analysis}
            className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-40"
          >
            Send Summary to Chat
          </button>
          {!apiKey && (
            <span className="text-[10px] text-rose-300">Add an API key in the Chat Assistant to enable analysis.</span>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h4 className="mb-2 text-sm font-semibold text-slate-200">Result</h4>
        <div className="text-xs whitespace-pre-line leading-relaxed text-slate-100 min-h-[160px]">
          {analysis || 'No analysis yet. Click Analyze Design.'}
        </div>
        {missingFields.length > 0 && (
          <p className="mt-4 text-[10px] text-slate-400">Detected incomplete inputs: {missingFields.join(', ')}</p>
        )}
      </div>
    </div>
  )
}

type FinancialSummaryTabProps = {
  snapshot: ReturnType<typeof buildModelSnapshot>
  crossoverData: Array<{ year: number; utility: number; solar: number; cumulativeSavings: number }>
}

const FinancialSummaryTab = ({ snapshot, crossoverData }: FinancialSummaryTabProps) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total 25-Year Savings"
        value={formatCurrency(snapshot.summary.totalSavings, { maximumFractionDigits: 0 })}
        sublabel="Value of avoided utility spend plus net-metering income."
      />
      <MetricCard
        label="Break-Even Point"
        value={snapshot.summary.breakEvenYear ? snapshot.summary.breakEvenLabel : 'Not reached'}
        sublabel="When cumulative savings surpass net upfront cost."
      />
      <MetricCard
        label="Net Upfront Cost"
        value={formatCurrency(snapshot.summary.netUpfrontCost, { maximumFractionDigits: 0 })}
        sublabel="After applying the federal tax credit."
      />
      <MetricCard
        label="25-Year ROI"
        value={formatPercent(snapshot.summary.roiPercent, 1)}
        sublabel="Total savings divided by net upfront investment."
      />
    </div>

    <ChartCard title="Utility vs Solar Cash Flow" description="Spot the break-even crossover point.">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={crossoverData}>
          <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke="#94a3b8" label={{ value: 'Year', position: 'insideBottom', dy: 12 }} />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(value) => formatCurrency(value, { maximumFractionDigits: 0 })}
          />
          <RechartsTooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 16 }}
            formatter={(value: number) => formatCurrency(value, { maximumFractionDigits: 0 })}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Legend />
          <Line type="monotone" dataKey="utility" stroke="#38bdf8" strokeWidth={3} name="Utility (No Solar)" />
          <Line type="monotone" dataKey="solar" stroke="#f97316" strokeWidth={3} name="Solar System" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
)

type ProductionTabProps = {
  panelChartData: Array<{ year: number; production: number }>
  monthlyData: Array<{ label: string; production: number; consumption: number }>
}

const ProductionTab = ({ panelChartData, monthlyData }: ProductionTabProps) => (
  <div className="grid gap-6 xl:grid-cols-2">
    <ChartCard
      title="Panel Degradation"
      description="Annual production modeled with the degradation rate you selected."
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={panelChartData}>
          <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke="#94a3b8" label={{ value: 'Year', position: 'insideBottom', dy: 12 }} />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(value) => `${formatNumber(value / 1000, 1)} MWh`}
          />
          <RechartsTooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 16 }}
            formatter={(value: number) => `${formatNumber(value, 0)} kWh`}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Line type="monotone" dataKey="production" stroke="#38bdf8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard
      title="Monthly Production vs Consumption"
      description="Quick view of how average monthly solar output compares with your usage."
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="label" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `${formatNumber(value, 0)} kWh`} />
          <RechartsTooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 16 }}
            formatter={(value: number) => `${formatNumber(value, 0)} kWh`}
          />
          <Legend />
          <Bar dataKey="production" name="Production" fill="#38bdf8" radius={[12, 12, 0, 0]} />
          <Bar dataKey="consumption" name="Consumption" fill="#f87171" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
)

const SolarIntegrationTab = () => <SolarApiIntegration />

type BatteryTabProps = {
  simulation: SolarStoreState['simulation']
  setSimulationValue: SolarStoreState['setSimulationValue']
  result: ReturnType<typeof runBatterySimulation>
  netMetering: boolean
}

const BatteryTab = ({ simulation, setSimulationValue, result, netMetering }: BatteryTabProps) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold">Outage Scenario Inputs</h3>
      <p className="text-sm text-slate-300">
        Model the loads that matter most. The calculator uses your solar assumptions to estimate savings and
        resilience.
      </p>
      <div className="space-y-3">
        <LabeledInput
          label="Critical Load (Watts)"
          helper="Think fridge, lighting, networking, medical devices."
          value={simulation.criticalLoadWatts}
          onChange={(value) => setSimulationValue('criticalLoadWatts', value)}
        />
        <LabeledInput
          label="Cheapest Month Bill ($)"
          helper="Smallest bill from the past 12 months."
          value={simulation.cheapestMonthBill}
          onChange={(value) => setSimulationValue('cheapestMonthBill', value)}
        />
        <LabeledInput
          label="Most Expensive Month Bill ($)"
          helper="Highest bill from the past 12 months."
          value={simulation.expensiveMonthBill}
          onChange={(value) => setSimulationValue('expensiveMonthBill', value)}
        />
      </div>
    </div>

    <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-accent/20 to-accentMuted/20 p-5">
      <h3 className="text-lg font-semibold">Results</h3>
      <ResultLine
        label="Battery autonomy"
        value={result.autonomyHours > 0 ? `${formatNumber(result.autonomyHours, 1)} hours` : 'No battery modeled'}
        highlight
      />
      <ResultLine
        label="Savings on priciest month"
        value={formatCurrency(result.savingsInExpensiveMonth, { maximumFractionDigits: 0 })}
      />
      <ResultLine
        label="Heavy month coverage"
        value={result.coversExpensiveMonth ? 'Covered' : 'Not fully covered'}
      />
      <p className="text-xs text-slate-200">
        {netMetering
          ? 'Surplus production above your usage is monetized using the sell-back rate you defined.'
          : 'With net metering off, surplus production is assumed to charge the battery without cash value.'}
      </p>
    </div>
  </div>
)

type TableRow = ProjectionYear & { periodLabel?: string }
type SortKey = keyof ProjectionYear

const DataSheetTab = ({ rows }: { rows: TableRow[] }) => {
  const [sortKey, setSortKey] = useState<SortKey>('year')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [view, setView] = useState<'yearly' | 'monthly'>('yearly')

  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    sorted.sort((a, b) => {
      const valueA = a[sortKey]
      const valueB = b[sortKey]
      if (valueA === valueB) return 0
      return sortDirection === 'asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1
    })
    return sorted
  }, [rows, sortDirection, sortKey])

  const displayRows =
    view === 'yearly' ? sortedRows.slice(0, 25) : buildMonthlyRows(sortedRows).slice(0, 250)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          {displayRows.length} rows displayed (max 250)
        </div>
        <div className="inline-flex rounded-full bg-white/10 p-1 text-xs">
          <button
            type="button"
            onClick={() => setView('yearly')}
            className={clsx(
              'rounded-full px-3 py-1 font-semibold',
              view === 'yearly' ? 'bg-accent text-night' : 'text-white/70',
            )}
          >
            Yearly
          </button>
          <button
            type="button"
            onClick={() => setView('monthly')}
            className={clsx(
              'rounded-full px-3 py-1 font-semibold',
              view === 'monthly' ? 'bg-accent text-night' : 'text-white/70',
            )}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-300">
            <tr>
              {COLUMN_CONFIG.map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer px-4 py-3 font-semibold"
                  onClick={() => handleSort(column.key)}
                >
                  <span className="flex items-center gap-1">
                    {column.label}
                    {sortKey === column.key && (sortDirection === 'asc' ? '^' : 'v')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={`${row.year}-${index}`} className="odd:bg-white/5">
                <td className="px-4 py-3 text-white/90">{row.periodLabel ?? `Year ${row.year}`}</td>
                <td className="px-4 py-3">{formatNumber(row.productionKwh, 0)} kWh</td>
                <td className="px-4 py-3">{formatPercent(row.degradationPercent, 2)}</td>
                <td className="px-4 py-3">{formatCurrency(row.energySavings, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3">{formatCurrency(row.netMeteringIncome, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3">{formatCurrency(row.totalBenefit, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3">{formatCurrency(row.cumulativeSavings, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const buildMonthlyRows = (rows: TableRow[]) => {
  const expanded: TableRow[] = []
  rows.forEach((row) => {
    const startOfYear = Math.max(row.cumulativeSavings - row.totalBenefit, 0)
    const monthlyProduction = row.productionKwh / 12
    const monthlySavings = row.energySavings / 12
    const monthlyNetMetering = row.netMeteringIncome / 12
    const monthlyBenefit = row.totalBenefit / 12
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const cumulativeSavings = startOfYear + monthlyBenefit * (monthIndex + 1)
      expanded.push({
        ...row,
        year: row.year,
        periodLabel: `Year ${row.year} - Month ${(monthIndex + 1).toString().padStart(2, '0')}`,
        productionKwh: monthlyProduction,
        degradationPercent: row.degradationPercent,
        energySavings: monthlySavings,
        netMeteringIncome: monthlyNetMetering,
        totalBenefit: monthlyBenefit,
        cumulativeSavings,
        utilityCostWithoutSolar: row.utilityCostWithoutSolar / 12,
        solarSystemCumulative: row.solarSystemCumulative,
      })
    }
  })
  return expanded
}

const COLUMN_CONFIG: Array<{ key: SortKey; label: string }> = [
  { key: 'year', label: 'Year / Period' },
  { key: 'productionKwh', label: 'Production (kWh)' },
  { key: 'degradationPercent', label: 'System Degradation' },
  { key: 'energySavings', label: 'Energy Savings ($)' },
  { key: 'netMeteringIncome', label: 'Net Meter Income ($)' },
  { key: 'totalBenefit', label: 'Total Annual Benefit ($)' },
  { key: 'cumulativeSavings', label: 'Cumulative Savings ($)' },
]

type MetricCardProps = {
  label: string
  value: string
  sublabel: string
}

const MetricCard = ({ label, value, sublabel }: MetricCardProps) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
    <p className="text-xs text-slate-400">{sublabel}</p>
  </div>
)

type ChartCardProps = {
  title: string
  description: string
  children: ReactNode
}

const ChartCard = ({ title, description, children }: ChartCardProps) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-slate-300">{description}</p>
    <div className="mt-4 h-full">{children}</div>
  </div>
)

type LabeledInputProps = {
  label: string
  helper: string
  value: number
  onChange: (value: number) => void
}

const LabeledInput = ({ label, helper, value, onChange }: LabeledInputProps) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">{label}</span>
    <input
      type="number"
      value={value}
      min={0}
      onChange={(event) => {
        const nextValue = Number(event.target.value)
        onChange(Number.isNaN(nextValue) ? 0 : nextValue)
      }}
      className="mt-1 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-accent focus:ring-accent"
    />
    <span className="text-xs text-slate-400">{helper}</span>
  </label>
)

type ResultLineProps = {
  label: string
  value: string
  highlight?: boolean
}

const ResultLine = ({ label, value, highlight = false }: ResultLineProps) => (
  <div
    className={clsx(
      'rounded-2xl border border-white/20 px-4 py-3 text-sm',
      highlight ? 'bg-white text-night font-semibold' : 'bg-white/10 text-white',
    )}
  >
    <p className="text-xs uppercase tracking-widest text-slate-200">{label}</p>
    <p className="text-lg">{value}</p>
  </div>
)

export default Dashboard
