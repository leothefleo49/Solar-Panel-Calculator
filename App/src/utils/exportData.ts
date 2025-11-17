import { useSolarStore } from '../state/solarStore'
import { buildModelSnapshot } from './calculations'
import { version } from '../../package.json'

type ExportPayload = {
  kind: 'inputs' | 'snapshot'
  appVersion: string
  exportedAt: string
  config: any
  simulation?: any
  snapshot?: any
}

function downloadBlob(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

export function exportInputs() {
  const { config, simulation } = useSolarStore.getState()
  const payload: ExportPayload = {
    kind: 'inputs',
    appVersion: version,
    exportedAt: new Date().toISOString(),
    config,
    simulation,
  }
  downloadBlob(payload, `solar-calculator-inputs-${Date.now()}.json`)
}

export function exportSnapshot() {
  const { config, simulation } = useSolarStore.getState()
  const snapshot = buildModelSnapshot(config)
  const payload: ExportPayload = {
    kind: 'snapshot',
    appVersion: version,
    exportedAt: new Date().toISOString(),
    config,
    simulation,
    snapshot,
  }
  downloadBlob(payload, `solar-calculator-snapshot-${Date.now()}.json`)
}

export async function importInputsFromFile(file: File): Promise<{ applied: number; skipped: string[] }> {
  const text = await file.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }
  if (!json || !json.config) {
    throw new Error('File missing config section')
  }
  const store = useSolarStore.getState()
  const current = store.config
  const allowedKeys = Object.keys(current) as (keyof typeof current)[]
  const toApply: Partial<typeof current> = {}
  const skipped: string[] = []
  for (const key of Object.keys(json.config)) {
    if (allowedKeys.includes(key as any)) {
      toApply[key as keyof typeof current] = json.config[key]
    } else {
      skipped.push(key)
    }
  }
  store.bulkUpdate(toApply)
  return { applied: Object.keys(toApply).length, skipped }
}
