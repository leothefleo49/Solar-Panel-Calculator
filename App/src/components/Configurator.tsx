import { type ChangeEvent, useState, useEffect } from 'react'
import clsx from 'clsx'
import { CONFIG_SECTIONS, type ConfigField } from '../constants/configSchema'
import { useSolarStore } from '../state/solarStore'
import InfoTooltip from './InfoTooltip'
import { openExternalUrl } from '../utils/openExternal'
import { estimateLoanRate } from '../utils/calculations'

const formatValue = (value: number) =>
  Number.isFinite(value) ? value : 0

const Configurator = () => {
  const config = useSolarStore((state) => state.config)
  const setValue = useSolarStore((state) => state.setConfigValue)
  const [usageMode, setUsageMode] = useState<'monthly' | 'yearly'>('monthly')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('panel-collapsed', { detail: { side: 'left', collapsed } }))
  }, [collapsed])

  const handleToggleChange = (key: ConfigField['key']) => () => {
    const current = config[key]
    setValue(key, (!current) as never)
  }

  const handleSelectChange = (key: ConfigField['key']) => (event: ChangeEvent<HTMLSelectElement>) => {
    setValue(key, event.target.value as never)
  }

  const handleModeToggle = (key: ConfigField['key'], newValue: string) => {
    setValue(key, newValue as never)
  }

  const handleEstimateLoanRate = () => {
    const estimatedRate = estimateLoanRate(config.creditScore)
    setValue('loanInterestRate', estimatedRate as never)
  }

  const renderField = (field: ConfigField) => {
    const disabled = field.disabled?.(config) ?? false
    const label = (
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
        <span>{field.label}</span>
        <InfoTooltip content={field.info} />
      </div>
    )

    if (field.type === 'toggle') {
      const value = Boolean(config[field.key])
      return (
        <div className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold text-white">{field.label}</p>
              <InfoTooltip content={field.info} />
            </div>
            <p className="text-xs text-slate-300">{field.helper}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleChange(field.key)}
            className={clsx(
              'relative inline-flex h-6 w-12 items-center rounded-full transition',
              value ? 'bg-accent' : 'bg-white/20',
            )}
            aria-pressed={value}
          >
            <span
              className={clsx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
                value ? 'right-0.5' : 'left-0.5',
              )}
            />
          </button>
        </div>
      )
    }

    if (field.type === 'modeToggle') {
      const currentValue = config[field.key] as string
      const options = field.options || []
      
      return (
        <div>
          {label}
          <div className="flex gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleModeToggle(field.key, option)}
                disabled={disabled}
                className={clsx(
                  'flex-1 rounded-xl px-4 py-2 text-sm font-medium transition',
                  currentValue === option
                    ? 'bg-accent text-slate-900'
                    : 'border border-white/20 bg-white/5 text-slate-300 hover:border-accent/50',
                  disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {option === 'daily' && 'Daily'}
                {option === 'yearly' && 'Yearly'}
                {option === 'perUnit' && 'Per Unit'}
                {option === 'bulk' && 'Bulk Package'}
                {option === 'cash' && 'Cash'}
                {option === 'loan' && 'Loan'}
                {!['daily', 'yearly', 'perUnit', 'bulk', 'cash', 'loan'].includes(option) && option}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
        </div>
      )
    }

    if (field.type === 'bulkPricing') {
      return (
        <div className={clsx(disabled && 'opacity-40')}>
          {label}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formatValue(config[field.key] as number)}
              onChange={(e) => {
                const val = Number.parseFloat(e.target.value)
                if (!Number.isNaN(val)) setValue(field.key, val as never)
              }}
              disabled={disabled}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm text-slate-400">units</span>
          </div>
          <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
        </div>
      )
    }

    if (field.type === 'loanEstimate') {
      return (
        <div className={clsx(disabled && 'opacity-40')}>
          {label}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formatValue(config[field.key] as number)}
              onChange={(e) => {
                const val = Number.parseFloat(e.target.value)
                if (!Number.isNaN(val)) setValue(field.key, val as never)
              }}
              disabled={disabled}
              min={field.min}
              max={field.max}
              step={field.step ?? 10}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleEstimateLoanRate}
              disabled={disabled}
              className="whitespace-nowrap rounded-xl bg-accent/20 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Estimate Rate
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
          {config.creditScore >= 300 && (
            <p className="mt-2 text-xs text-accent">
              Estimated Rate: {estimateLoanRate(config.creditScore).toFixed(2)}% APR
            </p>
          )}
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div>
          {label}
          <select
            value={config[field.key] as string}
            onChange={handleSelectChange(field.key)}
            className="premium-select block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent focus:ring-accent"
          >
            {field.options?.map((option) => (
              <option key={option} value={option} className="bg-slate-900">
                {option}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
        </div>
      )
    }

    const suffix = field.suffix ?? ''
    const step = field.step ?? 1
    const min = field.min ?? 0
    const max = field.max ?? 999999
    const type = 'number'

    // Special handling for monthlyUsage field
    const isMonthlyUsageField = field.key === 'monthlyUsage'
    const displayValue = isMonthlyUsageField && usageMode === 'yearly' 
      ? formatValue((config[field.key] as number) * 12)
      : formatValue(config[field.key] as number)
    const displaySuffix = isMonthlyUsageField 
      ? (usageMode === 'monthly' ? 'kWh/mo' : 'kWh/yr')
      : suffix

    return (
      <div className={clsx(disabled && 'opacity-40')}>
        {label}
        <div className="relative">
          {isMonthlyUsageField && (
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                onClick={() => setUsageMode('monthly')}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-1 text-xs font-medium transition',
                  usageMode === 'monthly'
                    ? 'bg-accent text-slate-900'
                    : 'border border-white/20 bg-white/5 text-slate-300 hover:border-accent/50'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setUsageMode('yearly')}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-1 text-xs font-medium transition',
                  usageMode === 'yearly'
                    ? 'bg-accent text-slate-900'
                    : 'border border-white/20 bg-white/5 text-slate-300 hover:border-accent/50'
                )}
              >
                Yearly
              </button>
            </div>
          )}
          <input
            type={type}
            value={displayValue}
            onChange={(event) => {
              let value = Number.parseFloat(event.target.value)
              if (Number.isNaN(value)) value = 0
              // If yearly mode for monthly usage, divide by 12
              const finalValue = isMonthlyUsageField && usageMode === 'yearly' 
                ? value / 12
                : value
              setValue(field.key, finalValue as never)
            }}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-16 text-sm text-white focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
          {displaySuffix && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {displaySuffix}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
        {field.emphasizeLinks && (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => openExternalUrl('https://sunroof.withgoogle.com/')}
              className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-semibold text-accent transition hover:bg-accent/20"
            >
              Google Project Sunroof
            </button>
            <button
              type="button"
              onClick={() => openExternalUrl('https://pvwatts.nrel.gov/')}
              className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-semibold text-accent transition hover:bg-accent/20"
            >
              NREL PVWatts
            </button>
          </div>
        )}
      </div>
    )
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="glass-panel fixed left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-[28px] p-2 text-white hover:bg-white/10 transition"
        title="Expand Configurator"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  return (
    <aside className="glass-panel relative z-20 flex h-full min-h-0 flex-col overflow-visible rounded-[28px] p-6 text-white">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Configurator</p>
          <h1 className="mt-2 text-2xl font-semibold">Fine-tune every assumption</h1>
          <p className="text-sm text-slate-300">
            Every input below ties directly into the financial and technical model. Hover the info icons to learn
            what typical values look like.
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1.5 hover:bg-white/10 transition"
          title="Minimize Configurator"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="modern-scroll flex-1 space-y-4 overflow-y-auto pr-1">
        {CONFIG_SECTIONS.map((section) => (
          <details key={section.id} className="section-details">
            <summary className="summary-trigger mb-3 cursor-pointer select-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-white hover:bg-white/10 flex items-center gap-3">
              <span className="caret-icon" aria-hidden="true" />
              <span>{section.title}</span>
            </summary>
            <div className="mb-6 space-y-4 px-1">
              <p className="text-xs text-slate-400">{section.description}</p>
              {section.fields.map((field) => (
                <div key={field.key}>{renderField(field)}</div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </aside>
  )
}

export default Configurator
