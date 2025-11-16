import { type ChangeEvent } from 'react'
import clsx from 'clsx'
import { CONFIG_SECTIONS, type ConfigField } from '../constants/configSchema'
import { useSolarStore } from '../state/solarStore'
import InfoTooltip from './InfoTooltip'

const formatValue = (value: number) =>
  Number.isFinite(value) ? value : 0

const Configurator = () => {
  const config = useSolarStore((state) => state.config)
  const setValue = useSolarStore((state) => state.setConfigValue)

  const handleNumericChange = (key: ConfigField['key']) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = parseFloat(event.target.value)
    setValue(key, Number.isNaN(nextValue) ? 0 : nextValue)
  }

  const handleToggleChange = (key: ConfigField['key']) => () => {
    const current = config[key]
    setValue(key, (!current) as never)
  }

  const handleSelectChange = (key: ConfigField['key']) => (event: ChangeEvent<HTMLSelectElement>) => {
    setValue(key, event.target.value as never)
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
              <option key={option} value={option} className="bg-slate">
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

    return (
      <div className={clsx(disabled && 'opacity-40')}>
        {label}
        <div className="flex items-center gap-3">
          <input
            type={type}
            step={step}
            min={min}
            max={max}
            value={formatValue(config[field.key] as number)}
            onChange={handleNumericChange(field.key)}
            disabled={disabled}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-accent focus:ring-accent"
          />
          {suffix && <span className="text-xs font-semibold text-slate-300">{suffix}</span>}
        </div>
        <p className="mt-1 text-xs text-slate-300">{field.helper}</p>
        {field.emphasizeLinks && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="text-slate-300">Need data? Jump to:</span>
            <a
              className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-semibold text-accent transition hover:bg-accent/20"
              href="https://sunroof.withgoogle.com/"
              target="_blank"
              rel="noreferrer"
            >
              Google Project Sunroof
            </a>
            <a
              className="rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-semibold text-accent transition hover:bg-accent/20"
              href="https://pvwatts.nrel.gov/"
              target="_blank"
              rel="noreferrer"
            >
              NREL PVWatts
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="glass-panel relative z-20 flex h-full min-h-0 flex-col overflow-visible rounded-[28px] p-6 text-white">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Configurator</p>
        <h1 className="mt-2 text-2xl font-semibold">Fine-tune every assumption</h1>
        <p className="text-sm text-slate-300">
          Every input below ties directly into the financial and technical model. Hover the info icons to learn
          what typical values look like.
        </p>
      </div>
      <div className="modern-scroll flex-1 space-y-4 overflow-y-auto pr-1">
        {CONFIG_SECTIONS.map((section) => (
          <details
            key={section.id}
            className="group w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glass"
            open
          >
            <summary className="summary-trigger flex cursor-pointer list-none items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">{section.title}</p>
                <p className="text-xs text-slate-300">{section.description}</p>
              </div>
            </summary>
            <div className="mt-4 space-y-4">
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
